#!/usr/bin/env bash
# CTO verifier, R-1 round 1 at df4ecdc (code bfe0bd5): DoD from a fresh clone, migrations, seed, server, e2e,
# integration suites in random file order twice. Retries 0 everywhere; every run kept.
V=/d/jazira-verify/2026-11-09; R=$V/r1; L=$V/logs/r1; PORT=3329; cd "$R" || exit 1
P="corepack pnpm"; SUM="$L/summary.tsv"; echo -e "step\texit\tseconds" > "$SUM"
step(){ name=$1; shift; s=$(date +%s); "$@" > "$L/$name.log" 2>&1; rc=$?; echo -e "$name\t$rc\t$(( $(date +%s)-s ))" >> "$SUM"; return $rc; }
export CI=; export PATH="/d/jazira-verify/bin:$PATH"; set -a; . ./.env; set +a
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
step int-shuffle-1 $P exec vitest run --sequence.shuffle tests/int
step int-shuffle-2 $P exec vitest run --sequence.shuffle tests/int
step build $P build
step audit-full $P audit --prod
step audit-high $P audit --prod --audit-level high
step seed env NODE_ENV=development $P seed
PORT=$PORT $P start > "$L/next-start.log" 2>&1 &
SRV=$!; WPID=$(cat /proc/$SRV/winpid); echo "$SRV $WPID" > "$L/next-start.pid"
for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/admin" && break; sleep 2; done
LP=$(netstat -ano | tr -d '\r' | awk -v p=":$PORT\$" '$2 ~ p && $4=="LISTENING" {print $5; exit}'); echo "$LP" > "$L/next-start.listen-pid"
curl -s http://localhost:$PORT/api/globals/site-settings | grep -o '"arabicEnabled":[a-z]*' > "$L/arabic-before-e2e.txt"
step e2e-default $P exec playwright test --retries=0
curl -s http://localhost:$PORT/api/globals/site-settings | grep -o '"arabicEnabled":[a-z]*' > "$L/arabic-after-e2e.txt"
echo "server left running: $SRV $WPID listen $LP" >> "$SUM"
echo done >> "$SUM"
