"""
Dispatches booking events to n8n for WhatsApp notification processing.
All dispatches are fire-and-forget — never block the booking flow.

Env vars required:
    N8N_WEBHOOK_BASE_URL  — e.g. https://n8n-production-c622.up.railway.app
    N8N_WEBHOOK_SECRET    — shared secret for request verification
"""
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

_TIMEOUT = 5  # seconds


def dispatch(event_type: str, payload: dict) -> bool:
    """
    POST payload to {N8N_WEBHOOK_BASE_URL}/webhook/{event_type}.
    Returns True on success, False on any failure.
    Never raises — all errors are logged and swallowed.
    """
    base_url = getattr(settings, "N8N_WEBHOOK_BASE_URL", "").rstrip("/")
    secret   = getattr(settings, "N8N_WEBHOOK_SECRET", "")

    if not base_url:
        logger.debug("dispatch: N8N_WEBHOOK_BASE_URL not set — skipping %s", event_type)
        return False

    url = f"{base_url}/webhook/{event_type}"

    try:
        resp = requests.post(
            url,
            json=payload,
            headers={
                "X-Kimawa-Secret": secret,
                "Content-Type": "application/json",
            },
            timeout=_TIMEOUT,
        )
        if resp.ok:
            logger.info("dispatch: %s → %s ✓ (%s)", event_type, url, resp.status_code)
            return True
        else:
            logger.warning(
                "dispatch: %s → %s returned %s: %s",
                event_type, url, resp.status_code, resp.text[:200],
            )
            return False
    except requests.exceptions.Timeout:
        logger.warning("dispatch: %s timed out after %ss", event_type, _TIMEOUT)
        return False
    except Exception:
        logger.exception("dispatch: unexpected error sending %s", event_type)
        return False
