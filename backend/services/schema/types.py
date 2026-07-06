from typing import Optional

import strawberry


@strawberry.type
class ServiceType:
    id: int
    name: str
    category: str
    description: str
    duration_minutes: int
    price_zmw: float
    price_max_zmw: Optional[float]
    deposit_zmw: float
    buffer_minutes: int
    requires_reference_picture: bool
    is_active: bool


@strawberry.type
class StaffServiceType:
    id: int
    staff_id: int
    staff_name: str
    service: ServiceType


def service_to_type(s) -> ServiceType:
    return ServiceType(
        id=s.pk,
        name=s.name,
        category=s.category or "",
        description=s.description,
        duration_minutes=s.duration_minutes,
        price_zmw=float(s.price_zmw),
        price_max_zmw=float(s.price_max_zmw) if s.price_max_zmw is not None else None,
        deposit_zmw=float(s.deposit_zmw),
        buffer_minutes=s.buffer_minutes,
        requires_reference_picture=s.requires_reference_picture,
        is_active=s.is_active,
    )


@strawberry.type
class PortfolioImageType:
    id: strawberry.ID
    image_url: str
    caption: str
    service_id: Optional[int]
    service_name: str
    display_order: int
    is_active: bool


def portfolio_image_to_type(img) -> PortfolioImageType:
    return PortfolioImageType(
        id=str(img.pk),
        image_url=img.image_url,
        caption=img.caption,
        service_id=img.service_id,
        service_name=img.service.name if img.service_id else "",
        display_order=img.display_order,
        is_active=img.is_active,
    )


def staff_service_to_type(ss) -> StaffServiceType:
    return StaffServiceType(
        id=ss.pk,
        staff_id=ss.staff_id,
        staff_name=ss.staff.full_name,
        service=service_to_type(ss.service),
    )
