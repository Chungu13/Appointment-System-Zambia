from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('tenants', '0013_tenant_payout_network'),
    ]

    operations = [
        migrations.CreateModel(
            name='PendingRegistration',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full_name', models.CharField(max_length=100)),
                ('email', models.EmailField(unique=True)),
                ('password_hash', models.CharField(blank=True, max_length=255)),
                ('business_name', models.CharField(max_length=100)),
                ('business_type', models.CharField(max_length=50)),
                ('city', models.CharField(max_length=50)),
                ('area', models.CharField(blank=True, max_length=50)),
                ('phone', models.CharField(max_length=20)),
                ('address', models.CharField(blank=True, max_length=200)),
                ('google_token', models.CharField(blank=True, max_length=500)),
                ('email_verified', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
