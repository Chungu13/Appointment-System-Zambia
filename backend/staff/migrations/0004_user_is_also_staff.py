from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("staff", "0003_user_pin_hash"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_also_staff",
            field=models.BooleanField(default=False),
        ),
    ]
