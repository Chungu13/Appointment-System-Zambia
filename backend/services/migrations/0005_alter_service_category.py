from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Convert Service.category from a constrained CharField(max_length=10, choices=...)
    to a free-text CharField(max_length=100). Existing values ("hair", "nails",
    "braids", "colour", "lashes", "other") are all valid strings — no data migration
    required. The max_length increase is a no-op at the DB level for most backends.
    """

    dependencies = [
        ("services", "0004_portfolioimage"),
    ]

    operations = [
        migrations.AlterField(
            model_name="service",
            name="category",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
    ]
