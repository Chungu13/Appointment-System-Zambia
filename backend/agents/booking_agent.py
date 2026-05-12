import json
import logging

from django.conf import settings
from django.utils import timezone
from openai import OpenAI

from agents.models import AgentLog

logger = logging.getLogger(__name__)

_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_services",
            "description": "List available services at the salon, optionally filtered by category.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "enum": ["hair", "nails", "braids", "colour", "lashes", "other"],
                        "description": "Filter by category. Omit to list all services.",
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_availability",
            "description": "Return available time slots for a service on a specific date.",
            "parameters": {
                "type": "object",
                "properties": {
                    "service_id": {"type": "integer", "description": "ID of the service."},
                    "date": {"type": "string", "description": "Date to check, YYYY-MM-DD."},
                },
                "required": ["service_id", "date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_staff_for_service",
            "description": "List staff members qualified to perform a service.",
            "parameters": {
                "type": "object",
                "properties": {
                    "service_id": {"type": "integer", "description": "ID of the service."},
                },
                "required": ["service_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_booking",
            "description": "Create an appointment for the customer.",
            "parameters": {
                "type": "object",
                "properties": {
                    "service_id": {"type": "integer"},
                    "staff_id": {"type": "integer"},
                    "starts_at": {
                        "type": "string",
                        "description": "Start datetime ISO 8601, e.g. 2025-06-15T10:00:00.",
                    },
                    "customer_name": {"type": "string"},
                    "customer_phone": {"type": "string"},
                    "notes": {"type": "string", "description": "Optional customer notes."},
                },
                "required": ["service_id", "staff_id", "starts_at", "customer_name", "customer_phone"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "initiate_payment",
            "description": "Start a payment for an appointment.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "integer"},
                    "payment_method": {
                        "type": "string",
                        "enum": ["airtel_money", "mtn_momo", "card", "cash"],
                    },
                },
                "required": ["appointment_id", "payment_method"],
            },
        },
    },
]


def _message_to_dict(msg) -> dict:
    """Convert an OpenAI ChatCompletionMessage object to a plain dict for Redis."""
    d = {"role": msg.role}
    if msg.content is not None:
        d["content"] = msg.content
    if getattr(msg, "tool_calls", None):
        d["tool_calls"] = [
            {
                "id": tc.id,
                "type": "function",
                "function": {
                    "name": tc.function.name,
                    "arguments": tc.function.arguments,
                },
            }
            for tc in msg.tool_calls
        ]
    return d


class BookingAgent:
    def __init__(self, tenant):
        self.tenant = tenant
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def _system_prompt(self, customer_phone: str) -> str:
        today = timezone.localdate()
        return (
            f"You are a warm, professional booking assistant for {self.tenant.business_name}, "
            "a beauty salon in Zambia.\n\n"
            "Your job:\n"
            "1. Help customers browse services and prices.\n"
            "2. Check available slots for their preferred date.\n"
            "3. Confirm service, stylist, date, and time before calling create_booking.\n"
            "4. After booking, offer to initiate payment and ask which method they prefer "
            "(Airtel Money, MTN MoMo, card, or cash).\n\n"
            "Guidelines:\n"
            "- Be concise and friendly.\n"
            "- Prices are in Zambian Kwacha (ZMW). Mention the deposit when relevant.\n"
            "- If asked something outside your tools, suggest calling the salon directly.\n"
            f"- Today's date is {today}.\n"
            f"- The customer's phone number is {customer_phone}. "
            "You already have this information — never ask the customer for their phone number.\n"
        )

    # ------------------------------------------------------------------
    # Tool execution
    # ------------------------------------------------------------------

    def _run_tool(self, name: str, inputs: dict, customer_phone: str, site_url: str) -> dict:
        import datetime as _dt

        from django.contrib.auth import get_user_model
        from django.db import transaction

        from bookings.models import Appointment, Customer
        from payments.models import Payment
        from payments.provider_factory import get_provider
        from services.models import Service, StaffService

        User = get_user_model()

        if name == "get_services":
            qs = Service.objects.filter(is_active=True)
            if inputs.get("category"):
                qs = qs.filter(category=inputs["category"])
            rows = list(qs.values("id", "name", "category", "description", "duration_minutes", "price_zmw", "deposit_zmw"))
            return {
                "services": [
                    {**r, "price_zmw": str(r["price_zmw"]), "deposit_zmw": str(r["deposit_zmw"])}
                    for r in rows
                ]
            }

        elif name == "check_availability":
            try:
                date = _dt.date.fromisoformat(inputs["date"])
            except ValueError:
                return {"error": f"Invalid date '{inputs['date']}'. Use YYYY-MM-DD."}

            try:
                service = Service.objects.get(pk=inputs["service_id"], is_active=True)
            except Service.DoesNotExist:
                return {"error": f"Service {inputs['service_id']} not found."}

            staff_ids = list(StaffService.objects.filter(service=service).values_list("staff_id", flat=True))
            tz = timezone.get_current_timezone()
            slot_duration = _dt.timedelta(minutes=service.duration_minutes + service.buffer_minutes)
            day_start = _dt.datetime(date.year, date.month, date.day, 9, 0, tzinfo=tz)
            day_end = _dt.datetime(date.year, date.month, date.day, 17, 0, tzinfo=tz)

            slots = []
            for staff_id in staff_ids:
                staff_name = (
                    User.objects.filter(pk=staff_id).values_list("full_name", flat=True).first() or "Unknown"
                )
                cursor = day_start
                while cursor + slot_duration <= day_end:
                    slot_end = cursor + slot_duration
                    conflict = Appointment.objects.filter(
                        staff_id=staff_id,
                        status__in=["pending", "confirmed", "in_progress"],
                        starts_at__lt=slot_end,
                        ends_at__gt=cursor,
                    ).exists()
                    if not conflict:
                        slots.append({
                            "staff_id": staff_id,
                            "staff_name": staff_name,
                            "starts_at": cursor.isoformat(),
                        })
                    cursor += _dt.timedelta(minutes=30)

            return {"date": inputs["date"], "service": service.name, "available_slots": slots}

        elif name == "get_staff_for_service":
            staff_ids = StaffService.objects.filter(service_id=inputs["service_id"]).values_list("staff_id", flat=True)
            return {"staff": list(User.objects.filter(pk__in=staff_ids).values("id", "full_name"))}

        elif name == "create_booking":
            try:
                service = Service.objects.get(pk=inputs["service_id"], is_active=True)
            except Service.DoesNotExist:
                return {"error": f"Service {inputs['service_id']} not found."}

            try:
                staff = User.objects.get(pk=inputs["staff_id"])
            except User.DoesNotExist:
                return {"error": f"Staff member {inputs['staff_id']} not found."}

            tz = timezone.get_current_timezone()
            try:
                import dateutil.parser
                starts_at = dateutil.parser.parse(inputs["starts_at"])
                if starts_at.tzinfo is None:
                    starts_at = starts_at.replace(tzinfo=tz)
            except Exception:
                return {"error": f"Invalid datetime '{inputs['starts_at']}'."}

            ends_at = starts_at + _dt.timedelta(minutes=service.duration_minutes + service.buffer_minutes)
            customer, _ = Customer.objects.get_or_create(
                phone=inputs["customer_phone"],
                defaults={"full_name": inputs["customer_name"]},
            )

            with transaction.atomic():
                conflict = (
                    Appointment.objects
                    .select_for_update()
                    .filter(
                        staff=staff,
                        status__in=["pending", "confirmed", "in_progress"],
                        starts_at__lt=ends_at,
                        ends_at__gt=starts_at,
                    )
                    .exists()
                )
                if conflict:
                    return {"error": "That slot is no longer available. Please choose another time."}

                appt = Appointment.objects.create(
                    customer=customer,
                    staff=staff,
                    service=service,
                    starts_at=starts_at,
                    ends_at=ends_at,
                    status="pending",
                    booked_by="agent",
                    customer_notes=inputs.get("notes", ""),
                )

            AgentLog.objects.create(
                agent_type="booking",
                action=(
                    f"Agent booked {service.name} for {customer.full_name} ({customer.phone}) "
                    f"with {staff.full_name} at {starts_at:%Y-%m-%d %H:%M}"
                ),
                related_appointment=appt,
                outcome="success",
                metadata={
                    "tenant": self.tenant.schema_name,
                    "customer_phone": inputs["customer_phone"],
                    "service_id": inputs["service_id"],
                    "staff_id": inputs["staff_id"],
                },
            )

            return {
                "appointment_id": appt.pk,
                "service": service.name,
                "staff": staff.full_name,
                "starts_at": starts_at.isoformat(),
                "status": "pending",
                "price_zmw": str(service.price_zmw),
                "deposit_zmw": str(service.deposit_zmw),
            }

        elif name == "initiate_payment":
            try:
                appt = Appointment.objects.select_related("customer", "service", "staff").get(
                    pk=inputs["appointment_id"]
                )
            except Appointment.DoesNotExist:
                return {"error": f"Appointment {inputs['appointment_id']} not found."}

            if appt.status == "cancelled":
                return {"error": "Cannot pay for a cancelled appointment."}

            deposit = appt.service.deposit_zmw
            amount = (
                appt.service.price_zmw
                if (not deposit or appt.customer.no_show_count >= 2)
                else deposit
            )
            payment_type = "deposit" if deposit and appt.customer.no_show_count < 2 else "balance"

            payment = Payment.objects.create(
                appointment=appt,
                amount_zmw=amount,
                payment_type=payment_type,
                method=inputs["payment_method"],
                status="pending",
            )

            provider = get_provider()
            result = provider.create_transaction(
                appointment_id=appt.pk,
                amount_zmw=float(amount),
                customer_name=appt.customer.full_name,
                customer_phone=appt.customer.phone,
                description=f"{appt.service.name} with {appt.staff.full_name} on {appt.starts_at:%Y-%m-%d %H:%M}",
                site_url=site_url,
            )

            if not result.success:
                payment.status = "failed"
                payment.save(update_fields=["status", "updated_at"])
                return {"error": f"Payment provider error: {result.error}"}

            payment.dpo_transaction_id = result.transaction_ref
            payment.dpo_token = result.payment_url
            payment.save(update_fields=["dpo_transaction_id", "dpo_token", "updated_at"])

            AgentLog.objects.create(
                agent_type="payment",
                action=f"Agent initiated payment of ZMW {amount} for {appt.customer.full_name} ({appt.customer.phone})",
                related_appointment=appt,
                outcome="success",
                metadata={
                    "tenant": self.tenant.schema_name,
                    "payment_id": payment.pk,
                    "transaction_ref": result.transaction_ref,
                    "amount_zmw": str(amount),
                },
            )

            return {
                "payment_id": payment.pk,
                "payment_url": result.payment_url,
                "transaction_ref": result.transaction_ref,
                "amount_zmw": str(amount),
            }

        return {"error": f"Unknown tool: {name}"}

    # ------------------------------------------------------------------
    # Agentic loop
    # ------------------------------------------------------------------

    def chat(
        self,
        message: str,
        customer_phone: str,
        conversation_history: list,
        site_url: str = "",
    ) -> tuple[str, list]:
        """
        Run one customer turn through the agentic loop.
        Returns (response_text, updated_conversation_history).
        """
        messages = list(conversation_history)
        messages.append({"role": "user", "content": message})

        while True:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "system", "content": self._system_prompt(customer_phone)}] + messages,
                tools=_TOOLS,
                tool_choice="auto",
            )

            choice = response.choices[0]
            assistant_dict = _message_to_dict(choice.message)

            if choice.finish_reason == "stop":
                messages.append(assistant_dict)
                return choice.message.content or "", messages

            elif choice.finish_reason == "tool_calls":
                messages.append(assistant_dict)

                for tc in choice.message.tool_calls:
                    try:
                        inputs = json.loads(tc.function.arguments)
                    except json.JSONDecodeError:
                        inputs = {}

                    result = self._run_tool(tc.function.name, inputs, customer_phone, site_url)
                    logger.info("Tool %s(%s) → %s", tc.function.name, inputs, result)

                    # Log to AgentLog on every tool call
                    AgentLog.objects.create(
                        agent_type="booking",
                        action=f"Tool call: {tc.function.name}",
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
                messages.append(assistant_dict)
                return "Sorry, something went wrong. Please try again.", messages
