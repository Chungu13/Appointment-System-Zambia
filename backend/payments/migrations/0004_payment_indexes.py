from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0003_rename_dpo_fields"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(fields=["status"], name="payment_status_idx"),
        ),
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(fields=["transaction_ref"], name="payment_txn_ref_idx"),
        ),
    ]
