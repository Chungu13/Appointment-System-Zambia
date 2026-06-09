from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0010_tenant_area"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="payout_phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="tenant",
            name="whatsapp_number",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
    ]
