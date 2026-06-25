import json
import logging
import urllib.request

from django.conf import settings
from django.core import signing
from django.http import HttpResponseRedirect, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

logger = logging.getLogger(__name__)


def _app_url():
    return getattr(settings, "APP_BASE_URL", f"https://{getattr(settings, 'VERCEL_APP_DOMAIN', 'kimawa.pro')}")


def _api_url():
    return getattr(settings, "API_BASE_URL", "http://localhost:8000")


# ── Email via Resend HTTP API ─────────────────────────────────────────────────

def send_email(to: str, subject: str, html: str) -> None:
    import resend
    from decouple import config

    resend.api_key = config("RESEND_API_KEY", default="")
    if not resend.api_key:
        logger.warning("send_email: RESEND_API_KEY not set — skipping email to %s", to)
        return

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "hello@kimawa.pro")
    try:
        resend.Emails.send({"from": from_email, "to": to, "subject": subject, "html": html})
    except Exception as exc:
        logger.error("send_email: failed to send to %s: %s", to, exc)


# ── Email helpers ─────────────────────────────────────────────────────────────

def send_verification_email(user_pk: int, schema_name: str, email: str, full_name: str) -> None:
    """Verification email for already-created tenant owner users (legacy path)."""
    token = signing.dumps({"schema": schema_name, "pk": user_pk}, salt="email-verification")
    verify_url = f"{_api_url()}/auth/verify-email/?token={token}"

    send_email(
        to=email,
        subject="Verify your Kimawa account",
        html=(
            f"<p>Hi {full_name},</p>"
            "<p>Click the link below to verify your email and activate your Kimawa account.</p>"
            f'<p><a href="{verify_url}">{verify_url}</a></p>'
            "<p>This link expires in 24 hours.</p>"
        ),
    )


def send_pending_verification_email(pending_id: int, email: str, full_name: str) -> None:
    """Verification email for a new PendingRegistration before admin approval."""
    token = signing.dumps({"pending_id": pending_id}, salt="email-verification")
    verify_url = f"{_api_url()}/auth/verify-email/?token={token}"

    send_email(
        to=email,
        subject="Verify your email — Kimawa",
        html=(
            f"<p>Hi {full_name},</p>"
            "<p>Click the link below to verify your email address.</p>"
            f'<p><a href="{verify_url}">{verify_url}</a></p>'
            "<p>After verification, your business application will be reviewed by our team. "
            "We'll email you within 24 hours once approved.</p>"
            "<p>This link expires in 24 hours.</p>"
        ),
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
    api_base    = getattr(settings, "API_BASE_URL", "https://api.kimawa.pro")

    send_email(
        to=admin_email,
        subject=f"New business signup — {business_name}",
        html=(
            "<p>New business registered on Kimawa (pending approval):</p>"
            "<ul>"
            f"<li><b>Business name:</b> {business_name}</li>"
            f"<li><b>Business type:</b> {business_type}</li>"
            f"<li><b>City:</b> {city}</li>"
            f"<li><b>Area:</b> {area}</li>"
            f"<li><b>Phone:</b> {phone}</li>"
            f"<li><b>Owner name:</b> {full_name}</li>"
            f"<li><b>Owner email:</b> {email}</li>"
            f"<li><b>Signed up:</b> {timestamp}</li>"
            "</ul>"
            f'<p><a href="{api_base}/admin/tenants/pendingregistration/">Review and approve in Django admin</a></p>'
        ),
    )


def send_approval_email(owner_name: str, business_name: str, owner_email: str) -> None:
    app_base = _app_url()

    send_email(
        to=owner_email,
        subject="Your Kimawa account is approved — you're live!",
        html=(
            f"<p>Hi {owner_name},</p>"
            f"<p>Your business <b>{business_name}</b> has been approved on Kimawa.</p>"
            f'<p><a href="{app_base}/login">Log in to your dashboard to get started</a></p>'
        ),
    )


def send_signup_spike_alert(count: int) -> None:
    admin_email = getattr(settings, "ADMIN_EMAIL", "admin@kimawa.pro")
    api_base    = getattr(settings, "API_BASE_URL", "https://api.kimawa.pro")

    send_email(
        to=admin_email,
        subject=f"[Kimawa] Signup spike alert — {count} registrations in 1 hour",
        html=(
            f"<p><b>{count}</b> new business registrations in the last hour — possible bot activity.</p>"
            f'<p><a href="{api_base}/admin/tenants/pendingregistration/">Review in Django admin</a></p>'
        ),
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

    # New pending registration flow
    if "pending_id" in data:
        from tenants.models import PendingRegistration
        try:
            pending = PendingRegistration.objects.get(pk=data["pending_id"])
            if not pending.email_verified:
                pending.email_verified = True
                pending.save(update_fields=["email_verified"])
        except PendingRegistration.DoesNotExist:
            return HttpResponseRedirect(f"{app_base}/login?error=invalid_token")
        return HttpResponseRedirect(f"{app_base}/pending-approval?verified=true")

    # Legacy flow (existing tenant owner users)
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

    # Check pending registrations first
    from tenants.models import PendingRegistration
    try:
        pending = PendingRegistration.objects.get(email=email, email_verified=False)
        send_pending_verification_email(pending.pk, pending.email, pending.full_name)
        return JsonResponse({"ok": True})
    except PendingRegistration.DoesNotExist:
        pass

    # Check existing tenant schemas
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
