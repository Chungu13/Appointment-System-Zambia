import json
import logging
import re
import random
import string
import urllib.parse
import urllib.request
from typing import List, Optional

logger = logging.getLogger(__name__)

import strawberry
from strawberry.types import Info


# ── Bot-protection helpers ─────────────────────────────────────────────────────

_DISPOSABLE_DOMAINS = frozenset({
    "mailinator.com", "guerrillamail.com", "throwam.com", "10minutemail.com",
    "trashmail.com", "yopmail.com", "maildrop.cc", "dispostable.com",
    "fakeinbox.com", "mailnull.com", "sharklasers.com", "guerrillamailblock.com",
    "grr.la", "guerrillamail.info", "guerrillamail.biz", "guerrillamail.de",
    "guerrillamail.net", "guerrillamail.org", "spam4.me", "trashmail.at",
    "trashmail.io", "trashmail.me", "wegwerfmail.de", "wegwerfmail.net",
    "wegwerfmail.org", "tempr.email", "discard.email", "spamgourmet.com",
    "zetmail.com", "spamcero.com", "mailexpire.com", "spamex.com",
    "deadaddress.com", "tempail.com", "owlpic.com", "tempinbox.com",
    "getairmail.com", "filzmail.com", "tempmailo.com",
})

def _is_valid_zambian_phone(phone: str) -> bool:
    cleaned = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    cleaned = cleaned.lstrip('+')
    if cleaned.startswith('260'):
        cleaned = cleaned[3:]
    if cleaned.startswith('0'):
        cleaned = cleaned[1:]
    # MTN: 76, 96 | Airtel: 57, 77, 97 | Zamtel: 95
    return bool(re.match(r'^(76|96|57|77|97|95)\d{7}$', cleaned))


def _verify_turnstile(token: str, secret_key: str, ip: str) -> bool:
    try:
        data = urllib.parse.urlencode({
            'secret': secret_key,
            'response': token,
            'remoteip': ip,
        }).encode()
        req = urllib.request.Request(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            data=data,
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read())
        return result.get('success', False)
    except Exception as exc:
        logger.warning("_verify_turnstile: request failed: %s", exc)
        return False


def _get_client_ip(info: Info) -> str:
    ctx = info.context
    request = ctx.get("request") if isinstance(ctx, dict) else getattr(ctx, "request", None)
    if not request:
        return ""
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    return forwarded.split(",")[0].strip() if forwarded else request.META.get("REMOTE_ADDR", "")


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
    is_approved: bool
    cover_image_url: str
    portfolio_preview_url: str


