from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookings", "0005_rename_waitlist_index"),
    ]

    operations = [
        migrations.AddField(
            model_name="appointment",
            name="notification_phone",
            field=models.CharField(blank=True, max_length=20),
        ),
    ]
