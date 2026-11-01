#!/usr/bin/env bash
# Verifier-only: md5 of every public table's rows (order-independent). Usage: db-digest.sh <compose-project> <envfile>
P=$1; set -a; . "$2" 2>/dev/null; set +a
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" ${P}-db-1 psql -U "$POSTGRES_USER" -d "$APP_DB_NAME" -At -c "
DO \$\$ DECLARE r record; h text; BEGIN
FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('payload_migrations','payload_locked_documents','payload_locked_documents_rels','payload_preferences','payload_preferences_rels','users','users_sessions') ORDER BY 1 LOOP
EXECUTE format('SELECT coalesce(md5(string_agg(md5(t::text), '''' ORDER BY md5(t::text))),''empty'') FROM %I t', r.tablename) INTO h;
RAISE NOTICE '% %', r.tablename, h; END LOOP; END \$\$;" 2>&1 | sed 's/^NOTICE:  //'
