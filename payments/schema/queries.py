import strawberry


@strawberry.type
class PaymentsQuery:
    @strawberry.field
    def payments_ping(self) -> str:
        return "ok"
