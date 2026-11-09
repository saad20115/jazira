#!/usr/bin/env bash
# CTO verifier, R-1 visual: Arabic on (done before by r1-arabic.mjs), shoot the R-1 server twice (fix, fix2), stop it by
# recorded PID, check out the base 34f3597 in the same clone (same lockfile), build, start on 3329, shoot base, Arabic off,
# stop it, check the clone back out at df4ecdc. Then compare. Retries 0.
V=/d/jazira-verify/2026-11-09; R=$V/r1; L=$V/logs/r1; O=$L/visual; PORT=3329; cd "$R" || exit 1
export CI=; export PATH="/d/jazira-verify/bin:$PATH"; set -a; . ./.env 2>/dev/null; set +a; SUM="$L/summary.tsv"
step(){ name=$1; shift; s=$(date +%s); "$@" > "$L/$name.log" 2>&1; rc=$?; echo -e "$name\t$rc\t$(( $(date +%s)-s ))" >> "$SUM"; return $rc; }
stopsrv(){ read S W < "$L/next-start.pid"; LP=$(cat "$L/next-start.listen-pid"); taskkill //PID "$W" //T //F > /dev/null 2>&1; taskkill //PID "$LP" //T //F > /dev/null 2>&1; sleep 3; echo "stopped $W $LP" >> "$SUM"; }
startsrv(){ PORT=$PORT corepack pnpm start > "$L/next-start-$1.log" 2>&1 & S=$!; W=$(cat /proc/$S/winpid); echo "$S $W" > "$L/next-start.pid"
  for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/en" && break; sleep 2; done
  LP=$(netstat -ano | tr -d '\r' | awk -v p=":$PORT\$" '$2 ~ p && $4=="LISTENING" {print $5; exit}'); echo "$LP" > "$L/next-start.listen-pid"; echo "started $1 $S $W listen $LP" >> "$SUM"; }
step visual-shoot-fix node $V/scripts/r1-visual.mjs shoot http://localhost:$PORT $O fix
step visual-shoot-fix2 node $V/scripts/r1-visual.mjs shoot http://localhost:$PORT $O fix2
stopsrv
git checkout -q --detach 34f3597 && git rev-parse HEAD > "$L/visual-base-head.txt"
step base-build corepack pnpm build
startsrv base
step visual-shoot-base node $V/scripts/r1-visual.mjs shoot http://localhost:$PORT $O base
step arabic-off node $V/scripts/r1-arabic.mjs http://localhost:$PORT .env false
curl -s http://localhost:$PORT/api/globals/site-settings | grep -o '"arabicEnabled":[a-z]*' > "$L/arabic-after-visual.txt"
stopsrv
git checkout -q --detach df4ecdc && git rev-parse HEAD > "$L/head-after-visual.txt"; git status --short > "$L/status-after-visual.txt"
step visual-diff node $V/scripts/r1-visual.mjs diff $O
echo visual-done >> "$SUM"
