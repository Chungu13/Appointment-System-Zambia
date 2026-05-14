from typing import List, Optional
import strawberry


@strawberry.type
class SalonType:
    id: int
    business_name: str
    business_type: str
    subdomain: str
    phone: str
    city: str
    address: str
    is_active: bool


@strawberry.type
class Query:
    @strawberry.field
    def health(self) -> str:
        return "ok"

    @strawberry.field
    def salons(
        self,
        city: Optional[str] = None,
        business_type: Optional[str] = None,
    ) -> List[SalonType]:
        from tenants.models import Tenant

        qs = Tenant.objects.filter(is_active=True).exclude(schema_name="public")
        if city:
            qs = qs.filter(city__iexact=city)
        if business_type:
            qs = qs.filter(business_type=business_type)

        return [
            SalonType(
                id=t.pk,
                business_name=t.business_name,
                business_type=t.business_type,
                subdomain=t.subdomain,
                phone=t.phone,
                city=t.city,
                address=t.address,
                is_active=t.is_active,
            )
            for t in qs
        ]


schema = strawberry.Schema(query=Query)
