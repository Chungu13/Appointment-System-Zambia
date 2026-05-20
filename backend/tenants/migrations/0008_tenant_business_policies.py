from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0007_alter_tenant_business_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='business_policies',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
