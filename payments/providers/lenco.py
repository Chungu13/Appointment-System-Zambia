from .base import BasePaymentProvider, PaymentResult, RefundResult, VerifyResult


class LencoPaymentProvider(BasePaymentProvider):
    """
    Lenco payment integration (https://lenco.co).

    Required env vars:
        LENCO_API_KEY       — from Lenco dashboard → Settings → API Keys
        LENCO_ACCOUNT_NO    — the funded Lenco account number to debit/credit

    All methods raise NotImplementedError until the integration is wired up.
    """

    BASE_URL = "https://api.lenco.co/access/v1"

    def create_transaction(
        self, appointment_id, amount_zmw, customer_name, customer_phone, description, site_url=""
    ) -> PaymentResult:
        # POST {BASE_URL}/transactions
        # Headers: Authorization: Bearer {LENCO_API_KEY}
        # Body: {
        #   "amount": amount_zmw * 100,   # Lenco uses kobo/ngwe (minor units)
        #   "currency": "ZMW",
        #   "reference": f"appt-{appointment_id}-{uuid}",
        #   "customer": {"name": customer_name, "phone": customer_phone},
        #   "description": description,
        #   "callback_url": "{SITE_URL}/payments/webhook/{reference}/",
        # }
        # On success: response["data"]["paymentLink"] → payment_url
        #             response["data"]["reference"]   → transaction_ref
        raise NotImplementedError("Lenco integration coming soon")

    def verify_transaction(self, transaction_ref: str) -> VerifyResult:
        # GET {BASE_URL}/transactions/{transaction_ref}
        # Headers: Authorization: Bearer {LENCO_API_KEY}
        # Check: response["data"]["status"] == "successful"
        # Return: VerifyResult(paid=True, amount_zmw=response["data"]["amount"] / 100)
        raise NotImplementedError("Lenco integration coming soon")

    def refund_transaction(self, transaction_ref: str, amount_zmw: float) -> RefundResult:
        # POST {BASE_URL}/transactions/{transaction_ref}/refund
        # Headers: Authorization: Bearer {LENCO_API_KEY}
        # Body: {"amount": amount_zmw * 100}
        raise NotImplementedError("Lenco integration coming soon")
