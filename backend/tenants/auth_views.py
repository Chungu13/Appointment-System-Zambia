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

def _email_wrapper(body_html: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf7f7;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f7;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #ede5e7;">
        <tr>
          <td style="padding:8px 32px;background:#6B2737;">
            <span style="color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Kimawa</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px 48px;">
            {body_html}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #ede5e7;">
            <p style="margin:0;font-size:11px;color:#b09090;">Kimawa, Lusaka, Zambia &nbsp;&middot;&nbsp; <a href="https://kimawa.pro" style="color:#b09090;">kimawa.pro</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _btn(url: str, label: str) -> str:
    return (
        f'<table cellpadding="0" cellspacing="0" style="margin:32px 0;">'
        f'<tr><td style="background:#6B2737;">'
        f'<a href="{url}" style="display:inline-block;padding:14px 32px;color:#ffffff;'
        f'font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;'
        f'text-decoration:none;">{label}</a>'
        f'</td></tr></table>'
    )


def send_verification_email(user_pk: int, schema_name: str, email: str, full_name: str) -> None:
    """Verification email for already-created tenant owner users (legacy path)."""
    token = signing.dumps({"schema": schema_name, "pk": user_pk}, salt="email-verification")
    verify_url = f"{_app_url()}/verify-email?token={token}"

    body = (
        f'<p style="margin:0 0 8px;font-size:20px;font-weight:300;color:#1a0a0d;">Hi {full_name},</p>'
        '<p style="margin:16px 0 0;font-size:13px;font-weight:300;color:#6b6b6b;line-height:1.7;">'
        'Please verify your email address to activate your Kimawa account.</p>'
        + _btn(verify_url, "Verify my email")
        + '<p style="margin:0;font-size:12px;color:#b09090;">This link expires in 24 hours. '
        'If you did not sign up for Kimawa, you can ignore this email.</p>'
    )
    send_email(
        to=email,
        subject="Verify your Kimawa account",
        html=_email_wrapper(body),
    )


def send_pending_verification_email(pending_id: int, email: str, full_name: str) -> None:
    """Verification email for a new PendingRegistration before admin approval."""
    token = signing.dumps({"pending_id": pending_id}, salt="email-verification")
    verify_url = f"{_app_url()}/verify-email?token={token}"

    body = (
        f'<p style="margin:0 0 8px;font-size:20px;font-weight:300;color:#1a0a0d;">Hi {full_name},</p>'
        '<p style="margin:16px 0 0;font-size:13px;font-weight:300;color:#6b6b6b;line-height:1.7;">'
        'Thanks for signing up on Kimawa. Tap the button below to verify your email address.</p>'
        '<p style="margin:8px 0 0;font-size:13px;font-weight:300;color:#6b6b6b;line-height:1.7;">'
        'Once verified, our team will review your business and get back to you within 24 hours.</p>'
        + _btn(verify_url, "Verify my email")
        + '<p style="margin:0;font-size:12px;color:#b09090;">This link expires in 24 hours. '
        'If you did not sign up for Kimawa, you can ignore this email.</p>'
    )
    send_email(
        to=email,
        subject="Verify your email",
        html=_email_wrapper(body),
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
    approve_url = f"{api_base}/admin/tenants/pendingregistration/"

    body = (
        '<p style="margin:0 0 16px;font-size:20px;font-weight:300;color:#1a0a0d;">New business signup</p>'
        '<table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">'
        f'<tr><td style="padding:8px 0;border-bottom:1px solid #ede5e7;font-size:12px;color:#b09090;width:40%;">Business</td><td style="padding:8px 0;border-bottom:1px solid #ede5e7;font-size:13px;color:#1a0a0d;">{business_name}</td></tr>'
        f'<tr><td style="padding:8px 0;border-bottom:1px solid #ede5e7;font-size:12px;color:#b09090;">Type</td><td style="padding:8px 0;border-bottom:1px solid #ede5e7;font-size:13px;color:#1a0a0d;">{business_type}</td></tr>'
        f'<tr><td style="padding:8px 0;border-bottom:1px solid #ede5e7;font-size:12px;color:#b09090;">Location</td><td style="padding:8px 0;border-bottom:1px solid #ede5e7;font-size:13px;color:#1a0a0d;">{city}{", " + area if area else ""}</td></tr>'
        f'<tr><td style="padding:8px 0;border-bottom:1px solid #ede5e7;font-size:12px;color:#b09090;">Owner</td><td style="padding:8px 0;border-bottom:1px solid #ede5e7;font-size:13px;color:#1a0a0d;">{full_name}</td></tr>'
        f'<tr><td style="padding:8px 0;border-bottom:1px solid #ede5e7;font-size:12px;color:#b09090;">Email</td><td style="padding:8px 0;border-bottom:1px solid #ede5e7;font-size:13px;color:#1a0a0d;">{email}</td></tr>'
        f'<tr><td style="padding:8px 0;border-bottom:1px solid #ede5e7;font-size:12px;color:#b09090;">Phone</td><td style="padding:8px 0;border-bottom:1px solid #ede5e7;font-size:13px;color:#1a0a0d;">{phone}</td></tr>'
        f'<tr><td style="padding:8px 0;font-size:12px;color:#b09090;">Signed up</td><td style="padding:8px 0;font-size:13px;color:#1a0a0d;">{timestamp}</td></tr>'
        '</table>'
        + _btn(approve_url, "Review in admin")
    )
    send_email(
        to=admin_email,
        subject=f"New signup: {business_name}",
        html=_email_wrapper(body),
    )


def send_approval_email(owner_name: str, business_name: str, owner_email: str) -> None:
    app_base = _app_url()

    body = (
        f'<p style="margin:0 0 8px;font-size:20px;font-weight:300;color:#1a0a0d;">You\'re approved, {owner_name}!</p>'
        f'<p style="margin:16px 0 0;font-size:13px;font-weight:300;color:#6b6b6b;line-height:1.7;">'
        f'<strong style="color:#1a0a0d;">{business_name}</strong> is now live on Kimawa. '
        f'Log in to your dashboard to set up your services, staff, and start taking bookings.</p>'
        + _btn(f"{app_base}/login", "Go to my dashboard")
        + '<p style="margin:0;font-size:12px;color:#b09090;">Questions? Reply to this email and we\'ll be happy to help.</p>'
    )
    send_email(
        to=owner_email,
        subject=f"You're approved and live on Kimawa",
        html=_email_wrapper(body),
    )


def send_signup_spike_alert(count: int) -> None:
    admin_email = getattr(settings, "ADMIN_EMAIL", "admin@kimawa.pro")
    api_base    = getattr(settings, "API_BASE_URL", "https://api.kimawa.pro")

    send_email(
        to=admin_email,
        subject=f"Signup spike alert: {count} registrations in 1 hour",
        html=_email_wrapper(
            f'<p style="margin:0 0 16px;font-size:20px;font-weight:300;color:#1a0a0d;">Signup spike detected</p>'
            f'<p style="margin:0 0 24px;font-size:13px;color:#6b6b6b;line-height:1.7;">'
            f'<strong style="color:#1a0a0d;">{count}</strong> new business registrations in the last hour. Possible bot activity.</p>'
            + _btn(f"{api_base}/admin/tenants/pendingregistration/", "Review in admin")
        ),
    )


# ── Views ─────────────────────────────────────────────────────────────────────

@require_GET
def verify_email(request):
    token = request.GET.get("token", "")
    app_base = _app_url()
    json_mode = request.GET.get("format") == "json"

    def _err(code):
        if json_mode:
            return JsonResponse({"ok": False, "error": code}, status=400)
        return HttpResponseRedirect(f"{app_base}/login?error={code}")

    def _ok(redirect):
        if json_mode:
            return JsonResponse({"ok": True, "redirect": redirect})
        return HttpResponseRedirect(redirect)

    if not token:
        return _err("invalid_token")

    try:
        data = signing.loads(token, max_age=86400, salt="email-verification")
    except signing.SignatureExpired:
        return _err("token_expired")
    except signing.BadSignature:
        return _err("invalid_token")

    # New pending registration flow
    if "pending_id" in data:
        from tenants.models import PendingRegistration
        try:
            pending = PendingRegistration.objects.get(pk=data["pending_id"])
            if not pending.email_verified:
                pending.email_verified = True
                pending.save(update_fields=["email_verified"])
        except PendingRegistration.DoesNotExist:
            return _err("invalid_token")
        return _ok(f"{app_base}/pending-approval?verified=true")

    # Legacy flow (existing tenant owner users)
    schema_name = data.get("schema")
    user_pk = data.get("pk")
    if not schema_name or not user_pk:
        return _err("invalid_token")

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
        return _err("invalid_token")

    return _ok(f"{app_base}/login?verified=true")


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
