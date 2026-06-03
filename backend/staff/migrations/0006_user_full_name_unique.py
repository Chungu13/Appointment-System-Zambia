from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("staff", "0005_user_bio_display_on_public_page_alter_avatar_url"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="full_name",
            field=models.CharField(max_length=150, unique=True),
        ),
    ]
