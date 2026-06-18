import json
import logging

from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def chat_stream(request):
    """
    SSE endpoint for streaming AI booking chat responses.
    POST body: {message, session_id, customer_phone, customer_name}
    Response: text/event-stream — data: {"token": "..."} chunks, then data: {"done": true}
    """
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    message = body.get("message", "").strip()
    session_id = body.get("session_id", "")
    customer_phone = body.get("customer_phone", "")
    customer_name = body.get("customer_name", "")

    if not message:
        return JsonResponse({"error": "message is required"}, status=400)

    from agents.booking_agent import BookingAgent, load_history, save_history

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
