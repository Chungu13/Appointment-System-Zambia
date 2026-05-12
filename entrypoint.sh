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

# Seed dev tenants only if the test tenant schema doesn't exist yet.
# Both commands are idempotent (get_or_create), but this avoids the noise
# on every restart once the volume is populated.
NEEDS_SEED=$(python -c "
import psycopg2, os
conn = psycopg2.connect(
    dbname=os.environ['DB_NAME'],
    user=os.environ['DB_USER'],
    password=os.environ['DB_PASSWORD'],
    host=os.environ['DB_HOST'],
    port=os.environ.get('DB_PORT', '5432'),
)
cur = conn.cursor()
cur.execute(\"SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'glow_salon'\")
print('0' if cur.fetchone()[0] else '1')
conn.close()
" 2>/dev/null || echo "1")

if [ "$NEEDS_SEED" = "1" ]; then
    echo "First run — seeding dev tenants..."
    python manage.py create_public_tenant
    python manage.py create_test_tenant
else
    echo "Dev tenants already exist — skipping seed."
fi

exec "$@"
