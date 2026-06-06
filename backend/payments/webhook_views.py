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


def _confirm_payment(reference_id: str, status: str = "Successful", provider_ref: str = "") -> dict:
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
    return {"ok": False, "error": f"Payment {status}: {message}"}
