from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def mock_pay(request, transaction_ref: str):
    """
    Development-only mock payment page.
    GET  → show a "Pay Now" button
    POST → confirm payment, then redirect to redirect_url if provided
    """
    redirect_url = request.GET.get("redirect_url", "")

    if request.method == "POST":
        from payments.webhook_views import _confirm_payment
        result = _confirm_payment(transaction_ref)
        if result["ok"]:
            if redirect_url:
                return HttpResponseRedirect(redirect_url)
            return HttpResponse(_success_page(transaction_ref))
        return HttpResponse(_error_page(result.get("error", "Unknown error")), status=400)

    return HttpResponse(_pay_page(transaction_ref, redirect_url))


# ---------------------------------------------------------------------------
# Simple inline HTML — no template engine needed for a dev-only page
# ---------------------------------------------------------------------------

_BASE_STYLE = """
  body { font-family: sans-serif; max-width: 420px; margin: 80px auto; padding: 0 16px; }
  .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 36px; text-align: center; }
  h1 { font-size: 1.25em; margin: 0 0 6px; color: #111; }
  p  { color: #6b7280; margin: 0 0 24px; font-size: 0.9em; }
  .badge { display: inline-block; background: #fef3c7; color: #92400e;
           padding: 4px 10px; border-radius: 99px; font-size: 0.75em;
           font-weight: 600; margin-bottom: 20px; }
  button { background: #16a34a; color: #fff; border: none; padding: 13px 0;
           border-radius: 7px; font-size: 1em; cursor: pointer; width: 100%; }
  button:hover { background: #15803d; }
  .ref { font-size: 0.7em; color: #9ca3af; margin-top: 18px; word-break: break-all; }
"""


def _pay_page(ref: str, redirect_url: str = "") -> str:
    from urllib.parse import quote as _q
    action = f"?redirect_url={_q(redirect_url)}" if redirect_url else ""
    return f"""<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><title>Mock Payment</title>
<style>{_BASE_STYLE}</style></head><body>
<div class="card">
  <span class="badge">DEV MODE</span>
  <h1>Mock Payment Gateway</h1>
  <p>No real money will be charged.<br>This simulates an instant payment confirmation.</p>
  <form method="POST" action="{action}">
    <button type="submit">Pay Now (Simulate)</button>
  </form>
  <p class="ref">ref: {ref}</p>
</div></body></html>"""


def _success_page(ref: str) -> str:
    return f"""<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><title>Payment Successful</title>
<style>{_BASE_STYLE} h1 {{ color: #16a34a; }}</style></head><body>
<div class="card">
  <h1>Payment Successful</h1>
  <p>Your booking has been confirmed.<br>You can close this window.</p>
  <p class="ref">ref: {ref}</p>
</div></body></html>"""


def _error_page(error: str) -> str:
    return f"""<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><title>Payment Failed</title>
<style>{_BASE_STYLE} h1 {{ color: #dc2626; }}</style></head><body>
<div class="card">
  <h1>Payment Failed</h1>
  <p>{error}</p>
</div></body></html>"""
