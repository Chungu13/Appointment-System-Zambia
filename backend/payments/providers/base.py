from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class PaymentResult:
    success: bool
    status: str = "pending"   # "pending" | "completed" | "failed"
    provider_ref: str = ""    # Provider's internal identifier
    reference_id: str = ""    # Our reference, e.g. KIMAWA-123
    message: str = ""


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
    def initiate_collection(
        self,
        phone: str,
        amount: float,
        reference: str,
        narration: str,
        email: str = "",
    ) -> PaymentResult: ...

    @abstractmethod
    def verify_transaction(self, reference: str) -> VerifyResult: ...

    @abstractmethod
    def refund_transaction(self, reference: str, amount_zmw: float) -> RefundResult: ...
