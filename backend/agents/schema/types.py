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
    try:
        agent_type = AgentTypeEnum(log.agent_type)
    except (ValueError, KeyError, TypeError):
        agent_type = AgentTypeEnum("booking")
    try:
        outcome = OutcomeEnum(log.outcome)
    except (ValueError, KeyError, TypeError):
        outcome = OutcomeEnum("pending_human")
    return AgentLogType(
        id=log.pk,
        agent_type=agent_type,
        action=log.action,
        outcome=outcome,
        created_at=log.created_at,
    )
