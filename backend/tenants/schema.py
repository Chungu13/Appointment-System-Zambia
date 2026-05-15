import datetime
from typing import List, Optional

import strawberry
from strawberry.types import Info


@strawberry.type
class SalonSettingsType:
    staff_access_key: str


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


@strawberry.type
class TenantQuery:
    @strawberry.field
    def salon_settings(self, info: Info) -> SalonSettingsType:
        from beautybook.permissions import require_owner
        require_owner(info)
        tenant = info.context.request.tenant
        return SalonSettingsType(staff_access_key=tenant.staff_access_key or "")

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
