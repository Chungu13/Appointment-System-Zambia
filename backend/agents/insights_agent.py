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
            "name": "get_weekly_stats",
            "description": "Return total bookings, revenue, no-show count, and top services for a date range.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "end_date": {"type": "string", "description": "YYYY-MM-DD"},
                },
                "required": ["start_date", "end_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_slow_slots",
            "description": "Return the day/time combinations with the fewest bookings over the past N weeks.",
            "parameters": {
                "type": "object",
                "properties": {
                    "weeks_back": {"type": "integer", "description": "How many weeks to look back."},
                },
                "required": ["weeks_back"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_lapsed_customers",
            "description": "Return customers who have not visited in the past X days.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Inactivity threshold in days."},
                },
                "required": ["days"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "send_owner_digest",
            "description": "Save the weekly summary for the salon owner (logs to AgentLog, outcome=pending_human).",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {"type": "string", "description": "The digest text to send."},
                },
                "required": ["message"],
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


class InsightsAgent:
    def __init__(self, tenant):
        self.tenant = tenant
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def _system_prompt(self) -> str:
        return (
            f"You are the business insights agent for {self.tenant.business_name} in Lusaka, Zambia. "
            "Every week you analyse booking data and write a short friendly summary for the owner. "
            "Write like you are texting a friend. Use ZMW. "
            "Keep it under 5 sentences. End with one actionable suggestion."
        )

    # ------------------------------------------------------------------
    # Tool execution
    # ------------------------------------------------------------------

    def _run_tool(self, name: str, inputs: dict) -> dict:
        import datetime

        from django.db.models import Count, Sum
        from django.db.models.functions import ExtractHour, ExtractWeekDay

        from bookings.models import Appointment, Customer
        from payments.models import Payment

        if name == "get_weekly_stats":
            import datetime as _dt
            start = _dt.date.fromisoformat(inputs["start_date"])
            end = _dt.date.fromisoformat(inputs["end_date"])

            bookings = Appointment.objects.filter(
                created_at__date__gte=start,
                created_at__date__lte=end,
            )
            total_bookings = bookings.count()
            no_show_count = bookings.filter(status="no_show").count()
            cancelled_count = bookings.filter(status="cancelled").count()

            revenue = (
                Payment.objects
                .filter(appointment__in=bookings, status="completed")
                .aggregate(total=Sum("amount_zmw"))["total"]
            ) or 0

            top_services = list(
                bookings
                .values("service__name")
                .annotate(count=Count("id"))
                .order_by("-count")[:3]
            )

            return {
                "total_bookings": total_bookings,
                "no_show_count": no_show_count,
                "cancelled_count": cancelled_count,
                "revenue_zmw": str(revenue),
                "top_services": [
                    {"name": s["service__name"], "bookings": s["count"]}
                    for s in top_services
                ],
            }

        elif name == "get_slow_slots":
            weeks_back = max(1, inputs.get("weeks_back", 2))
            since = timezone.now() - datetime.timedelta(weeks=weeks_back)

            day_names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            slot_counts = list(
                Appointment.objects
                .filter(
                    starts_at__gte=since,
                    status__in=["confirmed", "completed", "in_progress"],
                )
                .annotate(
                    weekday=ExtractWeekDay("starts_at"),
                    hour=ExtractHour("starts_at"),
                )
                .values("weekday", "hour")
                .annotate(count=Count("id"))
                .order_by("count")[:5]
            )

            return {
                "slow_slots": [
                    {
                        "day": day_names[(s["weekday"] - 1) % 7],
                        "hour": f"{s['hour']:02d}:00",
                        "booking_count": s["count"],
                    }
                    for s in slot_counts
                ]
            }

        elif name == "get_lapsed_customers":
            days = max(1, inputs.get("days", 60))
            cutoff = timezone.now() - datetime.timedelta(days=days)

            customers = list(
                Customer.objects
                .filter(last_visit_at__lt=cutoff, last_visit_at__isnull=False)
                .values("id", "full_name", "phone", "last_visit_at", "visit_count")
                .order_by("last_visit_at")[:20]
            )
            return {
                "lapsed_customers": [
                    {
                        "customer_id": c["id"],
                        "name": c["full_name"],
                        "phone": c["phone"],
                        "last_visit": str(c["last_visit_at"].date()) if c["last_visit_at"] else None,
                        "total_visits": c["visit_count"],
                    }
                    for c in customers
                ],
                "count": len(customers),
            }

        elif name == "send_owner_digest":
            message = inputs["message"]
            logger.info("InsightsAgent digest for %s: %s", self.tenant.business_name, message)

            AgentLog.objects.create(
                agent_type="insights",
                action=message,
                outcome="pending_human",
                metadata={
                    "tenant": self.tenant.schema_name,
                    "digest_date": str(timezone.localdate()),
                },
            )
            return {"sent": True}

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
                    logger.info("InsightsAgent tool %s → %s", tc.function.name, result)

                    AgentLog.objects.create(
                        agent_type="insights",
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

    def generate_weekly_digest(self) -> str:
        """Run the agent to produce and store a weekly business digest."""
        import datetime
        today = timezone.localdate()
        start = today - datetime.timedelta(days=7)

        return self._run_loop(
            f"Generate the weekly insights digest for {self.tenant.business_name}. "
            f"The week ran from {start} to {today}. "
            "Get the weekly stats, check for slow slots (2 weeks back), "
            "find lapsed customers (60 days), then write and send the owner digest."
        )
