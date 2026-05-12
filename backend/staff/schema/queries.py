from typing import List

import strawberry
from strawberry.types import Info

from beautybook.permissions import require_auth, require_owner
from staff.models import User

from .types import UserType, user_to_type


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
