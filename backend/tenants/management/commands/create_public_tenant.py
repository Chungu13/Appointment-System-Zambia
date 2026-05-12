from django.core.management.base import BaseCommand
from django.db import connection

from tenants.models import Domain, Tenant


class Command(BaseCommand):
    help = "Create the public tenant (schema_name='public') and a localhost domain if they don't exist."

    def add_arguments(self, parser):
        parser.add_argument(
            "--domain",
            default="localhost",
            help="Primary domain to attach to the public tenant (default: localhost).",
        )

    def handle(self, *args, **options):
        domain_name = options["domain"]

        # ------------------------------------------------------------------ #
        # 1. Public tenant row                                                 #
        # ------------------------------------------------------------------ #
        # schema_name='public' is the django-tenants convention for the
        # shared/public schema. auto_create_schema=True on the model means
        # save() will call create_schema(); with check_if_exists=True it
        # detects the schema already exists and skips DDL safely.
        tenant, tenant_created = Tenant.objects.get_or_create(
            schema_name="public",
            defaults={
                "business_name": "BeautyBook ZM Platform",
                "subdomain": "public",
                "on_trial": False,
                "is_active": True,
            },
        )

        if tenant_created:
            self.stdout.write(self.style.SUCCESS("✓ Public tenant created."))
        else:
            self.stdout.write("  Public tenant already exists — skipping.")

        # ------------------------------------------------------------------ #
        # 2. Domain row                                                        #
        # ------------------------------------------------------------------ #
        domain, domain_created = Domain.objects.get_or_create(
            domain=domain_name,
            defaults={"tenant": tenant, "is_primary": True},
        )

        if domain_created:
            self.stdout.write(
                self.style.SUCCESS(f"✓ Domain '{domain_name}' created and mapped to public tenant.")
            )
        else:
            # Make sure it points at the right tenant even if it pre-existed.
            if domain.tenant_id != tenant.pk:
                domain.tenant = tenant
                domain.save(update_fields=["tenant"])
                self.stdout.write(
                    self.style.WARNING(f"  Domain '{domain_name}' re-pointed to public tenant.")
                )
            else:
                self.stdout.write(f"  Domain '{domain_name}' already exists — skipping.")

        self.stdout.write(self.style.SUCCESS("\nPublic tenant setup complete."))
        self.stdout.write(
            f"  schema : public\n"
            f"  domain : {domain_name}\n"
            f"  admin  : http://{domain_name}:8000/admin/\n"
        )
