import json
import logging

from django.conf import settings
from django.utils import timezone
from openai import OpenAI

from agents.models import AgentLog
from agents.log_labels import friendly_tool_label

logger = logging.getLogger(__name__)

_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_unpaid_bookings",
            "description": (
                "Return pending appointments that have no completed payment. "
                "Includes how long each has been pending."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "send_payment_reminder",
            "description": "Send a deposit reminder SMS to the customer (placeholder — logs to AgentLog).",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "integer"},
                },
                "required": ["appointment_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_unpaid_booking",
            "description": (
                "Cancel a pending appointment whose deposit has not been received after 2 hours. "
                "Returns an error if the deposit has since been paid or the appointment is not overdue."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "integer"},
                },
                "required": ["appointment_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "process_refund",
            "description": "Trigger a refund via the payment provider for a specific payment.",
            "parameters": {
                "type": "object",
                "properties": {
                    "payment_id": {"type": "integer"},
                },
                "required": ["payment_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_refund_decision",
            "description": (
                "Return the refund status for a cancelled appointment "
                "(full_refund, owner_decision, or no_refund) and any associated completed payment."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "integer"},
                },
                "required": ["appointment_id"],
            },
        },
    },
]


def _message_to_dict(msg) -> dict:
    d = {"role": msg.role}
    if msg.content is not None:
        d["content"] = msg.content
    if getattr(msg, "tool_calls", None):
        d["tool_calls"] = [
            {
                "id": tc.id,
                "type": "function",
                "function": {"name": tc.function.name, "arguments": tc.function.arguments},
            }
            for tc in msg.tool_calls
        ]
    return d


