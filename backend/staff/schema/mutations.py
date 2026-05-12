import strawberry

from staff.schema.types import UserType, user_to_type


@strawberry.type
class AuthPayload:
    access_token: str
    refresh_token: str
    user: UserType


@strawberry.type
class StaffMutation:
    @strawberry.mutation
    def login(self, username: str, password: str) -> AuthPayload:
        from django.contrib.auth import authenticate

        from beautybook.jwt_auth import make_access_token, make_refresh_token

        user = authenticate(username=username, password=password)
        if not user or not user.is_active:
            raise ValueError("Invalid credentials.")

        return AuthPayload(
            access_token=make_access_token(user.pk),
            refresh_token=make_refresh_token(user.pk),
            user=user_to_type(user),
        )

    @strawberry.mutation
    def refresh_token(self, refresh_token: str) -> AuthPayload:
        import jwt as pyjwt

        from beautybook.jwt_auth import decode_token, make_access_token, make_refresh_token
        from staff.models import User

        try:
            payload = decode_token(refresh_token, "refresh")
        except pyjwt.ExpiredSignatureError:
            raise ValueError("Refresh token has expired. Please log in again.")
        except pyjwt.InvalidTokenError as exc:
            raise ValueError(f"Invalid refresh token: {exc}")

        user = User.objects.filter(pk=payload["user_id"], is_active=True).first()
        if not user:
            raise ValueError("User not found.")

        return AuthPayload(
            access_token=make_access_token(user.pk),
            refresh_token=make_refresh_token(user.pk),
            user=user_to_type(user),
        )
