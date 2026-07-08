from django.core.cache import cache

SERVICES_TTL  = 600   # 10 minutes
STAFF_TTL     = 600   # 10 minutes
HOURS_TTL     = 3600  # 1 hour
PORTFOLIO_TTL = 600   # 10 minutes


def _services_key(schema_name: str) -> str:
    return f"services:{schema_name}"


def _staff_key(schema_name: str) -> str:
    return f"staff:{schema_name}"


def _hours_key(schema_name: str) -> str:
    return f"hours:{schema_name}"


def _portfolio_key(schema_name: str) -> str:
    return f"portfolio:{schema_name}"


def invalidate_tenant_cache(schema_name: str) -> None:
    """Clear all per-tenant cache keys. Call whenever tenant data changes."""
    cache.delete_many([
        _services_key(schema_name),
        _staff_key(schema_name),
        _hours_key(schema_name),
        _portfolio_key(schema_name),
    ])


def get_cached_services(schema_name: str):
    return cache.get(_services_key(schema_name))


def set_cached_services(schema_name: str, value) -> None:
    cache.set(_services_key(schema_name), value, timeout=SERVICES_TTL)


def invalidate_services_cache(schema_name: str) -> None:
    cache.delete(_services_key(schema_name))


def get_cached_staff(schema_name: str):
    return cache.get(_staff_key(schema_name))


def set_cached_staff(schema_name: str, value) -> None:
    cache.set(_staff_key(schema_name), value, timeout=STAFF_TTL)


def invalidate_staff_cache(schema_name: str) -> None:
    cache.delete(_staff_key(schema_name))


def get_cached_hours(schema_name: str):
    return cache.get(_hours_key(schema_name))


def set_cached_hours(schema_name: str, value) -> None:
    cache.set(_hours_key(schema_name), value, timeout=HOURS_TTL)


def invalidate_hours_cache(schema_name: str) -> None:
    cache.delete(_hours_key(schema_name))


def get_cached_portfolio(schema_name: str):
    return cache.get(_portfolio_key(schema_name))


def set_cached_portfolio(schema_name: str, value) -> None:
    cache.set(_portfolio_key(schema_name), value, timeout=PORTFOLIO_TTL)


def invalidate_portfolio_cache(schema_name: str) -> None:
    cache.delete(_portfolio_key(schema_name))
