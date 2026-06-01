import datetime
import strawberry
from enum import Enum
from typing import List, Optional


@strawberry.enum
class RoleEnum(Enum):
    OWNER = "owner"
    STAFF = "staff"


@strawberry.type
class UserType:
    id: int
    username: str
    full_name: str
    email: str
    phone: str
    role: RoleEnum
    avatar_url: str
    bio: str
    display_on_public_page: bool
    is_active: bool
    is_also_staff: bool
    date_joined: datetime.datetime


@strawberry.type
class WorkingHoursType:
    id: int
    day_of_week: int
    day_name: str
    start_time: Optional[datetime.time]
    end_time: Optional[datetime.time]
    is_day_off: bool


@strawberry.type
class StaffDetailType:
    id: int
    username: str
    full_name: str
    email: str
    phone: str
    role: RoleEnum
    avatar_url: str
    bio: str
    display_on_public_page: bool
    is_active: bool
    is_also_staff: bool
    date_joined: datetime.datetime
    working_hours: List[WorkingHoursType]
    assigned_service_ids: List[int]


def user_to_type(u) -> UserType:
    try:
        role = RoleEnum(u.role)
    except (ValueError, KeyError, TypeError):
        role = RoleEnum("staff")
    return UserType(
        id=u.pk,
        username=u.username,
        full_name=u.full_name,
        email=u.email,
        phone=u.phone,
        role=role,
        avatar_url=u.avatar_url or "",
        bio=getattr(u, "bio", "") or "",
        display_on_public_page=getattr(u, "display_on_public_page", False),
        is_active=u.is_active,
        is_also_staff=getattr(u, "is_also_staff", False),
        date_joined=u.date_joined,
    )


def working_hours_to_type(wh) -> WorkingHoursType:
    return WorkingHoursType(
        id=wh.pk,
        day_of_week=wh.day_of_week,
        day_name=wh.get_day_of_week_display(),
        start_time=wh.start_time,
        end_time=wh.end_time,
        is_day_off=wh.is_day_off,
    )


def staff_detail_to_type(u) -> StaffDetailType:
    from services.models import StaffService

    wh_qs = u.working_hours.order_by("day_of_week")
    service_ids = list(
        StaffService.objects.filter(staff=u).values_list("service_id", flat=True)
    )
    try:
        role = RoleEnum(u.role)
    except (ValueError, KeyError, TypeError):
        role = RoleEnum("staff")
    return StaffDetailType(
        id=u.pk,
        username=u.username,
        full_name=u.full_name,
        email=u.email,
        phone=u.phone,
        role=role,
        avatar_url=u.avatar_url or "",
        bio=getattr(u, "bio", "") or "",
        display_on_public_page=getattr(u, "display_on_public_page", False),
        is_active=u.is_active,
        is_also_staff=getattr(u, "is_also_staff", False),
        date_joined=u.date_joined,
        working_hours=[working_hours_to_type(wh) for wh in wh_qs],
        assigned_service_ids=service_ids,
    )
