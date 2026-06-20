import json
import logging
import os

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)


def _verify_lipila_webhook(payload_bytes: bytes, headers: dict) -> bool:
    """Verify Lipila webhook signature using the StandardWebhooks spec."""
    from standardwebhooks import Webhook, WebhookVerificationError
    secret = os.environ.get("LIPILA_WEBHOOK_SECRET", "")
    if not secret:
        logger.warning("[Webhook] LIPILA_WEBHOOK_SECRET not set — rejecting request")
        return False
    try:
        wh = Webhook("whsec_" + secret)
        wh.verify(payload_bytes, headers)
        return True
    except WebhookVerificationError as exc:
        logger.warning("[Webhook] Lipila signature verification failed: %s", exc)
        return False


@csrf_exempt
@require_POST
def payment_webhook(request):
    """
    POST endpoint for Lipila payment callbacks.
    URL: /webhooks/lipila/  (no transaction_ref in path — it's in the body)

    Expected Lipila payload:
        { "referenceId": "KIMAWA-42", "status": "Successful", "identifier": "...", "message": "..." }
    """
    sig_headers = {
        "webhook-id":        request.headers.get("webhook-id", ""),
        "webhook-timestamp": request.headers.get("webhook-timestamp", ""),
        "webhook-signature": request.headers.get("webhook-signature", ""),
    }
    if not _verify_lipila_webhook(request.body, sig_headers):
        logger.warning("[Webhook] Rejected — invalid or missing signature")
        return JsonResponse({"error": "invalid signature"}, status=401)

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
        payment.disburse_status = "pending"
        payment.kimawa_net = Decimal(str(kimawa_net))
        payment.save(update_fields=["disburse_amount", "disburse_reference", "disburse_status", "kimawa_net", "updated_at"])

        result = LipilaProvider().initiate_disbursement(
            phone=payout_phone,
            amount=disburse_amount,
            reference=disburse_ref,
            narration=f"Booking payout — {appt.service.name}",
        )
        if result.success:
            payment.disburse_transaction_id = result.provider_ref
            payment.disburse_status = "sent"
            payment.save(update_fields=["disburse_transaction_id", "disburse_status", "updated_at"])
            logger.info(
                "[Disbursement] sent ZMW %.2f to %s | ref=%s | txn=%s",
                disburse_amount, payout_phone, disburse_ref, result.provider_ref,
            )
        else:
            payment.disburse_status = "failed"
            payment.save(update_fields=["disburse_status", "updated_at"])
            logger.warning("[Disbursement] failed | ref=%s | %s", disburse_ref, result.message)

    except Exception as exc:
        logger.exception("[Disbursement] unexpected error for payment %s: %s", payment.pk, exc)


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
        _disburse_to_business(payment, appt)

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
