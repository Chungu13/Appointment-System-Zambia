import logging
from decimal import Decimal, ROUND_HALF_UP

import requests
from django.conf import settings

from .base import BasePaymentProvider, PaymentResult, RefundResult, VerifyResult

logger = logging.getLogger(__name__)


def compute_disburse_amount(deposit_zmw: float) -> float:
    """Amount to disburse to the salon. Lipila charges the sender (Kimawa), not the recipient,
    so the salon receives this exact amount with nothing deducted."""
    return float(Decimal(str(deposit_zmw)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def compute_kimawa_net(deposit_zmw: float, collection_amount_zmw: float) -> float:
    """Kimawa's true net: collection minus Lipila's 2.5% collection fee, the disbursement to the
    salon, and Lipila's 1.5% disbursement sender fee (charged to Kimawa's Lipila balance)."""
    collection = Decimal(str(collection_amount_zmw))
    lipila_collection_fee = (collection * Decimal("0.025")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    disburse_amount = Decimal(str(compute_disburse_amount(deposit_zmw)))
    lipila_disburse_fee = (disburse_amount * Decimal("0.015")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return float((collection - lipila_collection_fee - disburse_amount - lipila_disburse_fee).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


LIPILA_FAILURE_MESSAGES = {
    "LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED": (
        "Insufficient balance or limit reached. Please try with another number."
    ),
    "User didn't enter the pin.": "Payment cancelled — PIN was not entered.",
    "System internal error.": "Payment failed — please try again.",
}


class LipilaProvider(BasePaymentProvider):
    """
    Lipila mobile money provider — push payment (collection) and payout (disbursement).

    Required env vars:
        LIPILA_API_KEY       — from the Lipila dashboard
        LIPILA_ENV           — 'sandbox' (default) or 'production'
        LIPILA_BASE_URL      — overrides the default URL if set (e.g. https://blz.lipila.io)
        LIPILA_CALLBACK_URL  — public webhook URL, e.g. https://api.kimawa.pro/webhooks/lipila/

    Collection flow:
        1. initiate_collection  → Lipila sends a PIN prompt to the customer's phone
        2. Customer enters PIN
        3. Lipila calls LIPILA_CALLBACK_URL with the result
        4. Webhook updates Payment + Appointment status
    """

    def __init__(self):
        self.api_key = settings.LIPILA_API_KEY
        environment = getattr(settings, "LIPILA_ENV", "sandbox")
        default_base_url = (
            "https://blz.lipila.io/api/v1"
            if environment == "production"
            else "https://api.lipila.dev/api/v1"
        )
        configured_base_url = getattr(settings, "LIPILA_BASE_URL", "").rstrip("/")
        if configured_base_url and not configured_base_url.endswith("/api/v1"):
            configured_base_url = f"{configured_base_url}/api/v1"
        self.base_url = configured_base_url or default_base_url
        self.callback_url = getattr(settings, "LIPILA_CALLBACK_URL", "")

    def _headers(self) -> dict:
        return {
            "accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "callbackUrl": self.callback_url,
        }

    @staticmethod
    def _normalise_phone(raw_phone: str) -> str:
        """Normalise to 260XXXXXXXXX format required by the Lipila API (no + prefix)."""
        from core.phone import normalise_phone
        return normalise_phone(raw_phone).lstrip("+")

    def initiate_collection(
        self,
        phone: str,
        amount: float,
        reference: str,
        narration: str,
        email: str = "",
    ) -> PaymentResult:
        formatted_phone = self._normalise_phone(phone)
        request_body = {
            "referenceId": reference,
            "amount": round(amount, 2),
            "narration": narration,
            "accountNumber": formatted_phone,
            "currency": "ZMW",
        }
        if email:
            request_body["email"] = email

        logger.info(
            "[Lipila] collection | ref=%s | ZMW %.2f | phone=%s",
            reference, amount, formatted_phone,
        )

        try:
            response = requests.post(
                f"{self.base_url}/collections/mobile-money",
                json=request_body,
                headers=self._headers(),
                timeout=30,
            )
            response_data = self._parse_response_body(response)
            logger.info(
                "[Lipila] collection response | status=%s | body=%s",
                response.status_code, response_data,
            )

            if response.status_code in (200, 201):
                return PaymentResult(
                    success=True,
                    status="pending",
                    provider_ref=response_data.get("identifier", ""),
                    reference_id=response_data.get("referenceId", reference),
                    message=response_data.get("message", "Payment prompt sent to phone"),
                )

            error_message = response_data.get("message") or response_data.get("error") or "Payment initiation failed"
            logger.warning("[Lipila] collection failed | status=%s | %s", response.status_code, error_message)
            return PaymentResult(success=False, status="failed", message=error_message)

        except Exception as exc:
            logger.exception("[Lipila] collection exception: %s", exc)
            return PaymentResult(success=False, status="failed", message=str(exc))

    def initiate_disbursement(
        self,
        phone: str,
        amount: float,
        reference: str,
        narration: str,
    ) -> PaymentResult:
        formatted_phone = self._normalise_phone(phone)
        request_body = {
            "referenceId": reference,
            "amount": float(round(amount, 2)),
            "accountNumber": formatted_phone,
            "currency": "ZMW",
            "narration": narration,
        }
        disbursement_url = f"{self.base_url}/disbursements/mobile-money"

        logger.info(
            "[Lipila] disbursement | ref=%s | ZMW %.2f | phone=%s | url=%s",
            reference, amount, formatted_phone, disbursement_url,
        )

        try:
            response = requests.post(
                disbursement_url,
                json=request_body,
                headers=self._headers(),
                timeout=30,
            )
            response_data = self._parse_response_body(response)
            logger.info(
                "[Lipila] disbursement response | status=%s | body=%s",
                response.status_code, response_data,
            )

            if response.status_code in (200, 201, 202):
                return PaymentResult(
                    success=True,
                    status="pending",
                    provider_ref=response_data.get("identifier", ""),
                    message=response_data.get("message", "Disbursement initiated"),
                )

            error_message = response_data.get("message") or response_data.get("error") or "Disbursement failed"
            logger.warning("[Lipila] disbursement failed | status=%s | %s", response.status_code, error_message)
            return PaymentResult(success=False, status="failed", message=error_message)

        except Exception as exc:
            logger.exception("[Lipila] disbursement exception: %s", exc)
            return PaymentResult(success=False, status="failed", message=str(exc))

    def verify_transaction(self, reference: str) -> VerifyResult:
        logger.info("[Lipila] verify_transaction | ref=%s", reference)
        try:
            response = requests.get(
                f"{self.base_url}/collections/check-status",
                headers=self._headers(),
                params={"referenceId": reference},
                timeout=30,
            )
            response_data = self._parse_response_body(response)
            raw_status = response_data.get("status", "")
            raw_message = response_data.get("message", "")
            friendly_message = LIPILA_FAILURE_MESSAGES.get(raw_message, raw_message)
            is_paid = raw_status == "Successful"

            logger.info("[Lipila] verify | ref=%s | status=%s | paid=%s", reference, raw_status, is_paid)
            return VerifyResult(
                success=True,
                paid=is_paid,
                amount_zmw=float(response_data.get("amount") or 0),
                status=raw_status,
                message=friendly_message,
            )
        except Exception as exc:
            logger.exception("[Lipila] verify_transaction exception: %s", exc)
            return VerifyResult(success=False, error=str(exc))

    def refund_transaction(self, reference: str, _amount_zmw: float) -> RefundResult:
        logger.info("[Lipila] refund requested for ref=%s — manual process required", reference)
        return RefundResult(
            success=False,
            message="Refunds must be processed manually via the Lipila dashboard.",
        )

    @staticmethod
    def _parse_response_body(response) -> dict:
        """Safely parse a JSON response body, returning an empty dict on failure."""
        try:
            return response.json()
        except Exception:
            return {}
