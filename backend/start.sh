#!/bin/bash
set -e

python manage.py migrate_schemas --noinput
python manage.py setup_production
exec gunicorn beautybook.wsgi:application --bind 0.0.0.0:${PORT:-8000}
