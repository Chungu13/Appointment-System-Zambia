TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_addons",
            "description": "List add-on services available to pair with a primary booking. Returns only active services with no deposit (deposit_zmw = 0), excluding the main service.",
            "parameters": {
                "type": "object",
                "properties": {
                    "main_service_id": {
                        "type": "integer",
                        "description": "ID of the primary service being booked. This service is excluded from results.",
                    },
                },
                "required": ["main_service_id"],
            },
        },
    },
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
            "name": "get_staff_for_service",
            "description": "List staff members qualified to perform a service.",
            "parameters": {
                "type": "object",
                "properties": {
                    "service_id": {"type": "integer", "description": "ID of the service."},
                },
                "required": ["service_id"],
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
                        "description": "Phone number for booking confirmation and reminder notifications. May differ from customer_phone/mobile_money_phone. Always pass this — set it to the customer's confirmed notification number from Step 2b.",
                    },
                    "notes": {"type": "string", "description": "Optional customer notes."},
                    "addon_service_ids": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "IDs of add-on services to include. Pass [] if none were selected.",
                    },
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
                "properties": {},
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
                    "reason": {
                        "type": "string",
                        "description": "Brief reason for cancellation (optional).",
                    },
                },
                "required": ["appointment_id"],
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
]
