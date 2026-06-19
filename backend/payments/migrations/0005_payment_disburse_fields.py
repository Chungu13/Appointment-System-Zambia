from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('payments', '0004_payment_indexes'),
    ]
    operations = [
        migrations.AddField(
            model_name='payment',
            name='disburse_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='payment',
            name='disburse_reference',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='disburse_transaction_id',
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='disburse_status',
            field=models.CharField(default='pending', max_length=20),
        ),
        migrations.AddField(
            model_name='payment',
            name='kimawa_net',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
    ]
