from django.db import migrations, models


def deduplicate_full_names(apps, schema_editor):
    User = apps.get_model("staff", "User")
    db_alias = schema_editor.connection.alias
    seen = {}
    to_delete = []
    for user in User.objects.using(db_alias).order_by("pk"):
        if user.full_name in seen:
            to_delete.append(user.pk)
        else:
            seen[user.full_name] = user.pk
    if to_delete:
        User.objects.using(db_alias).filter(pk__in=to_delete).delete()


def reverse_dedup(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    atomic = False  # ← THIS is the fix

    dependencies = [
        ("staff", "0005_user_bio_display_on_public_page_alter_avatar_url"),
    ]

    operations = [
        migrations.RunPython(deduplicate_full_names, reverse_code=reverse_dedup),
        migrations.AlterField(
            model_name="user",
            name="full_name",
            field=models.CharField(max_length=150, unique=True),
        ),
    ]