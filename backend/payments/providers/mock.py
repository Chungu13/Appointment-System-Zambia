import logging
import uuid

from .base import BasePaymentProvider, PaymentResult, RefundResult, VerifyResult

logger = logging.getLogger(__name__)


class MockPaymentProvider(BasePaymentProvider):
    def create_transaction(
        self, appointment_id, amount_zmw, customer_name, customer_phone,
        description, site_url="", redirect_url="", callback_url="",
    ) -> PaymentResult:
        transaction_ref = str(uuid.uuid4())
        base = site_url.rstrip("/") if site_url else "http://localhost:8000"
        from urllib.parse import quote as _q
        payment_url = (
            f"{base}/payments/mock-pay/{transaction_ref}/"
            + (f"?redirect_url={_q(redirect_url)}" if redirect_url else "")
        )
        logger.info(
            "[MOCK] Transaction created | ref=%s | %.2f ZMW | %s (%s) | %s",
            transaction_ref, amount_zmw, customer_name, customer_phone, description,
        )
        return PaymentResult(success=True, payment_url=payment_url, transaction_ref=transaction_ref)

    def verify_transaction(self, transaction_ref: str) -> VerifyResult:
        logger.info("[MOCK] Transaction verified | ref=%s | paid=True", transaction_ref)
        return VerifyResult(success=True, paid=True)

    def refund_transaction(self, transaction_ref: str, amount_zmw: float) -> RefundResult:
        logger.info("[MOCK] Refund processed | ref=%s | %.2f ZMW", transaction_ref, amount_zmw)
        return RefundResult(success=True)
