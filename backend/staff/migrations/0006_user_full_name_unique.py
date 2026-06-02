from django.db import migrations, models


def deduplicate_full_names(apps, schema_editor):
    """
    Delete duplicate staff users keeping the one with the lowest pk.
    Runs per-schema before the unique constraint is added.
    """
    User = apps.get_model("staff", "User")
    from django.db.models import Count

    dupes = (
        User.objects
        .values("full_name")
        .annotate(n=Count("id"))
        .filter(n__gt=1)
    )
    for row in dupes:
        users = User.objects.filter(full_name=row["full_name"]).order_by("pk")
        keep_pk = users.first().pk
        deleted, _ = users.exclude(pk=keep_pk).delete()
        print(
            f"  [dedup] full_name={row['full_name']!r}: "
            f"kept pk={keep_pk}, deleted {deleted} duplicate(s)"
        )


class Migration(migrations.Migration):

    dependencies = [
        ("staff", "0005_user_bio_display_on_public_page_alter_avatar_url"),
    ]

    operations = [
        migrations.RunPython(deduplicate_full_names, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="full_name",
            field=models.CharField(max_length=150, unique=True),
        ),
    ]
