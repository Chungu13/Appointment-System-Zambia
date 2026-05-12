import datetime
import strawberry
from enum import Enum


@strawberry.enum
class AgentTypeEnum(Enum):
    BOOKING = "booking"
    SCHEDULING = "scheduling"
    PAYMENT = "payment"
    INSIGHTS = "insights"
    ONBOARDING = "onboarding"


@strawberry.enum
class OutcomeEnum(Enum):
    SUCCESS = "success"
    FAILED = "failed"
    PENDING_HUMAN = "pending_human"


@strawberry.type
class AgentLogType:
    id: int
    agent_type: AgentTypeEnum
    action: str
    outcome: OutcomeEnum
    created_at: datetime.datetime


def agent_log_to_type(log) -> AgentLogType:
    return AgentLogType(
        id=log.pk,
        agent_type=AgentTypeEnum(log.agent_type),
        action=log.action,
        outcome=OutcomeEnum(log.outcome),
        created_at=log.created_at,
    )
