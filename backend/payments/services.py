import logging

from bookings.models import Appointment
from payments.models import Payment

logger = logging.getLogger(__name__)

LIPILA_STATUS_SUCCESSFUL = "Successful"


def _find_payment(*, transaction_ref: str = "", disburse_ref: str = ""):
    """
    Search all tenant schemas for a Payment record.
    Pass either transaction_ref (collection) or disburse_ref (disbursement).
    Returns (payment, tenant) or (None, None).
    """
    from django_tenants.utils import get_tenant_model, tenant_context

    Tenant = get_tenant_model()
    for tenant in Tenant.objects.exclude(schema_name="public"):
        with tenant_context(tenant):
            if transaction_ref:
                payment = (
                    Payment.objects
                    .select_related("appointment__service", "appointment__staff")
                    .filter(transaction_ref=transaction_ref)
                    .first()
                )
            else:
                payment = Payment.objects.filter(disburse_reference=disburse_ref).first()
            if payment:
                return payment, tenant
    return None, None


def _disburse_to_business(payment, appt) -> None:
    """Send owner payout after successful payment. Never raises — logs errors only."""
    try:
        from decimal import Decimal
        from django.db import connection
        from tenants.models import Tenant
        from payments.providers.lipila import LipilaProvider, compute_disburse_amount, compute_kimawa_net

        tenant = Tenant.objects.filter(schema_name=connection.schema_name).first()
        if not tenant:
            logger.warning("[Disbursement] Tenant not found for schema %s", connection.schema_name)
            return

        payout_phone = tenant.payout_phone
        if not payout_phone:
            logger.warning("[Disbursement] No payout_phone set for tenant %s", tenant.schema_name)
            return

        deposit = float(appt.service.deposit_zmw)
        collection_amount = float(payment.amount_zmw)
        disburse_amount = compute_disburse_amount(deposit)
        kimawa_net = compute_kimawa_net(deposit, collection_amount)
        disburse_ref = f"DISBURSE-{payment.transaction_ref}"

        payment.disburse_amount = Decimal(str(disburse_amount))
        payment.disburse_reference = disburse_ref
        payment.disburse_status = Payment.DISBURSE_PENDING
        payment.kimawa_net = Decimal(str(kimawa_net))
        payment.save(update_fields=["disburse_amount", "disburse_reference", "disburse_status", "kimawa_net", "updated_at"])

        sanitised_service_name = "".join(c for c in appt.service.name if c.isalnum() or c == " ")
        result = LipilaProvider().initiate_disbursement(
            phone=payout_phone,
            amount=disburse_amount,
            reference=disburse_ref,
            narration=f"Booking payout {sanitised_service_name}",
        )
        if result.success:
            payment.disburse_transaction_id = result.provider_ref
            payment.disburse_status = Payment.DISBURSE_SENT
            payment.save(update_fields=["disburse_transaction_id", "disburse_status", "updated_at"])
            logger.info(
                "[Disbursement] sent ZMW %.2f to %s | ref=%s | txn=%s",
                disburse_amount, payout_phone, disburse_ref, result.provider_ref,
            )
        else:
            payment.disburse_status = Payment.DISBURSE_FAILED
            payment.save(update_fields=["disburse_status", "updated_at"])
            logger.warning("[Disbursement] failed | ref=%s | %s", disburse_ref, result.message)

    except Exception as exc:
        logger.exception("[Disbursement] unexpected error for payment %s: %s", payment.pk, exc)


def handle_disbursement_callback(identifier: str, status: str, lipila_ref: str, message: str) -> dict:
    """Handle a Lipila Disbursement callback — update disburse_status on the matching Payment."""
    from django_tenants.utils import tenant_context

    payment, tenant = _find_payment(disburse_ref=identifier)
    if not payment:
        logger.warning("[Webhook] Disbursement payment not found | identifier=%s", identifier)
        return {"ok": False, "error": "Disbursement payment not found"}

    with tenant_context(tenant):
        if status == LIPILA_STATUS_SUCCESSFUL:
            payment.disburse_status = Payment.DISBURSE_COMPLETED
            if lipila_ref:
                payment.disburse_transaction_id = lipila_ref
            payment.save(update_fields=["disburse_status", "disburse_transaction_id", "updated_at"])
            logger.info(
                "[Webhook] Disbursement completed | identifier=%s | lipila_ref=%s | tenant=%s",
                identifier, lipila_ref, tenant.schema_name,
            )
            return {"ok": True, "disburse_status": Payment.DISBURSE_COMPLETED}

        payment.disburse_status = Payment.DISBURSE_FAILED
        payment.save(update_fields=["disburse_status", "updated_at"])
        logger.warning("[Webhook] Disbursement failed | identifier=%s | msg=%s", identifier, message)
        return {"ok": False, "error": f"Disbursement {status}: {message}"}


