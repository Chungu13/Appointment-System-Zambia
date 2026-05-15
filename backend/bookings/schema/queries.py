import datetime
from typing import List, Optional

import strawberry
from strawberry.types import Info

from agents.schema.types import AgentLogType, agent_log_to_type
from beautybook.permissions import require_auth, require_owner
from bookings.models import Appointment, Customer
from staff.schema.types import user_to_type

from .types import (
    AppointmentHistoryType,
    AppointmentType,
    AvailabilitySlotType,
    DashboardStatsType,
    appointment_to_type,
)


def _build_availability_slots(
    service_id: int,
    date: datetime.date,
    staff_id: Optional[int] = None,
) -> List[AvailabilitySlotType]:
    import zoneinfo
    from django.conf import settings
    from services.models import Service, StaffService
    from staff.models import WorkingHours

    service = Service.objects.filter(pk=service_id, is_active=True).first()
    if not service:
        return []

    tz = zoneinfo.ZoneInfo(settings.TIME_ZONE)
    slot_duration = datetime.timedelta(minutes=service.duration_minutes + service.buffer_minutes)
    step = datetime.timedelta(minutes=30)

    eligible_staff = StaffService.objects.filter(service=service).select_related("staff")
    if staff_id:
        eligible_staff = eligible_staff.filter(staff_id=staff_id)

    day_of_week = date.weekday()

    # Batch-load working hours and booked appointments for all eligible staff
    staff_objects = [ss.staff for ss in eligible_staff]
    wh_by_staff = {
        wh.staff_id: wh
        for wh in WorkingHours.objects.filter(
            staff__in=staff_objects, day_of_week=day_of_week
        )
    }
    staff_ids = [s.pk for s in staff_objects]
    booked_by_staff: dict[int, list] = {}
    for row in Appointment.objects.filter(
        staff_id__in=staff_ids,
        status__in=("pending", "confirmed", "in_progress"),
        starts_at__date=date,
    ).values("staff_id", "starts_at", "ends_at"):
        booked_by_staff.setdefault(row["staff_id"], []).append(
            (row["starts_at"], row["ends_at"])
        )

    slots: List[AvailabilitySlotType] = []

    for ss in eligible_staff:
        wh = wh_by_staff.get(ss.staff_id)
        if not wh or wh.is_day_off or not wh.start_time or not wh.end_time:
            continue

        day_start = datetime.datetime.combine(date, wh.start_time).replace(tzinfo=tz)
        day_end = datetime.datetime.combine(date, wh.end_time).replace(tzinfo=tz)
        booked = booked_by_staff.get(ss.staff_id, [])

        cursor = day_start
        while cursor + slot_duration <= day_end:
            slot_end = cursor + slot_duration
            if not any(not (slot_end <= b_start or cursor >= b_end) for b_start, b_end in booked):
                slots.append(
                    AvailabilitySlotType(
                        starts_at=cursor,
                        ends_at=slot_end,
                        staff=user_to_type(ss.staff),
                    )
                )
            cursor += step

    return slots


@strawberry.type
class BookingsQuery:
    @strawberry.field
    def availability(
        self,
        info: Info,
        service_id: int,
        date: datetime.date,
        staff_id: Optional[int] = None,
    ) -> List[AvailabilitySlotType]:
        return _build_availability_slots(service_id, date, staff_id)

    @strawberry.field
    def my_appointments(
        self,
        info: Info,
        date_from: Optional[datetime.date] = None,
        date_to: Optional[datetime.date] = None,
        status: Optional[str] = None,
    ) -> List[AppointmentType]:
        user = require_auth(info)
        qs = (
            Appointment.objects
            .select_related("customer", "staff", "service")
            .prefetch_related("payments")
        )
        if user.role != "owner":
            qs = qs.filter(staff=user)
        if date_from:
            qs = qs.filter(starts_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(starts_at__date__lte=date_to)
        if status:
            qs = qs.filter(status=status)
        return [appointment_to_type(a) for a in qs]

    @strawberry.field
    def customer_appointments(
        self,
        info: Info,
        phone: str,
    ) -> List[AppointmentType]:
        customer = Customer.objects.filter(phone=phone).first()
        if not customer:
            return []
        qs = (
            Appointment.objects
            .filter(customer=customer)
            .select_related("customer", "staff", "service")
            .prefetch_related("payments")
            .order_by("-starts_at")
        )
        return [appointment_to_type(a) for a in qs]

    @strawberry.field
    def dashboard_stats(
        self,
        info: Info,
        date: Optional[datetime.date] = None,
    ) -> DashboardStatsType:
        from django.db.models import Sum
        from django.utils import timezone
        from agents.models import AgentLog
        from payments.models import Payment

        require_owner(info)

        if date is None:
            date = timezone.localdate()

        appts = Appointment.objects.filter(starts_at__date=date)

        revenue = (
            Payment.objects
            .filter(
                appointment__starts_at__date=date,
                status="completed",
                payment_type__in=("deposit", "balance"),
            )
            .aggregate(t=Sum("amount_zmw"))["t"] or 0
        )

        slots_recovered = AgentLog.objects.filter(
            agent_type="scheduling",
            outcome="success",
            created_at__date=date,
        ).count()

        pending_payments = Payment.objects.filter(
            appointment__starts_at__date=date,
            status="pending",
        ).count()

        return DashboardStatsType(
            today_revenue=float(revenue),
            today_bookings=appts.count(),
            booked_by_agent=appts.filter(booked_by="agent").count(),
            slots_recovered=slots_recovered,
            pending_payments=pending_payments,
        )

    @strawberry.field
    def my_staff_appointments(
        self,
        info: Info,
        date_from: Optional[datetime.date] = None,
        date_to: Optional[datetime.date] = None,
    ) -> List[AppointmentType]:
        """Owner's own appointments as a practitioner (always filters by staff=user)."""
        user = require_auth(info)
        qs = (
            Appointment.objects
            .filter(staff=user)
            .select_related("customer", "staff", "service")
            .prefetch_related("payments")
            .order_by("starts_at")
        )
        if date_from:
            qs = qs.filter(starts_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(starts_at__date__lte=date_to)
        return [appointment_to_type(a) for a in qs]

    @strawberry.field
    def appointment_history(
        self,
        info: Info,
        appointment_id: int,
    ) -> List[AppointmentHistoryType]:
        from bookings.models import AppointmentHistory

        require_auth(info)
        qs = AppointmentHistory.objects.filter(
            appointment_id=appointment_id
        ).select_related("changed_by").order_by("created_at")

        return [
            AppointmentHistoryType(
                id=h.pk,
                old_status=h.old_status,
                new_status=h.new_status,
                changed_by_name=h.changed_by.full_name if h.changed_by_id else None,
                changed_by_agent=h.changed_by_agent,
                note=h.note,
                created_at=h.created_at,
            )
            for h in qs
        ]

    @strawberry.field
    def agent_activity(
        self,
        info: Info,
        limit: int = 20,
        agent_type: Optional[str] = None,
    ) -> List[AgentLogType]:
        from agents.models import AgentLog

        require_owner(info)
        qs = AgentLog.objects.order_by("-created_at")
        if agent_type:
            qs = qs.filter(agent_type=agent_type)
        return [agent_log_to_type(log) for log in qs[:limit]]
