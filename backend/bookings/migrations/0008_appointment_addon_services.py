from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0007_appointment_chat_session_id'),
        ('services', '0005_alter_service_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='addon_services',
            field=models.ManyToManyField(
                blank=True,
                related_name='addon_appointments',
                to='services.service',
            ),
        ),
    ]
