import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "beautybook.settings")

app = Celery("beautybook")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    # Daily at 6 pm CAT — remind customers about tomorrow's appointments
    "send-appointment-reminders": {
        "task": "agents.tasks.send_appointment_reminders",
        "schedule": crontab(hour=18, minute=0),
    },
    # Every 5 minutes — notify waitlist when a slot opens up
    "fill-cancelled-slots": {
        "task": "agents.tasks.fill_cancelled_slots",
        "schedule": 300.0,
    },
    # Every 30 minutes — auto-mark missed appointments as no_show
    "detect-no-shows": {
        "task": "agents.tasks.detect_no_shows",
        "schedule": 1800.0,
    },
    # Daily at midnight CAT — deactivate expired trial accounts
    "check-trial-expiry": {
        "task": "agents.tasks.check_trial_expiry",
        "schedule": crontab(hour=0, minute=0),
    },
    # Every 30 minutes — chase unpaid deposits and auto-cancel overdue bookings
    "check-unpaid-deposits": {
        "task": "agents.tasks.check_unpaid_deposits",
        "schedule": 1800.0,
    },
    # Every Monday at 7 am CAT — weekly business digest for each tenant
    "send-weekly-digest": {
        "task": "agents.tasks.send_weekly_digest",
        "schedule": crontab(hour=7, minute=0, day_of_week=1),
    },
}
