from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookings", "0006_appointment_notification_phone"),
    ]

    operations = [
        migrations.AddField(
            model_name="appointment",
            name="chat_session_id",
            field=models.CharField(blank=True, max_length=128),
        ),
    ]
