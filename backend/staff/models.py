from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import F, Q


class User(AbstractUser):
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("staff", "Staff"),
    ]

    full_name = models.CharField(max_length=150, unique=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="staff")
    avatar_url = models.TextField(blank=True)
    bio = models.TextField(blank=True)
    display_on_public_page = models.BooleanField(default=False)
    pin_hash = models.CharField(max_length=128, blank=True, default='')
    is_also_staff = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    # is_active is inherited from AbstractUser

    REQUIRED_FIELDS = ["email", "full_name"]

    def __str__(self):
        return self.full_name or self.username


class WorkingHours(models.Model):
    DAY_CHOICES = [
        (0, "Monday"), (1, "Tuesday"), (2, "Wednesday"),
        (3, "Thursday"), (4, "Friday"), (5, "Saturday"), (6, "Sunday"),
    ]

    staff = models.ForeignKey(
        "staff.User",
        on_delete=models.CASCADE,
        related_name="working_hours",
    )
    day_of_week = models.PositiveSmallIntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_day_off = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["day_of_week"]
        constraints = [
            models.UniqueConstraint(
                fields=["staff", "day_of_week"],
                name="workinghours_staff_day_uniq",
            ),
            # When it's not a day off, end_time must be after start_time.
            models.CheckConstraint(
                condition=Q(is_day_off=True) | Q(end_time__gt=F("start_time")),
                name="workinghours_end_after_start",
            ),
        ]

    def __str__(self):
        return f"{self.staff} — {self.get_day_of_week_display()}"
