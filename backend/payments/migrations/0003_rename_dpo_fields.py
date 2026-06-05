from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0002_payment_updated_at_alter_payment_appointment"),
    ]

    operations = [
        migrations.RenameField(
            model_name="payment",
            old_name="dpo_transaction_id",
            new_name="transaction_ref",
        ),
        migrations.RenameField(
            model_name="payment",
            old_name="dpo_token",
            new_name="provider_ref",
        ),
    ]
