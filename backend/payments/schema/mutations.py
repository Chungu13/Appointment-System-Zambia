import strawberry
from strawberry.types import Info

from .types import InitiatePaymentResult, PaymentTypeEnum


@strawberry.type
class PaymentsMutation:
    @strawberry.mutation
    def initiate_payment(
        self,
        info: Info,
        appointment_id: int,
        phone: str,
        payment_type: PaymentTypeEnum = PaymentTypeEnum.DEPOSIT,
    ) -> InitiatePaymentResult:
        from django.utils import timezone
        from bookings.models import Appointment
        from payments.models import Payment
        from payments.provider_factory import get_provider

        appt = (
            Appointment.objects
            .select_related("customer", "service", "staff")
            .filter(pk=appointment_id)
            .first()
        )
        if not appt:
            raise ValueError("Appointment not found.")
        if appt.status == "cancelled":
            raise ValueError("Cannot initiate payment for a cancelled appointment.")
        if appt.service.deposit_zmw == 0:
            raise ValueError("This service requires no upfront payment. Pay in full at the salon.")

        amount        = appt.service.deposit_zmw if payment_type == PaymentTypeEnum.DEPOSIT else appt.service.price_zmw
        transaction_ref = f"KIMAWA-{appt.pk}"
        narration     = f"{appt.service.name} with {appt.staff.full_name} on {appt.starts_at:%Y-%m-%d %H:%M}"

        payment = Payment.objects.create(
            appointment=appt,
            amount_zmw=amount,
            payment_type=payment_type.value,
            method="airtel_money",
            status="pending",
            transaction_ref=transaction_ref,
        )

        provider = get_provider()
        result = provider.initiate_collection(
            phone=phone,
            amount=float(amount),
            reference=transaction_ref,
            narration=narration,
        )

        if not result.success:
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            raise ValueError(f"Payment provider error: {result.message}")

        instant = result.status == "completed"
        if result.provider_ref:
            payment.provider_ref = result.provider_ref
            update_fields = ["provider_ref", "updated_at"]
        else:
            update_fields = ["updated_at"]

        if instant:
            payment.status  = "completed"
            payment.paid_at = timezone.now()
            update_fields += ["status", "paid_at"]
            appt.status = "confirmed"
            appt.save(update_fields=["status", "updated_at"])

        payment.save(update_fields=list(set(update_fields)))

        return InitiatePaymentResult(
            success=True,
            reference=transaction_ref,
            message=result.message,
            instant_confirm=instant,
        )
