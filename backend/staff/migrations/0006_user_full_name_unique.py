from django.db import migrations, models


def dedup_full_names(apps, schema_editor):
    User = apps.get_model("staff", "User")
    seen = {}
    for user in User.objects.order_by("id"):
        if user.full_name in seen:
            user.delete()
        else:
            seen[user.full_name] = user.id


def reverse_dedup(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("staff", "0005_user_bio_display_on_public_page_alter_avatar_url"),
    ]

    operations = [
        migrations.RunPython(dedup_full_names, reverse_dedup),
        migrations.AlterField(
            model_name="user",
            name="full_name",
            field=models.CharField(max_length=150, unique=True),
        ),
    ]
