from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("staff", "0004_user_is_also_staff"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="bio",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="user",
            name="display_on_public_page",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="user",
            name="avatar_url",
            field=models.TextField(blank=True),
        ),
    ]