def confirm_payment(reference_id: str, status: str = LIPILA_STATUS_SUCCESSFUL, provider_ref: str = "", message: str = "") -> dict:
    """Confirm or fail a payment based on Lipila webhook status."""
    from django_tenants.utils import tenant_context

    payment, tenant = _find_payment(transaction_ref=reference_id)
    if not payment:
        logger.warning("[Webhook] Payment not found | ref=%s", reference_id)
        return {"ok": False, "error": "Payment not found"}

    logger.info("[Webhook] Found payment in tenant=%s | ref=%s", tenant.schema_name, reference_id)

    with tenant_context(tenant):
        return _process_payment_confirmation(
            payment,
            appt=payment.appointment,
            status=status,
            provider_ref=provider_ref,
            reference_id=reference_id,
            message=message,
        )


def _process_payment_confirmation(payment, appt, status: str, provider_ref: str, reference_id: str, message: str) -> dict:
    """Run inside tenant_context — updates payment and appointment, triggers disbursement."""
    if status == LIPILA_STATUS_SUCCESSFUL:
        from django.utils import timezone
        return _handle_successful_payment(payment, appt, provider_ref, reference_id, timezone.now())

    return _handle_failed_payment(payment, appt, reference_id, status, message)


def _handle_successful_payment(payment, appt, provider_ref: str, reference_id: str, now) -> dict:
    """Mark payment as completed, confirm the appointment, and trigger disbursement."""
    from agents.models import AgentLog

    payment.status = Payment.STATUS_COMPLETED
    payment.paid_at = now
    if provider_ref:
        payment.provider_ref = provider_ref
    payment.save(update_fields=["status", "paid_at", "provider_ref", "updated_at"])

    if appt.status not in (Appointment.STATUS_CONFIRMED, Appointment.STATUS_COMPLETED):
        appt.status = Appointment.STATUS_CONFIRMED
        appt.save(update_fields=["status", "updated_at"])

    AgentLog.objects.create(
        agent_type="payment",
        action=(
            f"Payment confirmed: {payment.amount_zmw} ZMW "
            f"for {appt.service.name} with {appt.staff.full_name}"
        ),
        related_appointment=appt,
        outcome="success",
        metadata={
            "reference_id": reference_id,
            "provider_ref": provider_ref,
            "amount_zmw":   float(payment.amount_zmw),
        },
    )

    _disburse_to_business(payment, appt)

    return {"ok": True, "appointment_status": appt.status}


def _handle_failed_payment(payment, appt, reference_id: str, status: str, message: str) -> dict:
    """Mark payment as failed, cancel the appointment, and notify the customer's chat session."""
    from agents.models import AgentLog

    payment.status = Payment.STATUS_FAILED
    payment.save(update_fields=["status", "updated_at"])

    appt.status = Appointment.STATUS_CANCELLED
    appt.save(update_fields=["status", "updated_at"])

    AgentLog.objects.create(
        agent_type="payment",
        action=f"Payment failed: {payment.amount_zmw} ZMW for {appt.service.name}",
        related_appointment=appt,
        outcome="failed",
        metadata={"reference_id": reference_id, "status": status, "message": message},
    )

    _notify_chat_session_of_failed_payment(appt)

    return {"ok": False, "error": f"Payment {status}: {message}"}


def _notify_chat_session_of_failed_payment(appt) -> None:
    """Inject a retry prompt into the customer's active AI chat session."""
    if not appt.chat_session_id:
        return
    try:
        from agents.booking import inject_system_message
        inject_system_message(
            session_id=appt.chat_session_id,
            message=(
                f"SYSTEM: The customer's payment prompt was dismissed or failed "
                f"(appointment_id={appt.pk}, service={appt.service.name}). "
                f"Inform the customer their payment was not completed and ask if they would "
                f"like you to resend the payment prompt to their phone. "
                f"If yes, use the retry_payment tool with appointment_id={appt.pk}. "
                f"If no, let them know their booking slot has been released and they can book again anytime."
            ),
        )
    except Exception:
        logger.exception("[Services] Failed to inject retry system message for appt %s", appt.pk)


