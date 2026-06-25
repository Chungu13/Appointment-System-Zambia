import json
import logging
import os

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)

LIPILA_EVENT_COLLECTION   = "Collection"
LIPILA_EVENT_DISBURSEMENT = "Disbursement"

IDEMPOTENCY_TTL_SECONDS = 86_400  # 24 hours


def _verify_lipila_webhook(payload_bytes: bytes, signature_headers: dict) -> bool:
    """Verify Lipila webhook signature using the StandardWebhooks spec."""
    from standardwebhooks import Webhook, WebhookVerificationError
    webhook_secret = os.environ.get("LIPILA_WEBHOOK_SECRET", "")
    if not webhook_secret:
        logger.warning("[Webhook] LIPILA_WEBHOOK_SECRET not set — rejecting request")
        return False
    try:
        webhook = Webhook("whsec_" + webhook_secret)
        webhook.verify(payload_bytes, signature_headers)
        return True
    except WebhookVerificationError as exc:
        logger.warning("[Webhook] Lipila signature verification failed: %s", exc)
        return False


def _is_already_processed(identifier: str) -> bool:
    """
    Redis-backed idempotency guard. Returns True if this identifier was already processed.
    Never raises — if Redis is unavailable, returns False and processing continues.
    """
    try:
        import redis as _redis
        redis_url = (
            os.environ.get("REDIS_URL")
            or os.environ.get("CELERY_BROKER_URL")
            or "redis://localhost:6379/0"
        )
        redis_client = _redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=2)
        idempotency_key = f"webhook:processed:{identifier}"
        is_new_key = redis_client.set(idempotency_key, "1", ex=IDEMPOTENCY_TTL_SECONDS, nx=True)
        return not is_new_key  # True = key already existed = already processed
    except Exception as exc:
        logger.warning("[Webhook] Redis idempotency check unavailable: %s — proceeding without", exc)
        return False


@csrf_exempt
@require_POST
def payment_webhook(request):
    """
    POST endpoint for Lipila payment callbacks.
    URL: /webhooks/lipila/

    Lipila payload fields:
        identifier   — our internal reference (KIMAWA-XXXX or DISBURSE-KIMAWA-XXXX)
        referenceId  — Lipila's own transaction ID
        type         — "Collection" or "Disbursement"
        status       — "Successful" or "Failed"
        amount       — decimal amount
        accountNumber — customer phone
        paymentType  — "AirtelMoney", "MTNMoney", etc.

    Always returns 200 once past signature verification — non-200 causes Lipila to retry.
    """
    logger.info("[Webhook] Lipila raw body: %s", request.body.decode("utf-8", errors="replace"))

    signature_headers = {
        "webhook-id":        request.headers.get("webhook-id", ""),
        "webhook-timestamp": request.headers.get("webhook-timestamp", ""),
        "webhook-signature": request.headers.get("webhook-signature", ""),
    }
    if not _verify_lipila_webhook(request.body, signature_headers):
        logger.warning("[Webhook] Rejected — invalid or missing signature")
        return JsonResponse({"error": "invalid signature"}, status=401)

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    event_type = payload.get("type", "")         # "Collection" or "Disbursement"
    status     = payload.get("status", "")        # "Successful" or "Failed"
    identifier = payload.get("referenceId", "")   # our KIMAWA-XXXX or DISBURSE-KIMAWA-XXXX ref
    lipila_ref = payload.get("identifier", "")    # Lipila's own LPLXC-... transaction ID
    message    = payload.get("message", "")

    logger.info(
        "[Webhook] Lipila | type=%s | status=%s | identifier=%s | lipila_ref=%s | msg=%s",
        event_type, status, identifier, lipila_ref, message,
    )

    if not identifier:
        return JsonResponse({"error": "Missing identifier"}, status=400)

    if _is_already_processed(identifier):
        logger.info("[Webhook] Duplicate — identifier=%s already processed, skipping", identifier)
        return JsonResponse({"ok": True, "duplicate": True}, status=200)

    try:
        from payments.services import handle_disbursement_callback, confirm_payment
        if event_type == LIPILA_EVENT_DISBURSEMENT:
            result = handle_disbursement_callback(identifier, status, lipila_ref, message)
        else:
            result = confirm_payment(identifier, status=status, provider_ref=lipila_ref, message=message)
    except Exception as exc:
        logger.exception("[Webhook] Unhandled error for identifier=%s: %s", identifier, exc)
        return JsonResponse({"ok": False, "error": "internal error"}, status=200)

    # Always 200 — non-200 causes Lipila to retry the webhook
    return JsonResponse(result, status=200)
