import datetime

import jwt
from django.conf import settings

_ALGORITHM = "HS256"
_ACCESS_LIFETIME = datetime.timedelta(minutes=60)
_REFRESH_LIFETIME = datetime.timedelta(days=7)


def _encode(user_id: int, token_type: str, lifetime: datetime.timedelta) -> str:
    now = datetime.datetime.now(tz=datetime.timezone.utc)
    return jwt.encode(
        {"user_id": user_id, "token_type": token_type, "iat": now, "exp": now + lifetime},
        settings.SECRET_KEY,
        algorithm=_ALGORITHM,
    )


def make_access_token(user_id: int) -> str:
    return _encode(user_id, "access", _ACCESS_LIFETIME)


def make_refresh_token(user_id: int) -> str:
    return _encode(user_id, "refresh", _REFRESH_LIFETIME)


def decode_token(token: str, expected_type: str) -> dict:
    """Decode and validate a JWT. Raises jwt.InvalidTokenError on any failure."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[_ALGORITHM])
    if payload.get("token_type") != expected_type:
        raise jwt.InvalidTokenError(f"Expected {expected_type!r} token.")
    return payload
