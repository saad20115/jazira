#!/usr/bin/env bash
# CTO verifier, R-1 round 2 at 0b325e5 (code 45a1bd3): DoD from a fresh clone, shuffled int suites x2, the R1-2 live
# refusal (a server on the dev DB), the unfiltered e2e against a server on the e2e/test DB, and the round 2 must-fail.
# Retries 0 everywhere; every run kept. Servers are stopped only by the PIDs recorded at their launch.
V=/d/jazira-verify/2026-11-09; R=$V/r1b; L=$V/logs/r1b; PORT=3329; cd "$R" || exit 1
P="corepack pnpm"; SUM="$L/summary.tsv"; echo -e "step\texit\tseconds" > "$SUM"
step(){ name=$1; shift; s=$(date +%s); "$@" > "$L/$name.log" 2>&1; rc=$?; echo -e "$name\t$rc\t$(( $(date +%s)-s ))" >> "$SUM"; return $rc; }
export CI=; export PATH="/d/jazira-verify/bin:$PATH"; set -a; . ./.env 2>/dev/null; set +a
DEV_DB=$DATABASE_URL; E2E_DB=$E2E_DATABASE_URL
startsrv(){ tag=$1; db=$2; DATABASE_URL=$db PORT=$PORT $P start > "$L/next-start-$tag.log" 2>&1 & S=$!; W=$(cat /proc/$S/winpid); echo "$S $W" > "$L/next-start-$tag.pid"
  for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/en" && break; sleep 2; done
  LP=$(netstat -ano | tr -d '\r' | awk -v p=":$PORT\$" '$2 ~ p && $4=="LISTENING" {print $5; exit}'); echo "$LP" > "$L/next-start-$tag.listen-pid"; echo "started $tag $S $W listen $LP" >> "$SUM"; }
stopsrv(){ tag=$1; read S W < "$L/next-start-$tag.pid"; LP=$(cat "$L/next-start-$tag.listen-pid"); taskkill //PID "$W" //T //F > /dev/null 2>&1; [ -n "$LP" ] && taskkill //PID "$LP" //T //F > /dev/null 2>&1; sleep 3; echo "stopped $tag $W $LP" >> "$SUM"; }
users(){ docker exec aljazira-verify19-db-1 psql -U "$POSTGRES_USER" -d "$1" -tAc "select count(*) from users" 2>&1 | tr -d '\r'; }
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
# R1-2 live refusal: the server runs on the dev DB; playwright runs with DATABASE_URL = E2E_DATABASE_URL (as the guard requires).
DEVNAME=$(node -e 'console.log(new URL(process.argv[1]).pathname.slice(1))' "$DEV_DB"); E2ENAME=$(node -e 'console.log(new URL(process.argv[1]).pathname.slice(1))' "$E2E_DB")
startsrv devdb "$DEV_DB"
echo "dev users before: $(users $DEVNAME)" > "$L/r12-live-refusal.txt"
curl -s http://localhost:$PORT/api/globals/site-settings | grep -o '"arabicEnabled":[a-z]*' >> "$L/r12-live-refusal.txt"
step e2e-against-devdb-server env DATABASE_URL="$E2E_DB" $P exec playwright test --retries=0
echo "dev users after: $(users $DEVNAME)" >> "$L/r12-live-refusal.txt"
curl -s http://localhost:$PORT/api/globals/site-settings | grep -o '"arabicEnabled":[a-z]*' >> "$L/r12-live-refusal.txt"
stopsrv devdb
# Prepare the e2e/test DB (the int suites left data in it) and run the unfiltered e2e against a server on it.
step e2e-db-migrate env DATABASE_URL="$E2E_DB" $P payload migrate
step e2e-db-seed env DATABASE_URL="$E2E_DB" NODE_ENV=development $P seed --reseed --i-understand-this-deletes-content
startsrv e2edb "$E2E_DB"
curl -s http://localhost:$PORT/api/globals/site-settings | grep -o '"arabicEnabled":[a-z]*' > "$L/arabic-before-e2e.txt"
step e2e-unfiltered env DATABASE_URL="$E2E_DB" $P exec playwright test --retries=0
curl -s http://localhost:$PORT/api/globals/site-settings | grep -o '"arabicEnabled":[a-z]*' > "$L/arabic-after-e2e.txt"
stopsrv e2edb
echo "e2e users after: $(users $E2ENAME)" >> "$L/r12-live-refusal.txt"
git status --short > "$L/status-after-e2e.txt"; mkdir -p "$L/e2e-written"; git status --short | awk '{print $2}' | while read f; do mkdir -p "$L/e2e-written/$(dirname "$f")"; cp "$f" "$L/e2e-written/$f"; done; git checkout -- docs/reports 2>/dev/null
# Round 2 must-fail: put the round 2 code back to bfe0bd5 and run only its tests; then restore.
MF=$L/mustfail; mkdir -p $MF; echo -e "case\tphase\texit\tseconds" > $MF/summary.tsv
run(){ c=$1; ph=$2; shift 2; s=$(date +%s); $P exec vitest run "$@" > "$MF/$c-$ph.log" 2>&1; echo -e "$c\t$ph\t$?\t$(( $(date +%s)-s ))" >> $MF/summary.tsv; }
mf(){ c=$1; files=$2; shift 2; git checkout -q bfe0bd5 -- $files; git status --short > "$MF/$c-reverted-status.txt"; run $c base "$@"; git checkout -q 0b325e5 -- $files; git status --short > "$MF/$c-restored-status.txt"; run $c fix "$@"; }
mf R1-2-R1-3-R1-4 "tests/e2e/global-setup.ts tests/e2e/admin-smoke.spec.ts scripts/record/p3-t14-motion-recordings.mjs" tests/unit/e2e-global-setup.test.ts
mf R1-5 "src/env.ts" src/env.test.ts
git status --short > "$L/final-status.txt"
echo done >> "$SUM"
