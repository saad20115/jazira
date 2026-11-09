#!/usr/bin/env bash
# Executor diagnosis (non-authoritative): the full-model e2e test, interleaved on the round 11 build
# (r11b = 331ae43) and this round's (r12 = fa5694e). Usage: ab-full.sh <outDir> <builds...>
O=$1; shift
S=/c/Users/User21.CSE/AppData/Local/Temp/claude/55d5332796bc9398/1b1c303c-9b0c-4ef9-a782-162c77955636/scratchpad/ab
W=/d/jazira-p3t5
PORT=3170
mkdir -p "$O"; cd "$W" || exit 1
set -a; . ./.env 2>/dev/null; set +a
export NODE_OPTIONS=--no-deprecation
n=0
for b in "$@"; do
  n=$((n + 1))
  find "$W/.next" -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +
  tar -C "$S/next-$b" --exclude=./cache --exclude=./node_modules -cf - . | tar -C "$W/.next" -xf -
  node node_modules/next/dist/bin/next start -p $PORT > "$O/$n-$b-server.log" 2>&1 &
  P=$!; WP=$(cat /proc/$P/winpid); echo "$P $WP" > "$O/$n-$b-server.pid"
  for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/en" && break; sleep 2; done
  sleep 10
  wmic cpu get loadpercentage 2>/dev/null | tr -d '\r' | grep -v '^$' | tail -1 > "$O/$n-$b-cpu.txt"
  SERVER_URL=http://localhost:$PORT E2E_PRODUCTION_SERVER=1 E2E_GPU=1 corepack pnpm exec playwright test tests/e2e/p3-t5-live-3d.e2e.spec.ts --project=gpu -g "high-performance GPU" --reporter=line --retries=0 > "$O/$n-$b-e2e.log" 2>&1
  echo "$n $b exit=$? cpu=$(cat "$O/$n-$b-cpu.txt")"
  taskkill //PID "$WP" //T //F > /dev/null 2>&1
  sleep 3
done
# Leave the final build in place.
find "$W/.next" -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +
tar -C "$S/next-r12" --exclude=./cache --exclude=./node_modules -cf - . | tar -C "$W/.next" -xf -
echo ALLDONE
