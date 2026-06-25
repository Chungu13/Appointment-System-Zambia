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
    parking: str
    contact_preference: str
    additional_info: str


@strawberry.input
class BusinessPoliciesInput:
    cancellation_policy: str = ""
    late_arrival_policy: str = ""
    late_fee: str = ""
    waiting_time: str = ""
    what_to_bring: List[str] = strawberry.field(default_factory=list)
    parking: str = ""
    contact_preference: str = ""
    additional_info: str = ""


def _policies_from_db(data: dict) -> BusinessPoliciesType:
    return BusinessPoliciesType(
        cancellation_policy=data.get("cancellationPolicy", ""),
        late_arrival_policy=data.get("lateArrivalPolicy", ""),
        late_fee=data.get("lateFee", ""),
        waiting_time=data.get("waitingTime", ""),
        what_to_bring=data.get("whatToBring", []),
        parking=data.get("parking", ""),
        contact_preference=data.get("contactPreference", ""),
        additional_info=data.get("additionalInfo", ""),
    )


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
