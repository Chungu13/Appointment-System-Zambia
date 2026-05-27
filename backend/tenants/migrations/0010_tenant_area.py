from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0009_tenant_onboarding_completed'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='area',
            field=models.CharField(blank=True, default='', max_length=120),
        ),
    ]
