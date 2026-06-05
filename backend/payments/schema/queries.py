from typing import Optional

import strawberry
from strawberry.types import Info

from beautybook.permissions import require_auth

from .types import PaymentStatusResult, PaymentType, payment_to_type


@strawberry.type
class PaymentsQuery:
    @strawberry.field
    def payment_status(self, info: Info, payment_id: int) -> Optional[PaymentType]:
        from payments.models import Payment

        require_auth(info)
        payment = Payment.objects.filter(pk=payment_id).first()
        return payment_to_type(payment) if payment else None

    @strawberry.field
    def check_payment_status(self, info: Info, ref: str) -> Optional[PaymentStatusResult]:
        from payments.models import Payment

        payment = (
            Payment.objects
            .select_related("appointment__service")
            .filter(transaction_ref=ref)
            .first()
        )
        if not payment:
            return None
        appt = payment.appointment
        return PaymentStatusResult(
            status=payment.status,
            appointment_id=appt.pk,
            service_name=appt.service.name,
            starts_at=appt.starts_at.isoformat(),
        )
