#!/usr/bin/env bash
# CTO verifier DoD runner. Usage: dod.sh <repo-dir> <log-dir> <port>
REPO=$1; LOG=$2; PORT=$3; mkdir -p "$LOG"; cd "$REPO" || exit 1
P="corepack pnpm"
SUM="$LOG/summary.tsv"; echo -e "step\texit\tseconds" > "$SUM"
echo "HEAD $(git rev-parse HEAD)" > "$LOG/head.txt"
step(){ name=$1; shift; s=$(date +%s); "$@" > "$LOG/$name.log" 2>&1; rc=$?; echo -e "$name\t$rc\t$(( $(date +%s)-s ))" >> "$SUM"; return $rc; }
export CI=   # local mode, but retries forced to 0 on the CLI below
export PATH="/d/jazira-verify/bin:$PATH"
set -a; . ./.env; set +a   # vitest reads only TEST_DATABASE_URL from .env; Playwright reads SERVER_URL from env
step install $P install --frozen-lockfile
step migrate-up $P payload migrate
step migrate-down $P payload migrate:down
step migrate-up-again $P payload migrate
step migrate-status $P payload migrate:status
step lint $P lint
step typecheck $P typecheck
step format-check $P format:check
step tokens-check $P tokens:check
step test $P test
step build $P build
step audit-full $P audit --prod
step audit-high $P audit --prod --audit-level high
step seed $P seed
# e2e on the production build (next start), retries 0
PORT=$PORT $P start > "$LOG/next-start.log" 2>&1 &
SRV=$!; WPID=$(cat /proc/$SRV/winpid); echo "$SRV $WPID" > "$LOG/next-start.pid"
for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/admin" && break; sleep 2; done
step e2e $P exec playwright test --retries=0
taskkill //PID $WPID //T //F > "$LOG/stop.log" 2>&1
echo done >> "$SUM"
