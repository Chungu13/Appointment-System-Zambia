import datetime
from typing import List, Optional

import strawberry
from strawberry.types import Info

from tenants.schema.types import SalonSettingsType, StaffPortalAppointmentType, _check_staff_key, _policies_from_db


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
            city=tenant.city,
            area=tenant.area or "",
            address=tenant.address or "",
            phone=tenant.phone or "",
            payout_phone=tenant.payout_phone or "",
            payout_network=tenant.payout_network or "",
            whatsapp_number=tenant.whatsapp_number or "",
            staff_access_key=tenant.staff_access_key or "",
            cover_image_url=tenant.cover_image_url or "",
            slot_interval_minutes=tenant.slot_interval_minutes,
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
                staff_name=a.staff.full_name if a.staff_id else "N/A",
                customer_name=a.customer.full_name if a.customer_id else "N/A",
                service_name=a.service.name if a.service_id else "N/A",
                service_duration=a.service.duration_minutes if a.service_id else 0,
            )
            for a in qs
        ]
