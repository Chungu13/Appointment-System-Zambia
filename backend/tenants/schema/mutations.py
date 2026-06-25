from typing import Optional

import strawberry
from strawberry.types import Info

from tenants.schema.types import (
    BusinessPoliciesInput,
    _check_staff_key,
)


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
            "payout_phone", "payout_network", "whatsapp_number", "updated_at",
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
            "cancellationPolicy": policies.cancellation_policy,
            "lateArrivalPolicy":  policies.late_arrival_policy,
            "lateFee":            policies.late_fee,
            "waitingTime":        policies.waiting_time,
            "whatToBring":        policies.what_to_bring,
            "parking":            policies.parking,
            "contactPreference":  policies.contact_preference,
            "additionalInfo":     policies.additional_info,
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

