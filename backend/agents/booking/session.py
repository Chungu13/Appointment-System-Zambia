import json
import os


def _redis_client():
    import redis
    url = (
        os.environ.get("REDIS_URL")
        or os.environ.get("CELERY_BROKER_URL")
        or "redis://localhost:6379/0"
    )
    return redis.from_url(url, decode_responses=True)


def _redis_key(session_id: str) -> str:
    return f"booking_agent:{session_id}"


def load_history(session_id: str) -> list:
    if not session_id:
        return []
    raw = _redis_client().get(_redis_key(session_id))
    return json.loads(raw) if raw else []


def save_history(session_id: str, history: list) -> None:
    if not session_id:
        return
    _redis_client().setex(_redis_key(session_id), 86400, json.dumps(history, default=str))


def inject_system_message(session_id: str, message: str) -> None:
    """Append a system message to an active chat session's Redis history."""
    if not session_id:
        return
    history = load_history(session_id)
    history.append({"role": "system", "content": message})
    save_history(session_id, history)


def _reference_image_key(session_id: str) -> str:
    return f"chat_reference:{session_id}"


def save_reference_image(session_id: str, url: str, abs_path: str) -> None:
    """Stash an uploaded reference photo against a chat session until create_booking picks it up."""
    if not session_id:
        return
    _redis_client().setex(
        _reference_image_key(session_id), 7200, json.dumps({"url": url, "path": abs_path}),
    )


def load_reference_image(session_id: str) -> dict | None:
    if not session_id:
        return None
    raw = _redis_client().get(_reference_image_key(session_id))
    return json.loads(raw) if raw else None


def clear_reference_image(session_id: str) -> None:
    if not session_id:
        return
    _redis_client().delete(_reference_image_key(session_id))
