from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('tenants', '0012_tenant_is_approved'),
    ]
    operations = [
        migrations.AddField(
            model_name='tenant',
            name='payout_network',
            field=models.CharField(
                blank=True,
                choices=[('mtn', 'MTN Money'), ('airtel', 'Airtel Money'), ('zamtel', 'Zamtel Kwacha')],
                default='',
                max_length=10,
            ),
        ),
    ]
