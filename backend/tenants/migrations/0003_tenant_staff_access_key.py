from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tenants", "0002_subscriptionplan_updated_at_tenant_updated_at_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="staff_access_key",
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
