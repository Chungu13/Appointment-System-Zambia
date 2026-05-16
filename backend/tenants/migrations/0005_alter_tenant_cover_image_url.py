from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0004_tenant_cover_image_url"),
    ]

    operations = [
        migrations.AlterField(
            model_name="tenant",
            name="cover_image_url",
            field=models.TextField(blank=True),
        ),
    ]
