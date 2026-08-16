import datetime
from typing import List, Optional

import strawberry
from strawberry.types import Info


@strawberry.type
class BusinessPoliciesType:
    cancellation_policy: str
    late_arrival_policy: str
    late_fee: str
    waiting_time: str
    what_to_bring: List[str]
    walk_ins: str
    deposit_policy: str
    refund_policy: str
    balance_payment_method: str
    how_to_find_us: str
    contact_preference: str
    additional_info: str


@strawberry.input
class BusinessPoliciesInput:
    cancellation_policy: str = ""
    late_arrival_policy: str = ""
    late_fee: str = ""
    waiting_time: str = ""
    what_to_bring: List[str] = strawberry.field(default_factory=list)
    walk_ins: str = ""
    deposit_policy: str = ""
    refund_policy: str = ""
    balance_payment_method: str = ""
    how_to_find_us: str = ""
    contact_preference: str = ""
    additional_info: str = ""


def _policies_from_db(data: dict) -> BusinessPoliciesType:
    return BusinessPoliciesType(
        cancellation_policy=data.get("cancellationPolicy", ""),
        late_arrival_policy=data.get("lateArrivalPolicy", ""),
        late_fee=data.get("lateFee", ""),
        waiting_time=data.get("waitingTime", ""),
        what_to_bring=data.get("whatToBring", []),
        walk_ins=data.get("walkIns", ""),
        deposit_policy=data.get("depositPolicy", ""),
        refund_policy=data.get("refundPolicy", ""),
        balance_payment_method=data.get("balancePaymentMethod", ""),
        how_to_find_us=data.get("howToFindUs", ""),
        contact_preference=data.get("contactPreference", ""),
        additional_info=data.get("additionalInfo", ""),
    )


@strawberry.type
class OpeningHoursSettingType:
    """One weekday of the business's public opening hours."""
    day_of_week: int
    day_name: str
    opens: str
    closes: str
    closed: bool


@strawberry.input
class OpeningHoursSettingInput:
    day_of_week: int
    opens: str = ""
    closes: str = ""
    closed: bool = False


_OPENING_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# Used when a tenant has no hours stored at all — keeps the storefront and the
# Settings form showing something coherent instead of seven blank rows.
_OPENING_HOURS_FALLBACK = {"opens": "08:00", "closes": "18:00", "closed": False}


def _opening_hours_from_db(data: dict) -> List[OpeningHoursSettingType]:
    """Always returns all 7 days in weekday order, filling gaps with the fallback."""
    out: List[OpeningHoursSettingType] = []
    for day in range(7):
        row = (data or {}).get(str(day)) or _OPENING_HOURS_FALLBACK
        closed = bool(row.get("closed", False))
        out.append(OpeningHoursSettingType(
            day_of_week=day,
            day_name=_OPENING_DAY_NAMES[day],
            opens="" if closed else (row.get("opens") or ""),
            closes="" if closed else (row.get("closes") or ""),
            closed=closed,
        ))
    return out


@strawberry.type
class SalonSettingsType:
    business_name: str
    business_type: str
    city: str
    area: str
    address: str
    phone: str
    payout_phone: str
    payout_network: str
    whatsapp_number: str
    staff_access_key: str
    cover_image_url: str
    opening_hours: List[OpeningHoursSettingType]
    business_policies: BusinessPoliciesType
    onboarding_completed: bool


@strawberry.type
class CancelledAppointmentType:
    id: int
    status: str
    cancellation_reason: str


@strawberry.type
class CancelBookingResult:
    appointment: Optional[CancelledAppointmentType]
    refund_status: str
    message: str


@strawberry.type
class StaffPortalAppointmentType:
    id: int
    starts_at: datetime.datetime
    ends_at: datetime.datetime
    status: str
    staff_name: str
    customer_name: str
    service_name: str
    service_duration: int


def _check_staff_key(info: Info, key: str):
    tenant = info.context.request.tenant
    if not tenant.staff_access_key or tenant.staff_access_key.strip() != key.strip():
        raise ValueError("Invalid staff access key.")
    return tenant
