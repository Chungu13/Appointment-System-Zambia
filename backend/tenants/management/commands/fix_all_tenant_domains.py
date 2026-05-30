from django.conf import settings
from django.core.management.base import BaseCommand

from tenants.models import Domain, Tenant


class Command(BaseCommand):
    help = "Ensure every non-public tenant has both its frontend and API domain rows."

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm", action="store_true", default=False,
            help="Actually create missing rows. Without this flag the command is a dry run.",
        )

    def handle(self, *args, **options):
        confirm = options["confirm"]
        domain_suffix     = settings.TENANT_DOMAIN_SUFFIX       # e.g. kimawa.pro
        api_domain_suffix = settings.TENANT_API_DOMAIN_SUFFIX   # e.g. api.kimawa.pro

        if not confirm:
            self.stdout.write(self.style.WARNING(
                "DRY RUN — pass --confirm to apply fixes.\n"
            ))

        tenants = Tenant.objects.exclude(schema_name="public").order_by("schema_name")
        self.stdout.write(f"Checking {tenants.count()} tenant(s)...\n")

        already_ok = 0
        fixed      = 0
        would_fix  = 0

        for tenant in tenants:
            subdomain         = tenant.subdomain
            expected_frontend = f"{subdomain}.{domain_suffix}"
            expected_api      = f"{subdomain}.{api_domain_suffix}"

            has_frontend = Domain.objects.filter(tenant=tenant, domain=expected_frontend).exists()
            has_api      = Domain.objects.filter(tenant=tenant, domain=expected_api).exists()

            if has_frontend and has_api:
                already_ok += 1
                self.stdout.write(f"  ✓  {subdomain}")
                continue

            missing = []
            if not has_frontend:
                missing.append(expected_frontend)
            if not has_api:
                missing.append(expected_api)

            if confirm:
                if not has_frontend:
                    Domain.objects.create(domain=expected_frontend, tenant=tenant, is_primary=True)
                if not has_api:
                    Domain.objects.create(domain=expected_api, tenant=tenant, is_primary=False)
                fixed += 1
                self.stdout.write(self.style.SUCCESS(
                    f"  ✓  {subdomain}  [created: {', '.join(missing)}]"
                ))
            else:
                would_fix += 1
                self.stdout.write(self.style.WARNING(
                    f"  ✗  {subdomain}  [missing: {', '.join(missing)}]"
                ))

        self.stdout.write("")
        if confirm:
            self.stdout.write(self.style.SUCCESS(
                f"Done. {already_ok} already correct, {fixed} fixed."
            ))
        else:
            self.stdout.write(
                f"Summary: {already_ok} already correct, {would_fix} need fixing.\n"
                f"Re-run with --confirm to apply."
            )
        self.stdout.write("")
