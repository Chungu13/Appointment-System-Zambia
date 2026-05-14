import datetime
from typing import List, Optional

import strawberry
from strawberry.types import Info

from services.models import Service

from .types import CategoryEnum, ServiceType, service_to_type

_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


@strawberry.type
class OpeningHoursType:
    day_of_week: int
    day_name: str
    opens_at: Optional[datetime.time]
    closes_at: Optional[datetime.time]
    is_closed: bool


@strawberry.type
class SalonProfileType:
    business_name: str
    business_type: str
    phone: str
    city: str
    address: str
    services: List[ServiceType]
    opening_hours: List[OpeningHoursType]


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
    def salon_profile(self, info: Info) -> SalonProfileType:
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

        return SalonProfileType(
            business_name=tenant.business_name,
            business_type=tenant.business_type,
            phone=tenant.phone,
            city=tenant.city,
            address=tenant.address,
            services=services,
            opening_hours=opening_hours,
        )
