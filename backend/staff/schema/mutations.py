import datetime
from typing import Optional

import strawberry

from staff.schema.types import UserType, WorkingHoursType, user_to_type, working_hours_to_type


@strawberry.type
class AuthPayload:
    access_token: str
    refresh_token: str
    user: UserType


@strawberry.type
class StaffMutation:
    # ── Standard owner login (email + password) ───────────────────────────────
    @strawberry.mutation
    def login(self, email: str, password: str) -> AuthPayload:
        from beautybook.jwt_auth import make_access_token, make_refresh_token
        from staff.models import User

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            raise ValueError("Invalid credentials.")
        if not user.check_password(password):
            raise ValueError("Invalid credentials.")
        return AuthPayload(
            access_token=make_access_token(user.pk, user.role),
            refresh_token=make_refresh_token(user.pk),
            user=user_to_type(user),
        )

    # ── PIN login — works for staff AND owners who have a PIN ─────────────────
    @strawberry.mutation
    def login_with_pin(self, phone: str, pin: str) -> AuthPayload:
        from django.contrib.auth.hashers import check_password
        from beautybook.jwt_auth import make_access_token, make_refresh_token
        from staff.models import User

        user = User.objects.filter(phone=phone, is_active=True).first()
        if not user or not user.pin_hash:
            raise ValueError("Invalid phone or PIN.")
        if not check_password(pin, user.pin_hash):
            raise ValueError("Invalid phone or PIN.")
        return AuthPayload(
            access_token=make_access_token(user.pk, user.role),
            refresh_token=make_refresh_token(user.pk),
            user=user_to_type(user),
        )

    # ── Token refresh ─────────────────────────────────────────────────────────
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
            access_token=make_access_token(user.pk, user.role),
            refresh_token=make_refresh_token(user.pk),
            user=user_to_type(user),
        )

    # ── Self-service: update own profile (any authenticated user) ───────────
    @strawberry.mutation
    def update_my_profile(
        self,
        info: strawberry.types.Info,
        full_name: Optional[str] = None,
        phone: Optional[str] = None,
        avatar_url: Optional[str] = None,
    ) -> UserType:
        from beautybook.permissions import require_auth
        user = require_auth(info)
        fields = ["updated_at"]
        if full_name is not None:
            user.full_name = full_name.strip()
            fields.append("full_name")
        if phone is not None:
            user.phone = phone.strip()
            fields.append("phone")
        if avatar_url is not None:
            from beautybook.storage import save_image_from_base64
            tenant_schema = info.context.request.tenant.schema_name
            user.avatar_url = save_image_from_base64(avatar_url.strip(), "avatars", tenant_schema)
            fields.append("avatar_url")
        user.save(update_fields=fields)
        return user_to_type(user)

    # ── Self-service: change own password (any authenticated user) ───────────
    @strawberry.mutation
    def change_password(
        self,
        info: strawberry.types.Info,
        current_password: str,
        new_password: str,
    ) -> bool:
        from beautybook.permissions import require_auth
        user = require_auth(info)
        if not user.check_password(current_password):
            raise ValueError("Current password is incorrect.")
        if len(new_password) < 8:
            raise ValueError("New password must be at least 8 characters.")
        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])
        return True

    # ── Owner: create staff account (or mark self as also-staff) ─────────────
    @strawberry.mutation
    def create_staff(
        self,
        info: strawberry.types.Info,
        full_name: str = "",
        phone: str = "",
        username: str = "",
        email: str = "",
        pin: Optional[str] = None,
        is_me: bool = False,
    ) -> UserType:
        from django.contrib.auth.hashers import make_password
        from beautybook.permissions import require_owner
        from staff.models import User

        owner = require_owner(info)

        if is_me:
            # Owner is also the one doing the work — mark their own account
            fields = ["is_also_staff", "updated_at"]
            owner.is_also_staff = True
            if pin:
                owner.pin_hash = make_password(pin)
                fields.append("pin_hash")
            owner.save(update_fields=fields)
            return user_to_type(owner)

        # Normal flow — create a separate staff account
        if not full_name or not phone or not username:
            raise ValueError("fullName, phone, and username are required.")

        # Idempotent: if a staff member with this full_name already exists, update and return them
        existing = User.objects.filter(full_name=full_name).first()
        if existing:
            update_fields = ["phone", "email", "updated_at"]
            existing.phone = phone
            existing.email = email
            if pin:
                existing.pin_hash = make_password(pin)
                update_fields.append("pin_hash")
            existing.save(update_fields=update_fields)
            return user_to_type(existing)

        if User.objects.filter(username=username).exists():
            raise ValueError("Username already taken.")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=None,
            full_name=full_name,
            phone=phone,
            role="staff",
        )
        if pin:
            user.pin_hash = make_password(pin)
            user.save(update_fields=["pin_hash"])
        return user_to_type(user)

    # ── Owner: set or reset PIN (works for any user including owner) ──────────
    @strawberry.mutation
    def set_staff_pin(
        self,
        info: strawberry.types.Info,
        staff_id: int,
        pin: str,
    ) -> UserType:
        from django.contrib.auth.hashers import make_password
        from beautybook.permissions import require_owner
        from staff.models import User

        require_owner(info)
        if len(pin) != 4 or not pin.isdigit():
            raise ValueError("PIN must be exactly 4 digits.")
        user = User.objects.filter(pk=staff_id, is_active=True).first()
        if not user:
            raise ValueError("Staff member not found.")
        user.pin_hash = make_password(pin)
        user.save(update_fields=["pin_hash", "updated_at"])
        return user_to_type(user)

    # ── Owner: set working hours for one day ──────────────────────────────────
    @strawberry.mutation
    def set_working_hours(
        self,
        info: strawberry.types.Info,
        staff_id: int,
        day_of_week: int,
        is_day_off: bool = False,
        start_time: Optional[datetime.time] = None,
        end_time: Optional[datetime.time] = None,
    ) -> WorkingHoursType:
        from beautybook.permissions import require_owner
        from staff.models import User, WorkingHours

        require_owner(info)
        user = User.objects.filter(pk=staff_id, is_active=True).first()
        if not user:
            raise ValueError("Staff member not found.")

        wh, _ = WorkingHours.objects.update_or_create(
            staff=user,
            day_of_week=day_of_week,
            defaults={
                "is_day_off": is_day_off,
                "start_time": None if is_day_off else start_time,
                "end_time": None if is_day_off else end_time,
            },
        )
        from beautybook.cache_utils import invalidate_hours_cache
        invalidate_hours_cache(info.context.request.tenant.schema_name)
        return working_hours_to_type(wh)

    # ── Owner: assign service to staff member ─────────────────────────────────
    @strawberry.mutation
    def assign_service(
        self,
        info: strawberry.types.Info,
        staff_id: int,
        service_id: int,
    ) -> bool:
        from beautybook.permissions import require_owner
        from services.models import Service, StaffService
        from staff.models import User

        require_owner(info)
        user = User.objects.filter(pk=staff_id, is_active=True).first()
        if not user:
            raise ValueError("Staff member not found.")
        service = Service.objects.filter(pk=service_id, is_active=True).first()
        if not service:
            raise ValueError("Service not found.")
        StaffService.objects.get_or_create(staff=user, service=service)
        from beautybook.cache_utils import invalidate_staff_cache
        invalidate_staff_cache(info.context.request.tenant.schema_name)
        return True

    # ── Owner: update staff profile (avatar, bio, public visibility) ─────────
    @strawberry.mutation
    def update_staff_profile(
        self,
        info: strawberry.types.Info,
        staff_id: int,
        avatar_url: Optional[str] = None,
        bio: Optional[str] = None,
        display_on_public_page: Optional[bool] = None,
    ) -> UserType:
        from beautybook.permissions import require_owner
        from staff.models import User

        require_owner(info)
        user = User.objects.filter(pk=staff_id, is_active=True).first()
        if not user:
            raise ValueError("Staff member not found.")

        fields = ["updated_at"]
        if avatar_url is not None:
            from beautybook.storage import save_image_from_base64
            tenant_schema = info.context.request.tenant.schema_name
            user.avatar_url = save_image_from_base64(avatar_url.strip(), "avatars", tenant_schema)
            fields.append("avatar_url")
        if bio is not None:
            user.bio = bio.strip()
            fields.append("bio")
        if display_on_public_page is not None:
            user.display_on_public_page = display_on_public_page
            fields.append("display_on_public_page")

        user.save(update_fields=fields)
        from beautybook.cache_utils import invalidate_staff_cache
        invalidate_staff_cache(info.context.request.tenant.schema_name)
        return user_to_type(user)

    # ── Owner: remove service from staff member ───────────────────────────────
    @strawberry.mutation
    def remove_service(
        self,
        info: strawberry.types.Info,
        staff_id: int,
        service_id: int,
    ) -> bool:
        from beautybook.permissions import require_owner
        from services.models import StaffService

        require_owner(info)
        StaffService.objects.filter(staff_id=staff_id, service_id=service_id).delete()
        from beautybook.cache_utils import invalidate_staff_cache
        invalidate_staff_cache(info.context.request.tenant.schema_name)
        return True
