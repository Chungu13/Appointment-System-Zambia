from typing import List, Optional

import strawberry
from strawberry.types import Info

from beautybook.permissions import require_auth, require_owner
from staff.models import User

from .types import (
    PublicStaffType,
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
