import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context
from tenants.models import Domain, Tenant


class Command(BaseCommand):
    help = "Idempotent production setup: ensure public tenant exists with all required domains."

    def handle(self, *args, **options):
        tenant, created = Tenant.objects.get_or_create(
            schema_name="public",
            defaults={
                "business_name": "Kimawa Platform",
                "subdomain": "public",
                "on_trial": False,
                "is_active": True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created public tenant."))

        # Collect all domains that should point at the public tenant
        domains_to_register = {"localhost"}

        # Production domains — always register these
        for d in ["api.kimawa.pro", "kimawa.pro"]:
            domains_to_register.add(d)

        # Railway injects RAILWAY_PUBLIC_DOMAIN automatically
        railway_domain = os.environ.get("RAILWAY_PUBLIC_DOMAIN", "").strip()
        if railway_domain:
            domains_to_register.add(railway_domain)

        # Any extra domains passed via env (comma-separated)
        extra = os.environ.get("PUBLIC_DOMAINS", "").strip()
        if extra:
            for d in extra.split(","):
                d = d.strip()
                if d:
                    domains_to_register.add(d)

        for domain_name in sorted(domains_to_register):
            domain, domain_created = Domain.objects.get_or_create(
                domain=domain_name,
                defaults={"tenant": tenant, "is_primary": domain_name == railway_domain or domain_name == "localhost"},
            )
            if not domain_created and domain.tenant_id != tenant.pk:
                domain.tenant = tenant
                domain.save(update_fields=["tenant"])
            status = "registered" if domain_created else "already exists"
            self.stdout.write(f"  Domain '{domain_name}': {status}")

        # Create superuser in the public schema if one doesn't exist
        with schema_context("public"):
            User = get_user_model()
            if not User.objects.filter(username="admin").exists():
                User.objects.create_superuser(
                    username="admin",
                    email="admin@kimawa.pro",
                    password="admin1234",
                )
                self.stdout.write(self.style.SUCCESS("Superuser 'admin' created."))
            else:
                self.stdout.write("Superuser 'admin' already exists.")

        self.stdout.write(self.style.SUCCESS("Production setup complete."))
