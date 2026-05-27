import datetime
from typing import List, Optional

import strawberry
from strawberry.types import Info


# ---------------------------------------------------------------------------
# Business policies
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Settings types
# ---------------------------------------------------------------------------

@strawberry.type
class SalonSettingsType:
    business_name: str
    business_type: str
    staff_access_key: str
    cover_image_url: str
    business_policies: BusinessPoliciesType
    onboarding_completed: bool


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


# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------

@strawberry.type
class TenantQuery:
    @strawberry.field
    def salon_settings(self, info: Info) -> SalonSettingsType:
        from beautybook.permissions import require_owner
        require_owner(info)
        tenant = info.context.request.tenant
        return SalonSettingsType(
            business_name=tenant.business_name,
            business_type=tenant.business_type,
            staff_access_key=tenant.staff_access_key or "",
            cover_image_url=tenant.cover_image_url or "",
            business_policies=_policies_from_db(tenant.business_policies or {}),
            onboarding_completed=tenant.onboarding_completed,
        )

    @strawberry.field
    def all_appointments_today(
        self,
        info: Info,
        key: str,
        date: Optional[datetime.date] = None,
    ) -> List[StaffPortalAppointmentType]:
        _check_staff_key(info, key)

        from django.utils import timezone
        from bookings.models import Appointment

        if date is None:
            date = timezone.localdate()

        qs = (
            Appointment.objects
            .filter(starts_at__date=date)
            .exclude(status__in=("cancelled", "no_show"))
            .select_related("staff", "customer", "service")
            .order_by("starts_at")
        )

        return [
            StaffPortalAppointmentType(
                id=a.pk,
                starts_at=a.starts_at,
                ends_at=a.ends_at,
                status=a.status,
                staff_name=a.staff.full_name if a.staff_id else "—",
                customer_name=a.customer.full_name if a.customer_id else "—",
                service_name=a.service.name if a.service_id else "—",
                service_duration=a.service.duration_minutes if a.service_id else 0,
            )
            for a in qs
        ]


# ---------------------------------------------------------------------------
# Mutations
# ---------------------------------------------------------------------------

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
    ) -> bool:
        from beautybook.permissions import require_owner
        require_owner(info)
        tenant = info.context.request.tenant
        if cover_image_url is not None:
            tenant.cover_image_url = cover_image_url.strip()
        if address is not None:
            tenant.address = address.strip()
        if phone is not None:
            tenant.phone = phone.strip()
        tenant.save(update_fields=["cover_image_url", "address", "phone", "updated_at"])
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
            "cancellationPolicy": policies.cancellation_policy,
            "lateArrivalPolicy": policies.late_arrival_policy,
            "lateFee": policies.late_fee,
            "waitingTime": policies.waiting_time,
            "whatToBring": policies.what_to_bring,
            "parking": policies.parking,
            "contactPreference": policies.contact_preference,
            "additionalInfo": policies.additional_info,
        }
        tenant.save(update_fields=["business_policies", "updated_at"])
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
    def staff_update_appointment(
        self,
        info: Info,
        key: str,
        appointment_id: int,
        status: str,
    ) -> bool:
        _check_staff_key(info, key)

        from bookings.models import Appointment

        ALLOWED = {"in_progress", "completed"}
        if status.lower() not in ALLOWED:
            raise ValueError("Invalid status.")

        updated = Appointment.objects.filter(pk=appointment_id).update(status=status.lower())
        return updated > 0
