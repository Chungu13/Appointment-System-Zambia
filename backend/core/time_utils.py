import zoneinfo

LUSAKA_TZ = zoneinfo.ZoneInfo("Africa/Lusaka")


def fmt_time_cat(dt) -> str:
    """Format a datetime as 12-hour time in Central Africa Time, e.g. '9:00 AM'."""
    return dt.astimezone(LUSAKA_TZ).strftime("%I:%M %p").lstrip("0")


def fmt_date_cat(dt) -> str:
    """Format a datetime as 'Tuesday, 24 June 2026' in Central Africa Time."""
    return dt.astimezone(LUSAKA_TZ).strftime("%A, %d %B %Y")


def fmt_ordinal_date(d) -> str:
    """Format a date object with an ordinal suffix, e.g. '24th June 2026'."""
    day = d.day
    suffix = "th" if 11 <= day % 100 <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(day % 10, "th")
    return f"{day}{suffix} {d.strftime('%B %Y')}"
