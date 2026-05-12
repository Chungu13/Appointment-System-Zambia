import strawberry


@strawberry.type
class AgentsQuery:
    @strawberry.field
    def agents_ping(self) -> str:
        return "ok"
