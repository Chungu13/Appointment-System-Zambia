from django.core.management.base import BaseCommand, CommandError

from tenants.models import Tenant


class Command(BaseCommand):
    help = (
        "Delete all tenants except schema_name='public', dropping each PostgreSQL schema. "
        "Must pass --confirm to run."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm",
            action="store_true",
            default=False,
            help="Required flag — actually perform the deletion.",
        )

    def handle(self, *args, **options):
        if not options["confirm"]:
            self.stdout.write(self.style.WARNING(
                "Dry run — no changes made.\n"
                "Tenants that WOULD be deleted (everything except schema_name='public'):\n"
            ))
            tenants = Tenant.objects.exclude(schema_name="public").order_by("schema_name")
            if not tenants.exists():
                self.stdout.write("  (none)")
            for t in tenants:
                self.stdout.write(f"  [{t.schema_name}]  {t.business_name}  ({t.subdomain})")
            self.stdout.write(self.style.WARNING(
                "\nRe-run with --confirm to actually delete them."
            ))
            return

        tenants = Tenant.objects.exclude(schema_name="public").order_by("schema_name")
        count = tenants.count()

        if count == 0:
            self.stdout.write("No non-public tenants found. Nothing to do.")
            return

        self.stdout.write(self.style.WARNING(
            f"Deleting {count} tenant(s) and dropping their PostgreSQL schemas...\n"
        ))

        deleted = 0
        errors = 0

        for tenant in list(tenants):  # list() — evaluate before deletion loop
            schema = tenant.schema_name
            name   = tenant.business_name
            slug   = tenant.subdomain
            try:
                # force_drop=True drops the PostgreSQL schema.
                # Domain rows cascade via FK on_delete=CASCADE.
                tenant.delete(force_drop=True)
                self.stdout.write(self.style.SUCCESS(
                    f"  ✓ Deleted [{schema}]  {name}  ({slug})"
                ))
                deleted += 1
            except Exception as exc:
                self.stdout.write(self.style.ERROR(
                    f"  ✗ Failed [{schema}]  {name}  ({slug}): {exc}"
                ))
                errors += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Done. {deleted} deleted, {errors} errors."))
        if errors:
            raise CommandError(f"{errors} tenant(s) could not be deleted — check output above.")
