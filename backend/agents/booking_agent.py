# Moved to agents/booking/ package.
# This shim preserves backward compatibility during the transition.
from agents.booking import BookingAgent, load_history, save_history, inject_system_message

__all__ = ["BookingAgent", "load_history", "save_history", "inject_system_message"]
