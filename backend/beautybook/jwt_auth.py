import datetime

import jwt
from django.conf import settings

_ALGORITHM = "HS256"
_ACCESS_LIFETIME = datetime.timedelta(minutes=60)
_REFRESH_LIFETIME = datetime.timedelta(days=7)


def make_access_token(user_id: int, role: str = "") -> str:
    now = datetime.datetime.now(tz=datetime.timezone.utc)
    return jwt.encode(
        {
            "user_id": user_id,
            "role": role,
            "token_type": "access",
            "iat": now,
            "exp": now + _ACCESS_LIFETIME,
        },
        settings.SECRET_KEY,
        algorithm=_ALGORITHM,
    )


def make_refresh_token(user_id: int) -> str:
    now = datetime.datetime.now(tz=datetime.timezone.utc)
    return jwt.encode(
        {"user_id": user_id, "token_type": "refresh", "iat": now, "exp": now + _REFRESH_LIFETIME},
        settings.SECRET_KEY,
        algorithm=_ALGORITHM,
    )


def decode_token(token: str, expected_type: str) -> dict:
    """Decode and validate a JWT. Raises jwt.InvalidTokenError on any failure."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[_ALGORITHM])
    if payload.get("token_type") != expected_type:
        raise jwt.InvalidTokenError(f"Expected {expected_type!r} token.")
    return payload
