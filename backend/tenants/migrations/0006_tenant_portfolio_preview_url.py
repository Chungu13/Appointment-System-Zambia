from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0005_alter_tenant_cover_image_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="portfolio_preview_url",
            field=models.TextField(blank=True),
        ),
    ]
