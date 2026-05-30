FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN SECRET_KEY=dummy-build-key python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate_schemas --noinput && python manage.py setup_production && python manage.py collectstatic --noinput && python manage.py fix_all_tenant_domains --confirm && gunicorn beautybook.wsgi:application --bind 0.0.0.0:8000 --workers 2"]
