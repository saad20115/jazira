#!/usr/bin/env bash
# Executor diagnosis (non-authoritative): programs.mjs on each saved build. Usage: count.sh <outDir> <builds...>
O=$1; shift
S=/c/Users/User21.CSE/AppData/Local/Temp/claude/55d5332796bc9398/1b1c303c-9b0c-4ef9-a782-162c77955636/scratchpad
W=/d/jazira-p3t5
PORT=3170
mkdir -p "$O"; cd "$W" || exit 1
set -a; . ./.env 2>/dev/null; set +a
export NODE_OPTIONS=--no-deprecation
n=0
for b in "$@"; do
  n=$((n + 1))
  find "$W/.next" -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +
  tar -C "$S/ab/next-$b" --exclude=./cache --exclude=./node_modules -cf - . | tar -C "$W/.next" -xf -
  node node_modules/next/dist/bin/next start -p $PORT > "$O/$n-$b-server.log" 2>&1 &
  P=$!; WP=$(cat /proc/$P/winpid); echo "$P $WP" > "$O/$n-$b-server.pid"
  for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/en" && break; sleep 2; done
  sleep 10
  echo "$n $b onscreen3s $(node "$S/r13/programs.mjs" "http://localhost:$PORT" "$O/$n-$b-onscreen3s.json" 3000)"
  echo "$n $b immediate $(node "$S/r13/programs.mjs" "http://localhost:$PORT" "$O/$n-$b-immediate.json" 0)"
  taskkill //PID "$WP" //T //F > /dev/null 2>&1
  sleep 3
done
echo ALLDONE
