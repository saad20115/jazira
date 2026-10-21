#!/bin/sh
set -eu

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set app_user="$APP_DB_USER" \
  --set app_password="$APP_DB_PASSWORD" \
  --set app_db="$APP_DB_NAME" \
  --set test_db="$APP_TEST_DB_NAME" <<'EOSQL'
SELECT format(
  'CREATE ROLE %I WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD %L',
  :'app_user',
  :'app_password'
)
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = :'app_user') \gexec

SELECT format('ALTER DATABASE %I OWNER TO %I', :'app_db', :'app_user') \gexec

SELECT format('CREATE DATABASE %I OWNER %I', :'test_db', :'app_user')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'test_db') \gexec
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$APP_DB_NAME" \
  --set app_user="$APP_DB_USER" <<'EOSQL'
SELECT format('GRANT ALL ON SCHEMA public TO %I', :'app_user') \gexec
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$APP_TEST_DB_NAME" \
  --set app_user="$APP_DB_USER" <<'EOSQL'
SELECT format('GRANT ALL ON SCHEMA public TO %I', :'app_user') \gexec
EOSQL
