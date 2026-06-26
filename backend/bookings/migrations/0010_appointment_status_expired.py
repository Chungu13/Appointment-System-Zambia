from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookings", "0009_appointment_cancelled_by"),
    ]

    operations = [
        migrations.AlterField(
            model_name="appointment",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("confirmed", "Confirmed"),
                    ("in_progress", "In Progress"),
                    ("completed", "Completed"),
                    ("no_show", "No Show"),
                    ("cancelled", "Cancelled"),
                    ("expired", "Expired"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
