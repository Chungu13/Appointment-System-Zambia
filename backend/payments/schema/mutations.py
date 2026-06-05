import strawberry
from strawberry.types import Info

from .types import ConfirmPaymentResult, InitiatePaymentResult, PaymentMethodEnum, PaymentTypeEnum


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
        if appt.service.deposit_zmw == 0:
            raise ValueError("This service requires no upfront payment — pay in full at the salon.")

        if payment_type == PaymentTypeEnum.DEPOSIT:
            amount = appt.service.deposit_zmw
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

        payment.transaction_ref = result.transaction_ref
        payment.provider_ref = result.provider_ref or result.payment_url or ""
        payment.save(update_fields=["transaction_ref", "provider_ref", "updated_at"])

        return InitiatePaymentResult(
            payment_id=payment.pk,
            payment_url=result.payment_url,
            transaction_ref=result.transaction_ref,
        )

    @strawberry.mutation
    def confirm_dummy_payment(self, info: Info, payment_ref: str) -> ConfirmPaymentResult:
        from django.db.models import Q
        from django.utils import timezone
        from bookings.models import Appointment
        from payments.models import Payment

        q = Q(transaction_ref=payment_ref)
        try:
            q |= Q(pk=int(payment_ref))
        except (ValueError, TypeError):
            pass

        payment = (
            Payment.objects
            .select_related("appointment__service", "appointment__staff")
            .filter(q)
            .first()
        )
        if not payment:
            raise ValueError("Payment not found.")

        appt = payment.appointment

        if payment.status != "completed":
            payment.status = "completed"
            payment.paid_at = timezone.now()
            payment.save(update_fields=["status", "paid_at", "updated_at"])
            appt.status = "confirmed"
            appt.save(update_fields=["status", "updated_at"])

        return ConfirmPaymentResult(
            success=True,
            appointment_id=appt.pk,
            service_name=appt.service.name,
            starts_at=appt.starts_at.isoformat(),
            staff_name=appt.staff.full_name,
        )
