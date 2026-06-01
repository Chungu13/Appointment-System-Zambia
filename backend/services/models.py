import uuid

from django.conf import settings
from django.db import models
from django.db.models import F, Q


class Service(models.Model):
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100, blank=True, default="")
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveIntegerField(default=60)
    price_zmw = models.DecimalField(max_digits=10, decimal_places=2)
    deposit_zmw = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    buffer_minutes = models.PositiveIntegerField(
        default=0,
        help_text="Clean-up / prep time appended after the appointment slot.",
    )
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "name"]
        constraints = [
            models.CheckConstraint(
                condition=Q(price_zmw__gte=0),
                name="service_price_non_negative",
            ),
            models.CheckConstraint(
                condition=Q(deposit_zmw__lte=F("price_zmw")),
                name="service_deposit_le_price",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.duration_minutes} min)"


class StaffService(models.Model):
    """Junction table: which staff members can perform which services."""

    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="staff_services",
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="staff_services",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["staff", "service"],
                name="staffservice_staff_service_uniq",
            ),
        ]

    def __str__(self):
        return f"{self.staff} — {self.service}"


class PortfolioImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    image_url = models.TextField()
    caption = models.TextField(blank=True)
    service = models.ForeignKey(
        Service,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="portfolio_images",
    )
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "created_at"]

    def __str__(self):
        return f"Portfolio image {self.pk}"