class PaymentAgent:
    def __init__(self, tenant):
        self.tenant = tenant
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def _system_prompt(self) -> str:
        return (
            f"You are the payment agent for {self.tenant.business_name}. "
            "You handle deposit reminders, refund decisions, and payment confirmations. "
            "Always be polite but firm about deposit requirements."
        )

    # ------------------------------------------------------------------
    # Tool execution
    # ------------------------------------------------------------------

    def _run_tool(self, name: str, inputs: dict) -> dict:
        import datetime

        from django.db.models import Exists, OuterRef

        from bookings.models import Appointment
        from payments.models import Payment
        from payments.provider_factory import get_provider

        if name == "get_unpaid_bookings":
            now = timezone.now()
            cutoff_30 = now - datetime.timedelta(minutes=30)

            has_completed_payment = Payment.objects.filter(
                appointment=OuterRef("pk"), status="completed"
            )
            pending = (
                Appointment.objects
                .filter(status="pending", created_at__lt=cutoff_30)
                .exclude(Exists(has_completed_payment))
                .select_related("customer", "service", "staff")
            )

            results = []
            for appt in pending:
                minutes_pending = int((now - appt.created_at).total_seconds() / 60)
                results.append({
                    "appointment_id": appt.pk,
                    "customer_name": appt.customer.full_name,
                    "customer_phone": appt.customer.phone,
                    "service": appt.service.name,
                    "starts_at": appt.starts_at.isoformat(),
                    "minutes_pending": minutes_pending,
                    "deposit_zmw": str(appt.service.deposit_zmw),
                })
            return {"unpaid_bookings": results, "count": len(results)}

        elif name == "send_payment_reminder":
            appointment_id = inputs["appointment_id"]
            try:
                appt = Appointment.objects.select_related("customer", "service").get(pk=appointment_id)
            except Appointment.DoesNotExist:
                return {"error": f"Appointment {appointment_id} not found."}

            msg = (
                f"SMS to {appt.customer.phone}: Hi {appt.customer.full_name}, "
                f"a deposit of ZMW {appt.service.deposit_zmw} is required to confirm your "
                f"{appt.service.name} appointment. Please pay to avoid cancellation."
            )
            logger.info(msg)

            AgentLog.objects.create(
                agent_type="payment",
                action=msg,
                related_appointment=appt,
                outcome="success",
                metadata={
                    "tenant": self.tenant.schema_name,
                    "customer_phone": appt.customer.phone,
                    "appointment_id": appointment_id,
                    "notification_type": "deposit_reminder",
                },
            )
            return {"sent": True, "appointment_id": appointment_id}

        elif name == "cancel_unpaid_booking":
            appointment_id = inputs["appointment_id"]
            now = timezone.now()
            cutoff_2h = now - datetime.timedelta(hours=2)

            try:
                appt = Appointment.objects.select_related("customer", "service").get(pk=appointment_id)
            except Appointment.DoesNotExist:
                return {"error": f"Appointment {appointment_id} not found."}

            if appt.status != "pending":
                return {"skipped": f"Appointment is already {appt.status}."}

            if appt.created_at >= cutoff_2h:
                minutes_left = int((cutoff_2h - appt.created_at).total_seconds() / -60)
                return {"skipped": f"Not yet overdue — {minutes_left} minutes until 2-hour cutoff."}

            has_paid = Payment.objects.filter(appointment=appt, status="completed").exists()
            if has_paid:
                return {"skipped": "Deposit has been received — no cancellation needed."}

            appt.status = "cancelled"
            appt.cancelled_at = now
            appt.cancellation_reason = "Auto-cancelled: deposit not received within 2 hours."
            appt.save(update_fields=["status", "cancelled_at", "cancellation_reason", "updated_at"])

            AgentLog.objects.create(
                agent_type="payment",
                action=(
                    f"Auto-cancelled unpaid booking: {appt.service.name} "
                    f"for {appt.customer.full_name} ({appt.customer.phone})"
                ),
                related_appointment=appt,
                outcome="success",
                metadata={
                    "tenant": self.tenant.schema_name,
                    "appointment_id": appointment_id,
                    "reason": "deposit_timeout",
                },
            )
            return {"cancelled": True, "appointment_id": appointment_id}

        elif name == "process_refund":
            payment_id = inputs["payment_id"]
            try:
                payment = Payment.objects.select_related("appointment__customer", "appointment__service").get(
                    pk=payment_id
                )
            except Payment.DoesNotExist:
                return {"error": f"Payment {payment_id} not found."}

            if payment.status == "refunded":
                return {"skipped": "Payment has already been refunded."}

            if payment.status != "completed":
                return {"error": f"Cannot refund a payment with status '{payment.status}'."}

            provider = get_provider()
            result = provider.refund_transaction(
                payment.dpo_transaction_id, float(payment.amount_zmw)
            )

            if not result.success:
                AgentLog.objects.create(
                    agent_type="payment",
                    action=f"Refund failed for payment {payment_id}: {result.error}",
                    related_appointment=payment.appointment,
                    outcome="failed",
                    metadata={"tenant": self.tenant.schema_name, "payment_id": payment_id},
                )
                return {"error": f"Refund failed: {result.error}"}

            payment.status = "refunded"
            payment.save(update_fields=["status", "updated_at"])

            AgentLog.objects.create(
                agent_type="payment",
                action=(
                    f"Refund processed: ZMW {payment.amount_zmw} for "
                    f"{payment.appointment.customer.full_name}"
                ),
                related_appointment=payment.appointment,
                outcome="success",
                metadata={
                    "tenant": self.tenant.schema_name,
                    "payment_id": payment_id,
                    "amount_zmw": str(payment.amount_zmw),
                },
            )
            return {"refunded": True, "payment_id": payment_id, "amount_zmw": str(payment.amount_zmw)}

        elif name == "get_refund_decision":
            appointment_id = inputs["appointment_id"]

            # Check AgentLog for refund_status stored at cancellation time
            refund_status = None
            logs = AgentLog.objects.filter(
                related_appointment_id=appointment_id,
                agent_type="scheduling",
            ).order_by("-created_at")
            for log in logs:
                if "refund_status" in log.metadata:
                    refund_status = log.metadata["refund_status"]
                    break

            # Fall back to computing from appointment timestamps
            if not refund_status:
                try:
                    appt = Appointment.objects.get(pk=appointment_id)
                    if appt.cancelled_at and appt.starts_at:
                        hours = (appt.starts_at - appt.cancelled_at).total_seconds() / 3600
                        refund_status = (
                            "full_refund" if hours > 24
                            else "owner_decision" if hours > 0
                            else "no_refund"
                        )
                    else:
                        refund_status = "owner_decision"
                except Appointment.DoesNotExist:
                    return {"error": f"Appointment {appointment_id} not found."}

            # Find the most recent completed payment for this appointment
            payment = Payment.objects.filter(
                appointment_id=appointment_id, status="completed"
            ).order_by("-paid_at").first()

            return {
                "appointment_id": appointment_id,
                "refund_status": refund_status,
                "payment_id": payment.pk if payment else None,
                "amount_zmw": str(payment.amount_zmw) if payment else None,
            }

        return {"error": f"Unknown tool: {name}"}

    # ------------------------------------------------------------------
    # Agentic loop
    # ------------------------------------------------------------------

    def _run_loop(self, initial_message: str) -> str:
        messages = [{"role": "user", "content": initial_message}]

        while True:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "system", "content": self._system_prompt()}] + messages,
                tools=_TOOLS,
                tool_choice="auto",
            )
            choice = response.choices[0]
            assistant_dict = _message_to_dict(choice.message)

            if choice.finish_reason == "stop":
                messages.append(assistant_dict)
                return choice.message.content or ""

            elif choice.finish_reason == "tool_calls":
                messages.append(assistant_dict)
                for tc in choice.message.tool_calls:
                    inputs = json.loads(tc.function.arguments or "{}")
                    result = self._run_tool(tc.function.name, inputs)
                    logger.info("PaymentAgent tool %s → %s", tc.function.name, result)

                    AgentLog.objects.create(
                        agent_type="payment",
                        action=friendly_tool_label(tc.function.name),
                        outcome="success" if "error" not in result else "failed",
                        metadata={
                            "tool": tc.function.name,
                            "input": inputs,
                            "result": result,
                            "tenant": self.tenant.schema_name,
                        },
                    )

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": json.dumps(result, default=str),
                    })
            else:
                break

        return ""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def chase_deposits(self) -> str:
        """Remind and auto-cancel appointments with unpaid deposits."""
        return self._run_loop(
            "Check for appointments with unpaid deposits. "
            "Send reminders to those that have been pending for more than 30 minutes. "
            "Cancel those that have been pending for more than 2 hours with no payment."
        )

    def handle_refund(self, appointment_id: int) -> str:
        """Assess and process the refund for a cancelled appointment."""
        return self._run_loop(
            f"Appointment {appointment_id} has been cancelled. "
            "Get the refund decision. If a refund applies (full_refund or owner_decision) "
            "and a completed payment exists, process the refund."
        )
