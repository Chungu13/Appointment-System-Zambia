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

    @staticmethod
    def _fmt_date(d) -> str:
        day = d.day
        suffix = "th" if 11 <= day % 100 <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(day % 10, "th")
        return f"{day}{suffix} {d.strftime('%B %Y')}"

    def _system_prompt(self, customer_phone: str) -> str:
        import datetime as _dt
        import zoneinfo as _zi
        _cat = _zi.ZoneInfo("Africa/Lusaka")
        _now = timezone.now().astimezone(_cat)
        today = _now.date()
        today_day = _now.strftime("%A")
        today_str = self._fmt_date(today)
        current_time_str = _now.strftime("%I:%M %p").lstrip("0")
        tomorrow = today + _dt.timedelta(days=1)
        tomorrow_day = tomorrow.strftime("%A")
        tomorrow_str = self._fmt_date(tomorrow)

        policies = self.tenant.business_policies or {}
        policies_lines = []
        if policies.get("cancellationPolicy"):
            policies_lines.append(f"- Cancellation policy: {policies['cancellationPolicy']}")
        if policies.get("lateArrivalPolicy"):
            policies_lines.append(f"- Late arrivals: {policies['lateArrivalPolicy']}")
        if policies.get("lateFee"):
            policies_lines.append(f"- Late fee: {policies['lateFee']}")
        if policies.get("waitingTime"):
            policies_lines.append(f"- Waiting time: {policies['waitingTime']}")
        if policies.get("whatToBring"):
            bring = policies["whatToBring"]
            if isinstance(bring, list):
                bring = ", ".join(bring)
            policies_lines.append(f"- Customers should bring: {bring}")
        if policies.get("parking"):
            policies_lines.append(f"- Parking: {policies['parking']}")
        if policies.get("contactPreference"):
            policies_lines.append(f"- Preferred contact: {policies['contactPreference']}")
        if policies.get("additionalInfo"):
            policies_lines.append(f"- Additional info: {policies['additionalInfo']}")

        policies_section = ""
        if policies_lines:
            policies_section = (
                "\n\nBUSINESS POLICIES:\n" + "\n".join(policies_lines)
            )

        return (
            f"You are a warm, professional booking assistant for {self.tenant.business_name}, "
            "a beauty salon in Zambia.\n\n"
            "Your job:\n"
            "- When a customer names a service they want to book, IMMEDIATELY call check_availability "
            f"for today ({today.isoformat()}) and check whether any slots come back.\n"
            "- Be concise — no filler, no unnecessary questions. When a customer asks about a service, "
            "give them the price, duration and available times immediately.\n"
            "- Confirm service, stylist, date, and time before calling create_booking.\n"
            "- After booking, offer payment — deposit only. Ask which payment method they prefer "
            "(Airtel Money, MTN MoMo, card, or cash).\n\n"
            "DATE AND AVAILABILITY RULES — FOLLOW STRICTLY:\n"
            f"- The current time in Zambia is {current_time_str} (CAT, UTC+2). "
            f"Today is {today_day}, {today_str}.\n"
            "- After calling check_availability for today:\n"
            "  → If slots are returned: say 'Here are the available times for today, "
            f"{today_day} {today_str}:' then list the times as a bullet list.\n"
            "  → If the result is empty (salon closed or all today's slots are in the past):\n"
            "     Do NOT mention today at all.\n"
            f"     Automatically call check_availability for tomorrow ({tomorrow.isoformat()}).\n"
            f"     Say: 'Here are the available times for tomorrow, {tomorrow_day} {tomorrow_str}:'"
            " then list the times.\n"
            "- After every slot list, add on a new line: Would you like a different day?\n"
            "- NEVER show past time slots. NEVER show slots for a closed day.\n"
            "- NEVER write dates as '2026-06-03' — always write '3rd June 2026' or "
            "'tomorrow, Wednesday 3rd June'. Use ordinal suffixes (1st, 2nd, 3rd, 4th...).\n\n"
            "Formatting rules — VERY IMPORTANT:\n"
            "- Never use markdown. No **bold**, no *italic*, no asterisks of any kind.\n"
            "- When a customer asks about a specific service, reply with ONLY this on one line:\n"
            "  SERVICE: [name] | DURATION: [X min] | PRICE: ZMW [X] | DEPOSIT: ZMW [X] | STAFF: [name]\n"
            "  Then on a new line ask if they want to see available times. No other text before the SERVICE line.\n"
            "- When listing available time slots, show them in 12-hour AM/PM format:\n"
            "  - 9:00 AM\n"
            "  - 10:30 AM\n"
            "  - 2:00 PM\n"
            "  Do not add any explanation or other text around the times list.\n"
            "- Put a blank line between sections so the message is easy to read on a phone.\n"
            "- Never write one long paragraph — use short lines with line breaks.\n"
            "- End each message with a short question to keep the conversation moving.\n\n"
            "Payment — IMPORTANT:\n"
            "- Collect the deposit only — never the full price upfront.\n"
            "- Tell the customer: 'To confirm your booking, a deposit of ZMW [deposit amount] is required. "
            "The remaining ZMW [balance] is paid in person after your service.'\n"
            "- NEVER charge the full service price upfront.\n\n"
            "Payment confirmation format — CRITICAL:\n"
            "When a booking is confirmed and payment is required, append this line EXACTLY at the "
            "end of your response, after a blank line. Do not modify the format:\n"
            "BOOKING_CONFIRMED | service: [service name] | date: [YYYY-MM-DD] | time: [HH:MM] | "
            "payment_ref: [ref] | amount: ZMW [X] | staff: [staff name]\n"
            "Replace each [placeholder] with the real value. Use 24-hour HH:MM for time in this line only.\n\n"
            "Guidelines:\n"
            "- Use simple, friendly English. Write dates as '3rd June 2026' or 'tomorrow, Wednesday 3rd June'. "
            "Write times as '9:00 AM' or '2:30 PM' — never '09:00' or '14:30'. Keep responses short and clear.\n"
            "- Prices are in Zambian Kwacha (ZMW). Always mention the deposit amount.\n"
            "- If asked something outside your tools, suggest calling the salon directly.\n"
            f"- Today is {today_day}, {today_str}. Current time in Zambia: {current_time_str}.\n"
            f"- The customer's phone number is {customer_phone}. "
            "You already have this information — never ask the customer for their phone number.\n"
            + policies_section
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
                    {
                        **r,
                        "price_zmw": str(r["price_zmw"]),
                        "deposit_zmw": str(r["deposit_zmw"]),
                        "display_name": f"{r['category']} — {r['name']}" if r.get("category") else r["name"],
                    }
                    for r in rows
                ]
            }

        elif name == "check_availability":
            try:
                date = _dt.date.fromisoformat(inputs["date"])
            except ValueError:
                return {"error": f"Invalid date '{inputs['date']}'. Use YYYY-MM-DD."}

            from bookings.availability import build_availability_slots

            raw_slots = build_availability_slots(inputs["service_id"], date)
            self._last_availability_slots = raw_slots

            if not raw_slots:
                return {"date": inputs["date"], "available_slots": [], "message": "No slots available on this date."}

            by_staff: dict[str, list[str]] = {}
            for s in raw_slots:
                by_staff.setdefault(s["staff_name"], []).append(s["starts_at"].strftime("%H:%M"))

            return {
                "date": inputs["date"],
                "service": raw_slots[0]["service_name"],
                "slots_by_staff": by_staff,
                "total_slots": len(raw_slots),
            }

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
                        status__in=["confirmed", "in_progress"],
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
                    status="confirmed",
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

            amount = appt.service.deposit_zmw
            payment_type = "deposit"

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

            from urllib.parse import quote as _quote
            from django.conf import settings as _s
            _app_domain = getattr(_s, "TENANT_DOMAIN_SUFFIX", "kimawa.pro")
            _slug = self.tenant.subdomain
            _base = (
                f"http://localhost:{getattr(_s, 'VITE_DEV_PORT', 3000)}"
                if _s.DEBUG else f"https://{_app_domain}"
            )
            frontend_pay_url = (
                f"{_base}/pay"
                f"?ref={_quote(result.transaction_ref)}"
                f"&amount={float(amount):.0f}"
                f"&service={_quote(appt.service.name)}"
                f"&salon={_quote(self.tenant.business_name)}"
                f"&slug={_slug}"
            )

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
                "payment_url": frontend_pay_url,
                "transaction_ref": result.transaction_ref,
                "amount_zmw": str(amount),
                "service_name": appt.service.name,
                "staff_name": appt.staff.full_name,
                "starts_at": appt.starts_at.strftime("%Y-%m-%dT%H:%M"),
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
    ) -> tuple[str, list, list]:
        """
        Run one customer turn through the agentic loop.
        Returns (response_text, updated_conversation_history, availability_slots).
        availability_slots is the list of slot dicts from the last check_availability call,
        or [] if check_availability was not called this turn.
        """
        self._last_availability_slots: list = []
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
                return choice.message.content or "", messages, self._last_availability_slots

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
                messages.append(assistant_dict)
                return "Sorry, something went wrong. Please try again.", messages, self._last_availability_slots
