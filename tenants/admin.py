from django.contrib import admin

from .models import Domain, SubscriptionPlan, Tenant, TenantSubscription


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("business_name", "business_type", "subdomain", "city", "is_active", "on_trial", "created_at")
    list_filter = ("business_type", "is_active", "on_trial")
    search_fields = ("business_name", "subdomain", "phone")
    readonly_fields = ("schema_name", "created_at", "updated_at")


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
