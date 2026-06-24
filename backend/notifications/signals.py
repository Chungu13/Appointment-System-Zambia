import logging

from django.dispatch import receiver

from bookings.models import Appointment
from bookings.signals import appointment_status_changed

logger = logging.getLogger(__name__)


@receiver(appointment_status_changed)
def on_appointment_status_changed(sender, instance, old_status, new_status, schema_name, **kwargs):
    """Enqueue a Celery notification task whenever an appointment is confirmed or cancelled."""
    if new_status not in (Appointment.STATUS_CONFIRMED, Appointment.STATUS_CANCELLED):
        return
    try:
        if new_status == Appointment.STATUS_CONFIRMED:
            from notifications.tasks import notify_booking_confirmed
            notify_booking_confirmed.delay(instance.pk, schema_name)
        elif new_status == Appointment.STATUS_CANCELLED:
            from notifications.tasks import notify_booking_cancelled
            notify_booking_cancelled.delay(instance.pk, schema_name)
    except Exception:
        logger.exception(
            "on_appointment_status_changed: failed to enqueue notification for pk=%s status=%s",
            instance.pk, new_status,
        )
