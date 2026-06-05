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
    Lipila mobile-money payment integration.

    Required env vars:
        LIPILA_API_KEY       — from the Lipila dashboard
        LIPILA_ENV           — 'sandbox' (default) or 'production'
        LIPILA_CALLBACK_URL  — full URL of our webhook, e.g.
                               https://api.kimawa.pro/payments/webhook/
    """

    def __init__(self):
        self.api_key = settings.LIPILA_API_KEY
        env = getattr(settings, "LIPILA_ENV", "sandbox")
        self.callback_url = getattr(settings, "LIPILA_CALLBACK_URL", "")

        self.base_url = (
            "https://blz.lipila.io/api/v1"
            if env == "production"
            else "https://api.lipila.dev/api/v1"
        )
        self.headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "callbackUrl": self.callback_url,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _customer_amount(deposit_zmw: float) -> float:
        """Customer pays deposit + 10 % Kimawa service fee."""
        return round(deposit_zmw * 1.10, 2)

    # ------------------------------------------------------------------
    # Interface
    # ------------------------------------------------------------------

    def create_transaction(
        self,
        appointment_id: int,
        amount_zmw: float,
        customer_name: str,
        customer_phone: str,
        description: str,
        site_url: str = "",
    ) -> PaymentResult:
        """Initiate a mobile-money collection — customer receives a USSD prompt."""
        customer_pays = self._customer_amount(amount_zmw)

        payload = {
            "referenceId": f"KIMAWA-{appointment_id}",
            "amount": customer_pays,
            "narration": description,
            "accountNumber": customer_phone,
            "currency": "ZMW",
        }

        logger.info(
            "[Lipila] create_transaction | appt=%s | ZMW %.2f (customer pays %.2f) | %s",
            appointment_id, amount_zmw, customer_pays, customer_phone,
        )

        try:
            response = requests.post(
                f"{self.base_url}/collections/mobile-money",
                headers=self.headers,
                json=payload,
                timeout=30,
            )
            data = response.json()

            if response.status_code == 200:
                ref = data.get("referenceId", f"KIMAWA-{appointment_id}")
                logger.info("[Lipila] Transaction initiated | ref=%s | identifier=%s", ref, data.get("identifier"))
                return PaymentResult(
                    success=True,
                    transaction_ref=ref,
                    provider_ref=data.get("identifier", ""),
                    message=data.get("message", "Payment initiated. Check your phone for a prompt."),
                )
            else:
                msg = data.get("message", "Payment initiation failed")
                logger.warning("[Lipila] create_transaction failed | status=%s | %s", response.status_code, msg)
                return PaymentResult(success=False, error=msg)

        except Exception as exc:
            logger.exception("[Lipila] create_transaction exception: %s", exc)
            return PaymentResult(success=False, error=str(exc))

    def verify_transaction(self, transaction_ref: str) -> VerifyResult:
        """Check whether a collection has been completed."""
        logger.info("[Lipila] verify_transaction | ref=%s", transaction_ref)

        try:
            response = requests.get(
                f"{self.base_url}/collections/check-status",
                headers=self.headers,
                params={"referenceId": transaction_ref},
                timeout=30,
            )
            data = response.json()
            status = data.get("status", "")
            raw_message = data.get("message", "")
            friendly = FAILURE_MESSAGES.get(raw_message, raw_message)
            paid = status == "Successful"

            logger.info("[Lipila] verify_transaction | ref=%s | status=%s | paid=%s", transaction_ref, status, paid)
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

    def refund_transaction(self, transaction_ref: str, amount_zmw: float) -> RefundResult:
        """Refunds must be processed manually via the Lipila dashboard."""
        logger.info("[Lipila] refund requested for ref=%s — manual process", transaction_ref)
        return RefundResult(
            success=False,
            message="Refunds must be processed manually via the Lipila dashboard.",
        )

    def get_wallet_balance(self) -> float | None:
        """Return the current Lipila wallet balance, or None on failure."""
        try:
            response = requests.get(
                f"{self.base_url}/merchants/balance",
                headers=self.headers,
                timeout=30,
            )
            data = response.json()
            if data.get("success"):
                return float(data["data"]["balance"])
            return None
        except Exception:
            return None
