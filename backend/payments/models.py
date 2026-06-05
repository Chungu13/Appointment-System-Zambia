from django.db import models


class Payment(models.Model):
    PAYMENT_TYPE_CHOICES = [
        ("deposit", "Deposit"),
        ("balance", "Balance"),
        ("refund", "Refund"),
    ]
    METHOD_CHOICES = [
        ("airtel_money", "Airtel Money"),
        ("mtn_momo", "MTN MoMo"),
        ("card", "Card"),
        ("cash", "Cash"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
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
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-paid_at"]

    def __str__(self):
        return f"{self.appointment} — {self.amount_zmw} ZMW ({self.status})"
