from django.core.management.base import BaseCommand, CommandError
from django_tenants.utils import tenant_context

from tenants.models import Tenant


class Command(BaseCommand):
    help = "Check whether a user exists in a specific tenant schema by email."

    def add_arguments(self, parser):
        parser.add_argument("--schema", required=True, help="Tenant schema name (e.g. glow_wonders_2)")
        parser.add_argument("--email",  required=True, help="Email address to look up")

    def handle(self, *args, **options):
        schema = options["schema"].strip()
        email  = options["email"].strip()

        # ── Locate tenant ─────────────────────────────────────────────────────
        try:
            tenant = Tenant.objects.get(schema_name=schema)
        except Tenant.DoesNotExist:
            raise CommandError(
                f"No tenant with schema_name='{schema}'. "
                f"Available schemas: {list(Tenant.objects.exclude(schema_name='public').values_list('schema_name', flat=True))}"
            )

        self.stdout.write(f"\nTenant : {tenant.business_name} (schema={schema})")
        self.stdout.write(f"Looking for email: {email}\n")

        with tenant_context(tenant):
            from staff.models import User

            # ── Check 1: lookup by email ──────────────────────────────────────
            try:
                user = User.objects.get(email=email)
                self.stdout.write(self.style.SUCCESS("✓ Found by email"))
                self._print_user(user)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR("✗ No user found with that email"))
            except User.MultipleObjectsReturned:
                users = User.objects.filter(email=email)
                self.stdout.write(self.style.WARNING(f"⚠ Multiple users ({users.count()}) share that email:"))
                for u in users:
                    self._print_user(u)

            # ── Check 2: lookup by username (in case email was used as username) ──
            self.stdout.write("")
            try:
                user = User.objects.get(username=email)
                self.stdout.write(self.style.WARNING("⚠ Found by username (email stored in username field — login will fail)"))
                self._print_user(user)
            except User.DoesNotExist:
                self.stdout.write("  (no user has that value as their username)")
            except User.MultipleObjectsReturned:
                self.stdout.write(self.style.WARNING("⚠ Multiple users share that username"))

            # ── Check 3: list all users in this schema ────────────────────────
            all_users = User.objects.all().order_by("date_joined")
            self.stdout.write(f"\nAll users in schema '{schema}' ({all_users.count()} total):")
            for u in all_users:
                self.stdout.write(
                    f"  id={u.pk}  username={u.username!r:30}  email={u.email!r:40}  "
                    f"role={u.role!r:8}  active={u.is_active}  joined={u.date_joined:%Y-%m-%d %H:%M}"
                )

        self.stdout.write("")

    def _print_user(self, user):
        self.stdout.write(f"  id          : {user.pk}")
        self.stdout.write(f"  username    : {user.username!r}")
        self.stdout.write(f"  email       : {user.email!r}")
        self.stdout.write(f"  role        : {user.role!r}")
        self.stdout.write(f"  is_active   : {user.is_active}")
        self.stdout.write(f"  has_password: {user.has_usable_password()}")
        self.stdout.write(f"  date_joined : {user.date_joined:%Y-%m-%d %H:%M:%S UTC}")
