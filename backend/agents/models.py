from django.db import models


class AgentLog(models.Model):
    AGENT_TYPE_CHOICES = [
        ("booking", "Booking"),
        ("scheduling", "Scheduling"),
        ("payment", "Payment"),
        ("insights", "Insights"),
        ("onboarding", "Onboarding"),
    ]
    OUTCOME_CHOICES = [
        ("success", "Success"),
        ("failed", "Failed"),
        ("pending_human", "Pending Human"),
    ]

    agent_type = models.CharField(max_length=20, choices=AGENT_TYPE_CHOICES)
    action = models.TextField()
    related_appointment = models.ForeignKey(
        "bookings.Appointment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="agent_logs",
    )
    outcome = models.CharField(max_length=20, choices=OUTCOME_CHOICES)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at", "agent_type"], name="agentlog_created_type_idx"),
        ]

    def __str__(self):
        return f"[{self.agent_type}] {self.outcome} @ {self.created_at:%Y-%m-%d %H:%M}"
