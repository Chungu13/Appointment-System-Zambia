import strawberry
from strawberry.tools import merge_types

from agents.schema import AgentsMutation
from bookings.schema import BookingsMutation, BookingsQuery
from payments.schema import PaymentsMutation, PaymentsQuery
from services.schema import ServicesMutation, ServicesQuery
from staff.schema import StaffMutation, StaffQuery
from tenants.schema import TenantMutation, TenantQuery

Query = merge_types(
    "Query",
    (BookingsQuery, ServicesQuery, StaffQuery, PaymentsQuery, TenantQuery),
)

Mutation = merge_types(
    "Mutation",
    (BookingsMutation, ServicesMutation, StaffMutation, PaymentsMutation, AgentsMutation, TenantMutation),
)

schema = strawberry.Schema(query=Query, mutation=Mutation)
