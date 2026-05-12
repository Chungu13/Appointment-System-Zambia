from typing import Optional

import strawberry
from strawberry.types import Info

from beautybook.permissions import require_owner
from services.models import Service

from .types import ServiceType, service_to_type


@strawberry.type
class ServicesMutation:
    @strawberry.mutation
    def create_service(
        self,
        info: Info,
        name: str,
        category: str,
        duration_minutes: int,
        price_zmw: float,
        description: str = "",
        deposit_zmw: float = 0,
        buffer_minutes: int = 0,
    ) -> ServiceType:
        require_owner(info)
        service = Service.objects.create(
            name=name,
            category=category,
            description=description,
            duration_minutes=duration_minutes,
            price_zmw=price_zmw,
            deposit_zmw=deposit_zmw,
            buffer_minutes=buffer_minutes,
        )
        return service_to_type(service)

    @strawberry.mutation
    def update_service(
        self,
        info: Info,
        id: int,
        name: Optional[str] = None,
        category: Optional[str] = None,
        description: Optional[str] = None,
        duration_minutes: Optional[int] = None,
        price_zmw: Optional[float] = None,
        deposit_zmw: Optional[float] = None,
        buffer_minutes: Optional[int] = None,
    ) -> ServiceType:
        require_owner(info)
        service = Service.objects.filter(pk=id).first()
        if not service:
            raise ValueError("Service not found.")

        update_fields = []
        if name is not None:
            service.name = name
            update_fields.append("name")
        if category is not None:
            service.category = category
            update_fields.append("category")
        if description is not None:
            service.description = description
            update_fields.append("description")
        if duration_minutes is not None:
            service.duration_minutes = duration_minutes
            update_fields.append("duration_minutes")
        if price_zmw is not None:
            service.price_zmw = price_zmw
            update_fields.append("price_zmw")
        if deposit_zmw is not None:
            service.deposit_zmw = deposit_zmw
            update_fields.append("deposit_zmw")
        if buffer_minutes is not None:
            service.buffer_minutes = buffer_minutes
            update_fields.append("buffer_minutes")

        if update_fields:
            update_fields.append("updated_at")
            service.save(update_fields=update_fields)

        return service_to_type(service)

    @strawberry.mutation
    def toggle_service(self, info: Info, id: int) -> ServiceType:
        require_owner(info)
        service = Service.objects.filter(pk=id).first()
        if not service:
            raise ValueError("Service not found.")
        service.is_active = not service.is_active
        service.save(update_fields=["is_active", "updated_at"])
        return service_to_type(service)
