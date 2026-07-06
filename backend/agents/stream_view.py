import json
import logging
import re
import secrets
import urllib.parse
import urllib.request

from django.core.cache import cache
from django.http import JsonResponse, StreamingHttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)

_PHONE_RE = re.compile(r'^[\d\s\-+().]{7,18}$')

def _looks_like_phone(msg: str) -> bool:
    return bool(_PHONE_RE.match(msg.strip()))

def _count_phone_rejections(history: list) -> int:
    """
    Count prior invalid-phone rejections using two independent signals so the
    limit holds whether or not the AI called the validate_phone_number tool.
    """
    tool_count = 0
    msg_count  = 0
    for m in history:
        role    = m.get("role")
        content = m.get("content") or ""
        if role == "tool" and isinstance(content, str):
            try:
                c = json.loads(content)
                if isinstance(c, dict) and c.get("valid") is False:
                    tool_count += 1
            except (json.JSONDecodeError, TypeError):
                pass
        elif role == "assistant" and isinstance(content, str):
            low = content.lower()
            if "valid" in low and "number" in low and any(
                w in low for w in ("mtn", "airtel", "zamtel", "mobile money")
            ):
                msg_count += 1
    return max(tool_count, msg_count)


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

    # Enforce 2-attempt phone limit in Python — before the AI sees the message.
    # Works regardless of whether the AI called validate_phone_number or not.
    if _looks_like_phone(message) and _count_phone_rejections(history) >= 2:
        stop_msg = (
            "I'm unable to process your booking without a valid number. "
            "Please start a new chat to try again."
        )

        def _stop_stream():
            yield f"data: {json.dumps({'token': stop_msg})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"

        resp = StreamingHttpResponse(_stop_stream(), content_type="text/event-stream")
        resp["Cache-Control"] = "no-cache"
        resp["X-Accel-Buffering"] = "no"
        return resp

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


@csrf_exempt
@require_POST
def upload_reference_image(request):
    """
    POST /chat/upload-reference/
    Body: {session_id, session_token, image}  (image = base64 data URL)
    Stashes the image against the chat session; handle_create_booking attaches
    it to the appointment once one is created for that session.
    """
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    session_id = body.get("session_id", "")
    session_token = body.get("session_token", "")
    image = body.get("image", "")

    if session_token and not cache.get(f"chat_session:{session_token}"):
        return JsonResponse({"error": "Session expired. Please refresh and start a new conversation."}, status=403)

    if not session_id or not image.startswith("data:image"):
        return JsonResponse({"error": "Invalid request."}, status=400)

    from django.conf import settings
    max_mb = getattr(settings, "MEDIA_MAX_SIZE_MB", 10)
    try:
        _, encoded = image.split(",", 1)
        approx_bytes = len(encoded) * 3 // 4
    except ValueError:
        return JsonResponse({"error": "Invalid image data."}, status=400)
    if approx_bytes > max_mb * 1024 * 1024:
        return JsonResponse({"error": f"Image is too large. Maximum size is {max_mb}MB."}, status=400)

    from beautybook.storage import save_raw_from_base64
    from agents.booking.session import save_reference_image

    url, abs_path = save_raw_from_base64(image, "reference", request.tenant.schema_name)
    save_reference_image(session_id, url, abs_path)

    return JsonResponse({"ok": True, "url": url})
