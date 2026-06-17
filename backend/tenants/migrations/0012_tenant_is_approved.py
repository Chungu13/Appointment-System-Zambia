from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Add is_approved to Tenant.
    Existing tenants backfill to True (already live).
    New signups start as False (require admin approval).
    """

    dependencies = [
        ("tenants", "0011_tenant_payout_phone_whatsapp_number"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="is_approved",
            field=models.BooleanField(default=True),  # backfill existing tenants as approved
            preserve_default=False,
        ),
        # Reset the column default to False so new rows start unapproved
        migrations.AlterField(
            model_name="tenant",
            name="is_approved",
            field=models.BooleanField(default=False),
        ),
    ]
