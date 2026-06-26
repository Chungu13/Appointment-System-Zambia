import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "beautybook.settings")

app = Celery("beautybook")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.update(
    result_expires=3600,           # clear completed task results from Redis after 1 hour
    task_compression="gzip",       # compress task payloads in Redis
    worker_prefetch_multiplier=1,  # fetch one task at a time — avoids starvation under load
    task_acks_late=True,           # ack only after the task completes — safer on worker crash
)

app.conf.beat_schedule = {
    # Every 15 minutes — expire pending appointments whose payment window has closed
    "expire-pending-payments": {
        "task": "agents.tasks.expire_pending_payments",
        "schedule": 900.0,
    },
    # Daily at 6 pm CAT — remind customers about tomorrow's appointments
    "send-appointment-reminders": {
        "task": "agents.tasks.send_appointment_reminders",
        "schedule": crontab(hour=18, minute=0),
    },
    # Every 30 minutes — auto-mark missed appointments as no_show
    "detect-no-shows": {
        "task": "agents.tasks.detect_no_shows",
        "schedule": 1800.0,
    },
    # Daily at 1 am CAT — deactivate expired trial accounts (off-peak)
    "check-trial-expiry": {
        "task": "agents.tasks.check_trial_expiry",
        "schedule": crontab(hour=1, minute=0),
    },
    # Every Monday at 2 am CAT — weekly business digest (off-peak)
    "send-weekly-digest": {
        "task": "agents.tasks.send_weekly_digest",
        "schedule": crontab(hour=2, minute=0, day_of_week=1),
    },
}
