import re
import random
import string
from typing import List, Optional

import strawberry


# ── Types ─────────────────────────────────────────────────────────────────────

@strawberry.type
class SalonType:
    id: int
    business_name: str
    business_type: str
    subdomain: str
    phone: str
    city: str
    address: str
    is_active: bool
    cover_image_url: str


@strawberry.type
class RegisterPayload:
    access_token: str
    refresh_token: str
    tenant_subdomain: str
    staff_access_key: str


# ── Query ─────────────────────────────────────────────────────────────────────

@strawberry.type
class Query:
    @strawberry.field
    def health(self) -> str:
        return "ok"

    @strawberry.field
    def salons(
        self,
        city: Optional[str] = None,
        business_type: Optional[str] = None,
    ) -> List[SalonType]:
        from tenants.models import Tenant

        qs = (
            Tenant.objects
            .filter(is_active=True)
            .exclude(schema_name="public")
            .prefetch_related("domains")
        )
        if city:
            qs = qs.filter(city__iexact=city)
        if business_type:
            qs = qs.filter(business_type=business_type)

        def _subdomain(tenant):
            primary = next((d for d in tenant.domains.all() if d.is_primary), None)
            if primary:
                return primary.domain.split(".")[0]
            return tenant.subdomain

        return [
            SalonType(
                id=t.pk,
                business_name=t.business_name,
                business_type=t.business_type,
                subdomain=_subdomain(t),
                phone=t.phone,
                city=t.city,
                address=t.address,
                is_active=t.is_active,
                cover_image_url=t.cover_image_url or "",
            )
            for t in qs
        ]


# ── Mutation ──────────────────────────────────────────────────────────────────

@strawberry.type
class Mutation:
    @strawberry.mutation
    def register_tenant(
        self,
        business_name: str,
        business_type: str,
        city: str,
        owner_name: str,
        phone: str,
        email: str,
        password: str,
        address: str = "",
    ) -> RegisterPayload:
        from django.conf import settings
        from django_tenants.utils import tenant_context
        from beautybook.jwt_auth import make_access_token, make_refresh_token
        from tenants.models import Domain, Tenant

        # ── Validate ──────────────────────────────────────────────────────────
        for label, val in [
            ("Business name", business_name), ("Business type", business_type),
            ("City", city), ("Owner name", owner_name),
            ("Phone", phone), ("Email", email), ("Password", password),
        ]:
            if not str(val).strip():
                raise ValueError(f"{label} is required.")

        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters.")

        # ── Generate identifiers ──────────────────────────────────────────────
        base_slug = re.sub(r"[^a-z0-9]+", "-", business_name.lower().strip()).strip("-")
        if len(base_slug) < 2:
            raise ValueError("Business name is too short or contains only special characters.")

        subdomain   = base_slug
        schema_name = base_slug.replace("-", "_")

        if Tenant.objects.filter(subdomain=subdomain).exists():
            raise ValueError(
                f"'{business_name}' is already registered on BeautyBook ZM. "
                "Try adding your city — e.g. 'Glow Salon Lusaka'."
            )
        # Avoid schema_name collision (edge case)
        if Tenant.objects.filter(schema_name=schema_name).exists():
            schema_name = schema_name + "_biz"

        # ── Staff access key ──────────────────────────────────────────────────
        words = ["GLOW", "LUXE", "SHINE", "BLOOM", "GRACE", "SPARK", "VIBE", "GLAM", "SILK", "PURE"]
        staff_key = random.choice(words) + "".join(random.choices(string.digits, k=4))

        # ── Create tenant (auto-creates schema + runs migrations) ─────────────
        domain_suffix = "localhost" if settings.DEBUG else "beautybook.zm"

        tenant = Tenant(
            schema_name=schema_name,
            business_name=business_name,
            business_type=business_type,
            subdomain=subdomain,
            city=city,
            address=address,
            phone=phone,
            on_trial=True,
            is_active=True,
            staff_access_key=staff_key,
        )
        tenant.save()  # triggers auto_create_schema

        Domain.objects.create(
            domain=f"{subdomain}.{domain_suffix}",
            tenant=tenant,
            is_primary=True,
        )

        # ── Create owner inside tenant schema ─────────────────────────────────
        with tenant_context(tenant):
            from staff.models import User

            base_user = re.sub(r"[^a-z0-9]", "", email.split("@")[0].lower())[:20] or "owner"
            username = base_user
            n = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_user}{n}"
                n += 1

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                full_name=owner_name,
                phone=phone,
                role="owner",
                is_staff=True,
            )

        return RegisterPayload(
            access_token=make_access_token(user.pk, "owner"),
            refresh_token=make_refresh_token(user.pk),
            tenant_subdomain=subdomain,
            staff_access_key=staff_key,
        )


schema = strawberry.Schema(query=Query, mutation=Mutation)
