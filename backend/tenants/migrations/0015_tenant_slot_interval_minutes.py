from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0014_pendingregistration"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="slot_interval_minutes",
            field=models.PositiveIntegerField(
                default=30,
                help_text="Granularity of appointment start times shown to customers (e.g. every 15/30/60 min).",
            ),
        ),
        migrations.AddConstraint(
            model_name="tenant",
            constraint=models.CheckConstraint(
                condition=Q(slot_interval_minutes__gte=5),
                name="tenant_slot_interval_min_5",
            ),
        ),
    ]
