#!/usr/bin/env bash
# Executor bisect (non-authoritative): the CTO's gate script (copy) on each build in the order given,
# `onscreen3s` then `immediate`, one fresh server per slot. Builds: r11b = 331ae43 (round 11),
# s = 3385150 (O-15), w = 2b7abb3 (+ O-18), r12 = fa5694e (+ O-14b rest), fix = this round.
# Usage: bisect.sh <outDir> <builds...>
O=$1; shift
S=/c/Users/User21.CSE/AppData/Local/Temp/claude/55d5332796bc9398/1b1c303c-9b0c-4ef9-a782-162c77955636/scratchpad
G=$S/ab/scripts
W=/d/jazira-p3t5
PORT=3170
mkdir -p "$O"; cd "$W" || exit 1
set -a; . ./.env 2>/dev/null; set +a
export NODE_OPTIONS=--no-deprecation
n=0
for b in "$@"; do
  n=$((n + 1))
  R="$O/$n-$b"; mkdir -p "$R"
  find "$W/.next" -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +
  tar -C "$S/ab/next-$b" --exclude=./cache --exclude=./node_modules -cf - . | tar -C "$W/.next" -xf -
  node node_modules/next/dist/bin/next start -p $PORT > "$R/server.log" 2>&1 &
  P=$!; WP=$(cat /proc/$P/winpid); echo "$P $WP" > "$R/server.pid"
  for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/en" && break; sleep 2; done
  sleep 10
  wmic cpu get loadpercentage 2>/dev/null | tr -d '\r' | grep -v '^$' | tail -1 > "$R/cpu.txt"
  for m in onscreen3s immediate; do
    node "$G/cards-gates.mjs" "http://localhost:$PORT" "$R/gates-$m" $m > "$R/gates-$m.log" 2>&1
  done
  taskkill //PID "$WP" //T //F > "$R/stop.log" 2>&1
  sleep 3
  echo "done $n $b"
done
find "$W/.next" -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +
tar -C "$S/ab/next-fix" --exclude=./cache --exclude=./node_modules -cf - . | tar -C "$W/.next" -xf -
echo ALLDONE
