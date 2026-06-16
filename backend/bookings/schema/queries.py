import datetime
from typing import List, Optional

import strawberry
from django.db.models import Q
from strawberry.types import Info

from agents.schema.types import AgentLogType, agent_log_to_type
from beautybook.permissions import require_auth, require_owner
from bookings.models import Appointment, Customer
from staff.schema.types import user_to_type

from .types import (
    AppointmentHistoryType,
    AppointmentType,
    AvailabilitySlotType,
    CustomerType,
    DashboardStatsType,
    appointment_to_type,
    customer_to_type,
)


def _build_availability_slots(
    service_id: int,
    date: datetime.date,
    staff_id: Optional[int] = None,
) -> List[AvailabilitySlotType]:
    from bookings.availability import build_availability_slots

    return [
        AvailabilitySlotType(
            starts_at=s["starts_at"],
            ends_at=s["ends_at"],
            staff=user_to_type(s["staff_obj"]),
        )
        for s in build_availability_slots(service_id, date, staff_id)
    ]


@strawberry.type
class BookingsQuery:
    @strawberry.field
    def customers(
        self,
        info: Info,
        search: Optional[str] = None,
    ) -> List[CustomerType]:
        require_owner(info)
        qs = Customer.objects.all().order_by("-last_visit_at", "full_name")
        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) | Q(phone__icontains=search)
            )
        return [customer_to_type(c) for c in qs]

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

        # Real earnings: service prices for appointments marked complete today
        earned_today = (
            appts
            .filter(status="completed")
            .aggregate(t=Sum("service__price_zmw"))["t"] or 0
        )

        # Platform deposits collected today
        deposits_today = (
            Payment.objects
            .filter(
                appointment__starts_at__date=date,
                status="completed",
                payment_type="deposit",
            )
            .aggregate(t=Sum("amount_zmw"))["t"] or 0
        )

        cancelled_today = appts.filter(status="cancelled").count()

        pending_completion = appts.filter(
            status__in=("confirmed", "in_progress")
        ).count()

        return DashboardStatsType(
            earned_today=float(earned_today),
            deposits_today=float(deposits_today),
            today_bookings=appts.count(),
            booked_by_agent=appts.filter(booked_by="agent").count(),
            cancelled_today=cancelled_today,
            pending_completion=pending_completion,
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
