from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


def _confirm_payment(transaction_ref: str) -> dict:
    """
    Core confirmation logic — shared by both the mock page and real provider webhooks.
    Returns a plain dict so it can be called without an HTTP request.
    """
    from django.utils import timezone
    from agents.models import AgentLog
    from payments.models import Payment
    from payments.provider_factory import get_provider

    result = get_provider().verify_transaction(transaction_ref)
    if not result.success or not result.paid:
        return {"ok": False, "error": result.error or "Payment not completed"}

    payment = (
        Payment.objects
        .select_related("appointment__customer", "appointment__service", "appointment__staff")
        .filter(dpo_transaction_id=transaction_ref)
        .first()
    )
    if not payment:
        return {"ok": False, "error": "Payment record not found"}

    now = timezone.now()
    payment.status = "completed"
    payment.paid_at = now
    payment.save(update_fields=["status", "paid_at", "updated_at"])

    appt = payment.appointment
    if appt.status == "pending":
        appt.status = "confirmed"
        appt.save(update_fields=["status", "updated_at"])

    AgentLog.objects.create(
        agent_type="payment",
        action=(
            f"Payment confirmed: {payment.amount_zmw} ZMW "
            f"via {payment.method} for {appt.service.name}"
        ),
        related_appointment=appt,
        outcome="success",
        metadata={
            "transaction_ref": transaction_ref,
            "amount_zmw": float(payment.amount_zmw),
            "payment_type": payment.payment_type,
            "method": payment.method,
        },
    )

    return {"ok": True, "appointment_status": appt.status}


@csrf_exempt
@require_POST
def payment_webhook(request, transaction_ref: str):
    """POST endpoint for real payment provider callbacks."""
    result = _confirm_payment(transaction_ref)
    status = 200 if result["ok"] else 400
    return JsonResponse(result, status=status)
