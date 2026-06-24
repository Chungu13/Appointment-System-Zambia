import logging
from decimal import Decimal, ROUND_HALF_UP

import requests
from django.conf import settings

from .base import BasePaymentProvider, PaymentResult, RefundResult, VerifyResult


def compute_disburse_amount(deposit_zmw: float) -> float:
    """Gross up deposit so business receives exactly deposit_zmw after Lipila's 1.5% disbursement fee."""
    result = Decimal(str(deposit_zmw)) / Decimal("0.985")
    return float(result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def compute_kimawa_net(deposit_zmw: float, collection_amount_zmw: float) -> float:
    """Kimawa's net: collection less Lipila's 2.5% collection fee and the gross-up disbursement."""
    col = Decimal(str(collection_amount_zmw))
    lipila_fee = (col * Decimal("0.025")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    disburse = Decimal(str(compute_disburse_amount(deposit_zmw)))
    return float((col - lipila_fee - disburse).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

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
    Lipila mobile money collection — push payment flow.

    Required env vars:
        LIPILA_API_KEY       — from the Lipila dashboard
        LIPILA_ENV           — 'sandbox' (default) or 'production'
        LIPILA_CALLBACK_URL  — server-to-server webhook, e.g.
                               https://api.kimawa.pro/webhooks/lipila/

    Flow:
        1. initiate_collection  → calls Lipila /collections/mobile-money
                                → customer receives a PIN prompt on their phone
                                → returns immediately with status='pending'
        2. Customer enters PIN on their phone
        3. Lipila calls our webhook (LIPILA_CALLBACK_URL) on completion
        4. Webhook updates Payment + Appointment status
    """

    def __init__(self):
        self.api_key = settings.LIPILA_API_KEY
        env = getattr(settings, "LIPILA_ENV", "sandbox")
        self.base_url = (
            "https://blz.lipila.io/api/v1"
            if env == "production"
            else "https://api.lipila.dev/api/v1"
        )
        self.callback_url = getattr(settings, "LIPILA_CALLBACK_URL", "")

    def _headers(self) -> dict:
        return {
            "accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "callbackUrl": self.callback_url,
        }

    @staticmethod
    def _format_phone(phone: str) -> str:
        """Normalise to 260XXXXXXXXX format. Handles +260, 0, and bare formats."""
        phone = phone.strip().lstrip("+").replace(" ", "").replace("-", "")
        if phone.startswith("0"):
            phone = "260" + phone[1:]
        if not phone.startswith("260"):
            phone = "260" + phone
        return phone

    # ------------------------------------------------------------------
    # initiate_collection — push PIN prompt to phone
    # ------------------------------------------------------------------

    def initiate_collection(
        self,
        phone: str,
        amount: float,
        reference: str,
        narration: str,
        email: str = "",
    ) -> PaymentResult:
        formatted_phone = self._format_phone(phone)
        payload = {
            "referenceId": reference,
            "amount": round(amount, 2),
            "narration": narration,
            "accountNumber": formatted_phone,
            "currency": "ZMW",
        }
        if email:
            payload["email"] = email

        print(f"[Lipila] phone_raw={phone!r} phone_formatted={formatted_phone!r}", flush=True)
        print(f"[Lipila] payload={payload}", flush=True)
        print(f"[Lipila] api_key_set={bool(self.api_key)} api_key_prefix={self.api_key[:8] + '...' if self.api_key else 'MISSING'}", flush=True)
        print(f"[Lipila] base_url={self.base_url}", flush=True)
        print(f"[Lipila] callback_url={self.callback_url!r}", flush=True)
        logger.info(
            "[Lipila] initiate_collection | ref=%s | ZMW %.2f | phone_raw=%s | phone_fmt=%s",
            reference, amount, phone, formatted_phone,
        )

        try:
            response = requests.post(
                f"{self.base_url}/collections/mobile-money",
                json=payload,
                headers=self._headers(),
                timeout=30,
            )
            print(f"[Lipila] response status={response.status_code}", flush=True)
            print(f"[Lipila] response body={response.text}", flush=True)
            try:
                data = response.json()
            except Exception:
                data = {}
            logger.info(
                "[Lipila] collection response | status=%s | body=%s",
                response.status_code, data,
            )

            if response.status_code in (200, 201):
                return PaymentResult(
                    success=True,
                    status="pending",
                    provider_ref=data.get("identifier", ""),
                    reference_id=data.get("referenceId", reference),
                    message=data.get("message", "Payment prompt sent to phone"),
                )

            msg = data.get("message") or data.get("error") or "Payment initiation failed"
            logger.warning(
                "[Lipila] collection failed | status=%s | %s", response.status_code, msg,
            )
            return PaymentResult(success=False, status="failed", message=msg)

        except Exception as exc:
            print(f"[Lipila] exception: {exc}", flush=True)
            logger.exception("[Lipila] initiate_collection exception: %s", exc)
            return PaymentResult(success=False, status="failed", message=str(exc))

    # ------------------------------------------------------------------
    # initiate_disbursement — send owner payout
    # ------------------------------------------------------------------

    def initiate_disbursement(
        self,
        phone: str,
        amount: float,
        reference: str,
        narration: str,
    ) -> PaymentResult:
        formatted_phone = self._format_phone(phone)
        payload = {
            "referenceId": reference,
            "amount": float(round(amount, 2)),
            "accountNumber": formatted_phone,
            "currency": "ZMW",
            "narration": narration,
        }
        url = f"{self.base_url}/disbursements/mobile-money"
        headers = self._headers()
        print(f"[Lipila] disbursement URL: {url}", flush=True)
        print(f"[Lipila] disbursement api_key_prefix={self.api_key[:8] + '...' if self.api_key else 'MISSING'}", flush=True)
        print(f"[Lipila] disbursement callbackUrl={headers.get('callbackUrl')!r}", flush=True)
        print(f"[Lipila] disbursement body={payload}", flush=True)

        try:
            response = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=30,
            )
            print(f"[Lipila] disbursement response status={response.status_code}", flush=True)
            print(f"[Lipila] disbursement response body={response.text}", flush=True)
            try:
                data = response.json()
            except Exception:
                data = {}

            if response.status_code in (200, 201, 202):
                return PaymentResult(
                    success=True,
                    status="pending",
                    provider_ref=data.get("identifier", ""),
                    message=data.get("message", "Disbursement initiated — awaiting PIN confirmation"),
                )
            msg = data.get("message") or data.get("error") or "Disbursement failed"
            logger.warning("[Lipila] disbursement failed | status=%s | %s", response.status_code, msg)
            return PaymentResult(success=False, status="failed", message=msg)

        except Exception as exc:
            logger.exception("[Lipila] initiate_disbursement exception: %s", exc)
            return PaymentResult(success=False, status="failed", message=str(exc))

    # ------------------------------------------------------------------
    # verify_transaction
    # ------------------------------------------------------------------

    def verify_transaction(self, reference: str) -> VerifyResult:
        logger.info("[Lipila] verify_transaction | ref=%s", reference)
        try:
            response = requests.get(
                f"{self.base_url}/collections/check-status",
                headers=self._headers(),
                params={"referenceId": reference},
                timeout=30,
            )
            data = response.json()
            status = data.get("status", "")
            raw_message = data.get("message", "")
            friendly = FAILURE_MESSAGES.get(raw_message, raw_message)
            paid = status == "Successful"

            logger.info(
                "[Lipila] verify | ref=%s | status=%s | paid=%s", reference, status, paid,
            )
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

    def refund_transaction(self, reference: str, amount_zmw: float) -> RefundResult:
        logger.info("[Lipila] refund requested for ref=%s — manual process", reference)
        return RefundResult(
            success=False,
            message="Refunds must be processed manually via the Lipila dashboard.",
        )
