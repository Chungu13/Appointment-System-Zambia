import json

import strawberry
from strawberry.types import Info


@strawberry.type
class AgentChatResult:
    response: str
    session_id: str


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
        response_text, updated_history = agent.chat(
            message=message,
            customer_phone=customer_phone,
            conversation_history=history,
            site_url=site_url,
        )

        # Persist for 24 hours
        r.setex(redis_key, 86400, json.dumps(updated_history, default=str))

        return AgentChatResult(response=response_text, session_id=session_id)
