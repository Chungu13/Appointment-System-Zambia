import json
import logging
import secrets
import urllib.parse
import urllib.request

from django.core.cache import cache
from django.http import JsonResponse, StreamingHttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)


def _get_client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    return forwarded.split(",")[0].strip() if forwarded else request.META.get("REMOTE_ADDR", "")


def validate_message(message: str):
    if not message.strip():
        return False, "Please enter a message."
    if len(message) > 500:
        return False, "Message too long. Please keep it under 500 characters."
    if len(set(message.replace(" ", ""))) < 3:
        return False, "Invalid message."
    suspicious = [
        "ignore previous", "disregard", "system prompt", "jailbreak",
        "SELECT *", "DROP TABLE", "<script>", "javascript:",
    ]
    lower = message.lower()
    if any(p.lower() in lower for p in suspicious):
        return False, "Invalid message."
    return True, None


def validate_chat_session(session_token: str):
    session = cache.get(f"chat_session:{session_token}")
    if not session:
        return False, "Session expired. Please refresh and start a new conversation."
    if session["message_count"] >= 20:
        return False, (
            "You've reached the message limit for this session. "
            "If you need help, please contact the salon directly."
        )
    session["message_count"] += 1
    cache.set(f"chat_session:{session_token}", session, timeout=7200)
    return True, None


@csrf_exempt
@require_POST
def verify_chat_access(request):
    """
    POST /chat/verify/
    Body: { "turnstileToken": "..." }
    Returns: { "sessionToken": "..." }

    Verifies the Turnstile token (if TURNSTILE_SECRET_KEY is set) and issues
    a short-lived session token that the frontend must include in every chat
    request to enforce the 20-message cap.
    """
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    from django.conf import settings
    turnstile_key = getattr(settings, "TURNSTILE_SECRET_KEY", "")

    if turnstile_key:
        turnstile_token = data.get("turnstileToken", "")
        if not turnstile_token:
            return JsonResponse({"error": "Verification required."}, status=403)
        try:
            payload = urllib.parse.urlencode({
                "secret": turnstile_key,
                "response": turnstile_token,
                "remoteip": _get_client_ip(request),
            }).encode()
            req = urllib.request.Request(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data=payload,
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                result = json.loads(resp.read())
            if not result.get("success"):
                return JsonResponse({"error": "Verification failed. Please try again."}, status=403)
        except Exception as exc:
            logger.warning("Turnstile verification error: %s", exc)
            return JsonResponse({"error": "Verification error. Please try again."}, status=503)

    token = secrets.token_urlsafe(32)
    cache.set(f"chat_session:{token}", {
        "ip": _get_client_ip(request),
        "message_count": 0,
        "created_at": timezone.now().isoformat(),
    }, timeout=7200)

    return JsonResponse({"sessionToken": token})


@csrf_exempt
@require_POST
def chat_stream(request):
    """
    SSE endpoint for streaming AI booking chat responses.
    POST body: {message, session_id, session_token, customer_phone, customer_name}
    Response: text/event-stream
    """
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    message = body.get("message", "").strip()
    session_id = body.get("session_id", "")
    session_token = body.get("session_token", "")
    customer_phone = body.get("customer_phone", "")
    customer_name = body.get("customer_name", "")

    valid, err = validate_message(message)
    if not valid:
        return JsonResponse({"error": err}, status=400)

    # Only enforce session when a token is provided — allows graceful frontend rollout
    if session_token:
        valid, err = validate_chat_session(session_token)
        if not valid:
            return JsonResponse({"error": err}, status=403)

    if not request.tenant.is_approved:
        return JsonResponse({"error": "This salon is not yet available for bookings."}, status=403)

    from agents.booking import BookingAgent, load_history, save_history

    history = load_history(session_id)
    agent = BookingAgent(request.tenant)

    def event_stream():
        try:
            for kind, value in agent.chat_streaming(
                message=message,
                customer_phone=customer_phone,
                conversation_history=history,
                customer_name=customer_name,
                session_id=session_id,
            ):
                if kind == "token":
                    yield f"data: {json.dumps({'token': value})}\n\n"
                elif kind == "history":
                    save_history(session_id, value)
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as exc:
            logger.error("chat_stream error: %s", exc, exc_info=True)
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response
