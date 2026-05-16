import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0003_alter_staffservice_unique_together_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="PortfolioImage",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("image_url", models.TextField()),
                ("caption", models.TextField(blank=True)),
                ("display_order", models.IntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "service",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="portfolio_images",
                        to="services.service",
                    ),
                ),
            ],
            options={
                "ordering": ["display_order", "created_at"],
            },
        ),
    ]
