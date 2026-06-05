from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class PaymentResult:
    success: bool
    payment_url: str = ""       # Hosted checkout URL (Lipila) or mock URL
    transaction_ref: str = ""   # Our reference, e.g. KIMAWA-123
    provider_ref: str = ""      # Provider's internal identifier
    message: str = ""
    error: str = ""


@dataclass
class VerifyResult:
    success: bool
    paid: bool = False
    amount_zmw: float = 0.0
    status: str = ""
    message: str = ""
    error: str = ""


@dataclass
class RefundResult:
    success: bool
    message: str = ""
    error: str = ""


class BasePaymentProvider(ABC):
    @abstractmethod
    def create_transaction(
        self,
        appointment_id: int,
        amount_zmw: float,
        customer_name: str,
        customer_phone: str,
        description: str,
        site_url: str = "",
        redirect_url: str = "",   # Where to send the customer after payment
        callback_url: str = "",   # Webhook URL for server-to-server notification
    ) -> PaymentResult: ...

    @abstractmethod
    def verify_transaction(self, transaction_ref: str) -> VerifyResult: ...

    @abstractmethod
    def refund_transaction(self, transaction_ref: str, amount_zmw: float) -> RefundResult: ...
