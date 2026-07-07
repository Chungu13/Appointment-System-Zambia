TOOLS = [
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
            "name": "get_best_staff",
            "description": (
                "Find the best available staff member for a service at a specific date and time, "
                "based on workload. Returns the staff member with the fewest booked hours today "
                "who is qualified and free at the requested slot."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "service_id": {
                        "type": "integer",
                        "description": "ID of the service.",
                    },
                    "date": {
                        "type": "string",
                        "description": "Date in YYYY-MM-DD format.",
                    },
                    "start_time": {
                        "type": "string",
                        "description": "Start time in HH:MM 24-hour format, e.g. '14:30'.",
                    },
                    "duration_minutes": {
                        "type": "integer",
                        "description": "Duration of the service in minutes, from the check_availability result.",
                    },
                },
                "required": ["service_id", "date", "start_time", "duration_minutes"],
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
                    "notification_phone": {
                        "type": "string",
                        "description": "Phone number for booking confirmation notifications. May differ from customer_phone/mobile_money_phone. Always pass this — set it to the customer's confirmed notification number from Step 2b.",
                    },
                    "notes": {"type": "string", "description": "Optional customer notes."},
                },
                "required": ["service_id", "staff_id", "starts_at", "customer_name", "customer_phone", "notification_phone"],
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
    {
        "type": "function",
        "function": {
            "name": "find_my_appointments",
            "description": "Look up the customer's upcoming confirmed or pending appointments.",
            "parameters": {
                "type": "object",
                "properties": {
                    "phone": {
                        "type": "string",
                        "description": "Customer's mobile number. Pass the number they provided in this conversation if you asked for it.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_appointment",
            "description": "Cancel one of the customer's appointments. Only call AFTER the customer explicitly confirms they want to cancel.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {
                        "type": "integer",
                        "description": "ID of the appointment to cancel, from find_my_appointments.",
                    },
                    "phone": {
                        "type": "string",
                        "description": "Customer's mobile number, as provided in this conversation.",
                    },
                    "reason": {
                        "type": "string",
                        "description": "Brief reason for cancellation (optional).",
                    },
                },
                "required": ["appointment_id", "phone"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "retry_payment",
            "description": "Re-send a Lipila mobile money payment prompt for an appointment whose previous payment was dismissed or failed.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {
                        "type": "integer",
                        "description": "ID of the appointment to retry payment for.",
                    },
                    "mobile_money_phone": {
                        "type": "string",
                        "description": "Customer's mobile money number. Use the same number as before unless they provide a different one.",
                    },
                },
                "required": ["appointment_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "reschedule_appointment",
            "description": "Move an appointment to a new date and time. Only call AFTER checking availability with check_availability and the customer confirms the new slot.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {
                        "type": "integer",
                        "description": "ID of the appointment to reschedule, from find_my_appointments.",
                    },
                    "new_date": {
                        "type": "string",
                        "description": "New date in YYYY-MM-DD format.",
                    },
                    "new_time": {
                        "type": "string",
                        "description": "New start time in HH:MM 24-hour format.",
                    },
                },
                "required": ["appointment_id", "new_date", "new_time"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "validate_phone_number",
            "description": "Check whether a phone number is a valid Zambian mobile money number. ALWAYS call this before telling a customer their number is invalid.",
            "parameters": {
                "type": "object",
                "properties": {
                    "phone": {
                        "type": "string",
                        "description": "The phone number exactly as entered by the customer.",
                    },
                },
                "required": ["phone"],
            },
        },
    },
]
