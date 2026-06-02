import datetime

from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context

from tenants.models import Tenant


class Command(BaseCommand):
    help = (
        "Fix WorkingHours rows where start_time = midnight and is_day_off = False "
        "(bad data from the HH:MM parse bug). Sets start_time=08:00, end_time=18:00. "
        "Dry run by default — pass --confirm to apply."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm",
            action="store_true",
            default=False,
            help="Required flag — actually apply the fix.",
        )

    def handle(self, *args, **options):
        confirm = options["confirm"]
        midnight = datetime.time(0, 0)
        new_start = datetime.time(8, 0)
        new_end = datetime.time(18, 0)

        if not confirm:
            self.stdout.write(self.style.WARNING(
                "DRY RUN — no changes will be made. Pass --confirm to apply.\n"
            ))

        tenants = Tenant.objects.exclude(schema_name="public").order_by("schema_name")
        if not tenants.exists():
            self.stdout.write("No non-public tenants found.")
            return

        total_fixed = 0

        for tenant in tenants:
            with schema_context(tenant.schema_name):
                from staff.models import WorkingHours

                bad_rows = WorkingHours.objects.filter(
                    is_day_off=False,
                    start_time=midnight,
                )
                count = bad_rows.count()

                if count == 0:
                    self.stdout.write(f"  [{tenant.schema_name}] {tenant.business_name}: OK (no bad rows)")
                    continue

                if confirm:
                    updated = bad_rows.update(start_time=new_start, end_time=new_end)
                    self.stdout.write(self.style.SUCCESS(
                        f"  [{tenant.schema_name}] {tenant.business_name}: fixed {updated} row(s) "
                        f"(00:00 → 08:00–18:00)"
                    ))
                    total_fixed += updated
                else:
                    days = list(bad_rows.values_list("day_of_week", flat=True))
                    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                    day_list = ", ".join(day_names[d] for d in days)
                    self.stdout.write(self.style.WARNING(
                        f"  [{tenant.schema_name}] {tenant.business_name}: "
                        f"{count} bad row(s) would be fixed — days: {day_list}"
                    ))

        if confirm:
            self.stdout.write("")
            self.stdout.write(self.style.SUCCESS(
                f"Done. {total_fixed} WorkingHours row(s) fixed across all tenants."
            ))
        else:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING(
                "Re-run with --confirm to apply these fixes."
            ))
