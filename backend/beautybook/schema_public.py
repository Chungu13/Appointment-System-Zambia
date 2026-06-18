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
    is_approved: bool
    business_name: str


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
    def owner_login(
        self,
        email: str,
        password: str = "",
        google_token: str = "",
    ) -> OwnerLoginPayload:
        from django_tenants.utils import schema_context
        from beautybook.jwt_auth import make_access_token, make_refresh_token
        from tenants.models import Tenant

        email = email.strip().lower()
        if not email:
            raise ValueError("Email is required.")

        # Verify google_token when provided — skip password check
        if google_token:
            from django.core import signing as _signing
            try:
                gdata = _signing.loads(google_token, max_age=600, salt="google-auth")
                if gdata.get("email", "").lower() != email:
                    raise ValueError("Google authentication mismatch.")
            except _signing.SignatureExpired:
                raise ValueError("Google session expired. Please try again.")
            except ValueError:
                raise
            except Exception:
                raise ValueError("Invalid Google authentication.")
        elif not password:
            raise ValueError("Password is required.")

        tenants = Tenant.objects.exclude(schema_name="public")
        for tenant in tenants:
            with schema_context(tenant.schema_name):
                from staff.models import User
                try:
                    user = User.objects.get(email=email, role="owner", is_active=True)
                except User.DoesNotExist:
                    continue
                if not google_token and not user.check_password(password):
                    raise ValueError("Invalid credentials.")
                access_token  = make_access_token(user.pk, "owner")
                refresh_token = make_refresh_token(user.pk)
                full_name     = user.full_name
                slug          = tenant.subdomain

            return OwnerLoginPayload(
                access_token=access_token,
                refresh_token=refresh_token,
                tenant_slug=slug,
                full_name=full_name,
                is_approved=tenant.is_approved,
                business_name=tenant.business_name,
            )

        if google_token:
            raise ValueError("NO_TENANT")
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
        address: str = "",
        area: str = "",
        password: str = "",
        google_token: str = "",
    ) -> RegisterPayload:
        from django.conf import settings
        from django.utils import timezone
        from django_tenants.utils import tenant_context, schema_context
        from beautybook.jwt_auth import make_access_token, make_refresh_token
        from tenants.models import Domain, Tenant
        from tenants.auth_views import send_verification_email, send_admin_notification

        # ── Validate google token first ───────────────────────────────────────
        is_google = False
        if google_token:
            from django.core import signing as _signing
            try:
                google_data = _signing.loads(google_token, max_age=600, salt="google-auth")
                if google_data.get("email", "").lower() != email.strip().lower():
                    raise ValueError("Google email does not match the email entered.")
                is_google = True
            except _signing.SignatureExpired:
                raise ValueError("Your Google session has expired. Please try Google sign-in again.")
            except ValueError:
                raise
            except Exception:
                raise ValueError("Invalid Google authentication. Please try again.")

        # ── Validate required fields ──────────────────────────────────────────
        for label, val in [
            ("Business name", business_name), ("Business type", business_type),
            ("City", city), ("Owner name", owner_name),
            ("Phone", phone), ("Email", email),
        ]:
            if not str(val).strip():
                raise ValueError(f"{label} is required.")

        if not is_google:
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

        # ── Check for existing account with this email ────────────────────────
        for existing_tenant in Tenant.objects.exclude(schema_name="public"):
            with schema_context(existing_tenant.schema_name):
                from staff.models import User as _User
                try:
                    existing_user = _User.objects.get(email=email, role="owner")
                except _User.DoesNotExist:
                    continue

                if not existing_user.is_active:
                    # Not yet verified — resend the link
                    send_verification_email(
                        existing_user.pk,
                        existing_tenant.schema_name,
                        email,
                        existing_user.full_name,
                    )
                    raise ValueError(
                        "This email is already registered but not verified. "
                        "We've resent the verification link — please check your inbox."
                    )
                raise ValueError(
                    "An account with this email already exists. Please log in instead."
                )

        # ── Generate identifiers ──────────────────────────────────────────────
        base_slug = re.sub(r"[^a-z0-9]+", "-", business_name.lower().strip()).strip("-")
        if len(base_slug) < 2:
            raise ValueError("Business name is too short or contains only special characters.")

        subdomain = base_slug
        counter = 2
        while Tenant.objects.filter(subdomain=subdomain).exists():
            subdomain = f"{base_slug}-{counter}"
            counter += 1

        schema_name = subdomain.replace("-", "_")
        if Tenant.objects.filter(schema_name=schema_name).exists():
            schema_name = schema_name + "_biz"

        logger.info(
            "registerTenant: business_name=%r → subdomain=%r schema=%r",
            business_name, subdomain, schema_name,
        )

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
            is_approved=False,
            staff_access_key=staff_key,
            onboarding_completed=True,
        )
        tenant.save()

        Domain.objects.create(
            domain=f"{subdomain}.{domain_suffix}",
            tenant=tenant,
            is_primary=True,
        )
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
            logger.error(
                "registerTenant: Vercel provisioning failed for %r: %s", subdomain, exc
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
                password=password if not is_google else None,
                full_name=owner_name,
                phone=phone,
                role="owner",
                is_staff=True,
                is_active=is_google,   # True for Google auth (already verified)
            )

        # ── Send verification email (non-Google only) ─────────────────────────
        if not is_google:
            send_verification_email(user.pk, schema_name, email, owner_name)

        # ── Notify admin ──────────────────────────────────────────────────────
        send_admin_notification(
            business_name=business_name,
            business_type=business_type,
            city=city,
            area=area.strip() or "",
            phone=phone,
            full_name=owner_name,
            email=email,
            timestamp=timezone.now().strftime("%Y-%m-%d %H:%M UTC+2"),
        )

        return RegisterPayload(
            access_token=make_access_token(user.pk, "owner"),
            refresh_token=make_refresh_token(user.pk),
            tenant_subdomain=subdomain,
            staff_access_key=staff_key,
        )


schema = strawberry.Schema(query=Query, mutation=Mutation)
