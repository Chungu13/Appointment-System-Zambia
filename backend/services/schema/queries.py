from typing import List, Optional

import strawberry
from strawberry.types import Info

from services.models import Service

from .types import CategoryEnum, ServiceType, service_to_type


@strawberry.type
class ServicesQuery:
    @strawberry.field
    def services(
        self,
        info: Info,
        category: Optional[CategoryEnum] = None,
        active_only: bool = True,
    ) -> List[ServiceType]:
        qs = Service.objects.all()
        if active_only:
            qs = qs.filter(is_active=True)
        if category is not None:
            qs = qs.filter(category=category.value)
        return [service_to_type(s) for s in qs]
