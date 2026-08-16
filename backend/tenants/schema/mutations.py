import re
from typing import List, Optional

import strawberry
from strawberry.types import Info

from tenants.schema.types import (
    BusinessPoliciesInput,
    CancelBookingResult,
    CancelledAppointmentType,
    OpeningHoursSettingInput,
    _check_staff_key,
)

_HHMM = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def _is_hhmm(value: str) -> bool:
    """True for a zero-padded 24-hour "HH:MM" string. Zero-padding is what makes
    the plain string comparison in update_opening_hours a valid time ordering."""
    return bool(_HHMM.match(value or ""))


@strawberry.type
class TenantMutation:
    @strawberry.mutation
    def verify_staff_key(self, info: Info, key: str) -> bool:
        tenant = info.context.request.tenant
        return bool(tenant.staff_access_key and tenant.staff_access_key.strip() == key.strip())

    @strawberry.mutation
    def set_staff_access_key(self, info: Info, key: str) -> bool:
        from beautybook.permissions import require_owner
        require_owner(info)
        key = key.strip()
        if not key:
            raise ValueError("Key cannot be empty.")
        tenant = info.context.request.tenant
        tenant.staff_access_key = key
        tenant.save(update_fields=["staff_access_key", "updated_at"])
        return True

    @strawberry.mutation
    def update_tenant_profile(
        self,
        info: Info,
        cover_image_url: Optional[str] = None,
        address: Optional[str] = None,
        phone: Optional[str] = None,
        city: Optional[str] = None,
        area: Optional[str] = None,
        payout_phone: Optional[str] = None,
        payout_network: Optional[str] = None,
        whatsapp_number: Optional[str] = None,
    ) -> bool:
        from beautybook.permissions import require_owner
        require_owner(info)
        tenant = info.context.request.tenant
        if cover_image_url is not None:
            from beautybook.storage import save_image_from_base64
            tenant.cover_image_url = save_image_from_base64(
                cover_image_url.strip(), "covers", tenant.schema_name
            )
        if address is not None:
            tenant.address = address.strip()
        if phone is not None:
            tenant.phone = phone.strip()
        if city is not None:
            tenant.city = city.strip()
        if area is not None:
            tenant.area = area.strip()
        if payout_phone is not None:
            tenant.payout_phone = payout_phone.strip()
        if payout_network is not None:
            tenant.payout_network = payout_network.strip()
        if whatsapp_number is not None:
            tenant.whatsapp_number = whatsapp_number.strip()
        tenant.save(update_fields=[
            "cover_image_url", "address", "phone", "city", "area",
            "payout_phone", "payout_network", "whatsapp_number",
            "updated_at",
        ])
        return True

    @strawberry.mutation
    def update_business_policies(
        self,
        info: Info,
        policies: BusinessPoliciesInput,
    ) -> bool:
        from beautybook.permissions import require_owner
        require_owner(info)
        tenant = info.context.request.tenant
        tenant.business_policies = {
            "cancellationPolicy":    policies.cancellation_policy,
            "lateArrivalPolicy":     policies.late_arrival_policy,
            "lateFee":               policies.late_fee,
            "waitingTime":           policies.waiting_time,
            "whatToBring":           policies.what_to_bring,
            "walkIns":               policies.walk_ins,
            "depositPolicy":         policies.deposit_policy,
            "refundPolicy":          policies.refund_policy,
            "balancePaymentMethod":  policies.balance_payment_method,
            "howToFindUs":           policies.how_to_find_us,
            "contactPreference":     policies.contact_preference,
            "additionalInfo":        policies.additional_info,
        }
        tenant.save(update_fields=["business_policies", "updated_at"])
        return True

    @strawberry.mutation
    def update_opening_hours(
        self,
        info: Info,
        hours: List[OpeningHoursSettingInput],
    ) -> bool:
        """Set the business's public opening hours. Expects all 7 weekdays."""
        from beautybook.permissions import require_owner
        require_owner(info)
        tenant = info.context.request.tenant

        stored = {}
        for row in hours:
            if not 0 <= row.day_of_week <= 6:
                raise ValueError(f"dayOfWeek must be 0-6, got {row.day_of_week}.")
            if row.closed:
                stored[str(row.day_of_week)] = {"opens": "", "closes": "", "closed": True}
                continue
            opens, closes = row.opens.strip(), row.closes.strip()
            if not _is_hhmm(opens) or not _is_hhmm(closes):
                raise ValueError("Opening and closing times must be in HH:MM 24-hour format.")
            if opens >= closes:
                raise ValueError("Closing time must be after opening time.")
            stored[str(row.day_of_week)] = {"opens": opens, "closes": closes, "closed": False}

        tenant.opening_hours = stored
        tenant.save(update_fields=["opening_hours", "updated_at"])

        # The storefront caches opening hours for an hour — drop it so the
        # change is visible immediately rather than whenever the TTL lapses.
        from beautybook.cache_utils import invalidate_hours_cache
        invalidate_hours_cache(tenant.schema_name)
        return True

    @strawberry.mutation
    def complete_onboarding(self, info: Info) -> bool:
        from beautybook.permissions import require_owner
        require_owner(info)
        tenant = info.context.request.tenant
        tenant.onboarding_completed = True
        tenant.save(update_fields=["onboarding_completed", "updated_at"])
        return True

    @strawberry.mutation
    def delete_tenant(self, info: Info, confirm: str) -> bool:
        from beautybook.permissions import require_owner
        require_owner(info)
        tenant = info.context.request.tenant
        if confirm != tenant.business_name:
            raise ValueError("Confirmation does not match your business name.")
        tenant.delete(force_drop=True)
        return True

    @strawberry.mutation
    def staff_update_appointment(
        self,
        info: Info,
        key: str,
        appointment_id: int,
        status: str,
    ) -> bool:
        _check_staff_key(info, key)

        from bookings.models import Appointment

        ALLOWED = {Appointment.STATUS_IN_PROGRESS, Appointment.STATUS_COMPLETED}
        if status.lower() not in ALLOWED:
            raise ValueError("Invalid status.")

        updated = Appointment.objects.filter(pk=appointment_id).update(status=status.lower())
        return updated > 0

    @strawberry.mutation
    def cancel_booking(
        self,
        info: Info,
        appointment_id: int,
        reason: Optional[str] = None,
        cancelled_by: Optional[str] = None,
    ) -> CancelBookingResult:
        from beautybook.permissions import require_owner
        from django.utils import timezone
        from bookings.models import Appointment, AppointmentHistory

        require_owner(info)

        try:
            appt = Appointment.objects.select_related("customer", "service", "staff").get(
                pk=appointment_id
            )
        except Appointment.DoesNotExist:
            raise ValueError(f"Appointment {appointment_id} not found.")

        if appt.status == Appointment.STATUS_CANCELLED:
            raise ValueError("Appointment is already cancelled.")
        if appt.status in (Appointment.STATUS_COMPLETED, Appointment.STATUS_NO_SHOW):
            raise ValueError("Completed appointments cannot be cancelled.")

        old_status = appt.status
        actor = (cancelled_by or "owner").lower()
        if actor not in ("customer", "owner"):
            actor = "owner"

        appt.status = Appointment.STATUS_CANCELLED
        appt.cancelled_at = timezone.now()
        appt.cancellation_reason = reason or "Cancelled by owner"
        appt.cancelled_by = actor
        appt.save(update_fields=["status", "cancelled_at", "cancellation_reason", "cancelled_by", "updated_at"])

        AppointmentHistory.objects.create(
            appointment=appt,
            changed_by=info.context.request.user if info.context.request.user.is_authenticated else None,
            old_status=old_status,
            new_status=Appointment.STATUS_CANCELLED,
            note=appt.cancellation_reason,
        )

        return CancelBookingResult(
            appointment=CancelledAppointmentType(
                id=appt.pk,
                status=appt.status,
                cancellation_reason=appt.cancellation_reason,
            ),
            refund_status="manual",
            message="Appointment cancelled successfully.",
        )

