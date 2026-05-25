import datetime
import json
from typing import List

import strawberry
from strawberry.types import Info


@strawberry.type
class ChatSlotType:
    starts_at: datetime.datetime
    ends_at: datetime.datetime
    staff_id: int
    staff_name: str
    service_id: int
    service_name: str
    duration_minutes: int


@strawberry.type
class AgentChatResult:
    response: str
    session_id: str
    slots: List[ChatSlotType]


@strawberry.type
class AgentsMutation:
    @strawberry.mutation
    def agent_chat(
        self,
        info: Info,
        message: str,
        customer_phone: str,
        session_id: str,
    ) -> AgentChatResult:
        import redis
        from django.conf import settings

        from agents.booking_agent import BookingAgent

        r = redis.from_url(settings.CELERY_BROKER_URL, decode_responses=True)
        redis_key = f"booking_agent:{session_id}"

        raw = r.get(redis_key)
        history = json.loads(raw) if raw else []

        request = info.context.request
        tenant = request.tenant
        scheme = "https" if request.is_secure() else "http"
        site_url = f"{scheme}://{request.get_host()}"

        agent = BookingAgent(tenant)
        response_text, updated_history, raw_slots = agent.chat(
            message=message,
            customer_phone=customer_phone,
            conversation_history=history,
            site_url=site_url,
        )

        # Persist for 24 hours
        r.setex(redis_key, 86400, json.dumps(updated_history, default=str))

        slots = [
            ChatSlotType(
                starts_at=s["starts_at"],
                ends_at=s["ends_at"],
                staff_id=s["staff_id"],
                staff_name=s["staff_name"],
                service_id=s["service_id"],
                service_name=s["service_name"],
                duration_minutes=s["duration_minutes"],
            )
            for s in raw_slots
        ]

        return AgentChatResult(response=response_text, session_id=session_id, slots=slots)
