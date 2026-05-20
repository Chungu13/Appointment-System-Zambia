import strawberry
from strawberry.types import Info

from .types import InitiatePaymentResult, PaymentMethodEnum, PaymentTypeEnum


@strawberry.type
class PaymentsMutation:
    @strawberry.mutation
    def initiate_payment(
        self,
        info: Info,
        appointment_id: int,
        payment_method: PaymentMethodEnum,
        payment_type: PaymentTypeEnum = PaymentTypeEnum.DEPOSIT,
    ) -> InitiatePaymentResult:
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
        if appt.customer.no_show_count < 2 and appt.service.deposit_zmw == 0:
            raise ValueError("This service requires no upfront payment — pay in full at the salon.")

        # Deposit amount — full price if customer has 2+ no-shows
        if payment_type == PaymentTypeEnum.DEPOSIT:
            amount = (
                appt.service.price_zmw
                if appt.customer.no_show_count >= 2
                else appt.service.deposit_zmw
            )
        else:
            amount = appt.service.price_zmw

        description = (
            f"{appt.service.name} with {appt.staff.full_name} "
            f"on {appt.starts_at:%Y-%m-%d %H:%M}"
        )

        payment = Payment.objects.create(
            appointment=appt,
            amount_zmw=amount,
            payment_type=payment_type.value,
            method=payment_method.value,
            status="pending",
        )

        request = info.context.request
        scheme = "https" if request.is_secure() else "http"
        site_url = f"{scheme}://{request.get_host()}"

        provider = get_provider()
        result = provider.create_transaction(
            appointment_id=appt.pk,
            amount_zmw=float(amount),
            customer_name=appt.customer.full_name,
            customer_phone=appt.customer.phone,
            description=description,
            site_url=site_url,
        )

        if not result.success:
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            raise ValueError(f"Payment provider error: {result.error}")

        payment.dpo_transaction_id = result.transaction_ref
        payment.dpo_token = result.payment_url
        payment.save(update_fields=["dpo_transaction_id", "dpo_token", "updated_at"])

        return InitiatePaymentResult(
            payment_id=payment.pk,
            payment_url=result.payment_url,
            transaction_ref=result.transaction_ref,
        )
