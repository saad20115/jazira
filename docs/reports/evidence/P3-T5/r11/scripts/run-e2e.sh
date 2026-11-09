#!/usr/bin/env bash
# Executor run (non-authoritative): the P3-T5 e2e spec on `next start` of the build in .next.
# Usage: run-e2e.sh <outDir> [projects...]
O=$1; shift
W=/d/jazira-p3t5
PORT=3170
mkdir -p "$O"; cd "$W" || exit 1
set -a; . ./.env 2>/dev/null; set +a
export NODE_OPTIONS=--no-deprecation
git log -1 --format=%H > "$O/head.txt"
node node_modules/next/dist/bin/next start -p $PORT > "$O/next-start.log" 2>&1 &
P=$!; WP=$(cat /proc/$P/winpid); echo "$P $WP" > "$O/next-start.pid"
for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/en" && break; sleep 2; done
sleep 10
for proj in "$@"; do
  if [ "$proj" = gpu ]; then G=1; else G=; fi
  SERVER_URL=http://localhost:$PORT E2E_PRODUCTION_SERVER=1 E2E_GPU=$G corepack pnpm exec playwright test tests/e2e/p3-t5-live-3d.e2e.spec.ts --project=$proj --reporter=line --retries=0 > "$O/e2e-$proj.log" 2>&1
  echo "e2e $proj exit=$?"
done
taskkill //PID "$WP" //T //F > "$O/stop.log" 2>&1
echo ALLDONE
