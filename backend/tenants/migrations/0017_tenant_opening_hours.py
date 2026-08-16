from django.db import migrations, models


DEFAULT_OPENING_HOURS = {
    str(day): (
        {"opens": "", "closes": "", "closed": True}
        if day == 6
        else {"opens": "08:00", "closes": "18:00", "closed": False}
    )
    for day in range(7)
}


def seed_opening_hours(apps, schema_editor):
    """
    Give every existing tenant sensible public hours (Mon-Sat 08:00-18:00,
    Sunday closed) so no live storefront loses its hours card, open/closed
    badge, or JSON-LD opening hours the moment this ships. Owners adjust
    theirs in Settings.
    """
    Tenant = apps.get_model("tenants", "Tenant")
    for tenant in Tenant.objects.filter(opening_hours={}):
        tenant.opening_hours = DEFAULT_OPENING_HOURS
        tenant.save(update_fields=["opening_hours"])


def unseed_opening_hours(apps, schema_editor):
    """Reverse leaves the column drop to the AddField below — nothing to undo."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0016_remove_tenant_slot_interval_minutes"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="opening_hours",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.RunPython(seed_opening_hours, unseed_opening_hours),
    ]
