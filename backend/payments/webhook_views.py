import json
import logging

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def payment_webhook(request):
    """
    POST endpoint for Lipila payment callbacks.
    URL: /webhooks/lipila/  (no transaction_ref in path — it's in the body)

    Expected Lipila payload:
        { "referenceId": "KIMAWA-42", "status": "Successful", "identifier": "...", "message": "..." }
    """
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    reference_id = payload.get("referenceId")
    status       = payload.get("status", "")
    identifier   = payload.get("identifier", "")
    message      = payload.get("message", "")

    logger.info(
        "[Webhook] Lipila callback | ref=%s | status=%s | identifier=%s | msg=%s",
        reference_id, status, identifier, message,
    )

    if not reference_id:
        return JsonResponse({"error": "Missing referenceId"}, status=400)

    result = _confirm_payment(reference_id, status=status, provider_ref=identifier)
    return JsonResponse(result, status=200 if result["ok"] else 400)


def _trigger_disbursement(transaction_ref: str, deposit_zmw: float, service_name: str) -> None:
    """Send owner payout after successful payment. Never raises — logs errors only."""
    try:
        from django.db import connection
        from tenants.models import Tenant
        from payments.providers.lipila import LipilaProvider

        tenant = Tenant.objects.filter(schema_name=connection.schema_name).first()
        if not tenant:
            logger.warning("[Disbursement] Tenant not found for schema %s", connection.schema_name)
            return

        payout_phone = tenant.payout_phone or tenant.phone
        if not payout_phone:
            logger.warning("[Disbursement] No payout_phone set for tenant %s", tenant.schema_name)
            return

        disburse_ref = f"DISBURSE-{transaction_ref}"
        result = LipilaProvider().initiate_disbursement(
            phone=payout_phone,
            amount=deposit_zmw,
            reference=disburse_ref,
            narration=f"Booking payout — {service_name}",
        )
        if result.success:
            logger.info(
                "[Disbursement] sent ZMW %.2f to %s | ref=%s",
                deposit_zmw, payout_phone, disburse_ref,
            )
        else:
            logger.warning("[Disbursement] failed | ref=%s | %s", disburse_ref, result.message)

    except Exception as exc:
        logger.exception("[Disbursement] unexpected error for ref=%s: %s", transaction_ref, exc)


def _confirm_payment(reference_id: str, status: str = "Successful", provider_ref: str = "", message: str = "") -> dict:
    """Confirm or fail a payment based on Lipila webhook status."""
    from django.utils import timezone
    from agents.models import AgentLog
    from payments.models import Payment

    payment = (
        Payment.objects
        .select_related("appointment__service", "appointment__staff")
        .filter(transaction_ref=reference_id)
        .first()
    )
    if not payment:
        logger.warning("[Webhook] Payment not found | ref=%s", reference_id)
        return {"ok": False, "error": "Payment not found"}

    appt = payment.appointment
    now  = timezone.now()

    if status == "Successful":
        payment.status   = "completed"
        payment.paid_at  = now
        if provider_ref:
            payment.provider_ref = provider_ref
        payment.save(update_fields=["status", "paid_at", "provider_ref", "updated_at"])

        if appt.status not in ("confirmed", "completed"):
            appt.status = "confirmed"
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
                "amount_zmw": float(payment.amount_zmw),
            },
        )

        # Disburse the service deposit to the salon owner
        _trigger_disbursement(
            transaction_ref=reference_id,
            deposit_zmw=float(appt.service.deposit_zmw),
            service_name=appt.service.name,
        )

        return {"ok": True, "appointment_status": appt.status}

    # Any non-Successful status = failed
    payment.status = "failed"
    payment.save(update_fields=["status", "updated_at"])
    appt.status = "cancelled"
    appt.save(update_fields=["status", "updated_at"])

    AgentLog.objects.create(
        agent_type="payment",
        action=f"Payment failed: {payment.amount_zmw} ZMW for {appt.service.name}",
        related_appointment=appt,
        outcome="failed",
        metadata={"reference_id": reference_id, "status": status, "message": message},
    )

    # Notify the customer's active chat session so the AI can offer a retry
    if appt.chat_session_id:
        try:
            from agents.booking_agent import inject_system_message
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
            logger.exception("[Webhook] Failed to inject retry system message for appt %s", appt.pk)

    return {"ok": False, "error": f"Payment {status}: {message}"}
