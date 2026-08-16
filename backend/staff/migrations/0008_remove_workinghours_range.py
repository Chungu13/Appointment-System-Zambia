from django.db import migrations


class Migration(migrations.Migration):
    """
    Drop the legacy start_time/end_time range. Availability is now driven
    entirely by WorkingHours.available_times (the exact times an owner picks).
    """

    dependencies = [
        ('staff', '0007_workinghours_available_times'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='workinghours',
            name='workinghours_end_after_start',
        ),
        migrations.RemoveField(
            model_name='workinghours',
            name='start_time',
        ),
        migrations.RemoveField(
            model_name='workinghours',
            name='end_time',
        ),
    ]
