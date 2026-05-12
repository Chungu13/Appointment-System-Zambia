import datetime

from django.core.management.base import BaseCommand
from django_tenants.utils import tenant_context

from tenants.models import Domain, Tenant


class Command(BaseCommand):
    help = "Create a test tenant 'Glow Salon' with sample services, staff, and working hours."

    def handle(self, *args, **options):
        self.stdout.write("\n── Public schema ─────────────────────────────────")

        tenant, created = Tenant.objects.get_or_create(
            schema_name="glow_salon",
            defaults={
                "business_name": "Glow Salon",
                "business_type": "salon",
                "subdomain": "glow-salon",
                "city": "Lusaka",
                "on_trial": True,
                "is_active": True,
            },
        )
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
            "  GraphQL : http://glow.localhost:8000/graphql\n"
            "  Admin   : http://glow.localhost:8000/admin/\n"
            "  Owner   : glowowner / glow1234\n"
            "  Staff   : alice / staff1234   |   bob / staff1234\n"
        )

    # ------------------------------------------------------------------

    def _seed(self):
        owner = self._create_owner()  # noqa: F841
        services = self._create_services()
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
                        "start_time": None if is_off else datetime.time(8, 0),
                        "end_time": None if is_off else datetime.time(18, 0),
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
