from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0006_service_price_max_zmw"),
    ]

    operations = [
        migrations.AddField(
            model_name="service",
            name="image_url",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Photo shown on the service card / storefront listing.",
            ),
        ),
    ]
