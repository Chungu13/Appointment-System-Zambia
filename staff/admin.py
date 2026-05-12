from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, WorkingHours


class WorkingHoursInline(admin.TabularInline):
    model = WorkingHours
    extra = 0
    fields = ("day_of_week", "is_day_off", "start_time", "end_time")
    ordering = ("day_of_week",)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "full_name", "email", "phone", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("username", "full_name", "email", "phone")
    readonly_fields = ("updated_at",)
    inlines = [WorkingHoursInline]
    fieldsets = UserAdmin.fieldsets + (
        ("Profile", {"fields": ("full_name", "phone", "role", "avatar_url", "updated_at")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Profile", {"fields": ("full_name", "email", "phone", "role")}),
    )


@admin.register(WorkingHours)
class WorkingHoursAdmin(admin.ModelAdmin):
    list_display = ("staff", "day_of_week", "is_day_off", "start_time", "end_time")
    list_filter = ("day_of_week", "is_day_off")
    search_fields = ("staff__full_name", "staff__username")
    raw_id_fields = ("staff",)
