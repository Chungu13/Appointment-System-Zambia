from typing import List, Optional

import strawberry
from strawberry.types import Info

from beautybook.permissions import require_auth, require_owner
from staff.models import User

from .types import UserType, WorkingHoursType, user_to_type, working_hours_to_type


@strawberry.type
class StaffQuery:
    @strawberry.field
    def my_profile(self, info: Info) -> UserType:
        user = require_auth(info)
        return user_to_type(user)

    @strawberry.field
    def staff_list(self, info: Info) -> List[UserType]:
        require_owner(info)
        return [user_to_type(u) for u in User.objects.filter(is_active=True)]

    @strawberry.field
    def working_hours(self, info: Info, staff_id: Optional[int] = None) -> List[WorkingHoursType]:
        from staff.models import WorkingHours
        user = require_auth(info)
        target_id = staff_id if (staff_id and user.role == "owner") else user.pk
        qs = WorkingHours.objects.filter(staff_id=target_id).order_by("day_of_week")
        return [working_hours_to_type(wh) for wh in qs]
