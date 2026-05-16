from typing import List, Optional

import strawberry
from strawberry.types import Info

from django.db.models import Max

from beautybook.permissions import require_owner
from services.models import Service, PortfolioImage

from .types import ServiceType, service_to_type, PortfolioImageType, portfolio_image_to_type


def _sync_portfolio_preview(info):
    """Update tenant.portfolio_preview_url with the first active image URL."""
    tenant = info.context.request.tenant
    first = PortfolioImage.objects.filter(is_active=True).order_by("display_order", "created_at").first()
    tenant.portfolio_preview_url = first.image_url if first else ""
    tenant.save(update_fields=["portfolio_preview_url", "updated_at"])


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

    @strawberry.mutation
    def add_portfolio_image(
        self,
        info: Info,
        image_url: str,
        caption: str = "",
        service_id: Optional[int] = None,
    ) -> PortfolioImageType:
        require_owner(info)
        if not image_url.strip():
            raise ValueError("Image URL is required.")
        next_order = (PortfolioImage.objects.aggregate(m=Max("display_order"))["m"] or 0) + 1
        img = PortfolioImage.objects.create(
            image_url=image_url.strip(),
            caption=caption.strip(),
            service_id=service_id,
            display_order=next_order,
        )
        _sync_portfolio_preview(info)
        return portfolio_image_to_type(img)

    @strawberry.mutation
    def delete_portfolio_image(self, info: Info, id: strawberry.ID) -> bool:
        require_owner(info)
        deleted, _ = PortfolioImage.objects.filter(pk=str(id)).delete()
        if deleted:
            _sync_portfolio_preview(info)
        return deleted > 0

    @strawberry.mutation
    def reorder_portfolio_images(self, info: Info, ids: List[strawberry.ID]) -> bool:
        require_owner(info)
        for order, raw_id in enumerate(ids):
            PortfolioImage.objects.filter(pk=str(raw_id)).update(display_order=order)
        return True
