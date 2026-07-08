from django.db import models


class Payment(models.Model):
    STATUS_PENDING   = "pending"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED    = "failed"
    STATUS_REFUNDED  = "refunded"

    DISBURSE_PENDING   = "pending"
    DISBURSE_SENT      = "sent"
    DISBURSE_COMPLETED = "completed"
    DISBURSE_FAILED    = "failed"

    PAYMENT_TYPE_CHOICES = [
        ("deposit", "Deposit"),
        ("balance", "Balance"),
        ("refund",  "Refund"),
    ]
    METHOD_CHOICES = [
        ("airtel_money", "Airtel Money"),
        ("mtn_momo",     "MTN MoMo"),
        ("card",         "Card"),
        ("cash",         "Cash"),
    ]
    STATUS_CHOICES = [
        (STATUS_PENDING,   "Pending"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED,    "Failed"),
        (STATUS_REFUNDED,  "Refunded"),
    ]

    appointment = models.ForeignKey(
        "bookings.Appointment",
        on_delete=models.CASCADE,
        related_name="payments",
    )
    amount_zmw = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPE_CHOICES)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    transaction_ref = models.CharField(max_length=100, blank=True)
    provider_ref = models.CharField(max_length=200, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    disburse_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    disburse_reference = models.CharField(max_length=64, null=True, blank=True)
    disburse_transaction_id = models.CharField(max_length=128, null=True, blank=True)
    disburse_status = models.CharField(max_length=20, default='pending')
    kimawa_net = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-paid_at"]
        indexes = [
            models.Index(fields=["status"],          name="payment_status_idx"),
            models.Index(fields=["transaction_ref"], name="payment_txn_ref_idx"),
        ]

    def __str__(self):
        return f"{self.appointment}: {self.amount_zmw} ZMW ({self.status})"
