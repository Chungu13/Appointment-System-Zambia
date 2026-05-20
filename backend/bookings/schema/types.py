import datetime
import strawberry
from enum import Enum
from typing import List, Optional

from payments.schema.types import PaymentType, payment_to_type
from services.schema.types import ServiceType, service_to_type
from staff.schema.types import UserType, user_to_type


@strawberry.enum
class BookingStatusEnum(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    NO_SHOW = "no_show"
    CANCELLED = "cancelled"


@strawberry.enum
class BookedByEnum(Enum):
    CUSTOMER = "customer"
    STAFF = "staff"
    AGENT = "agent"


@strawberry.type
class CustomerType:
    id: int
    full_name: str
    phone: str
    notes: str
    visit_count: int
    no_show_count: int
    last_visit_at: Optional[datetime.datetime]
    created_at: datetime.datetime


@strawberry.type
class AppointmentType:
    id: int
    customer: CustomerType
    staff: UserType
    service: ServiceType
    starts_at: datetime.datetime
    ends_at: datetime.datetime
    status: BookingStatusEnum
    booked_by: BookedByEnum
    customer_notes: str
    cancellation_reason: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    payments: List[PaymentType]


@strawberry.type
class WaitlistType:
    id: int
    customer: CustomerType
    service: ServiceType
    preferred_date: datetime.date
    preferred_staff_id: Optional[int]
    preferred_staff_name: Optional[str]
    is_active: bool
    notified_at: Optional[datetime.datetime]


@strawberry.type
class AppointmentHistoryType:
    id: int
    old_status: str
    new_status: str
    changed_by_name: Optional[str]
    changed_by_agent: str
    note: str
    created_at: datetime.datetime


@strawberry.type
class AvailabilitySlotType:
    starts_at: datetime.datetime
    ends_at: datetime.datetime
    staff: UserType


@strawberry.type
class DashboardStatsType:
    today_revenue: float
    today_bookings: int
    booked_by_agent: int
    slots_recovered: int


@strawberry.type
class CreateBookingResult:
    appointment: Optional[AppointmentType]
    deposit_required: float
    requires_payment: bool
    payment_url: Optional[str]


@strawberry.type
class CancelBookingResult:
    appointment: AppointmentType
    refund_status: str  # "full_refund" | "owner_decision" | "no_refund"
    message: str


# ---------------------------------------------------------------------------
# Converters
# ---------------------------------------------------------------------------

def customer_to_type(c) -> CustomerType:
    return CustomerType(
        id=c.pk,
        full_name=c.full_name,
        phone=c.phone,
        notes=c.notes,
        visit_count=c.visit_count,
        no_show_count=c.no_show_count,
        last_visit_at=c.last_visit_at,
        created_at=c.created_at,
    )


def appointment_to_type(a) -> AppointmentType:
    return AppointmentType(
        id=a.pk,
        customer=customer_to_type(a.customer),
        staff=user_to_type(a.staff),
        service=service_to_type(a.service),
        starts_at=a.starts_at,
        ends_at=a.ends_at,
        status=BookingStatusEnum(a.status),
        booked_by=BookedByEnum(a.booked_by),
        customer_notes=a.customer_notes,
        cancellation_reason=a.cancellation_reason,
        created_at=a.created_at,
        updated_at=a.updated_at,
        payments=[payment_to_type(p) for p in a.payments.all()],
    )


def waitlist_to_type(w) -> WaitlistType:
    return WaitlistType(
        id=w.pk,
        customer=customer_to_type(w.customer),
        service=service_to_type(w.service),
        preferred_date=w.preferred_date,
        preferred_staff_id=w.preferred_staff_id,
        preferred_staff_name=w.preferred_staff.full_name if w.preferred_staff_id else None,
        is_active=w.is_active,
        notified_at=w.notified_at,
    )
