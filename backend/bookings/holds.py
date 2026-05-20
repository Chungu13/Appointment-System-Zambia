from django.core.cache import cache

HOLD_TTL = 600  # 10 minutes


def save_hold(hold_id: str, data: dict) -> None:
    cache.set(f"hold:{hold_id}", data, timeout=HOLD_TTL)


def load_hold(hold_id: str) -> dict | None:
    return cache.get(f"hold:{hold_id}")


def remove_hold(hold_id: str) -> None:
    cache.delete(f"hold:{hold_id}")
