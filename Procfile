web: gunicorn beautybook.wsgi:application --bind 0.0.0.0:8000 --workers 2
release: python manage.py migrate_schemas --noinput && python manage.py setup_production
