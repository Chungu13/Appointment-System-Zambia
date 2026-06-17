from django.contrib import admin
from django.conf import settings

from .models import Domain, SubscriptionPlan, Tenant, TenantSubscription


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
        "is_approved", "is_active", "on_trial", "created_at",
    )
    list_filter = ("is_approved", "is_active", "business_type", "on_trial")
    search_fields = ("business_name", "subdomain", "phone")
    readonly_fields = ("schema_name", "created_at", "updated_at")
    actions = [approve_businesses]


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
