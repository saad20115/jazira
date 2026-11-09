#!/usr/bin/env bash
# Executor runs (non-authoritative) for round 12 on `next start` of the build in .next:
# after the O-14b rest fix: the P3-T5 e2e (both projects) and copies of the CTO's gate scripts. Usage: run-all.sh <outDir>
O=$1
G=/c/Users/User21.CSE/AppData/Local/Temp/claude/55d5332796bc9398/1b1c303c-9b0c-4ef9-a782-162c77955636/scratchpad/ab/scripts
W=/d/jazira-p3t5
PORT=3170
mkdir -p "$O"; cd "$W" || exit 1
set -a; . ./.env 2>/dev/null; set +a
export NODE_OPTIONS=--no-deprecation
git log -1 --format=%H > "$O/head.txt"
wmic cpu get loadpercentage 2>/dev/null | tr -d '\r' | grep -v '^$' > "$O/cpu-load-before.txt"
node node_modules/next/dist/bin/next start -p $PORT > "$O/next-start.log" 2>&1 &
P=$!; WP=$(cat /proc/$P/winpid); echo "$P $WP" > "$O/next-start.pid"
for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/en" && break; sleep 2; done
sleep 15
for proj in chromium gpu; do
  if [ "$proj" = gpu ]; then E=1; else E=; fi
  SERVER_URL=http://localhost:$PORT E2E_PRODUCTION_SERVER=1 E2E_GPU=$E corepack pnpm exec playwright test tests/e2e/p3-t5-live-3d.e2e.spec.ts --project=$proj --reporter=line --retries=0 > "$O/e2e-$proj.log" 2>&1
  echo "e2e $proj exit=$?"
done
mkdir -p "$O/gates"
for r in 1 2 3; do node "$G/cards-timeline.mjs" http://localhost:$PORT "$O/gates/timeline-r$r" 0 > "$O/gates/timeline-r$r.log" 2>&1; echo "timeline-r$r exit=$?"; done
for m in throttle10 onscreen3s immediate latest; do for r in 1 2 3; do node "$G/cards-gates.mjs" http://localhost:$PORT "$O/gates/gates-$m-r$r" $m > "$O/gates/gates-$m-r$r.log" 2>&1; echo "gates-$m-r$r exit=$?"; done; done
for r in 1 2; do node "$G/cards-gates.mjs" http://localhost:$PORT "$O/gates/gates-held-r$r" held > "$O/gates/gates-held-r$r.log" 2>&1; echo "gates-held-r$r exit=$?"; done
wmic cpu get loadpercentage 2>/dev/null | tr -d '\r' | grep -v '^$' > "$O/cpu-load-after.txt"
taskkill //PID "$WP" //T //F > "$O/stop.log" 2>&1
echo ALLDONE
