#!/usr/bin/env bash
# Executor diagnosis (non-authoritative): traces of the start for each build given. Usage: traces.sh r9 r10 ...
S=/c/Users/User21.CSE/AppData/Local/Temp/claude/55d5332796bc9398/1b1c303c-9b0c-4ef9-a782-162c77955636/scratchpad/ab
W=/d/jazira-p3t5
PORT=3170
cd "$W" || exit 1
set -a; . ./.env; set +a
export NODE_OPTIONS=--no-deprecation
n=0
for b in "$@"; do
  n=$((n + 1))
  R="$S/traces/$n-$b"; mkdir -p "$R"
  find "$W/.next" -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +; tar -C "$S/next-$b" --exclude=./cache --exclude=./node_modules -cf - . | tar -C "$W/.next" -xf -
  node node_modules/next/dist/bin/next start -p $PORT > "$R/server.log" 2>&1 &
  P=$!; WP=$(cat /proc/$P/winpid); echo "$P $WP" > "$R/server.pid"
  for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/en" && break; sleep 2; done
  sleep 10
  node "$S/trace.mjs" "http://localhost:$PORT" "$R/immediate" 0 > "$R/immediate.log" 2>&1
  node "$S/trace.mjs" "http://localhost:$PORT" "$R/onscreen3s" 3000 > "$R/onscreen3s.log" 2>&1
  taskkill //PID "$WP" //T //F > "$R/stop.log" 2>&1
  sleep 3
  echo "done $n $b"
done
