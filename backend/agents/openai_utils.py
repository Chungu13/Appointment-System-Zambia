def message_to_dict(msg) -> dict:
    """Convert an OpenAI ChatCompletionMessage object to a plain dict for Redis serialisation."""
    result = {"role": msg.role}
    if msg.content is not None:
        result["content"] = msg.content
    if getattr(msg, "tool_calls", None):
        result["tool_calls"] = [
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
    return result
