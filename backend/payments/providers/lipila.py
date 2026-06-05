import logging

import requests
from django.conf import settings

from .base import BasePaymentProvider, PaymentResult, RefundResult, VerifyResult

logger = logging.getLogger(__name__)

FAILURE_MESSAGES = {
    "LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED": (
        "Insufficient balance or limit reached. Please try with another number."
    ),
    "User didn't enter the pin.": "Payment cancelled — PIN was not entered.",
    "System internal error.": "Payment failed — please try again.",
}


class LipilaProvider(BasePaymentProvider):
    """
    Lipila payment integration — hosted checkout flow.

    Required env vars:
        LIPILA_API_KEY       — from the Lipila dashboard
        LIPILA_ENV           — 'sandbox' (default) or 'production'
        LIPILA_CALLBACK_URL  — server-to-server webhook, e.g.
                               https://api.kimawa.pro/payments/webhook/

    Flow:
        1. create_transaction  → calls Lipila checkout endpoint
                               → returns a hosted payment_url
        2. Customer is redirected to that URL and pays on Lipila's page
        3. Lipila calls our webhook (callback_url) on completion
        4. Lipila redirects the customer to redirect_url
    """

    def __init__(self):
        self.api_key = settings.LIPILA_API_KEY
        env = getattr(settings, "LIPILA_ENV", "sandbox")
        self.default_callback_url = getattr(settings, "LIPILA_CALLBACK_URL", "")

        self.base_url = (
            "https://blz.lipila.io/api/v1"
            if env == "production"
            else "https://api.lipila.dev/api/v1"
        )

    def _headers(self, callback_url: str = "") -> dict:
        return {
            "accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "callbackUrl": callback_url or self.default_callback_url,
        }

    @staticmethod
    def _customer_amount(deposit_zmw: float) -> float:
        """Customer pays deposit + 10 % Kimawa service fee."""
        return round(deposit_zmw * 1.10, 2)

    # ------------------------------------------------------------------
    # create_transaction — hosted checkout page
    # ------------------------------------------------------------------

    def create_transaction(
        self,
        appointment_id: int,
        amount_zmw: float,
        customer_name: str,
        customer_phone: str,
        description: str,
        site_url: str = "",
        redirect_url: str = "",
        callback_url: str = "",
    ) -> PaymentResult:
        """
        Create a Lipila checkout session and return the hosted payment URL.

        NOTE: Verify the exact endpoint path and response field names
        against your Lipila API documentation — update CHECKOUT_ENDPOINT
        and the response field below if needed.
        """
        CHECKOUT_ENDPOINT = "/checkout"   # ← adjust if Lipila uses a different path

        customer_pays = self._customer_amount(amount_zmw)
        transaction_ref = f"KIMAWA-{appointment_id}"

        payload = {
            "referenceId": transaction_ref,
            "amount": customer_pays,
            "currency": "ZMW",
            "narration": description,
            "redirectUrl": redirect_url,
        }

        logger.info(
            "[Lipila] create_transaction | ref=%s | ZMW %.2f (customer pays %.2f) | redirect=%s",
            transaction_ref, amount_zmw, customer_pays, redirect_url,
        )

        try:
            response = requests.post(
                f"{self.base_url}{CHECKOUT_ENDPOINT}",
                headers=self._headers(callback_url),
                json=payload,
                timeout=30,
            )
            data = response.json()
            logger.info("[Lipila] checkout response | status=%s | body=%s", response.status_code, data)

            if response.status_code in (200, 201):
                # Adjust the field name below to match what Lipila actually returns
                checkout_url = (
                    data.get("checkoutUrl")
                    or data.get("paymentLink")
                    or data.get("payment_link")
                    or data.get("url")
                    or ""
                )
                provider_id = data.get("identifier") or data.get("id") or ""

                if not checkout_url:
                    logger.warning("[Lipila] No checkout URL in response: %s", data)
                    return PaymentResult(
                        success=False,
                        error=f"Lipila returned no checkout URL. Response: {data}",
                    )

                return PaymentResult(
                    success=True,
                    payment_url=checkout_url,
                    transaction_ref=transaction_ref,
                    provider_ref=provider_id,
                    message=data.get("message", "Redirecting to payment page…"),
                )
            else:
                msg = data.get("message") or data.get("error") or "Payment initiation failed"
                logger.warning("[Lipila] checkout failed | status=%s | %s", response.status_code, msg)
                return PaymentResult(success=False, error=msg)

        except Exception as exc:
            logger.exception("[Lipila] create_transaction exception: %s", exc)
            return PaymentResult(success=False, error=str(exc))

    # ------------------------------------------------------------------
    # verify_transaction
    # ------------------------------------------------------------------

    def verify_transaction(self, transaction_ref: str) -> VerifyResult:
        logger.info("[Lipila] verify_transaction | ref=%s", transaction_ref)
        try:
            response = requests.get(
                f"{self.base_url}/collections/check-status",
                headers=self._headers(),
                params={"referenceId": transaction_ref},
                timeout=30,
            )
            data = response.json()
            status = data.get("status", "")
            raw_message = data.get("message", "")
            friendly = FAILURE_MESSAGES.get(raw_message, raw_message)
            paid = status == "Successful"

            logger.info("[Lipila] verify | ref=%s | status=%s | paid=%s", transaction_ref, status, paid)
            return VerifyResult(
                success=True,
                paid=paid,
                amount_zmw=float(data.get("amount") or 0),
                status=status,
                message=friendly,
            )
        except Exception as exc:
            logger.exception("[Lipila] verify_transaction exception: %s", exc)
            return VerifyResult(success=False, error=str(exc))

    # ------------------------------------------------------------------
    # refund_transaction
    # ------------------------------------------------------------------

    def refund_transaction(self, transaction_ref: str, amount_zmw: float) -> RefundResult:
        logger.info("[Lipila] refund requested for ref=%s — manual process", transaction_ref)
        return RefundResult(
            success=False,
            message="Refunds must be processed manually via the Lipila dashboard.",
        )

    # ------------------------------------------------------------------
    # get_wallet_balance (utility, not part of base interface)
    # ------------------------------------------------------------------

    def get_wallet_balance(self) -> float | None:
        try:
            response = requests.get(
                f"{self.base_url}/merchants/balance",
                headers=self._headers(),
                timeout=30,
            )
            data = response.json()
            if data.get("success"):
                return float(data["data"]["balance"])
            return None
        except Exception:
            return None
