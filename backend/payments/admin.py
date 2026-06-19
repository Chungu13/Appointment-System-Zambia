from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("appointment", "amount_zmw", "payment_type", "method", "status", "paid_at", "disburse_amount", "disburse_status", "kimawa_net")
    list_filter = ("status", "payment_type", "method")
    search_fields = ("appointment__customer__full_name", "transaction_ref")
    readonly_fields = ("updated_at",)
    raw_id_fields = ("appointment",)
