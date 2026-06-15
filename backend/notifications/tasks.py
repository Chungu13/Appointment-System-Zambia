import logging
import zoneinfo

from celery import shared_task
from django.utils import timezone

from notifications.webhook_dispatcher import dispatch

logger = logging.getLogger(__name__)

_CAT = zoneinfo.ZoneInfo("Africa/Lusaka")


def _fmt_date(dt) -> str:
    local = dt.astimezone(_CAT)
    return local.strftime("%A, %d %B %Y")


def _fmt_time(dt) -> str:
    local = dt.astimezone(_CAT)
    return local.strftime("%I:%M %p").lstrip("0")


def _build_payload(appt, tenant, event: str) -> dict:
    return {
        "event":          event,
        "appointment_id": appt.pk,
        "customer_name":  appt.customer.full_name,
        "customer_phone": appt.notification_phone or appt.customer.phone,
        "business_name":  tenant.business_name,
        "service_name":   appt.service.name,
        "staff_name":     appt.staff.full_name if appt.staff else None,
        "date":           _fmt_date(appt.starts_at),
        "time":           _fmt_time(appt.starts_at),
    }


@shared_task(name="notifications.tasks.notify_booking_confirmed")
def notify_booking_confirmed(appointment_id: int, schema_name: str) -> None:
    """Fire the booking_confirmed webhook to n8n."""
    _fire("booking-confirmed", appointment_id, schema_name)


@shared_task(name="notifications.tasks.notify_booking_reminder")
def notify_booking_reminder(appointment_id: int, schema_name: str) -> None:
    """Fire the booking_reminder webhook to n8n."""
    _fire("booking-reminder", appointment_id, schema_name)


@shared_task(name="notifications.tasks.notify_booking_cancelled")
def notify_booking_cancelled(appointment_id: int, schema_name: str) -> None:
    """Fire the booking_cancelled webhook to n8n."""
    _fire("booking-cancelled", appointment_id, schema_name)


def _fire(event: str, appointment_id: int, schema_name: str) -> None:
    """Shared implementation — fetch appointment in tenant context, dispatch webhook."""
    try:
        from django_tenants.utils import get_tenant_model, tenant_context

        Tenant = get_tenant_model()
        try:
            tenant = Tenant.objects.get(schema_name=schema_name)
        except Tenant.DoesNotExist:
            logger.warning("_fire: schema '%s' not found — skipping %s", schema_name, event)
            return

        with tenant_context(tenant):
            from bookings.models import Appointment
            try:
                appt = Appointment.objects.select_related(
                    "service", "staff", "customer"
                ).get(pk=appointment_id)
            except Appointment.DoesNotExist:
                logger.warning("_fire: appointment %d not found in %s", appointment_id, schema_name)
                return

            payload = _build_payload(appt, tenant, event)
            dispatch(event, payload)

    except Exception:
        logger.exception("_fire: unhandled error for %s appointment=%d schema=%s", event, appointment_id, schema_name)
