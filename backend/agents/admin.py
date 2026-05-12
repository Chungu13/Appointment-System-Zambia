from django.contrib import admin

from .models import AgentLog


@admin.register(AgentLog)
class AgentLogAdmin(admin.ModelAdmin):
    list_display = ("agent_type", "outcome", "related_appointment", "created_at")
    list_filter = ("agent_type", "outcome")
    search_fields = ("action",)
    readonly_fields = ("agent_type", "action", "related_appointment", "outcome", "metadata", "created_at")
    raw_id_fields = ("related_appointment",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
