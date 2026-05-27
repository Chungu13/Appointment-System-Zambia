import datetime
from typing import List, Optional

import strawberry
from strawberry.types import Info

from services.models import Service
from tenants.schema import BusinessPoliciesType, _policies_from_db

from .types import CategoryEnum, ServiceType, service_to_type, PortfolioImageType, portfolio_image_to_type

_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


@strawberry.type
class OpeningHoursType:
    day_of_week: int
    day_name: str
    opens_at: Optional[datetime.time]
    closes_at: Optional[datetime.time]
    is_closed: bool


@strawberry.type
class BookableStaffType:
    id: int
    full_name: str
    avatar_url: str
    bio: str
    display_on_public_page: bool
    service_names: List[str]


@strawberry.type
class SalonProfileType:
    business_name: str
    business_type: str
    phone: str
    city: str
    area: str
    address: str
    cover_image_url: str
    services: List[ServiceType]
    opening_hours: List[OpeningHoursType]
    staff: List[BookableStaffType]
    staff_count: int
    portfolio_images: List[PortfolioImageType]
    business_policies: BusinessPoliciesType
    onboarding_completed: bool


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

    @strawberry.field
    def portfolio_images(self, info: Info) -> List[PortfolioImageType]:
        from services.models import PortfolioImage
        return [
            portfolio_image_to_type(img)
            for img in PortfolioImage.objects.filter(is_active=True).select_related("service")
        ]

    @strawberry.field
    def salon_profile(self, info: Info) -> SalonProfileType:
        from services.models import StaffService
        from staff.models import WorkingHours

        tenant = info.context.request.tenant
        services = [service_to_type(s) for s in Service.objects.filter(is_active=True)]

        # Aggregate across all staff: salon opens when any staff member is available
        opening_hours = []
        for day in range(7):
            timed_rows = WorkingHours.objects.filter(
                day_of_week=day,
                is_day_off=False,
                start_time__isnull=False,
                end_time__isnull=False,
            )
            if timed_rows.exists():
                opens = min(wh.start_time for wh in timed_rows)
                closes = max(wh.end_time for wh in timed_rows)
                opening_hours.append(OpeningHoursType(
                    day_of_week=day,
                    day_name=_DAY_NAMES[day],
                    opens_at=opens,
                    closes_at=closes,
                    is_closed=False,
                ))
            else:
                opening_hours.append(OpeningHoursType(
                    day_of_week=day,
                    day_name=_DAY_NAMES[day],
                    opens_at=None,
                    closes_at=None,
                    is_closed=True,
                ))

        # Bookable staff = users who have at least one service assigned
        bookable_qs = (
            StaffService.objects
            .select_related("staff", "service")
            .order_by("staff_id", "service__name")
        )
        staff_services_map: dict = {}
        for ss in bookable_qs:
            sid = ss.staff_id
            if sid not in staff_services_map:
                staff_services_map[sid] = {"user": ss.staff, "service_names": []}
            staff_services_map[sid]["service_names"].append(ss.service.name)

        staff_list = [
            BookableStaffType(
                id=sid,
                full_name=entry["user"].full_name,
                avatar_url=entry["user"].avatar_url or "",
                bio=getattr(entry["user"], "bio", "") or "",
                display_on_public_page=getattr(entry["user"], "display_on_public_page", False),
                service_names=entry["service_names"],
            )
            for sid, entry in staff_services_map.items()
        ]

        from services.models import PortfolioImage
        portfolio = [
            portfolio_image_to_type(img)
            for img in PortfolioImage.objects.filter(is_active=True).select_related("service")
        ]

        return SalonProfileType(
            business_name=tenant.business_name,
            business_type=tenant.business_type,
            phone=tenant.phone,
            city=tenant.city,
            area=tenant.area or "",
            address=tenant.address,
            cover_image_url=tenant.cover_image_url or "",
            services=services,
            opening_hours=opening_hours,
            staff=staff_list,
            staff_count=len(staff_list),
            portfolio_images=portfolio,
            business_policies=_policies_from_db(tenant.business_policies or {}),
            onboarding_completed=tenant.onboarding_completed,
        )
