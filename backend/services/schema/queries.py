import datetime
from typing import List, Optional

import strawberry
from strawberry.types import Info
from django.db.models import Case, IntegerField, Value, When

from services.models import Service
from tenants.schema import BusinessPoliciesType, _policies_from_db

from .types import ServiceType, service_to_type, PortfolioImageType, portfolio_image_to_type

_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


def _public_active_services():
    """
    Active services in the order the business entered them (creation order),
    with any "Extras" category always sorted to the bottom regardless of
    when it was added. Used for the customer-facing service listing.
    """
    return (
        Service.objects.filter(is_active=True)
        .annotate(_extras_last=Case(
            When(category__iexact="extras", then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        ))
        .order_by("_extras_last", "id")
    )


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
    portfolio_preview_url: str
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
        category: Optional[str] = None,
        active_only: bool = True,
    ) -> List[ServiceType]:
        from beautybook.cache_utils import get_cached_services, set_cached_services
        # Cache the default case (active, no category filter) used by the booking chat
        if active_only and category is None:
            schema_name = info.context.request.tenant.schema_name
            cached = get_cached_services(schema_name)
            if cached is not None:
                return cached
            result = [service_to_type(s) for s in _public_active_services()]
            set_cached_services(schema_name, result)
            return result
        qs = Service.objects.all()
        if active_only:
            qs = qs.filter(is_active=True)
        if category is not None:
            qs = qs.filter(category=category)
        return [service_to_type(s) for s in qs]

    @strawberry.field
    def portfolio_images(self, info: Info) -> List[PortfolioImageType]:
        from beautybook.cache_utils import get_cached_portfolio, set_cached_portfolio
        from services.models import PortfolioImage

        schema_name = info.context.request.tenant.schema_name
        cached = get_cached_portfolio(schema_name)
        if cached is not None:
            return cached
        result = [
            portfolio_image_to_type(img)
            for img in PortfolioImage.objects.filter(is_active=True).select_related("service")
        ]
        set_cached_portfolio(schema_name, result)
        return result

    @strawberry.field
    def salon_profile(self, info: Info) -> SalonProfileType:
        from django.db import connection
        from tenants.models import Tenant
        from services.models import StaffService
        from staff.models import WorkingHours
        from beautybook.cache_utils import (
            get_cached_services, set_cached_services,
            get_cached_hours, set_cached_hours,
        )

        # Re-fetch the tenant from the DB using the schema that the middleware
        # set on the connection. This avoids acting on a stale request.tenant
        # object that could carry is_approved=False from an earlier state even
        # after the admin has approved the tenant.
        schema_name = connection.schema_name
        try:
            tenant = Tenant.objects.get(schema_name=schema_name)
        except Tenant.DoesNotExist:
            raise ValueError("SALON_NOT_FOUND")

        if not tenant.is_approved:
            raise ValueError("SALON_NOT_APPROVED")

        # Services — serve from cache when possible
        services = get_cached_services(schema_name)
        if services is None:
            services = [service_to_type(s) for s in _public_active_services()]
            set_cached_services(schema_name, services)

        # Opening hours — the span of times any staff member offers that day,
        # i.e. earliest offered start through latest offered start. Cached 1 hour.
        opening_hours = get_cached_hours(schema_name)
        if opening_hours is None:
            times_by_day: dict[int, list[datetime.time]] = {}
            for day, times in WorkingHours.objects.filter(is_day_off=False).values_list(
                "day_of_week", "available_times"
            ):
                for time_str in times or []:
                    try:
                        h, m = (int(part) for part in time_str.split(":")[:2])
                    except (ValueError, AttributeError):
                        continue  # Ignore malformed entries rather than break the storefront
                    times_by_day.setdefault(day, []).append(datetime.time(h, m))

            opening_hours = []
            for day in range(7):
                offered = times_by_day.get(day)
                opening_hours.append(OpeningHoursType(
                    day_of_week=day,
                    day_name=_DAY_NAMES[day],
                    opens_at=min(offered) if offered else None,
                    closes_at=max(offered) if offered else None,
                    is_closed=not offered,
                ))
            set_cached_hours(schema_name, opening_hours)

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
            if getattr(entry["user"], "display_on_public_page", False)
        ]

        from beautybook.cache_utils import get_cached_portfolio, set_cached_portfolio
        from services.models import PortfolioImage

        portfolio = get_cached_portfolio(schema_name)
        if portfolio is None:
            portfolio = [
                portfolio_image_to_type(img)
                for img in PortfolioImage.objects.filter(is_active=True).select_related("service")
            ]
            set_cached_portfolio(schema_name, portfolio)

        return SalonProfileType(
            business_name=tenant.business_name,
            business_type=tenant.business_type,
            phone=tenant.phone,
            city=tenant.city,
            area=tenant.area or "",
            address=tenant.address,
            cover_image_url=tenant.cover_image_url or "",
            portfolio_preview_url=tenant.portfolio_preview_url or "",
            services=services,
            opening_hours=opening_hours,
            staff=staff_list,
            staff_count=len(staff_list),
            portfolio_images=portfolio,
            business_policies=_policies_from_db(tenant.business_policies or {}),
            onboarding_completed=tenant.onboarding_completed,
        )
