#!/usr/bin/env bash
# Executor run (non-authoritative): copies of the CTO's gate scripts (92d9080) and the O-16
# recordings on `next start` of the build in .next. Usage: run-gates.sh <outDir>
O=$1
S=/c/Users/User21.CSE/AppData/Local/Temp/claude/55d5332796bc9398/1b1c303c-9b0c-4ef9-a782-162c77955636/scratchpad/ab/scripts
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
for r in 1 2 3; do node "$S/cards-timeline.mjs" http://localhost:$PORT "$O/timeline-r$r" 0 > "$O/timeline-r$r.log" 2>&1; echo "timeline-r$r exit=$?"; done
for m in onscreen3s immediate latest throttle10; do for r in 1 2 3; do node "$S/cards-gates.mjs" http://localhost:$PORT "$O/gates-$m-r$r" $m > "$O/gates-$m-r$r.log" 2>&1; echo "gates-$m-r$r exit=$?"; done; done
for r in 1 2; do node "$S/cards-gates.mjs" http://localhost:$PORT "$O/gates-held-r$r" held > "$O/gates-held-r$r.log" 2>&1; echo "gates-held-r$r exit=$?"; done
node scripts/evidence/p3-t5-o16-recordings.mjs http://localhost:$PORT "$O/o16-recordings" > "$O/o16-recordings.log" 2>&1; echo "recordings exit=$?"
wmic cpu get loadpercentage 2>/dev/null | tr -d '\r' | grep -v '^$' > "$O/cpu-load-after.txt"
taskkill //PID "$WP" //T //F > "$O/stop.log" 2>&1
echo ALLDONE
