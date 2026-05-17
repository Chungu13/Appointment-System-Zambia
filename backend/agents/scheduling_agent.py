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
            "name": "get_cancelled_slot",
            "description": "Return details of a cancelled appointment — service, staff, date, and time.",
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
            "name": "get_waitlist_matches",
            "description": (
                "Return the top 3 active waitlist customers for a service on a given date, "
                "ordered by how long they have been waiting (oldest first). "
                "Only returns entries that have not yet been notified."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "service_id": {"type": "integer"},
                    "date": {"type": "string", "description": "YYYY-MM-DD"},
                    "staff_id": {"type": "integer", "description": "Preferred staff (optional)"},
                },
                "required": ["service_id", "date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "notify_customer",
            "description": "Send an SMS notification to a customer (placeholder — logs to AgentLog).",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_phone": {"type": "string"},
                    "message": {"type": "string"},
                    "appointment_id": {"type": "integer", "description": "Related cancelled appointment."},
                },
                "required": ["customer_phone", "message", "appointment_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "mark_waitlist_notified",
            "description": "Mark a waitlist entry as notified so it is not contacted again.",
            "parameters": {
                "type": "object",
                "properties": {
                    "waitlist_id": {"type": "integer"},
                },
                "required": ["waitlist_id"],
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


class SchedulingAgent:
    def __init__(self, tenant):
        self.tenant = tenant
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def _system_prompt(self) -> str:
        return (
            f"You are the scheduling agent for {self.tenant.business_name}. "
            "Your job is to fill cancelled appointment slots by finding the best matching "
            "customers from the waitlist and notifying them. "
            "Be efficient and fair — prioritize customers who have been waiting longest."
        )

    # ------------------------------------------------------------------
    # Tool execution
    # ------------------------------------------------------------------

    def _run_tool(self, name: str, inputs: dict) -> dict:
        from bookings.models import Appointment, Waitlist

        if name == "get_cancelled_slot":
            try:
                appt = Appointment.objects.select_related("customer", "staff", "service").get(
                    pk=inputs["appointment_id"], status="cancelled"
                )
            except Appointment.DoesNotExist:
                return {"error": f"Cancelled appointment {inputs['appointment_id']} not found."}

            return {
                "appointment_id": appt.pk,
                "service_id": appt.service_id,
                "service_name": appt.service.name,
                "staff_id": appt.staff_id,
                "staff_name": appt.staff.full_name,
                "date": str(appt.starts_at.date()),
                "starts_at": appt.starts_at.isoformat(),
                "ends_at": appt.ends_at.isoformat(),
            }

        elif name == "get_waitlist_matches":
            service_id = inputs["service_id"]
            date_str = inputs["date"]
            staff_id = inputs.get("staff_id")

            entries = (
                Waitlist.objects
                .filter(
                    service_id=service_id,
                    preferred_date=date_str,
                    is_active=True,
                    notified_at__isnull=True,
                )
                .select_related("customer", "service")
                .order_by("id")[:3]
            )

            results = []
            for e in entries:
                results.append({
                    "waitlist_id": e.pk,
                    "customer_phone": e.customer.phone,
                    "customer_name": e.customer.full_name,
                    "service_name": e.service.name,
                    "preferred_date": str(e.preferred_date),
                })
            return {"matches": results, "count": len(results)}

        elif name == "notify_customer":
            msg = (
                f"SMS to {inputs['customer_phone']}: {inputs['message']}"
            )
            logger.info(msg)

            try:
                appt = Appointment.objects.get(pk=inputs["appointment_id"])
            except Appointment.DoesNotExist:
                appt = None

            AgentLog.objects.create(
                agent_type="scheduling",
                action=msg,
                related_appointment=appt,
                outcome="success",
                metadata={
                    "tenant": self.tenant.schema_name,
                    "customer_phone": inputs["customer_phone"],
                    "notification_type": "waitlist_slot_available",
                },
            )
            return {"sent": True, "phone": inputs["customer_phone"]}

        elif name == "mark_waitlist_notified":
            updated = Waitlist.objects.filter(pk=inputs["waitlist_id"]).update(
                notified_at=timezone.now()
            )
            if not updated:
                return {"error": f"Waitlist entry {inputs['waitlist_id']} not found."}
            return {"marked": True, "waitlist_id": inputs["waitlist_id"]}

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
                    logger.info("SchedulingAgent tool %s → %s", tc.function.name, result)

                    AgentLog.objects.create(
                        agent_type="scheduling",
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

    def fill_slot(self, appointment_id: int) -> str:
        """Run the agent for one cancelled appointment slot."""
        return self._run_loop(
            f"Appointment {appointment_id} has just been cancelled. "
            "Get the slot details, find the best matching waitlist customers, "
            "notify each of them, and mark their waitlist entries as notified."
        )
