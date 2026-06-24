import logging

from celery import shared_task

from core.time_utils import fmt_date_cat, fmt_time_cat
from notifications.webhook_dispatcher import dispatch

logger = logging.getLogger(__name__)


def _build_payload(appt, tenant, event: str) -> dict:
    deposit = str(appt.service.deposit_zmw) if float(appt.service.deposit_zmw or 0) > 0 else "0"
    payload = {
        "event":           event,
        "appointment_id":  appt.pk,
        "customer_name":   appt.customer.full_name,
        "customer_phone":  appt.notification_phone or appt.customer.phone,
        "business_name":   tenant.business_name,
        "service_name":    appt.service.name,
        "staff_name":      appt.staff.full_name if appt.staff else None,
        "date":            fmt_date_cat(appt.starts_at),
        "time":            fmt_time_cat(appt.starts_at),
        "owner_whatsapp":  tenant.whatsapp_number or "",
        "deposit_amount":  deposit,
    }
    if event == "booking-cancelled":
        payload["cancelled_by"] = getattr(appt, "cancelled_by", "customer") or "customer"
    return payload


@shared_task(name="notifications.tasks.notify_booking_confirmed")
def notify_booking_confirmed(appointment_id: int, schema_name: str) -> None:
    _dispatch_notification("booking-confirmed", appointment_id, schema_name)


@shared_task(name="notifications.tasks.notify_booking_reminder")
def notify_booking_reminder(appointment_id: int, schema_name: str) -> None:
    _dispatch_notification("booking-reminder", appointment_id, schema_name)


@shared_task(name="notifications.tasks.notify_booking_cancelled")
def notify_booking_cancelled(appointment_id: int, schema_name: str) -> None:
    _dispatch_notification("booking-cancelled", appointment_id, schema_name)


def _dispatch_notification(event: str, appointment_id: int, schema_name: str) -> None:
    """Fetch appointment in tenant context and send the event payload to n8n."""
    try:
        from django_tenants.utils import get_tenant_model, tenant_context

        Tenant = get_tenant_model()
        try:
            tenant = Tenant.objects.get(schema_name=schema_name)
        except Tenant.DoesNotExist:
            logger.warning(
                "_dispatch_notification: schema '%s' not found — skipping %s",
                schema_name, event,
            )
            return

        with tenant_context(tenant):
            from bookings.models import Appointment
            try:
                appt = Appointment.objects.select_related(
                    "service", "staff", "customer"
                ).get(pk=appointment_id)
            except Appointment.DoesNotExist:
                logger.warning(
                    "_dispatch_notification: appointment %d not found in %s",
                    appointment_id, schema_name,
                )
                return

            payload = _build_payload(appt, tenant, event)
            dispatch(event, payload)

    except Exception:
        logger.exception(
            "_dispatch_notification: unhandled error for %s appointment=%d schema=%s",
            event, appointment_id, schema_name,
        )
