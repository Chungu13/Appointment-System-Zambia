from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookings", "0008_appointment_addon_services"),
    ]

    operations = [
        migrations.AddField(
            model_name="appointment",
            name="cancelled_by",
            field=models.CharField(
                blank=True,
                choices=[("customer", "Customer"), ("owner", "Owner")],
                default="customer",
                max_length=10,
            ),
        ),
    ]
