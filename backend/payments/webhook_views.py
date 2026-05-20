from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


def _confirm_hold_payment(transaction_ref: str, hold: dict) -> dict:
    """Create a CONFIRMED appointment from a Redis hold after payment succeeds."""
    import datetime
    from django.db import transaction as db_transaction
    from django.utils import timezone
    from django.utils.dateparse import parse_datetime
    from agents.models import AgentLog
    from bookings.holds import remove_hold
    from bookings.models import Appointment, Customer
    from payments.models import Payment
    from services.models import Service
    from staff.models import User

    service = Service.objects.filter(pk=hold["service_id"]).first()
    staff = User.objects.filter(pk=hold["staff_id"]).first()
    if not service or not staff:
        remove_hold(transaction_ref)
        return {"ok": False, "error": "Service or staff no longer available"}

    starts_at = parse_datetime(hold["starts_at"])
    ends_at = parse_datetime(hold["ends_at"])
    now = timezone.now()

    customer, _ = Customer.objects.get_or_create(
        phone=hold["customer_phone"],
        defaults={"full_name": hold["customer_name"]},
    )

    with db_transaction.atomic():
        conflict = (
            Appointment.objects.select_for_update()
            .filter(
                staff=staff,
                status__in=("confirmed", "in_progress"),
                starts_at__lt=ends_at,
                ends_at__gt=starts_at,
            )
            .exists()
        )
        if conflict:
            remove_hold(transaction_ref)
            return {"ok": False, "error": "Time slot is no longer available"}

        appt = Appointment.objects.create(
            customer=customer,
            staff=staff,
            service=service,
            starts_at=starts_at,
            ends_at=ends_at,
            status="confirmed",
            booked_by=hold.get("booked_by", "customer"),
            customer_notes=hold.get("customer_notes", ""),
        )

        Payment.objects.create(
            appointment=appt,
            amount_zmw=hold["deposit_required"],
            payment_type="deposit",
            method=hold.get("payment_method", "airtel_money"),
            status="completed",
            dpo_transaction_id=transaction_ref,
            paid_at=now,
        )

        AgentLog.objects.create(
            agent_type="payment",
            action=(
                f"Payment confirmed: {hold['deposit_required']} ZMW "
                f"for {service.name} with {staff.full_name} "
                f"at {starts_at:%Y-%m-%d %H:%M}"
            ),
            related_appointment=appt,
            outcome="success",
            metadata={
                "transaction_ref": transaction_ref,
                "amount_zmw": hold["deposit_required"],
                "payment_type": "deposit",
                "method": hold.get("payment_method", "airtel_money"),
            },
        )

    remove_hold(transaction_ref)
    return {"ok": True, "appointment_status": "confirmed"}


def _confirm_payment(transaction_ref: str) -> dict:
    """
    Core confirmation logic — shared by both the mock page and real provider webhooks.
    Handles both Redis-hold bookings (new flow) and legacy direct-payment records.
    """
    from bookings.holds import load_hold

    hold = load_hold(transaction_ref)
    if hold:
        return _confirm_hold_payment(transaction_ref, hold)

    # Legacy path: find an existing Payment record
    from django.utils import timezone
    from agents.models import AgentLog
    from payments.models import Payment
    from payments.provider_factory import get_provider

    result = get_provider().verify_transaction(transaction_ref)
    if not result.success or not result.paid:
        return {"ok": False, "error": result.error or "Payment not completed"}

    payment = (
        Payment.objects
        .select_related("appointment__customer", "appointment__service", "appointment__staff")
        .filter(dpo_transaction_id=transaction_ref)
        .first()
    )
    if not payment:
        return {"ok": False, "error": "Payment record not found"}

    now = timezone.now()
    payment.status = "completed"
    payment.paid_at = now
    payment.save(update_fields=["status", "paid_at", "updated_at"])

    appt = payment.appointment
    if appt.status == "pending":
        appt.status = "confirmed"
        appt.save(update_fields=["status", "updated_at"])

    AgentLog.objects.create(
        agent_type="payment",
        action=(
            f"Payment confirmed: {payment.amount_zmw} ZMW "
            f"via {payment.method} for {appt.service.name}"
        ),
        related_appointment=appt,
        outcome="success",
        metadata={
            "transaction_ref": transaction_ref,
            "amount_zmw": float(payment.amount_zmw),
            "payment_type": payment.payment_type,
            "method": payment.method,
        },
    )

    return {"ok": True, "appointment_status": appt.status}


@csrf_exempt
@require_POST
def payment_webhook(request, transaction_ref: str):
    """POST endpoint for real payment provider callbacks."""
    result = _confirm_payment(transaction_ref)
    status = 200 if result["ok"] else 400
    return JsonResponse(result, status=status)