@strawberry.type
class SignupPendingPayload:
    message: str
    email: str


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
            .filter(is_active=True, is_approved=True, onboarding_completed=True)
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
                is_approved=t.is_approved,
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
        info: Info,
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
        honeypot: str = "",
        turnstile_token: str = "",
    ) -> SignupPendingPayload:
        from django.conf import settings
        from django.utils import timezone
        from django.contrib.auth.hashers import make_password
        from tenants.models import PendingRegistration, Tenant
        from tenants.auth_views import (
            send_pending_verification_email,
            send_admin_notification,
            send_signup_spike_alert,
            send_verification_email,
        )

        ip_address = _get_client_ip(info)

        # ── Honeypot: silent reject ───────────────────────────────────────────
        logger.info(
            "[Signup] Honeypot value received: %r | ip=%s | email=%s",
            honeypot, ip_address, email,
        )
        if honeypot:
            logger.warning(
                "registerTenant: honeypot triggered | ip=%s | email=%s",
                ip_address, email,
            )
            return SignupPendingPayload(
                message="Please check your email to verify your account.",
                email=email.strip().lower(),
            )

        email = email.strip().lower()

        # ── Turnstile verification ────────────────────────────────────────────
        turnstile_key = getattr(settings, "TURNSTILE_SECRET_KEY", "")
        if turnstile_key:
            if not turnstile_token:
                raise ValueError("Bot protection check is required.")
            if not _verify_turnstile(turnstile_token, turnstile_key, ip_address):
                raise ValueError("Something went wrong. Please refresh the page and try again.")

        # ── Validate Google token ─────────────────────────────────────────────
        is_google = False
        if google_token:
            from django.core import signing as _signing
            try:
                google_data = _signing.loads(google_token, max_age=600, salt="google-auth")
                if google_data.get("email", "").lower() != email:
                    raise ValueError("Google email does not match the email entered.")
                is_google = True
            except _signing.SignatureExpired:
                raise ValueError("Your Google session has expired. Please try Google sign-in again.")
            except ValueError:
                raise
            except Exception:
                raise ValueError("Invalid Google authentication. Please try again.")

        # ── Required fields ───────────────────────────────────────────────────
        for label, val in [
            ("Business name", business_name), ("Business type", business_type),
            ("City", city), ("Owner name", owner_name),
            ("Phone", phone), ("Email", email),
        ]:
            if not str(val).strip():
                raise ValueError(f"{label} is required.")

        if not is_google and len(password) < 8:
            raise ValueError("Password must be at least 8 characters.")

        # Normalize capitalization so stored values are always Title Case
        business_name = business_name.strip().title()
        owner_name = owner_name.strip().title()

        # ── Disposable email check ────────────────────────────────────────────
        email_domain = email.split("@")[-1].lower() if "@" in email else ""
        if email_domain in _DISPOSABLE_DOMAINS:
            raise ValueError("Please use a permanent email address to register.")

        # ── Zambian phone validation ──────────────────────────────────────────
        if not _is_valid_zambian_phone(phone):
            raise ValueError(
                "Enter a valid Zambian mobile number. "
                "Supported: MTN (076, 096), Airtel (057, 077, 097), Zamtel (095)."
            )

        # ── Business name slug check ──────────────────────────────────────────
        base_slug = re.sub(r"[^a-z0-9]+", "-", business_name.lower().strip()).strip("-")
        if len(base_slug) < 2:
            raise ValueError("Business name is too short or contains only special characters.")

        # ── Email uniqueness ──────────────────────────────────────────────────
        if PendingRegistration.objects.filter(email=email).exists():
            raise ValueError(
                "This email already has a pending registration. "
                "Please check your inbox for the verification link."
            )

        from django_tenants.utils import schema_context
        for existing_tenant in Tenant.objects.exclude(schema_name="public"):
            with schema_context(existing_tenant.schema_name):
                from staff.models import User as _User
                try:
                    existing_user = _User.objects.get(email=email, role="owner")
                except _User.DoesNotExist:
                    continue
                if not existing_user.is_active:
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

        # ── Business name uniqueness ──────────────────────────────────────────
        if PendingRegistration.objects.filter(business_name__iexact=business_name).exists():
            raise ValueError(
                "A business with this name is already pending registration. "
                "Please choose a different name."
            )
        if Tenant.objects.exclude(schema_name="public").filter(
            business_name__iexact=business_name
        ).exists():
            raise ValueError(
                "A business with this name already exists on Kimawa. "
                "Please choose a different name."
            )

        # ── Phone uniqueness ──────────────────────────────────────────────────
        normalized_phone = re.sub(r'\D', '', phone.strip())
        if PendingRegistration.objects.filter(phone__icontains=normalized_phone[-9:]).exists():
            raise ValueError(
                "This phone number is already linked to a pending registration. "
                "If this is your number, please check your email for the verification link."
            )
        if Tenant.objects.exclude(schema_name="public").filter(
            phone__icontains=normalized_phone[-9:]
        ).exists():
            raise ValueError(
                "This phone number is already registered on Kimawa. "
                "Please use a different number or log in to your existing account."
            )

        # ── Create PendingRegistration ────────────────────────────────────────
        pending = PendingRegistration.objects.create(
            full_name=owner_name,
            email=email,
            password_hash=make_password(password) if not is_google else "",
            business_name=business_name,
            business_type=business_type,
            city=city,
            area=area.strip(),
            phone=phone,
            address=address.strip(),
            google_token=google_token,
            email_verified=is_google,
            ip_address=ip_address or None,
        )

        logger.info(
            "registerTenant: pending_id=%s | business=%r | email=%s | ip=%s",
            pending.pk, business_name, email, ip_address,
        )

        # ── Send verification email (password signups only) ───────────────────
        if not is_google:
            send_pending_verification_email(pending.pk, email, owner_name.strip())

        # ── Spike alert ───────────────────────────────────────────────────────
        one_hour_ago = timezone.now() - timezone.timedelta(hours=1)
        recent_count = PendingRegistration.objects.filter(created_at__gte=one_hour_ago).count()
        if recent_count > 5:
            try:
                send_signup_spike_alert(recent_count)
            except Exception as exc:
                logger.warning("registerTenant: spike alert failed: %s", exc)

        # ── Notify admin ──────────────────────────────────────────────────────
        send_admin_notification(
            business_name=business_name.strip(),
            business_type=business_type,
            city=city,
            area=area.strip() or "",
            phone=phone,
            full_name=owner_name.strip(),
            email=email,
            timestamp=timezone.now().strftime("%Y-%m-%d %H:%M UTC+2"),
        )

        return SignupPendingPayload(
            message="Please check your email to verify your account.",
            email=email,
        )


schema = strawberry.Schema(query=Query, mutation=Mutation)
