from typing import List, Optional

import strawberry
from strawberry.types import Info

from beautybook.permissions import require_auth, require_owner
from staff.models import User

from .types import (
    StaffDetailType,
    UserType,
    WorkingHoursType,
    staff_detail_to_type,
    user_to_type,
    working_hours_to_type,
)


@strawberry.type
class StaffQuery:
    @strawberry.field
    def debug_working_hours(self, info: Info) -> str:
        from staff.models import WorkingHours
        import json
        rows = WorkingHours.objects.all().values(
            'staff_id', 'staff__full_name', 'day_of_week',
            'start_time', 'end_time', 'is_day_off'
        )
        return json.dumps([
            {
                'staff': r['staff__full_name'],
                'day': r['day_of_week'],
                'start': str(r['start_time']),
                'end': str(r['end_time']),
                'off': r['is_day_off']
            }
            for r in rows
        ], indent=2)

    @strawberry.field
    def my_profile(self, info: Info) -> UserType:
        user = require_auth(info)
        return user_to_type(user)

    @strawberry.field
    def staff_list(self, info: Info) -> List[StaffDetailType]:
        require_owner(info)
        users = User.objects.filter(is_active=True).prefetch_related(
            "working_hours", "staff_services"
        )
        return [staff_detail_to_type(u) for u in users]

    @strawberry.field
    def working_hours(self, info: Info, staff_id: Optional[int] = None) -> List[WorkingHoursType]:
        from staff.models import WorkingHours
        user = require_auth(info)
        target_id = staff_id if (staff_id and user.role == "owner") else user.pk
        qs = WorkingHours.objects.filter(staff_id=target_id).order_by("day_of_week")
        return [working_hours_to_type(wh) for wh in qs]
