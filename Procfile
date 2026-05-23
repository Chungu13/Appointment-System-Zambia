web: cd backend && gunicorn beautybook.wsgi:application --bind 0.0.0.0:$PORT
release: cd backend && python manage.py migrate_schemas --noinput
