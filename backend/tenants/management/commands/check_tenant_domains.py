from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from tenants.models import Domain, Tenant


class Command(BaseCommand):
    help = "Inspect and repair Domain table entries for a tenant."

    def add_arguments(self, parser):
        parser.add_argument(
            "--subdomain", required=True,
            help="Tenant subdomain (e.g. claws-hair)",
        )
        parser.add_argument(
            "--fix", action="store_true", default=False,
            help="Create missing domain rows instead of just reporting",
        )

    def handle(self, *args, **options):
        subdomain = options["subdomain"].strip()
        fix       = options["fix"]

        # ── Locate tenant ─────────────────────────────────────────────────────
        try:
            tenant = Tenant.objects.get(subdomain=subdomain)
        except Tenant.DoesNotExist:
            available = list(
                Tenant.objects.exclude(schema_name="public").values_list("subdomain", flat=True)
            )
            raise CommandError(
                f"No tenant with subdomain={subdomain!r}.\n"
                f"Available subdomains: {available}"
            )

        self.stdout.write(f"\nTenant : {tenant.business_name!r}")
        self.stdout.write(f"Schema : {tenant.schema_name}")
        self.stdout.write(f"Active : {tenant.is_active}\n")

        # ── List all current domain rows ───────────────────────────────────────
        domains = Domain.objects.filter(tenant=tenant).order_by("-is_primary", "domain")
        self.stdout.write(f"Domain rows ({domains.count()}):")
        for d in domains:
            primary_tag = " [PRIMARY]" if d.is_primary else ""
            self.stdout.write(f"  {d.domain}{primary_tag}")

        # ── Derive expected domains ────────────────────────────────────────────
        domain_suffix     = settings.TENANT_DOMAIN_SUFFIX      # e.g. kimawa.pro
        api_domain_suffix = settings.TENANT_API_DOMAIN_SUFFIX  # e.g. api.kimawa.pro

        expected_frontend = f"{subdomain}.{domain_suffix}"
        expected_api      = f"{subdomain}.{api_domain_suffix}"

        self.stdout.write("")

        # ── Check frontend domain ──────────────────────────────────────────────
        has_frontend = Domain.objects.filter(tenant=tenant, domain=expected_frontend).exists()
        if has_frontend:
            self.stdout.write(self.style.SUCCESS(f"✓ Frontend domain present : {expected_frontend}"))
        else:
            self.stdout.write(self.style.ERROR(f"✗ Frontend domain MISSING  : {expected_frontend}"))
            if fix:
                Domain.objects.create(domain=expected_frontend, tenant=tenant, is_primary=True)
                self.stdout.write(self.style.SUCCESS(f"  → Created {expected_frontend} (primary=True)"))

        # ── Check API domain ───────────────────────────────────────────────────
        has_api = Domain.objects.filter(tenant=tenant, domain=expected_api).exists()
        if has_api:
            self.stdout.write(self.style.SUCCESS(f"✓ API domain present      : {expected_api}"))
        else:
            self.stdout.write(self.style.ERROR(f"✗ API domain MISSING       : {expected_api}"))
            if fix:
                Domain.objects.create(domain=expected_api, tenant=tenant, is_primary=False)
                self.stdout.write(self.style.SUCCESS(f"  → Created {expected_api} (primary=False)"))

        # ── Summary ───────────────────────────────────────────────────────────
        self.stdout.write("")
        if not has_frontend or not has_api:
            if fix:
                self.stdout.write(self.style.SUCCESS("Repair complete. Missing domains have been created."))
            else:
                self.stdout.write(
                    self.style.WARNING("Missing domains detected. Re-run with --fix to create them.")
                )
        else:
            self.stdout.write(self.style.SUCCESS("All expected domains are present. No action needed."))

        self.stdout.write("")
