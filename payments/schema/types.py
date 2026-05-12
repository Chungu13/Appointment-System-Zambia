import datetime
import strawberry
from enum import Enum
from typing import Optional


@strawberry.enum
class PaymentTypeEnum(Enum):
    DEPOSIT = "deposit"
    BALANCE = "balance"
    REFUND = "refund"


@strawberry.enum
class PaymentMethodEnum(Enum):
    AIRTEL_MONEY = "airtel_money"
    MTN_MOMO = "mtn_momo"
    CARD = "card"
    CASH = "cash"


@strawberry.enum
class PaymentStatusEnum(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


@strawberry.type
class PaymentType:
    id: int
    amount_zmw: float
    payment_type: PaymentTypeEnum
    method: PaymentMethodEnum
    status: PaymentStatusEnum
    dpo_transaction_id: str
    paid_at: Optional[datetime.datetime]


@strawberry.type
class InitiatePaymentResult:
    payment_id: int
    payment_url: str
    transaction_ref: str


def payment_to_type(p) -> PaymentType:
    return PaymentType(
        id=p.pk,
        amount_zmw=float(p.amount_zmw),
        payment_type=PaymentTypeEnum(p.payment_type),
        method=PaymentMethodEnum(p.method),
        status=PaymentStatusEnum(p.status),
        dpo_transaction_id=p.dpo_transaction_id,
        paid_at=p.paid_at,
    )
