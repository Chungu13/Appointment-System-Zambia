from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("appointment", "amount_zmw", "payment_type", "method", "status", "paid_at")
    list_filter = ("status", "payment_type", "method")
    search_fields = ("appointment__customer__full_name", "dpo_transaction_id")
    readonly_fields = ("updated_at",)
    raw_id_fields = ("appointment",)
