from typing import Optional

import strawberry
from strawberry.types import Info

from beautybook.permissions import require_auth

from .types import PaymentType, payment_to_type


@strawberry.type
class PaymentsQuery:
    @strawberry.field
    def payment_status(self, info: Info, payment_id: int) -> Optional[PaymentType]:
        from payments.models import Payment

        require_auth(info)
        payment = Payment.objects.filter(pk=payment_id).first()
        return payment_to_type(payment) if payment else None
