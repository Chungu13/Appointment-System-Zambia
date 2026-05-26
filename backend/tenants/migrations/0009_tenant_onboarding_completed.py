from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0008_tenant_business_policies'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='onboarding_completed',
            field=models.BooleanField(default=False),
        ),
    ]
