from django.db import migrations, models
from django.db.models import F, Q


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0005_alter_service_category"),
    ]

    operations = [
        migrations.AddField(
            model_name="service",
            name="price_max_zmw",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                max_digits=10,
                null=True,
                help_text="Optional ceiling for design-dependent pricing (e.g. nail art). "
                          "price_zmw is treated as the starting/minimum price.",
            ),
        ),
        migrations.AddField(
            model_name="service",
            name="requires_reference_picture",
            field=models.BooleanField(
                default=False,
                help_text="If true, customers booking this service are asked to attach a reference photo.",
            ),
        ),
        migrations.AddConstraint(
            model_name="service",
            constraint=models.CheckConstraint(
                condition=Q(price_max_zmw__isnull=True) | Q(price_max_zmw__gte=F("price_zmw")),
                name="service_price_max_gte_min",
            ),
        ),
    ]
