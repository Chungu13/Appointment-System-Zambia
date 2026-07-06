import logging
import random
import re
import string

from django.contrib import admin
from django.conf import settings

from .models import Domain, PendingRegistration, SubscriptionPlan, Tenant, TenantSubscription

logger = logging.getLogger(__name__)


# ── Existing tenant approval ──────────────────────────────────────────────────

@admin.action(description="Approve selected businesses")
def approve_businesses(modeladmin, request, queryset):
    from django_tenants.utils import schema_context
    from tenants.auth_views import send_approval_email

    for tenant in queryset:
        tenant.is_approved = True
        tenant.is_active = True
        tenant.save(update_fields=["is_approved", "is_active"])

        with schema_context(tenant.schema_name):
            from staff.models import User
            owner = User.objects.filter(role="owner").first()
            if owner and owner.email:
                send_approval_email(owner.full_name, tenant.business_name, owner.email)


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = (
        "business_name", "business_type", "subdomain", "city",
        "is_approved", "is_active", "on_trial", "payout_phone", "payout_network", "created_at",
    )
    list_filter = ("is_approved", "is_active", "business_type", "on_trial")
    search_fields = ("business_name", "subdomain", "phone")
    readonly_fields = ("schema_name", "created_at", "updated_at")
    actions = [approve_businesses]


# ── Pending registration approval ─────────────────────────────────────────────

@admin.action(description="Approve and create tenant for selected registrations")
def approve_pending_registrations(modeladmin, request, queryset):
    from django_tenants.utils import tenant_context
    from tenants.auth_views import send_approval_email
    from tenants.models import Domain, Tenant

    approved = 0
    for pending in queryset:
        try:
            _create_tenant_from_pending(pending)
            approved += 1
        except Exception as exc:
            logger.error(
                "approve_pending_registrations: failed for pending_id=%s (%s): %s",
                pending.pk, pending.email, exc,
            )
            modeladmin.message_user(
                request,
                f"Failed to approve {pending.business_name} ({pending.email}): {exc}",
                level="error",
            )

    if approved:
        modeladmin.message_user(request, f"Approved {approved} registration(s).")


def _create_tenant_from_pending(pending: PendingRegistration) -> None:
    """Create Tenant + Domain + owner User from a PendingRegistration, then delete it."""
    from django_tenants.utils import tenant_context
    from tenants.auth_views import send_approval_email
    from tenants.models import Domain, Tenant

    # Generate subdomain / schema
    base_slug = re.sub(r"[^a-z0-9]+", "-", pending.business_name.lower().strip()).strip("-")
    subdomain = base_slug
    counter = 2
    while Tenant.objects.filter(subdomain=subdomain).exists():
        subdomain = f"{base_slug}-{counter}"
        counter += 1

    schema_name = subdomain.replace("-", "_")
    if Tenant.objects.filter(schema_name=schema_name).exists():
        schema_name = schema_name + "_biz"

    words = ["GLOW", "LUXE", "SHINE", "BLOOM", "GRACE", "SPARK", "VIBE", "GLAM", "SILK", "PURE"]
    staff_key = random.choice(words) + "".join(random.choices(string.digits, k=4))

    # Use TENANT_FRONTEND_DOMAIN for the customer-facing subdomain (e.g. kimawa.pro).
    # TENANT_DOMAIN_SUFFIX on Railway is already set to the API domain (api.kimawa.pro),
    # so settings.TENANT_API_DOMAIN_SUFFIX (which defaults to f"api.{TENANT_DOMAIN_SUFFIX}")
    # doubles up to "api.api.kimawa.pro" — hardcode it here instead, same as
    # tenants/management/commands/fix_all_tenant_domains.py.
    domain_suffix     = "localhost" if settings.DEBUG else getattr(settings, "TENANT_FRONTEND_DOMAIN", "kimawa.pro")
    api_domain_suffix = None       if settings.DEBUG else f"api.{getattr(settings, 'TENANT_FRONTEND_DOMAIN', 'kimawa.pro')}"

    tenant = Tenant(
        schema_name=schema_name,
        business_name=pending.business_name,
        business_type=pending.business_type,
        subdomain=subdomain,
        city=pending.city,
        area=pending.area,
        address=pending.address,
        phone=pending.phone,
        payout_phone=pending.phone,
        whatsapp_number=pending.phone,
        on_trial=True,
        is_active=True,
        is_approved=True,
        staff_access_key=staff_key,
        onboarding_completed=True,
    )
    tenant.save()

    Domain.objects.create(domain=f"{subdomain}.{domain_suffix}", tenant=tenant, is_primary=True)
    if api_domain_suffix:
        Domain.objects.create(
            domain=f"{subdomain}.{api_domain_suffix}", tenant=tenant, is_primary=False,
        )

    # Provision Vercel subdomain
    try:
        from tenants.vercel import add_vercel_domain
        add_vercel_domain(subdomain)
    except Exception as exc:
        logger.error("_create_tenant_from_pending: Vercel failed for %r: %s", subdomain, exc)

    # Create owner user inside the new tenant schema
    with tenant_context(tenant):
        from staff.models import User

        base_user = re.sub(r"[^a-z0-9]", "", pending.email.split("@")[0].lower())[:20] or "owner"
        username = base_user
        n = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_user}{n}"
            n += 1

        user = User(
            username=username,
            email=pending.email,
            full_name=pending.full_name,
            phone=pending.phone,
            role="owner",
            is_staff=True,
            is_active=True,
        )
        user.password = pending.password_hash  # already Django-hashed (empty for Google users)
        user.save()

    send_approval_email(pending.full_name, pending.business_name, pending.email)
    logger.info(
        "_create_tenant_from_pending: created tenant=%r schema=%r for pending_id=%s",
        subdomain, schema_name, pending.pk,
    )
    pending.delete()


@admin.register(PendingRegistration)
class PendingRegistrationAdmin(admin.ModelAdmin):
    list_display = (
        "business_name", "email", "phone", "city",
        "email_verified", "created_at", "ip_address",
    )
    list_filter = ("email_verified", "business_type", "created_at")
    search_fields = ("business_name", "email", "phone", "full_name")
    readonly_fields = ("created_at", "ip_address", "password_hash")
    actions = [approve_pending_registrations]


# ── Supporting models ─────────────────────────────────────────────────────────

@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ("domain", "tenant", "is_primary")
    list_filter = ("is_primary",)
    search_fields = ("domain", "tenant__business_name")


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "price_zmw", "max_staff", "max_bookings_per_month", "agent_features_enabled")
    list_filter = ("agent_features_enabled",)


@admin.register(TenantSubscription)
class TenantSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("tenant", "plan", "status", "current_period_ends_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("tenant__business_name",)
    raw_id_fields = ("tenant", "plan")
