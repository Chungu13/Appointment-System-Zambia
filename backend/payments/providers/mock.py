import logging

from .base import BasePaymentProvider, PaymentResult, RefundResult, VerifyResult

logger = logging.getLogger(__name__)


class MockPaymentProvider(BasePaymentProvider):
    """
    Dev-only provider — simulates push payment by auto-confirming instantly.
    The payment record must already exist with transaction_ref set before calling
    initiate_collection, so _auto_confirm can find and complete it immediately.
    """

    def initiate_collection(
        self,
        phone: str,
        amount: float,
        reference: str,
        narration: str,
        email: str = "",
    ) -> PaymentResult:
        logger.info(
            "[MOCK] initiate_collection | ref=%s | ZMW %.2f | phone=%s",
            reference, amount, phone,
        )
        self._auto_confirm(reference)
        return PaymentResult(
            success=True,
            status="completed",
            reference_id=reference,
            message="Dev: payment auto-confirmed",
        )

    @staticmethod
    def _auto_confirm(reference: str):
        """Immediately mark payment + appointment as confirmed (dev only)."""
        from django.utils import timezone
        from payments.models import Payment

        payment = (
            Payment.objects
            .select_related("appointment")
            .filter(transaction_ref=reference)
            .first()
        )
        if not payment:
            logger.warning("[MOCK] _auto_confirm: no payment found for ref=%s", reference)
            return

        if payment.status != "completed":
            payment.status = "completed"
            payment.paid_at = timezone.now()
            payment.save(update_fields=["status", "paid_at", "updated_at"])

        appt = payment.appointment
        if appt and appt.status not in ("confirmed", "completed"):
            appt.status = "confirmed"
            appt.save(update_fields=["status", "updated_at"])

    def verify_transaction(self, reference: str) -> VerifyResult:
        logger.info("[MOCK] verify_transaction | ref=%s | paid=True", reference)
        return VerifyResult(success=True, paid=True)

    def refund_transaction(self, reference: str, amount_zmw: float) -> RefundResult:
        logger.info("[MOCK] refund | ref=%s | ZMW %.2f", reference, amount_zmw)
        return RefundResult(success=True)
