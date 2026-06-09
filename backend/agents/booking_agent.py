import json
import logging

from django.conf import settings
from django.utils import timezone
from openai import OpenAI

from agents.models import AgentLog
from agents.log_labels import friendly_tool_label

logger = logging.getLogger(__name__)


def _calculate_customer_total(deposit_zmw: float) -> float:
    """
    What the customer pays upfront.
    Owner always receives deposit_zmw exactly (paid out via disbursement).
    Kimawa earns 10% commission; Lipila fees are covered by the service fee.
    """
    kimawa_fee      = deposit_zmw * 0.10
    lipila_disburse = deposit_zmw * 0.015
    subtotal        = deposit_zmw + kimawa_fee + lipila_disburse
    total           = subtotal / (1 - 0.025)   # gross up to cover 2.5% collection fee
    return round(total, 2)

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
            "description": "Send a mobile money payment prompt to the customer's phone. Call this immediately after create_booking succeeds.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "integer"},
                    "mobile_money_phone": {
                        "type": "string",
                        "description": "Customer's mobile money number. Use the customer's phone from intake unless they specify a different one.",
                    },
                },
                "required": ["appointment_id", "mobile_money_phone"],
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

    def _system_prompt(self, customer_name: str = "") -> str:
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
            "a beauty and or wellness business in Zambia.\n\n"
            "Your job:\n"
            "- When a customer names a service they want to book, IMMEDIATELY call check_availability "
            f"for today ({today.isoformat()}) and check whether any slots come back.\n"
            "- Be concise — no filler, no unnecessary questions. When a customer asks about a service, "
            "give them the price, duration and available times immediately.\n"
            "- After check_availability returns results, look at the available_staff list:\n"
            "  → If there is only ONE staff member available: proceed with that person, no need to ask.\n"
            "  → If there are MULTIPLE staff members: ask the customer which one they prefer.\n"
            "    Example: 'Who would you like? Alice is free at 9 AM and 10 AM, Bob is free at 11 AM and 2 PM or do you prefer one of them?'\n"
            "  → If the customer says 'anyone', 'no preference', 'you choose', or similar: "
            "pick the staff member with the earliest available time slot automatically.\n"
            "- When calling create_booking, use the staff_id from the available_staff list "
            "returned by check_availability. Never guess or invent a staff_id.\n\n"
            "BOOKING CONFIRMATION FLOW — FOLLOW THIS EXACTLY, EVERY TIME:\n"
            "Step 1 — When the customer picks a time, send a short summary and ask to confirm:\n"
            "  [Service name]\n"
            "  [Day, Date] at [Time]\n"
            "  With [Staff name]\n\n"
            "  Deposit: ZMW [deposit_zmw]\n"
            "  Service fee: ZMW [service_fee]\n"
            "  Total now: ZMW [customer_total]\n"
            "  ZMW [balance_at_salon] balance paid at the salon.\n\n"
            "  Shall I confirm this booking?\n"
            "  Use the deposit_zmw, service_fee, customer_total and balance_at_salon values "
            "from the check_availability result. Nothing else. No other questions yet.\n"
            "Step 2 — When the customer says yes/confirm/ok:\n"
            "  Ask ONE question: 'What's your mobile money number for the deposit? (e.g. 0971234567)'\n"
            "  Do not call any tools yet. Wait for their reply.\n"
            "Step 3 — Once the customer provides their phone number:\n"
            "  Call create_booking immediately. CRITICAL: use the EXACT service_id you called "
            "check_availability with — never a different service.\n"
            "  Then call initiate_payment immediately with that same phone number as mobile_money_phone.\n"
            "  In your confirmation message use amount_charged from the initiate_payment result — "
            "not the total from check_availability. These must match; if they differ, tell the customer "
            "the correct amount before they confirm on their phone.\n"
            "  Do NOT ask anything else.\n\n"
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
            "- Only ask a follow-up question when you genuinely need information to proceed.\n\n"
            "Payment — IMPORTANT:\n"
            "- The customer pays customer_total now (deposit + service fee). "
            "The balance_at_salon is paid in person after the service.\n"
            "- NEVER charge the full service price upfront.\n\n"
            "Payment confirmation format — CRITICAL:\n"
            "After initiate_payment succeeds, tell the customer a prompt has been sent, "
            "then append this line EXACTLY at the end of your response, after a blank line:\n"
            "  MOBILE_PAYMENT_SENT | service: [service name] | date: [YYYY-MM-DD] | time: [HH:MM] | "
            "amount: ZMW [amount_charged] | staff: [staff name] | phone: [mobile_money_phone] | payment_ref: [transaction_ref]\n"
            "Use amount_charged, phone and transaction_ref from the initiate_payment tool result — "
            "NOT the totals from check_availability. Use 24-hour HH:MM in this line only.\n"
            "Example human message before the line: "
            "'A payment prompt of ZMW [amount_charged] has been sent to [phone]. Enter your PIN when prompted to confirm your booking.'\n\n"
            "Guidelines:\n"
            "- Use simple, friendly English. Write dates as '3rd June 2026' or 'tomorrow, Wednesday 3rd June'. "
            "Write times as '9:00 AM' or '2:30 PM' — never '09:00' or '14:30'. Keep responses short and clear.\n"
            "- Prices are in Zambian Kwacha (ZMW). Always mention the deposit amount.\n"
            "- If asked something outside your tools, suggest calling the salon directly.\n"
            f"- Today is {today_day}, {today_str}. Current time in Zambia: {current_time_str}.\n"
            f"- The customer's name is {customer_name or 'not provided'}. "
            "You already have their name — never ask for it again.\n"
            "- You do NOT have their phone number. Ask for it at Step 2 of the booking flow (see above) — not before.\n"
            + policies_section
        )

    # ------------------------------------------------------------------
    # Tool execution
    # ------------------------------------------------------------------

    def _run_tool(self, name: str, inputs: dict, customer_phone: str) -> dict:
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

            # Group by staff, keeping staff_id so the AI can pass it directly
            # to create_booking without having to look it up separately.
            seen: dict[int, dict] = {}
            for s in raw_slots:
                sid = s["staff_id"]
                if sid not in seen:
                    seen[sid] = {
                        "staff_id":   sid,
                        "staff_name": s["staff_name"],
                        "times":      [],
                    }
                seen[sid]["times"].append(
                    s["starts_at"].strftime("%I:%M %p").lstrip("0")
                )

            service_obj = Service.objects.filter(pk=inputs["service_id"]).values("deposit_zmw", "price_zmw").first()
            if service_obj:
                deposit       = float(service_obj["deposit_zmw"])
                price         = float(service_obj["price_zmw"])
                customer_total = _calculate_customer_total(deposit)
                service_fee   = round(customer_total - deposit, 2)
                balance_salon = round(price - deposit, 2)
            else:
                deposit = customer_total = service_fee = balance_salon = 0.0

            return {
                "date": inputs["date"],
                "service": raw_slots[0]["service_name"],
                "deposit_zmw": deposit,
                "customer_total": customer_total,
                "service_fee": service_fee,
                "balance_at_salon": balance_salon,
                "available_staff": list(seen.values()),
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

            # Ensure this staff member is actually assigned to the service
            if not StaffService.objects.filter(service=service, staff=staff).exists():
                assigned = list(
                    StaffService.objects.filter(service=service)
                    .select_related("staff")
                    .values_list("staff__full_name", flat=True)
                )
                return {
                    "error": (
                        f"{staff.full_name} is not assigned to {service.name}. "
                        f"Please use one of the staff members returned by check_availability: "
                        f"{', '.join(assigned) or 'none available'}."
                    )
                }

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

            # Use the phone the customer provided during intake unless they specified another
            mobile_money_phone = inputs.get("mobile_money_phone") or customer_phone

            # Always derive amounts from the booked appointment's service —
            # this is the authoritative source, not what check_availability returned.
            actual_deposit = float(appt.service.deposit_zmw)
            actual_total   = _calculate_customer_total(actual_deposit)
            actual_fee     = round(actual_total - actual_deposit, 2)

            import uuid as _uuid
            transaction_ref = f"KIMAWA-{_uuid.uuid4().hex[:12].upper()}"

            # Create payment record — amount_zmw is what the customer actually pays
            payment = Payment.objects.create(
                appointment=appt,
                amount_zmw=actual_total,
                payment_type="deposit",
                method="airtel_money",
                status="pending",
                transaction_ref=transaction_ref,
            )

            provider = get_provider()
            result = provider.initiate_collection(
                phone=mobile_money_phone,
                amount=actual_total,
                reference=transaction_ref,
                narration=f"{appt.service.name} deposit",
            )

            if not result.success:
                payment.status = "failed"
                payment.save(update_fields=["status", "updated_at"])
                return {"error": f"Payment initiation failed: {result.message}"}

            update_fields = ["updated_at"]
            if result.provider_ref:
                payment.provider_ref = result.provider_ref
                update_fields.append("provider_ref")

            # Mock auto-confirms immediately — mark payment + appointment here too
            if result.status == "completed":
                from django.utils import timezone as _tz
                payment.status  = "completed"
                payment.paid_at = _tz.now()
                update_fields += ["status", "paid_at"]
                if appt.status not in ("confirmed", "completed"):
                    appt.status = "confirmed"
                    appt.save(update_fields=["status", "updated_at"])

            payment.save(update_fields=list(set(update_fields)))

            AgentLog.objects.create(
                agent_type="payment",
                action=(
                    f"Agent initiated payment of ZMW {actual_total} for "
                    f"{appt.customer.full_name} ({mobile_money_phone})"
                ),
                related_appointment=appt,
                outcome="success",
                metadata={
                    "tenant": self.tenant.schema_name,
                    "payment_id": payment.pk,
                    "transaction_ref": transaction_ref,
                    "amount_charged": str(actual_total),
                    "deposit_zmw": str(actual_deposit),
                    "phone": mobile_money_phone,
                },
            )

            return {
                "payment_flow": "mobile_money",
                "transaction_ref": transaction_ref,
                "phone": mobile_money_phone,
                "amount_charged": actual_total,
                "deposit": actual_deposit,
                "service_fee": actual_fee,
                "message": f"Payment of ZMW {actual_total} initiated to {mobile_money_phone}",
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
        customer_name: str = "",
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
                messages=[{"role": "system", "content": self._system_prompt(customer_name)}] + messages,
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

                    result = self._run_tool(tc.function.name, inputs, customer_phone)
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
