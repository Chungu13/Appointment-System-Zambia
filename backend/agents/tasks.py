import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


def _active_tenants():
    """All non-public, active tenants."""
    from django_tenants.utils import get_tenant_model
    return (
        get_tenant_model().objects
        .filter(is_active=True)
        .exclude(schema_name="public")
    )


# ---------------------------------------------------------------------------
# Task 1 — daily 6 pm CAT
# ---------------------------------------------------------------------------

@shared_task(name="agents.tasks.send_appointment_reminders")
def send_appointment_reminders():
    """Send SMS reminders for tomorrow's confirmed appointments."""
    import datetime
    from django_tenants.utils import tenant_context
    from agents.models import AgentLog
    from bookings.models import Appointment

    tomorrow = timezone.localdate() + datetime.timedelta(days=1)
    now = timezone.now()
    local_tz = timezone.get_current_timezone()
    total = 0

    for tenant in _active_tenants():
        with tenant_context(tenant):
            appointments = (
                Appointment.objects
                .filter(
                    starts_at__date=tomorrow,
                    status="confirmed",
                    reminder_sent_at__isnull=True,
                )
                .select_related("customer", "staff", "service")
            )
            for appt in appointments:
                local_time = appt.starts_at.astimezone(local_tz).strftime("%H:%M")
                msg = (
                    f"REMINDER SMS to {appt.customer.phone}: "
                    f"Your {appt.service.name} appointment is tomorrow at "
                    f"{local_time} with {appt.staff.full_name} "
                    f"at {tenant.business_name}"
                )
                logger.info(msg)

                appt.reminder_sent_at = now
                appt.save(update_fields=["reminder_sent_at"])

                AgentLog.objects.create(
                    agent_type="scheduling",
                    action=msg,
                    related_appointment=appt,
                    outcome="success",
                    metadata={
                        "tenant": tenant.schema_name,
                        "appointment_date": str(tomorrow),
                        "customer_phone": appt.customer.phone,
                    },
                )
                total += 1

    logger.info("send_appointment_reminders: %d reminders sent", total)
    return total


# ---------------------------------------------------------------------------
# Task 2 — every 5 minutes
# ---------------------------------------------------------------------------

@shared_task(name="agents.tasks.fill_cancelled_slots")
def fill_cancelled_slots():
    """Notify waitlist customers when a slot opens up. Disabled until SMS infrastructure is ready."""
    # TODO: re-enable when WhatsApp/SMS delivery is wired up
    # Waitlist model and data are preserved — just notifications are paused.
    logger.info("fill_cancelled_slots: slot available — waitlist notifications coming soon")
    return 0

    # --- preserved for later ---
    # import datetime
    # from django_tenants.utils import tenant_context
    # from agents.scheduling_agent import SchedulingAgent
    # from bookings.models import Appointment
    #
    # now = timezone.now()
    # since = now - datetime.timedelta(minutes=10)
    # total = 0
    #
    # for tenant in _active_tenants():
    #     with tenant_context(tenant):
    #         recently_cancelled = (
    #             Appointment.objects
    #             .filter(status="cancelled", cancelled_at__gte=since)
    #             .only("id")
    #         )
    #         agent = SchedulingAgent(tenant)
    #         for appt in recently_cancelled:
    #             try:
    #                 agent.fill_slot(appt.pk)
    #                 total += 1
    #             except Exception:
    #                 logger.exception(
    #                     "fill_cancelled_slots: error processing appointment %d for tenant %s",
    #                     appt.pk, tenant.schema_name,
    #                 )
    #
    # logger.info("fill_cancelled_slots: processed %d cancelled slots", total)
    # return total


# ---------------------------------------------------------------------------
# Task 3 — every 30 minutes
# ---------------------------------------------------------------------------

@shared_task(name="agents.tasks.detect_no_shows")
def detect_no_shows():
    """Mark overdue confirmed appointments as no_show and increment counters."""
    from django.db.models import F
    from django_tenants.utils import tenant_context
    from agents.models import AgentLog
    from bookings.models import Appointment, Customer

    now = timezone.now()
    total = 0

    for tenant in _active_tenants():
        with tenant_context(tenant):
            overdue = (
                Appointment.objects
                .filter(ends_at__lt=now, status="confirmed")
                .select_related("customer", "staff", "service")
            )
            for appt in overdue:
                appt.status = "no_show"
                appt.save(update_fields=["status", "updated_at"])

                Customer.objects.filter(pk=appt.customer_id).update(
                    no_show_count=F("no_show_count") + 1,
                )

                action = (
                    f"No-show detected: {appt.customer.full_name} missed "
                    f"{appt.service.name} with {appt.staff.full_name} "
                    f"at {appt.starts_at:%Y-%m-%d %H:%M}"
                )
                logger.warning(action)

                AgentLog.objects.create(
                    agent_type="scheduling",
                    action=action,
                    related_appointment=appt,
                    outcome="success",
                    metadata={
                        "tenant": tenant.schema_name,
                        "customer_id": appt.customer_id,
                        "appointment_id": appt.pk,
                    },
                )
                total += 1

    logger.info("detect_no_shows: marked %d appointments as no_show", total)
    return total


# ---------------------------------------------------------------------------
# Task 4 — daily midnight CAT
# ---------------------------------------------------------------------------

@shared_task(name="agents.tasks.check_trial_expiry")
def check_trial_expiry():
    """Deactivate tenants whose free trial period has ended."""
    from django_tenants.utils import get_tenant_model, tenant_context
    from agents.models import AgentLog

    now = timezone.now()
    expired = (
        get_tenant_model().objects
        .filter(on_trial=True, trial_ends_at__lt=now, is_active=True)
        .exclude(schema_name="public")
    )
    total = 0

    for tenant in expired:
        tenant.is_active = False
        tenant.on_trial = False
        tenant.save(update_fields=["is_active", "on_trial", "updated_at"])

        action = (
            f"Trial expired for {tenant.business_name} "
            f"(ended {tenant.trial_ends_at:%Y-%m-%d})"
        )
        logger.warning(action)

        with tenant_context(tenant):
            AgentLog.objects.create(
                agent_type="onboarding",
                action=action,
                outcome="success",
                metadata={
                    "tenant": tenant.schema_name,
                    "trial_ends_at": str(tenant.trial_ends_at),
                },
            )
        total += 1

    logger.info("check_trial_expiry: deactivated %d tenants", total)
    return total


# ---------------------------------------------------------------------------
# Task 5 — every Monday 7 am CAT
# ---------------------------------------------------------------------------

@shared_task(name="agents.tasks.send_weekly_digest")
def send_weekly_digest():
    """Use the InsightsAgent to generate and store a weekly business digest per tenant."""
    from django_tenants.utils import tenant_context
    from agents.insights_agent import InsightsAgent

    total = 0
    for tenant in _active_tenants():
        with tenant_context(tenant):
            try:
                InsightsAgent(tenant).generate_weekly_digest()
                total += 1
            except Exception:
                logger.exception(
                    "send_weekly_digest: error for tenant %s", tenant.schema_name
                )

    logger.info("send_weekly_digest: generated digests for %d tenants", total)
    return total
