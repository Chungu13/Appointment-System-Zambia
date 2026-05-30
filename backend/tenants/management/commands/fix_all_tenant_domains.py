from django.conf import settings
from django.core.management.base import BaseCommand

from tenants.models import Domain, Tenant

# Hardcoded to avoid doubling when TENANT_DOMAIN_SUFFIX is already set to
# the API domain (e.g. api.kimawa.pro) on Railway.
# Frontend: {slug}.kimawa.pro   API: {slug}.api.kimawa.pro
BASE_DOMAIN = "kimawa.pro"
API_SUFFIX  = f"api.{BASE_DOMAIN}"   # api.kimawa.pro


class Command(BaseCommand):
    help = "Ensure every non-public tenant has the correct API domain row and remove any doubled ones."

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm", action="store_true", default=False,
            help="Actually apply changes. Without this flag the command is a dry run.",
        )

    def handle(self, *args, **options):
        confirm = options["confirm"]

        if not confirm:
            self.stdout.write(self.style.WARNING("DRY RUN — pass --confirm to apply.\n"))

        tenants = Tenant.objects.exclude(schema_name="public").order_by("schema_name")
        self.stdout.write(f"Checking {tenants.count()} tenant(s)...\n")

        cleaned  = 0
        created  = 0
        ok       = 0

        for tenant in tenants:
            slug = tenant.subdomain
            correct_api = f"{slug}.{API_SUFFIX}"           # claws-hair.api.kimawa.pro
            bad_api     = f"{slug}.api.{API_SUFFIX}"       # claws-hair.api.api.kimawa.pro

            actions = []

            # ── Delete any doubled rows ────────────────────────────────────────
            bad_qs = Domain.objects.filter(tenant=tenant, domain=bad_api)
            if bad_qs.exists():
                actions.append(f"DELETE {bad_api}")
                if confirm:
                    bad_qs.delete()
                    cleaned += 1

            # ── Create correct API row if missing ──────────────────────────────
            has_correct = Domain.objects.filter(tenant=tenant, domain=correct_api).exists()
            if not has_correct:
                actions.append(f"CREATE {correct_api}")
                if confirm:
                    Domain.objects.create(domain=correct_api, tenant=tenant, is_primary=False)
                    created += 1

            if actions:
                style = self.style.SUCCESS if confirm else self.style.WARNING
                self.stdout.write(style(f"  {'✓' if confirm else '✗'}  {slug}  [{', '.join(actions)}]"))
            else:
                ok += 1
                self.stdout.write(f"  ✓  {slug}  (already correct)")

        self.stdout.write("")
        if confirm:
            self.stdout.write(self.style.SUCCESS(
                f"Done. {ok} already correct, {cleaned} bad rows deleted, {created} correct rows created."
            ))
        else:
            self.stdout.write(f"Re-run with --confirm to apply changes.")
        self.stdout.write("")
