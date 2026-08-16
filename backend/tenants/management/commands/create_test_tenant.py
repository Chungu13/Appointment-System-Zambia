from django.core.management.base import BaseCommand
from django_tenants.utils import tenant_context

from tenants.models import Domain, Tenant


def _times(start_hour: int, end_hour: int) -> list[str]:
    """Every 30 minutes from start_hour up to and including end_hour, as "HH:MM"."""
    out = []
    for minutes in range(start_hour * 60, end_hour * 60 + 1, 30):
        out.append(f"{minutes // 60:02d}:{minutes % 60:02d}")
    return out


class Command(BaseCommand):
    help = "Create a test tenant 'Glow Salon' with sample services, staff, and working hours."

    def handle(self, *args, **options):
        self.stdout.write("\n── Public schema ─────────────────────────────────")

        tenant, created = Tenant.objects.get_or_create(
            schema_name="glow_salon",
            defaults={
                "business_name": "Glow Salon",
                "business_type": "salon",
                "subdomain": "glow",
                "city": "Lusaka",
                "on_trial": True,
                "is_active": True,
                "staff_access_key": "GLOW2024",
            },
        )
        # Ensure subdomain is correct for existing tenants created with the old value
        if not created and tenant.subdomain != "glow":
            tenant.subdomain = "glow"
            tenant.save(update_fields=["subdomain"])
        if not created and not tenant.staff_access_key:
            tenant.staff_access_key = "GLOW2024"
            tenant.save(update_fields=["staff_access_key"])
        self._ok(created, "Tenant 'Glow Salon'")

        domain, created = Domain.objects.get_or_create(
            domain="glow.localhost",
            defaults={"tenant": tenant, "is_primary": True},
        )
        self._ok(created, "Domain 'glow.localhost'")

        self.stdout.write("\n── Tenant schema (glow_salon) ────────────────────")
        with tenant_context(tenant):
            self._seed()

        self.stdout.write(self.style.SUCCESS("\n✓ Test tenant ready.\n"))
        self.stdout.write(
            "  GraphQL    : http://glow.localhost:8000/graphql\n"
            "  Admin      : http://glow.localhost:8000/admin/\n"
            "  Owner      : glowowner / glow1234\n"
            "  Staff key  : GLOW2024  → glow.localhost:3000/staff\n"
            "  PIN login  : +260971000000 / 1234  (owner as solo staff)\n"
        )

    # ------------------------------------------------------------------

    def _seed(self):
        owner = self._create_owner()
        services = self._create_services()
        self._seed_owner_as_staff(owner, services)
        self._create_staff(services)

    def _create_owner(self):
        from staff.models import User

        user, created = User.objects.get_or_create(
            username="glowowner",
            defaults={
                "email": "owner@glowsalon.zm",
                "full_name": "Glow Owner",
                "role": "owner",
                "is_staff": True,
            },
        )
        if created:
            user.set_password("glow1234")
            user.save(update_fields=["password"])
        self._ok(created, "Owner 'glowowner'")
        return user

    def _seed_owner_as_staff(self, owner, services):
        from django.contrib.auth.hashers import make_password
        from services.models import StaffService
        from staff.models import WorkingHours

        fields = []
        if not owner.is_also_staff:
            owner.is_also_staff = True
            fields.append("is_also_staff")
        if not owner.pin_hash:
            owner.pin_hash = make_password("1234")
            fields.append("pin_hash")
        if not owner.phone:
            owner.phone = "+260971000000"
            fields.append("phone")
        if fields:
            owner.save(update_fields=fields)
            self.stdout.write(self.style.SUCCESS("  ✓ Owner linked as staff (phone: +260971000000 / PIN: 1234)."))
        else:
            self.stdout.write("  – Owner already linked as staff, skipping.")

        # Working hours: Mon–Fri 09:00–17:00, Sat 09:00–14:00, Sun off
        for day in range(7):
            is_off = day == 6
            WorkingHours.objects.get_or_create(
                staff=owner,
                day_of_week=day,
                defaults={
                    "is_day_off": is_off,
                    "available_times": [] if is_off else _times(9, 14 if day == 5 else 17),
                },
            )

        # Assign all services to owner
        for svc in services.values():
            _, created = StaffService.objects.get_or_create(staff=owner, service=svc)
            if created:
                self.stdout.write(f"    ✓ glowowner → {svc.name}")

    def _create_services(self):
        from services.models import Service

        specs = [
            dict(
                name="Box Braids",
                category="braids",
                description="Classic medium-length box braids.",
                duration_minutes=180,
                price_zmw="280.00",
                deposit_zmw="50.00",
                buffer_minutes=10,
            ),
            dict(
                name="Gel Full Set",
                category="nails",
                description="Full set gel nails, colour of choice.",
                duration_minutes=90,
                price_zmw="150.00",
                deposit_zmw="50.00",
                buffer_minutes=5,
            ),
            dict(
                name="Weave Install",
                category="hair",
                description="Sew-in weave installation.",
                duration_minutes=120,
                price_zmw="200.00",
                deposit_zmw="50.00",
                buffer_minutes=10,
            ),
        ]

        services = {}
        for spec in specs:
            svc, created = Service.objects.get_or_create(name=spec["name"], defaults=spec)
            self._ok(created, f"Service '{svc.name}'")
            services[svc.name] = svc
        return services

    def _create_staff(self, services):
        from services.models import StaffService
        from staff.models import User, WorkingHours

        members = [
            dict(
                username="alice",
                full_name="Alice Banda",
                email="alice@glowsalon.zm",
                phone="+260971000001",
                role="staff",
                service_names=["Box Braids", "Weave Install"],
            ),
            dict(
                username="bob",
                full_name="Bob Mwale",
                email="bob@glowsalon.zm",
                phone="+260971000002",
                role="staff",
                service_names=["Gel Full Set", "Box Braids"],
            ),
        ]

        for spec in members:
            service_names = spec.pop("service_names")

            member, created = User.objects.get_or_create(
                username=spec["username"],
                defaults={**spec, "is_staff": False},
            )
            if created:
                member.set_password("staff1234")
                member.save(update_fields=["password"])
            self._ok(created, f"Staff '{member.full_name}'")

            # Working hours: Mon–Sat 08:00–18:00, Sunday off
            for day in range(7):
                is_off = day == 6
                WorkingHours.objects.get_or_create(
                    staff=member,
                    day_of_week=day,
                    defaults={
                        "is_day_off": is_off,
                        "available_times": [] if is_off else _times(8, 18),
                    },
                )

            # Link services
            for name in service_names:
                svc = services[name]
                _, created = StaffService.objects.get_or_create(staff=member, service=svc)
                if created:
                    self.stdout.write(f"    ✓ {member.username} → {svc.name}")

    # ------------------------------------------------------------------

    def _ok(self, created, label):
        if created:
            self.stdout.write(self.style.SUCCESS(f"  ✓ {label} created."))
        else:
            self.stdout.write(f"  – {label} already exists, skipping.")
