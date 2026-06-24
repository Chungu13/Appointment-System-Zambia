from django.conf import settings
from django.db import models
from django.db.models import F, Q


class Customer(models.Model):
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, unique=True)  # unique=True already creates an index
    notes = models.TextField(blank=True)
    visit_count = models.PositiveIntegerField(default=0)
    last_visit_at = models.DateTimeField(null=True, blank=True)
    no_show_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]
        constraints = [
            models.CheckConstraint(
                condition=Q(visit_count__gte=0),
                name="customer_visit_count_non_negative",
            ),
            models.CheckConstraint(
                condition=Q(no_show_count__gte=0),
                name="customer_no_show_count_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.phone})"


class Appointment(models.Model):
    STATUS_PENDING     = "pending"
    STATUS_CONFIRMED   = "confirmed"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED   = "completed"
    STATUS_NO_SHOW     = "no_show"
    STATUS_CANCELLED   = "cancelled"

    BOOKED_BY_CUSTOMER = "customer"
    BOOKED_BY_STAFF    = "staff"
    BOOKED_BY_AGENT    = "agent"

    STATUS_CHOICES = [
        (STATUS_PENDING,     "Pending"),
        (STATUS_CONFIRMED,   "Confirmed"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_COMPLETED,   "Completed"),
        (STATUS_NO_SHOW,     "No Show"),
        (STATUS_CANCELLED,   "Cancelled"),
    ]
    BOOKED_BY_CHOICES = [
        (BOOKED_BY_CUSTOMER, "Customer"),
        (BOOKED_BY_STAFF,    "Staff"),
        (BOOKED_BY_AGENT,    "Agent"),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="appointments")
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="appointments",
    )
    service = models.ForeignKey("services.Service", on_delete=models.PROTECT, related_name="appointments")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    booked_by = models.CharField(max_length=10, choices=BOOKED_BY_CHOICES, default="customer")
    customer_notes = models.TextField(blank=True)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    cancelled_by = models.CharField(
        max_length=10,
        choices=[("customer", "Customer"), ("owner", "Owner")],
        default="customer",
        blank=True,
    )
    notification_phone = models.CharField(max_length=20, blank=True)
    chat_session_id = models.CharField(max_length=128, blank=True)
    addon_services = models.ManyToManyField('services.Service', blank=True, related_name='addon_appointments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-starts_at"]
        indexes = [
            models.Index(fields=["starts_at"], name="appt_starts_at_idx"),
            models.Index(fields=["ends_at"], name="appt_ends_at_idx"),
            models.Index(fields=["staff", "starts_at"], name="appt_staff_starts_at_idx"),
            models.Index(fields=["status"], name="appt_status_idx"),
            models.Index(fields=["created_at"], name="appt_created_at_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(ends_at__gt=F("starts_at")),
                name="appt_ends_after_starts",
            ),
        ]

    def save(self, *args, **kwargs):
        # Detect status transitions to fire outgoing webhooks.
        # Query is skipped on INSERT (no pk yet) and when the status field
        # is not in update_fields (partial saves that don't touch status).
        update_fields = kwargs.get("update_fields")
        if update_fields is not None and "status" not in update_fields:
            super().save(*args, **kwargs)
            return

        if self.pk:
            old_status = (
                Appointment.objects.filter(pk=self.pk)
                .values_list("status", flat=True)
                .first()
            ) or "pending"
        else:
            old_status = "pending"

        super().save(*args, **kwargs)

        if old_status != self.status:
            try:
                from django.db import connection
                from bookings.signals import appointment_status_changed
                appointment_status_changed.send(
                    sender=self.__class__,
                    instance=self,
                    old_status=old_status,
                    new_status=self.status,
                    schema_name=connection.schema_name,
                )
            except Exception:
                import logging as _log
                _log.getLogger(__name__).exception(
                    "Appointment.save: failed to send appointment_status_changed signal for pk=%s status=%s",
                    self.pk, self.status,
                )

    def __str__(self):
        return f"{self.customer} with {self.staff} @ {self.starts_at:%Y-%m-%d %H:%M}"


class AppointmentHistory(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name="history")
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointment_history_entries",
    )
    changed_by_agent = models.CharField(max_length=50, blank=True)
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.appointment} | {self.old_status} → {self.new_status}"


class Waitlist(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="waitlist_entries")
    service = models.ForeignKey("services.Service", on_delete=models.CASCADE, related_name="waitlist_entries")
    preferred_date = models.DateField()
    preferred_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="waitlist_entries",
    )
    notified_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["preferred_date"]
        indexes = [
            models.Index(
                fields=["service", "preferred_date", "is_active"],
                name="wl_svc_date_active_idx",
            ),
        ]

    def __str__(self):
        return f"{self.customer} waiting for {self.service} on {self.preferred_date}"
