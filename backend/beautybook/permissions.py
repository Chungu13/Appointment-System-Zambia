from strawberry.types import Info


def _user_from_bearer(request):
    auth = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    try:
        from beautybook.jwt_auth import decode_token
        from staff.models import User

        payload = decode_token(token, "access")
        return User.objects.filter(pk=payload["user_id"], is_active=True).first()
    except Exception:
        return None


def require_auth(info: Info):
    request = info.context.request
    user = _user_from_bearer(request) or request.user
    if not user or not getattr(user, "is_authenticated", False):
        raise PermissionError("Authentication required.")
    return user


def require_owner(info: Info):
    user = require_auth(info)
    if user.role != "owner":
        raise PermissionError("Owner access required.")
    from django.db import connection
    from tenants.models import Tenant
    try:
        tenant = Tenant.objects.get(schema_name=connection.schema_name)
        if not tenant.is_approved:
            raise PermissionError("Account pending approval.")
    except Tenant.DoesNotExist:
        pass
    return user
