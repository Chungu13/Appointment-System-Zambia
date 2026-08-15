import datetime
from typing import List, Optional

import strawberry
from strawberry.types import Info

from beautybook.permissions import require_auth, require_owner
from staff.models import User

from .types import (
    PublicStaffType,
    StaffDetailType,
    StaffTimeSlotType,
    UserType,
    WorkingHoursType,
    staff_detail_to_type,
    user_to_type,
    working_hours_to_type,
)


@strawberry.type
class StaffQuery:
    @strawberry.field
    def my_profile(self, info: Info) -> UserType:
        user = require_auth(info)
        return user_to_type(user)

    @strawberry.field
    def public_staff(self, info: Info) -> List[PublicStaffType]:
        """Active staff shown on public page — no auth required."""
        users = User.objects.filter(
            is_active=True, display_on_public_page=True
        ).order_by("full_name")
        return [
            PublicStaffType(id=u.pk, full_name=u.full_name, avatar_url=u.avatar_url or "")
            for u in users
        ]

    @strawberry.field
    def staff_list(self, info: Info) -> List[StaffDetailType]:
        require_owner(info)
        from beautybook.cache_utils import get_cached_staff, set_cached_staff
        schema_name = info.context.request.tenant.schema_name
        cached = get_cached_staff(schema_name)
        if cached is not None:
            return cached
        users = User.objects.filter(is_active=True).prefetch_related(
            "working_hours", "staff_services"
        )
        result = [staff_detail_to_type(u) for u in users]
        set_cached_staff(schema_name, result)
        return result

    @strawberry.field
    def working_hours(self, info: Info, staff_id: Optional[int] = None) -> List[WorkingHoursType]:
        from staff.models import WorkingHours
        user = require_auth(info)
        target_id = staff_id if (staff_id and user.role == "owner") else user.pk
        qs = WorkingHours.objects.filter(staff_id=target_id).order_by("day_of_week")
        return [working_hours_to_type(wh) for wh in qs]

    @strawberry.field
    def staff_day_slots(self, info: Info, staff_id: int, date: datetime.date) -> List[StaffTimeSlotType]:
        """
        The exact times this staff member offers on `date` — the list the owner
        picked in the Hours tab — each flagged booked/free against their real
        appointments, for the owner's "Available Times" view. Unlike
        bookings.availability.build_availability_slots, this isn't scoped to
        one service (no duration/buffer filtering) — it's a raw look at the
        whole day.
        """
        require_owner(info)
        import zoneinfo
        from django.conf import settings

        from bookings.models import Appointment
        from staff.models import WorkingHours

        wh = WorkingHours.objects.filter(staff_id=staff_id, day_of_week=date.weekday()).first()
        if not wh or wh.is_day_off or not wh.available_times:
            return []

        tz = zoneinfo.ZoneInfo(settings.TIME_ZONE)

        booked = list(
            Appointment.objects.filter(
                staff_id=staff_id,
                starts_at__date=date,
                status__in=[
                    Appointment.STATUS_CONFIRMED,
                    Appointment.STATUS_IN_PROGRESS,
                    Appointment.STATUS_PENDING,
                ],
            ).values_list("starts_at", "ends_at")
        )

        starts: list[datetime.datetime] = []
        for time_str in sorted(wh.available_times):
            try:
                h, m = (int(part) for part in time_str.split(":")[:2])
            except (ValueError, AttributeError):
                continue  # Skip anything malformed rather than 500 the whole view
            starts.append(datetime.datetime.combine(date, datetime.time(h, m), tzinfo=tz))

        slots: List[StaffTimeSlotType] = []
        for i, cursor in enumerate(starts):
            # Display-only end: run to the next offered time, or 30 min for the last.
            slot_end = starts[i + 1] if i + 1 < len(starts) else cursor + datetime.timedelta(minutes=30)
            # A start time is taken when an appointment is already covering it.
            is_booked = any(b_start <= cursor < b_end for b_start, b_end in booked)
            slots.append(StaffTimeSlotType(starts_at=cursor, ends_at=slot_end, is_booked=is_booked))

        return slots
