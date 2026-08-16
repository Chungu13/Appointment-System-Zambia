from django.db import migrations


class Migration(migrations.Migration):
    """
    Drop slot_interval_minutes. Nothing slices a range into slots any more —
    owners pick the exact times they offer per staff member per weekday.
    """

    dependencies = [
        ('tenants', '0015_tenant_slot_interval_minutes'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='tenant',
            name='tenant_slot_interval_min_5',
        ),
        migrations.RemoveField(
            model_name='tenant',
            name='slot_interval_minutes',
        ),
    ]
