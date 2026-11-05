#!/usr/bin/env bash
# CTO verifier, Antigravity P3-T6..P3-T8 round 3 at f177655. Retries 0 everywhere; every run kept.
R=/d/jazira-verify/2026-11-05/ag-pages3; L=/d/jazira-verify/2026-11-05/logs/ag-pages3; O=/d/jazira-verify/2026-11-05/lighthouse/ag-pages3
PORT=3325; mkdir -p "$L" "$O"; cd "$R" || exit 1
P="corepack pnpm"; SUM="$L/summary.tsv"; echo -e "step\texit\tseconds" > "$SUM"
echo "HEAD $(git rev-parse HEAD)" > "$L/head.txt"
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
step build $P build
step audit-full $P audit --prod
step audit-high $P audit --prod --audit-level high
step seed $P seed
PORT=$PORT $P start > "$L/next-start.log" 2>&1 &
SRV=$!; WPID=$(cat /proc/$SRV/winpid); echo "$SRV $WPID" > "$L/next-start.pid"
for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/admin" && break; sleep 2; done
# e2e global setup creates the fixture admin; run the default suite once first, then publish home and run again
step e2e-default-pre $P exec playwright test --retries=0
step publish-home node /d/jazira-verify/2026-11-01/scripts/publish-as-fixture.mjs http://localhost:$PORT $R/tests/e2e/global-setup.ts true
step e2e-default $P exec playwright test --retries=0
step e2e-prodflag env E2E_PRODUCTION_SERVER=1 corepack pnpm exec playwright test --retries=0 tests/e2e/p3-t6.e2e.spec.ts tests/e2e/p3-t7.e2e.spec.ts tests/e2e/p3-t8.e2e.spec.ts tests/e2e/p3-t9.e2e.spec.ts
step publish-pages node /d/jazira-verify/2026-11-05/scripts/publish-pages-as-fixture.mjs http://localhost:$PORT $R/tests/e2e/global-setup.ts
step activate-team node /d/jazira-verify/2026-11-05/scripts/activate-team-as-fixture.mjs http://localhost:$PORT $R/tests/e2e/global-setup.ts
step page-shots node /d/jazira-verify/2026-11-05/scripts/page-shots.mjs http://localhost:$PORT $L/page-shots
step measure node /d/jazira-verify/2026-11-05/scripts/measure-r2.mjs http://localhost:$PORT $L/measure
for u in en/projects/sofitel-makkah-hotel ar/projects/sofitel-makkah-hotel en/projects ar/projects en/about en/services; do n=$(echo $u | tr / -); node /d/jazira-verify/2026-11-05/scripts/csp-probe.mjs http://localhost:$PORT/$u > "$L/csp-probe-$n.json" 2> "$L/csp-probe-$n.err"; echo -e "csp-$n\t$?\t0" >> "$SUM"; done
step arabic-off node /d/jazira-verify/2026-11-01/scripts/publish-as-fixture.mjs http://localhost:$PORT $R/tests/e2e/global-setup.ts false
curl -s http://localhost:$PORT/api/globals/site-settings | grep -o "\"arabicEnabled\":[a-z]*" > "$L/arabic-after.txt"
echo "server left running: $SRV $WPID" >> "$SUM"
echo done >> "$SUM"
