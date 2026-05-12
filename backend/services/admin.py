from django.contrib import admin

from .models import Service, StaffService


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "duration_minutes", "price_zmw", "deposit_zmw", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name",)
    readonly_fields = ("updated_at",)


@admin.register(StaffService)
class StaffServiceAdmin(admin.ModelAdmin):
    list_display = ("staff", "service", "updated_at")
    list_filter = ("service__category",)
    search_fields = ("staff__full_name", "service__name")
    raw_id_fields = ("staff", "service")
