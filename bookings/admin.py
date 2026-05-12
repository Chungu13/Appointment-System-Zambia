from django.contrib import admin

from .models import Appointment, AppointmentHistory, Customer, Waitlist


class AppointmentHistoryInline(admin.TabularInline):
    model = AppointmentHistory
    extra = 0
    readonly_fields = ("changed_by", "changed_by_agent", "old_status", "new_status", "note", "created_at")
    ordering = ("-created_at",)

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("full_name", "phone", "visit_count", "no_show_count", "last_visit_at", "created_at")
    search_fields = ("full_name", "phone")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("customer", "staff", "service", "starts_at", "ends_at", "status", "booked_by")
    list_filter = ("status", "booked_by", "service__category")
    search_fields = ("customer__full_name", "customer__phone", "staff__full_name")
    readonly_fields = ("created_at", "updated_at", "reminder_sent_at", "cancelled_at")
    raw_id_fields = ("customer", "staff", "service")
    date_hierarchy = "starts_at"
    inlines = [AppointmentHistoryInline]


@admin.register(AppointmentHistory)
class AppointmentHistoryAdmin(admin.ModelAdmin):
    list_display = ("appointment", "changed_by", "old_status", "new_status", "created_at")
    list_filter = ("old_status", "new_status")
    search_fields = ("appointment__customer__full_name",)
    readonly_fields = ("appointment", "changed_by", "changed_by_agent", "old_status", "new_status", "note", "created_at")
    raw_id_fields = ("appointment",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(Waitlist)
class WaitlistAdmin(admin.ModelAdmin):
    list_display = ("customer", "service", "preferred_date", "preferred_staff", "is_active", "notified_at")
    list_filter = ("is_active", "service__category")
    search_fields = ("customer__full_name", "customer__phone")
    raw_id_fields = ("customer", "service", "preferred_staff")
    date_hierarchy = "preferred_date"
