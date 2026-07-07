import json
import logging

from django.conf import settings
from openai import OpenAI

from agents.agent_log import log_tool_call
from agents.openai_utils import message_to_dict
from agents.booking import handlers
from agents.booking.prompt import build_system_prompt
from agents.booking.tools import TOOLS

logger = logging.getLogger(__name__)


class BookingAgent:
    def __init__(self, tenant):
        self.tenant = tenant
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def _run_tool(self, name: str, inputs: dict, customer_phone: str) -> dict:
        schema = self.tenant.schema_name
        session_id = getattr(self, "_session_id", "")
        last_slots = getattr(self, "_last_availability_slots", [])

        if name == "get_services":
            return handlers.handle_get_services(inputs)
        elif name == "check_availability":
            result, slots = handlers.handle_check_availability(inputs)
            self._last_availability_slots = slots
            return result
        elif name == "get_best_staff":
            return handlers.handle_get_best_staff(inputs)
        elif name == "create_booking":
            return handlers.handle_create_booking(inputs, customer_phone, schema, session_id, last_slots)
        elif name == "initiate_payment":
            return handlers.handle_initiate_payment(inputs, customer_phone, schema)
        elif name == "find_my_appointments":
            return handlers.handle_find_my_appointments(inputs, customer_phone)
        elif name == "cancel_appointment":
            return handlers.handle_cancel_appointment(inputs, customer_phone, schema)
        elif name == "reschedule_appointment":
            return handlers.handle_reschedule_appointment(inputs, customer_phone, schema)
        elif name == "retry_payment":
            return handlers.handle_retry_payment(inputs, customer_phone, schema)
        elif name == "validate_phone_number":
            result = handlers.handle_validate_phone(inputs)
            if not result.get("valid"):
                msgs = getattr(self, "_messages", [])
                prior_failures = 0
                for m in msgs:
                    if m.get("role") == "tool" and isinstance(m.get("content"), str):
                        try:
                            c = json.loads(m["content"])
                            if isinstance(c, dict) and c.get("valid") is False:
                                prior_failures += 1
                        except (json.JSONDecodeError, TypeError):
                            pass
                attempt = prior_failures + 1
                result["attempt"] = attempt
                if attempt >= 2:
                    result["stop"] = True
                    result["instruction"] = (
                        "The customer has now provided 2 invalid numbers. "
                        "Say EXACTLY this and nothing else: "
                        "'I'm unable to process your booking without a valid number. "
                        "Please start a new chat to try again.' "
                        "Do NOT ask for another number. Do NOT call any tools."
                    )
            return result
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
        session_id: str = "",
    ) -> tuple:
        """
        Run one customer turn through the agentic loop.
        Returns (response_text, updated_conversation_history, availability_slots).
        """
        self._session_id = session_id
        self._last_availability_slots: list = []
        messages = list(conversation_history)
        messages.append({"role": "user", "content": message})

        while True:
            self._messages = messages
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "system", "content": build_system_prompt(self.tenant, customer_name)}] + messages,
                tools=TOOLS,
                tool_choice="auto",
                max_tokens=500,
                temperature=0.3,
                top_p=0.9,
            )

            choice = response.choices[0]
            assistant_dict = message_to_dict(choice.message)

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
                    log_tool_call("booking", tc.function.name, inputs, result, self.tenant.schema_name)

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": json.dumps(result, default=str),
                    })

            else:
                messages.append(assistant_dict)
                return "Sorry, something went wrong. Please try again.", messages, self._last_availability_slots

    # ------------------------------------------------------------------
    # Streaming agentic loop — yields (kind, value) tuples
    # ------------------------------------------------------------------

    def chat_streaming(
        self,
        message: str,
        customer_phone: str,
        conversation_history: list,
        customer_name: str = "",
        session_id: str = "",
    ):
        """
        Same agentic loop as chat(), but uses stream=True for the final text turn.

        Yields:
          ("token", str)    — text chunk from the streaming text response
          ("history", list) — final messages list, yielded once at the very end
        """
        self._session_id = session_id
        self._last_availability_slots = []
        messages = list(conversation_history)
        messages.append({"role": "user", "content": message})

        while True:
            self._messages = messages
            stream = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "system", "content": build_system_prompt(self.tenant, customer_name)}] + messages,
                tools=TOOLS,
                tool_choice="auto",
                max_tokens=500,
                temperature=0.3,
                top_p=0.9,
                stream=True,
            )

            accumulated_content = ""
            accumulated_tool_calls = {}   # index → {id, name, arguments}
            finish_reason = None

            for chunk in stream:
                if not chunk.choices:
                    continue
                choice = chunk.choices[0]
                if choice.finish_reason:
                    finish_reason = choice.finish_reason

                delta = choice.delta

                if delta.tool_calls:
                    for tc_delta in delta.tool_calls:
                        idx = tc_delta.index
                        if idx not in accumulated_tool_calls:
                            accumulated_tool_calls[idx] = {"id": "", "name": "", "arguments": ""}
                        if tc_delta.id:
                            accumulated_tool_calls[idx]["id"] += tc_delta.id
                        if tc_delta.function:
                            if tc_delta.function.name:
                                accumulated_tool_calls[idx]["name"] += tc_delta.function.name
                            if tc_delta.function.arguments:
                                accumulated_tool_calls[idx]["arguments"] += tc_delta.function.arguments

                if delta.content:
                    accumulated_content += delta.content
                    yield ("token", delta.content)

            if finish_reason == "tool_calls":
                tool_calls_list = [
                    {
                        "id": accumulated_tool_calls[idx]["id"],
                        "type": "function",
                        "function": {
                            "name": accumulated_tool_calls[idx]["name"],
                            "arguments": accumulated_tool_calls[idx]["arguments"],
                        },
                    }
                    for idx in sorted(accumulated_tool_calls.keys())
                ]
                messages.append({"role": "assistant", "content": None, "tool_calls": tool_calls_list})

                for tc in tool_calls_list:
                    try:
                        inputs = json.loads(tc["function"]["arguments"])
                    except json.JSONDecodeError:
                        inputs = {}

                    result = self._run_tool(tc["function"]["name"], inputs, customer_phone)
                    logger.info("Tool %s(%s) → %s", tc["function"]["name"], inputs, result)
                    log_tool_call("booking", tc["function"]["name"], inputs, result, self.tenant.schema_name)

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": json.dumps(result, default=str),
                    })

                continue  # next agentic loop iteration

            else:
                if not accumulated_content:
                    accumulated_content = "Sorry, something went wrong. Please try again."
                    yield ("token", accumulated_content)
                messages.append({"role": "assistant", "content": accumulated_content})
                yield ("history", messages)
                return
