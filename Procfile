web: cd backend && python manage.py migrate_schemas --noinput && gunicorn beautybook.wsgi:application --bind 0.0.0.0:$PORT
