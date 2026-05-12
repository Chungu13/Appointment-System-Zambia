import datetime
import strawberry
from enum import Enum
from typing import Optional


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
    is_active: bool
    date_joined: datetime.datetime


@strawberry.type
class WorkingHoursType:
    id: int
    day_of_week: int
    day_name: str
    start_time: Optional[datetime.time]
    end_time: Optional[datetime.time]
    is_day_off: bool


def user_to_type(u) -> UserType:
    return UserType(
        id=u.pk,
        username=u.username,
        full_name=u.full_name,
        email=u.email,
        phone=u.phone,
        role=RoleEnum(u.role),
        avatar_url=u.avatar_url,
        is_active=u.is_active,
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
