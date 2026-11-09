#!/usr/bin/env bash
# Executor A/B (non-authoritative, diagnosis only): r9 code (09e8490) vs r10 code (a9c881d), the same
# machine, interleaved, with copies of the CTO's gate scripts from 92d9080. Usage: ab.sh <order...>
# e.g. ab.sh r9 r10 r10 r9 r9 r10
S=/c/Users/User21.CSE/AppData/Local/Temp/claude/55d5332796bc9398/1b1c303c-9b0c-4ef9-a782-162c77955636/scratchpad/ab
W=/d/jazira-p3t5
PORT=3170
cd "$W" || exit 1
set -a; . ./.env; set +a
export NODE_OPTIONS=--no-deprecation
n=0
for b in "$@"; do
  n=$((n + 1))
  R="$S/runs/$n-$b"; mkdir -p "$R"
  find "$W/.next" -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +; tar -C "$S/next-$b" --exclude=./cache --exclude=./node_modules -cf - . | tar -C "$W/.next" -xf -
  node node_modules/next/dist/bin/next start -p $PORT > "$R/server.log" 2>&1 &
  P=$!; WP=$(cat /proc/$P/winpid); echo "$P $WP" > "$R/server.pid"
  for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/en" && break; sleep 2; done
  sleep 15
  node "$S/scripts/cards-timeline.mjs" "http://localhost:$PORT" "$R/timeline" 0 > "$R/timeline.log" 2>&1
  for m in onscreen3s immediate onscreen3s; do
    k=$((k + 1))
    node "$S/scripts/cards-gates.mjs" "http://localhost:$PORT" "$R/gates-$m-$k" $m > "$R/gates-$m-$k.log" 2>&1
  done
  taskkill //PID "$WP" //T //F > "$R/stop.log" 2>&1
  sleep 3
  echo "done $n $b"
done
