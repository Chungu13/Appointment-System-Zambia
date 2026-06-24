from agents.log_labels import friendly_tool_label
from agents.models import AgentLog


def log_tool_call(
    agent_type: str,
    tool_name: str,
    inputs: dict,
    result: dict,
    tenant_schema: str,
    appointment=None,
) -> None:
    """Record one tool call in AgentLog. Used by all agent agentic loops."""
    AgentLog.objects.create(
        agent_type=agent_type,
        action=friendly_tool_label(tool_name),
        related_appointment=appointment,
        outcome="success" if "error" not in result else "failed",
        metadata={
            "tool": tool_name,
            "input": inputs,
            "result": result,
            "tenant": tenant_schema,
        },
    )
