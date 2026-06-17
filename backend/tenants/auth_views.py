import json
import logging
import urllib.request

from django.conf import settings
from django.core import signing
from django.core.mail import send_mail
from django.http import HttpResponseRedirect, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

logger = logging.getLogger(__name__)


def _app_url():
    return getattr(settings, "APP_BASE_URL", f"https://{getattr(settings, 'VERCEL_APP_DOMAIN', 'kimawa.pro')}")


def _api_url():
    return getattr(settings, "API_BASE_URL", "http://localhost:8000")


# ── Email helpers ─────────────────────────────────────────────────────────────

def send_verification_email(user_pk: int, schema_name: str, email: str, full_name: str) -> None:
    token = signing.dumps({"schema": schema_name, "pk": user_pk}, salt="email-verification")
    verify_url = f"{_api_url()}/auth/verify-email/?token={token}"
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "hello@kimawa.pro")

    send_mail(
        subject="Verify your Kimawa account",
        message=(
            f"Hi {full_name},\n\n"
            "Click the link below to verify your email and activate your Kimawa account.\n\n"
            f"{verify_url}\n\n"
            "This link expires in 24 hours."
        ),
        from_email=from_email,
        recipient_list=[email],
        fail_silently=True,
    )


def send_admin_notification(
    *,
    business_name: str,
    business_type: str,
    city: str,
    area: str,
    phone: str,
    full_name: str,
    email: str,
    timestamp: str,
) -> None:
    admin_email = getattr(settings, "ADMIN_EMAIL", "admin@kimawa.pro")
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "hello@kimawa.pro")
    api_base = getattr(settings, "API_BASE_URL", "https://api.kimawa.pro")

    send_mail(
        subject=f"New business signup — {business_name}",
        message=(
            "New business registered on Kimawa:\n\n"
            f"Business name: {business_name}\n"
            f"Business type: {business_type}\n"
            f"City: {city}\n"
            f"Area: {area}\n"
            f"Phone: {phone}\n"
            f"Owner name: {full_name}\n"
            f"Owner email: {email}\n"
            f"Signed up: {timestamp}\n\n"
            f"Review and approve at: {api_base}/admin/tenants/tenant/"
        ),
        from_email=from_email,
        recipient_list=[admin_email],
        fail_silently=True,
    )


def send_approval_email(owner_name: str, business_name: str, owner_email: str) -> None:
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "hello@kimawa.pro")
    app_base = _app_url()

    send_mail(
        subject="Your Kimawa account is approved — you're live!",
        message=(
            f"Hi {owner_name},\n\n"
            f"Your business {business_name} has been approved on Kimawa. "
            f"Log in to your dashboard to get started: {app_base}/login"
        ),
        from_email=from_email,
        recipient_list=[owner_email],
        fail_silently=True,
    )


# ── Views ─────────────────────────────────────────────────────────────────────

@require_GET
def verify_email(request):
    token = request.GET.get("token", "")
    app_base = _app_url()

    if not token:
        return HttpResponseRedirect(f"{app_base}/login?error=invalid_token")

    try:
        data = signing.loads(token, max_age=86400, salt="email-verification")
    except signing.SignatureExpired:
        return HttpResponseRedirect(f"{app_base}/login?error=token_expired")
    except signing.BadSignature:
        return HttpResponseRedirect(f"{app_base}/login?error=invalid_token")

    schema_name = data.get("schema")
    user_pk = data.get("pk")
    if not schema_name or not user_pk:
        return HttpResponseRedirect(f"{app_base}/login?error=invalid_token")

    try:
        from django_tenants.utils import schema_context
        from staff.models import User

        with schema_context(schema_name):
            user = User.objects.get(pk=user_pk)
            if not user.is_active:
                user.is_active = True
                user.save(update_fields=["is_active"])
    except Exception as exc:
        logger.error("verify_email: schema=%r pk=%r: %s", schema_name, user_pk, exc)
        return HttpResponseRedirect(f"{app_base}/login?error=invalid_token")

    return HttpResponseRedirect(f"{app_base}/login?verified=true")


@csrf_exempt
@require_POST
def google_auth_view(request):
    try:
        body = json.loads(request.body)
        access_token = body.get("access_token", "")
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({"error": "Invalid request"}, status=400)

    if not access_token:
        return JsonResponse({"error": "Missing access_token"}, status=400)

    try:
        req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            info = json.loads(resp.read())
    except Exception as exc:
        logger.warning("google_auth_view: failed to verify: %s", exc)
        return JsonResponse({"error": "Failed to verify with Google"}, status=400)

    email = info.get("email", "")
    if not email:
        return JsonResponse({"error": "No email returned from Google"}, status=400)

    # Issue a short-lived signed token that register_tenant verifies server-side
    google_token = signing.dumps(
        {"email": email, "sub": info.get("id", "")},
        salt="google-auth",
    )

    return JsonResponse({
        "name": info.get("name", ""),
        "email": email,
        "google_token": google_token,
    })


@csrf_exempt
@require_POST
def resend_verification(request):
    try:
        body = json.loads(request.body)
        email = body.get("email", "").strip().lower()
    except Exception:
        return JsonResponse({"ok": True})

    if not email:
        return JsonResponse({"ok": True})

    from tenants.models import Tenant
    from django_tenants.utils import schema_context

    for tenant in Tenant.objects.exclude(schema_name="public"):
        with schema_context(tenant.schema_name):
            from staff.models import User
            try:
                user = User.objects.get(email=email, role="owner", is_active=False)
                send_verification_email(user.pk, tenant.schema_name, email, user.full_name)
                return JsonResponse({"ok": True})
            except User.DoesNotExist:
                continue

    return JsonResponse({"ok": True})
