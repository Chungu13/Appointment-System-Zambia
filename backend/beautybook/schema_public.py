import logging
import re
import random
import string
from typing import List, Optional

logger = logging.getLogger(__name__)

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
    area: str
    address: str
    is_active: bool
    cover_image_url: str
    portfolio_preview_url: str


@strawberry.type
class RegisterPayload:
    access_token: str
    refresh_token: str
    tenant_subdomain: str
    staff_access_key: str


@strawberry.type
class OwnerLoginPayload:
    access_token: str
    refresh_token: str
    tenant_slug: str
    full_name: str


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
            .filter(is_active=True, onboarding_completed=True)
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
                area=t.area or "",
                address=t.address,
                is_active=t.is_active,
                cover_image_url=t.cover_image_url or "",
                portfolio_preview_url=t.portfolio_preview_url or "",
            )
            for t in qs
        ]


# ── Mutation ──────────────────────────────────────────────────────────────────

@strawberry.type
class Mutation:
    @strawberry.mutation
    def owner_login(self, email: str, password: str) -> OwnerLoginPayload:
        from django_tenants.utils import schema_context
        from beautybook.jwt_auth import make_access_token, make_refresh_token
        from tenants.models import Tenant

        email = email.strip().lower()
        if not email or not password:
            raise ValueError("Invalid credentials.")

        tenants = Tenant.objects.exclude(schema_name="public")
        for tenant in tenants:
            with schema_context(tenant.schema_name):
                from staff.models import User
                try:
                    user = User.objects.get(email=email, role="owner", is_active=True)
                except User.DoesNotExist:
                    continue
                if not user.check_password(password):
                    raise ValueError("Invalid credentials.")
                # Generate tokens inside the schema_context so user.pk is scoped correctly
                access_token  = make_access_token(user.pk, "owner")
                refresh_token = make_refresh_token(user.pk)
                full_name     = user.full_name
                slug          = tenant.subdomain

            return OwnerLoginPayload(
                access_token=access_token,
                refresh_token=refresh_token,
                tenant_slug=slug,
                full_name=full_name,
            )

        raise ValueError("Invalid credentials.")

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
        area: str = "",
    ) -> RegisterPayload:
        from django.conf import settings
        from django_tenants.utils import tenant_context, schema_context
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

        import re as _re
        _phone_digits = _re.sub(r'\D', '', phone.strip())
        if not (
            (_phone_digits.startswith('260') and len(_phone_digits) == 12) or
            (_phone_digits.startswith('0')   and len(_phone_digits) == 10)
        ):
            raise ValueError("Enter a valid Zambian phone number, e.g. +260 97 123 4567.")

        email = email.strip().lower()

        # ── Option A: resume incomplete onboarding ────────────────────────────
        # If this email already owns a tenant that hasn't finished onboarding,
        # return their existing credentials so they drop back into the flow
        # seamlessly — no duplicate tenant created.
        for existing_tenant in Tenant.objects.exclude(schema_name="public"):
            with schema_context(existing_tenant.schema_name):
                from staff.models import User as _User
                try:
                    existing_user = _User.objects.get(email=email, role="owner")
                except _User.DoesNotExist:
                    continue

                if existing_tenant.onboarding_completed:
                    raise ValueError(
                        "An account with this email already exists. "
                        "Please log in instead."
                    )

                # Incomplete onboarding — sync password in case they re-entered
                # a different one, then hand back existing credentials.
                if not existing_user.check_password(password):
                    existing_user.set_password(password)
                    existing_user.save(update_fields=["password"])

                logger.info(
                    "registerTenant: resuming incomplete onboarding for %r (tenant=%r)",
                    email, existing_tenant.subdomain,
                )
                return RegisterPayload(
                    access_token=make_access_token(existing_user.pk, "owner"),
                    refresh_token=make_refresh_token(existing_user.pk),
                    tenant_subdomain=existing_tenant.subdomain,
                    staff_access_key=existing_tenant.staff_access_key or "",
                )

        # ── Generate identifiers ──────────────────────────────────────────────
        base_slug = re.sub(r"[^a-z0-9]+", "-", business_name.lower().strip()).strip("-")
        if len(base_slug) < 2:
            raise ValueError("Business name is too short or contains only special characters.")

        # Append -2, -3 … if slug already taken
        subdomain = base_slug
        counter = 2
        while Tenant.objects.filter(subdomain=subdomain).exists():
            subdomain = f"{base_slug}-{counter}"
            counter += 1

        schema_name = subdomain.replace("-", "_")
        # Avoid schema_name collision (edge case)
        if Tenant.objects.filter(schema_name=schema_name).exists():
            schema_name = schema_name + "_biz"

        logger.info("registerTenant: business_name=%r → subdomain=%r schema=%r", business_name, subdomain, schema_name)
        print(f"[registerTenant] business_name={business_name!r} → subdomain={subdomain!r} schema={schema_name!r}")

        # ── Staff access key ──────────────────────────────────────────────────
        words = ["GLOW", "LUXE", "SHINE", "BLOOM", "GRACE", "SPARK", "VIBE", "GLAM", "SILK", "PURE"]
        staff_key = random.choice(words) + "".join(random.choices(string.digits, k=4))

        # ── Create tenant (auto-creates schema + runs migrations) ─────────────
        domain_suffix     = "localhost" if settings.DEBUG else settings.TENANT_DOMAIN_SUFFIX
        api_domain_suffix = None       if settings.DEBUG else settings.TENANT_API_DOMAIN_SUFFIX

        tenant = Tenant(
            schema_name=schema_name,
            business_name=business_name,
            business_type=business_type,
            subdomain=subdomain,
            city=city,
            area=area.strip(),
            address=address,
            phone=phone,
            payout_phone=phone,
            whatsapp_number=phone,
            on_trial=True,
            is_active=True,
            staff_access_key=staff_key,
        )
        tenant.save()  # triggers auto_create_schema

        # Primary domain: {slug}.kimawa.pro → Vercel frontend (tenant identification)
        Domain.objects.create(
            domain=f"{subdomain}.{domain_suffix}",
            tenant=tenant,
            is_primary=True,
        )
        # API domain: {slug}.api.kimawa.pro → Railway backend (django-tenants routing)
        if api_domain_suffix:
            Domain.objects.create(
                domain=f"{subdomain}.{api_domain_suffix}",
                tenant=tenant,
                is_primary=False,
            )

        # ── Provision Vercel subdomain (non-blocking) ─────────────────────────
        try:
            from tenants.vercel import add_vercel_domain
            add_vercel_domain(subdomain)
        except Exception as exc:
            logger.error("registerTenant: Vercel domain provisioning failed for %r: %s", subdomain, exc)

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
