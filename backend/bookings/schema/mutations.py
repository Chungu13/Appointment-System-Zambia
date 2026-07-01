import datetime
from typing import Optional

import strawberry
from strawberry.types import Info

from beautybook.permissions import require_auth
from bookings.models import Appointment, AppointmentHistory, Customer, Waitlist

from .types import (
    AppointmentType,
    BookedByEnum,
    BookingStatusEnum,
    CancelBookingResult,
    CreateBookingResult,
    WaitlistType,
    appointment_to_type,
    waitlist_to_type,
)

# Terminal states and the transitions that are permitted out of each state.
_VALID_TRANSITIONS: dict[str, set[str]] = {
    "pending":     {"confirmed", "cancelled", "no_show"},
    "confirmed":   {"completed", "cancelled", "no_show"},
    "in_progress": {"completed", "cancelled", "no_show"},
    "completed":   set(),
    "no_show":     {"completed"},
    "cancelled":   set(),
    "expired":     set(),
}


@strawberry.type
class BookingsMutation:
    @strawberry.mutation
    def create_booking(
        self,
        info: Info,
        service_id: int,
        staff_id: int,
        starts_at: datetime.datetime,
        customer_name: str,
        customer_phone: str,
        booked_by: BookedByEnum = BookedByEnum.CUSTOMER,
        customer_notes: str = "",
        payment_method: str = "AIRTEL_MONEY",
    ) -> CreateBookingResult:
        from django.db import transaction
        from agents.models import AgentLog
        from services.models import Service, StaffService
        from staff.models import User

        service = Service.objects.filter(pk=service_id, is_active=True).first()
        if not service:
            raise ValueError("Service not found or inactive.")

        staff = User.objects.filter(pk=staff_id, is_active=True).first()
        if not staff:
            raise ValueError("Staff member not found.")

        if not StaffService.objects.filter(staff=staff, service=service).exists():
            raise ValueError("This staff member does not offer that service.")

        ends_at = starts_at + datetime.timedelta(
            minutes=service.duration_minutes + service.buffer_minutes
        )

        customer, _ = Customer.objects.get_or_create(
            phone=customer_phone,
            defaults={"full_name": customer_name},
        )

        deposit_required = float(service.deposit_zmw)

        # ── Path A: zero deposit → CONFIRMED immediately ─────────────────────
        if deposit_required <= 0:
            with transaction.atomic():
                conflict = (
                    Appointment.objects.select_for_update()
                    .filter(
                        staff=staff,
                        status__in=("confirmed", "in_progress"),
                        starts_at__lt=ends_at,
                        ends_at__gt=starts_at,
                    )
                    .exists()
                )
                if conflict:
                    raise ValueError("This time slot is no longer available.")

                appt = Appointment.objects.create(
                    customer=customer,
                    staff=staff,
                    service=service,
                    starts_at=starts_at,
                    ends_at=ends_at,
                    status="confirmed",
                    booked_by=booked_by.value,
                    customer_notes=customer_notes,
                )

                AgentLog.objects.create(
                    agent_type="booking",
                    action=(
                        f"Booking created: {service.name} with {staff.full_name} "
                        f"at {starts_at:%Y-%m-%d %H:%M}"
                    ),
                    related_appointment=appt,
                    outcome="success",
                    metadata={
                        "service_id": service_id,
                        "staff_id": staff_id,
                        "booked_by": booked_by.value,
                        "deposit_required": 0,
                    },
                )

            appt = (
                Appointment.objects
                .select_related("customer", "staff", "service")
                .prefetch_related("payments")
                .get(pk=appt.pk)
            )
            return CreateBookingResult(
                appointment=appointment_to_type(appt),
                deposit_required=0.0,
                requires_payment=False,
                payment_url=None,
            )

        # ── Path B: deposit required → Redis hold + mobile money push ──────────
        conflict = (
            Appointment.objects
            .filter(
                staff=staff,
                status__in=("confirmed", "in_progress"),
                starts_at__lt=ends_at,
                ends_at__gt=starts_at,
            )
            .exists()
        )
        if conflict:
            raise ValueError("This time slot is no longer available.")

        import uuid
        from bookings.holds import save_hold
        from payments.provider_factory import get_provider

        transaction_ref = f"HOLD-{uuid.uuid4().hex[:12].upper()}"
        narration = f"{service.name} with {staff.full_name} on {starts_at:%Y-%m-%d %H:%M}"

        provider = get_provider()
        result = provider.initiate_collection(
            phone=customer_phone,
            amount=deposit_required,
            reference=transaction_ref,
            narration=narration,
        )

        if not result.success:
            raise ValueError(f"Payment provider error: {result.message}")

        save_hold(transaction_ref, {
            "service_id": service_id,
            "staff_id": staff_id,
            "starts_at": starts_at.isoformat(),
            "ends_at": ends_at.isoformat(),
            "customer_phone": customer_phone,
            "customer_name": customer_name,
            "customer_notes": customer_notes,
            "booked_by": booked_by.value,
            "deposit_required": deposit_required,
            "payment_method": payment_method.lower(),
        })

        AgentLog.objects.create(
            agent_type="payment",
            action=(
                f"Payment initiated: {deposit_required} ZMW for "
                f"{service.name} with {staff.full_name} "
                f"at {starts_at:%Y-%m-%d %H:%M}"
            ),
            outcome="success",
            metadata={
                "transaction_ref": transaction_ref,
                "deposit_required": deposit_required,
                "customer_phone": customer_phone,
            },
        )

        # payment_url is empty — customer pays via PIN prompt on their phone
        return CreateBookingResult(
            appointment=None,
            deposit_required=deposit_required,
            requires_payment=True,
            payment_url=None,
        )

    @strawberry.mutation
    def cancel_booking(
        self,
        info: Info,
        appointment_id: int,
        reason: str = "",
        cancelled_by: str = "staff",  # "customer" | "staff" | "owner"
    ) -> CancelBookingResult:
        from django.utils import timezone
        from agents.models import AgentLog

        user = require_auth(info)

        qs = (
            Appointment.objects
            .select_related("customer", "staff", "service")
            .prefetch_related("payments")
        )
        if user.role != "owner":
            qs = qs.filter(staff=user)

        appt = qs.filter(pk=appointment_id).first()
        if not appt:
            raise ValueError("Appointment not found or you don't have permission to cancel it.")
        if appt.status in ("completed", "cancelled", "expired"):
            raise ValueError(f"Cannot cancel a {appt.status} appointment.")

        now = timezone.now()
        hours_until = (appt.starts_at - now).total_seconds() / 3600

        if hours_until > 24:
            refund_status = "full_refund"
            message = "Cancelled with full refund — more than 24 hours notice given."
        elif hours_until > 0:
            refund_status = "owner_decision"
            message = "Cancelled within 24 hours — refund is at the owner's discretion."
        else:
            refund_status = "no_refund"
            message = "Appointment time has already passed — no refund applies."

        old_status = appt.status
        appt.status = "cancelled"
        appt.cancelled_at = now
        appt.cancellation_reason = reason
        appt.save(update_fields=["status", "cancelled_at", "cancellation_reason", "updated_at"])

        AppointmentHistory.objects.create(
            appointment=appt,
            changed_by=user,
            changed_by_agent=cancelled_by,
            old_status=old_status,
            new_status="cancelled",
            note=reason,
        )

        AgentLog.objects.create(
            agent_type="scheduling",
            action=(
                f"Appointment cancelled by {cancelled_by}: "
                f"{appt.service.name} with {appt.staff.full_name} "
                f"at {appt.starts_at:%Y-%m-%d %H:%M}"
            ),
            related_appointment=appt,
            outcome="success",
            metadata={
                "cancelled_by": cancelled_by,
                "reason": reason,
                "refund_status": refund_status,
                "hours_until": round(max(hours_until, 0), 2),
            },
        )

        appt = (
            Appointment.objects
            .select_related("customer", "staff", "service")
            .prefetch_related("payments")
            .get(pk=appt.pk)
        )
        return CancelBookingResult(
            appointment=appointment_to_type(appt),
            refund_status=refund_status,
            message=message,
        )

    @strawberry.mutation
    def update_appointment_status(
        self,
        info: Info,
        appointment_id: int,
        status: BookingStatusEnum,
        staff_notes: str = "",
    ) -> AppointmentType:
        from django.db.models import F
        from django.utils import timezone
        from agents.models import AgentLog

        user = require_auth(info)

        qs = (
            Appointment.objects
            .select_related("customer", "staff", "service")
            .prefetch_related("payments")
        )
        if user.role != "owner":
            qs = qs.filter(staff=user)

        appt = qs.filter(pk=appointment_id).first()
        if not appt:
            raise ValueError("Appointment not found.")

        new_status = status.value
        allowed = _VALID_TRANSITIONS.get(appt.status, set())
        if new_status not in allowed:
            if not allowed:
                raise ValueError(
                    f"Appointment is already in a terminal state ('{appt.status}') "
                    f"and cannot be updated."
                )
            raise ValueError(
                f"Cannot transition from '{appt.status}' to '{new_status}'. "
                f"Allowed: {', '.join(sorted(allowed))}."
            )

        old_status = appt.status
        appt.status = new_status
        appt.save(update_fields=["status", "updated_at"])

        now = timezone.now()
        if new_status == "completed":
            Customer.objects.filter(pk=appt.customer_id).update(
                visit_count=F("visit_count") + 1,
                last_visit_at=now,
            )
        elif new_status == "no_show":
            Customer.objects.filter(pk=appt.customer_id).update(
                no_show_count=F("no_show_count") + 1,
            )

        AppointmentHistory.objects.create(
            appointment=appt,
            changed_by=user,
            old_status=old_status,
            new_status=new_status,
            note=staff_notes,
        )

        AgentLog.objects.create(
            agent_type="scheduling",
            action=(
                f"Status updated {old_status} → {new_status}: "
                f"{appt.service.name} for {appt.customer.full_name}"
            ),
            related_appointment=appt,
            outcome="success",
            metadata={
                "old_status": old_status,
                "new_status": new_status,
                "updated_by": user.username,
                "staff_notes": staff_notes,
            },
        )

        # Reload to surface any customer counter changes
        appt = (
            Appointment.objects
            .select_related("customer", "staff", "service")
            .prefetch_related("payments")
            .get(pk=appt.pk)
        )
        return appointment_to_type(appt)

    @strawberry.mutation
    def rebook_appointment(
        self,
        info: Info,
        appointment_id: int,
        new_starts_at: datetime.datetime,
    ) -> AppointmentType:
        """Reassign a cancelled appointment to a new time slot. No payment triggered."""
        import datetime as dt
        from django.utils import timezone

        require_auth(info)

        appt = (
            Appointment.objects
            .select_related("customer", "staff", "service")
            .prefetch_related("payments")
            .filter(pk=appointment_id)
            .first()
        )
        if not appt:
            raise ValueError("Appointment not found.")
        if appt.status != Appointment.STATUS_CANCELLED:
            raise ValueError("Only cancelled appointments can be rebooked.")

        service = appt.service
        new_ends_at = new_starts_at + dt.timedelta(
            minutes=service.duration_minutes + service.buffer_minutes
        )

        conflict = (
            Appointment.objects
            .filter(
                staff=appt.staff,
                status__in=("confirmed", "in_progress"),
                starts_at__lt=new_ends_at,
                ends_at__gt=new_starts_at,
            )
            .exclude(pk=appointment_id)
            .exists()
        )
        if conflict:
            raise ValueError("That time slot is no longer available.")

        old_starts = appt.starts_at
        appt.starts_at = new_starts_at
        appt.ends_at   = new_ends_at
        appt.status    = Appointment.STATUS_CONFIRMED
        appt.save(update_fields=["starts_at", "ends_at", "status", "updated_at"])

        AppointmentHistory.objects.create(
            appointment=appt,
            changed_by=info.context.request.user,
            old_status="cancelled",
            new_status="confirmed",
            note=f"Rebooked from {old_starts:%Y-%m-%d %H:%M} to {new_starts_at:%Y-%m-%d %H:%M}",
        )

        appt = (
            Appointment.objects
            .select_related("customer", "staff", "service")
            .prefetch_related("payments")
            .get(pk=appt.pk)
        )
        return appointment_to_type(appt)

