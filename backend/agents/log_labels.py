_TOOL_LABELS = {
    # Booking
    "get_services":            "Looked up available services",
    "check_availability":      "Checked calendar availability",
    "create_booking":          "Created a new booking",
    "get_booking":             "Retrieved booking details",
    "cancel_booking":          "Cancelled an appointment",
    "reschedule_booking":      "Rescheduled an appointment",
    "get_staff":               "Looked up staff members",
    "add_to_waitlist":         "Added customer to waitlist",
    "notify_waitlist":         "Notified waitlist customers about an opening",
    "send_booking_confirmation": "Sent booking confirmation to customer",
    # Payments
    "get_unpaid_bookings":     "Checked for unpaid deposits",
    "send_payment_reminder":   "Sent payment reminder to customer",
    "initiate_payment":        "Initiated payment process",
    "confirm_payment":         "Confirmed payment received",
    "process_refund":          "Processed a refund",
    "get_payment_status":      "Checked payment status",
    # Scheduling
    "send_appointment_reminders": "Sent appointment reminders",
    "send_reminder":           "Sent appointment reminder to customer",
    "notify_customer":         "Notified customer about their appointment",
    "mark_no_show":            "Marked appointment as no-show",
    "get_todays_appointments": "Checked today's schedule",
    "get_appointments":        "Retrieved appointment list",
    "get_upcoming_appointments": "Checked upcoming appointments",
    # Insights
    "get_revenue_stats":       "Analysed revenue statistics",
    "get_booking_stats":       "Analysed booking trends",
    "get_customer_stats":      "Reviewed customer activity",
    "get_top_services":        "Identified top-performing services",
    "get_slow_periods":        "Identified quiet periods in schedule",
    "generate_campaign":       "Generated a marketing campaign suggestion",
}


def friendly_tool_label(tool_name: str) -> str:
    return _TOOL_LABELS.get(tool_name) or tool_name.replace("_", " ").capitalize()
