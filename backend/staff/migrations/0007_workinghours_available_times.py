# Generated migration

from django.db import migrations, models
from django.db.models import F, Q


class Migration(migrations.Migration):

    dependencies = [
        ('staff', '0006_user_full_name_unique'),
    ]

    operations = [
        migrations.AddField(
            model_name='workinghours',
            name='available_times',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.RemoveConstraint(
            model_name='workinghours',
            name='workinghours_end_after_start',
        ),
        migrations.AddConstraint(
            model_name='workinghours',
            constraint=models.CheckConstraint(
                condition=Q(('is_day_off', True)) | Q(('start_time__isnull', True), ('end_time__isnull', True)) | Q(('end_time__gt', F('start_time'))),
                name='workinghours_end_after_start'
            ),
        ),
    ]
