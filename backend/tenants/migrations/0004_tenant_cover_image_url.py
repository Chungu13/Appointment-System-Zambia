from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0003_tenant_staff_access_key"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="cover_image_url",
            field=models.URLField(blank=True),
        ),
    ]
