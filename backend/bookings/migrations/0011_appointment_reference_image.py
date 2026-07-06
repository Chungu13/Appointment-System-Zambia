from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookings", "0010_appointment_status_expired"),
    ]

    operations = [
        migrations.AddField(
            model_name="appointment",
            name="reference_image_url",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="appointment",
            name="reference_image_path",
            field=models.TextField(blank=True),
        ),
    ]
