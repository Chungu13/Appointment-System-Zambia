from django.db import models
from django_tenants.models import TenantMixin, DomainMixin


class Tenant(TenantMixin):
    BUSINESS_TYPE_CHOICES = [
        ("salon", "Salon"),
        ("barbershop", "Barbershop"),
        ("nail_tech", "Nail Tech"),
        ("spa", "Spa"),
        ("lash_studio", "Lash Studio"),
        ("makeup_artist", "Makeup Artist"),
    ]

    business_name = models.CharField(max_length=100)
    business_type = models.CharField(max_length=20, choices=BUSINESS_TYPE_CHOICES, default="salon")
    subdomain = models.SlugField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, default="Lusaka")
    area = models.CharField(max_length=120, blank=True, default="")
    address = models.TextField(blank=True)
    staff_access_key = models.CharField(max_length=50, blank=True)
    payout_phone = models.CharField(max_length=20, blank=True, default='')
    whatsapp_number = models.CharField(max_length=20, blank=True, default='')
    cover_image_url = models.TextField(blank=True)
    portfolio_preview_url = models.TextField(blank=True)
    business_policies = models.JSONField(default=dict, blank=True)
    onboarding_completed = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    on_trial = models.BooleanField(default=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    auto_create_schema = True

    class Meta:
        ordering = ["business_name"]

    def __str__(self):
        return self.business_name


class Domain(DomainMixin):
    pass


class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=50)
    price_zmw = models.DecimalField(max_digits=10, decimal_places=2)
    max_staff = models.PositiveIntegerField()
    max_bookings_per_month = models.PositiveIntegerField()
    agent_features_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class TenantSubscription(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("past_due", "Past Due"),
        ("cancelled", "Cancelled"),
        ("trialing", "Trialing"),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name="subscriptions")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="trialing")
    current_period_ends_at = models.DateTimeField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-current_period_ends_at"]

    def __str__(self):
        return f"{self.tenant} — {self.plan} ({self.status})"
