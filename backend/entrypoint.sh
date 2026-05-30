#!/bin/sh
set -e

# Wait for PostgreSQL to be ready before starting Django
echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(
        dbname=os.environ['DB_NAME'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD'],
        host=os.environ['DB_HOST'],
        port=os.environ.get('DB_PORT', '5432'),
    )
except psycopg2.OperationalError:
    sys.exit(1)
" 2>/dev/null; do
    echo "  PostgreSQL not ready — retrying in 1s..."
    sleep 1
done
echo "PostgreSQL is ready."

echo "Running migrations..."
python manage.py migrate_schemas --noinput

echo "Running setup_production..."
python manage.py setup_production

echo "=== Fixing tenant API domains ==="
python manage.py fix_all_tenant_domains --confirm
echo "=== Domain fix complete ==="

exec "$@"
