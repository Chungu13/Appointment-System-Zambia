"""
Single source of truth for availability slot generation.

Both the GraphQL availability query and the BookingAgent's check_availability
tool call this function, guaranteeing they always agree.

Returns a list of plain dicts so callers are not coupled to GraphQL types:
  {
      "starts_at":        datetime (tz-aware),
      "ends_at":          datetime (tz-aware),
      "staff_obj":        staff.User model instance,
      "staff_id":         int,
      "staff_name":       str,
      "service_id":       int,
      "service_name":     str,
      "duration_minutes": int,
  }

Staff members with no WorkingHours row for the requested day are SKIPPED.
There is no 9am-5pm fallback.
"""

import datetime
from typing import Optional


def build_availability_slots(
    service_id: int,
    date: datetime.date,
    staff_id: Optional[int] = None,
) -> list[dict]:
    import zoneinfo
    from django.conf import settings
    from django.db import connection

    from bookings.models import Appointment
    from services.models import Service, StaffService
    from staff.models import WorkingHours
    from tenants.models import Tenant

    service = Service.objects.filter(pk=service_id, is_active=True).first()
    if not service:
        return []

    tz = zoneinfo.ZoneInfo(settings.TIME_ZONE)
    slot_duration = datetime.timedelta(minutes=service.duration_minutes + service.buffer_minutes)

    eligible_staff = StaffService.objects.filter(service=service).select_related("staff")
    if staff_id:
        eligible_staff = eligible_staff.filter(staff_id=staff_id)

    day_of_week = date.weekday()
    staff_objects = [ss.staff for ss in eligible_staff]

    wh_by_staff = {
        wh.staff_id: wh
        for wh in WorkingHours.objects.filter(
            staff__in=staff_objects, day_of_week=day_of_week
        )
    }

    staff_ids = [s.pk for s in staff_objects]
    booked_by_staff: dict[int, list] = {}
    for row in Appointment.objects.filter(
        staff_id__in=staff_ids,
        status__in=("confirmed", "in_progress"),
        starts_at__date=date,
    ).values("staff_id", "starts_at", "ends_at"):
        booked_by_staff.setdefault(row["staff_id"], []).append(
            (row["starts_at"], row["ends_at"])
        )

    now   = datetime.datetime.now(tz=tz)   # current time in Africa/Lusaka
    today = now.date()                      # today's date in CAT, not UTC server time
    earliest = (now + datetime.timedelta(minutes=30)) if date == today else None

    slots: list[dict] = []

    for ss in eligible_staff:
        wh = wh_by_staff.get(ss.staff_id)
        if not wh or wh.is_day_off or not wh.available_times:
            continue  # No times configured for this day — skip, no fallback

        booked = booked_by_staff.get(ss.staff_id, [])

        for time_str in wh.available_times:
            h, m = map(int, time_str.split(":"))
            cursor = datetime.datetime.combine(date, datetime.time(h, m), tzinfo=tz)
            slot_end = cursor + slot_duration
            if earliest is not None and cursor < earliest:
                continue
            if not any(
                not (slot_end <= b_start or cursor >= b_end)
                for b_start, b_end in booked
            ):
                slots.append({
                    "starts_at": cursor,
                    "ends_at": slot_end,
                    "staff_obj": ss.staff,
                    "staff_id": ss.staff_id,
                    "staff_name": ss.staff.full_name or ss.staff.username,
                    "service_id": service.pk,
                    "service_name": service.name,
                    "duration_minutes": service.duration_minutes,
                })

    return slots
