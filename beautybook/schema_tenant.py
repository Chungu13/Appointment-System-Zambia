import strawberry
from strawberry.tools import merge_types

from agents.schema import AgentsMutation, AgentsQuery
from bookings.schema import BookingsMutation, BookingsQuery
from payments.schema import PaymentsMutation, PaymentsQuery
from services.schema import ServicesMutation, ServicesQuery
from staff.schema import StaffMutation, StaffQuery

Query = merge_types(
    "Query",
    (BookingsQuery, ServicesQuery, StaffQuery, PaymentsQuery, AgentsQuery),
)

Mutation = merge_types(
    "Mutation",
    (BookingsMutation, ServicesMutation, StaffMutation, PaymentsMutation, AgentsMutation),
)

schema = strawberry.Schema(query=Query, mutation=Mutation)
