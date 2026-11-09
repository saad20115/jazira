#!/usr/bin/env bash
# CTO verifier, P3-T5 r12 at 1cf1f8d (code fa5694e), part A: everything except the quiet-machine timing gates. Retries 0 everywhere; every run kept.
R=/d/jazira-verify/2026-11-09/p3t5m; L=/d/jazira-verify/2026-11-09/logs/p3t5m; O=/d/jazira-verify/2026-11-09/lighthouse/p3t5m
PORT=3330; mkdir -p "$L" "$O"; cd "$R" || exit 1
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
FIX=/d/jazira-verify/2026-11-01/scripts/publish-as-fixture.mjs; G=/d/jazira-verify/2026-11-05/scripts/p3t5
step e2e-default-pre $P exec playwright test --retries=0
step publish-home-ar-on node $FIX http://localhost:$PORT $R/tests/e2e/global-setup.ts true
step e2e-default $P exec playwright test --retries=0
step e2e-gpu env E2E_GPU=1 E2E_PRODUCTION_SERVER=1 corepack pnpm exec playwright test --retries=0 --project=gpu
step e2e-p3t5-prodflag env E2E_PRODUCTION_SERVER=1 corepack pnpm exec playwright test --retries=0 tests/e2e/p3-t5-live-3d.e2e.spec.ts
step owner-shots node $G/owner-shots.mjs http://localhost:$PORT $L/owner-shots
step sky-swap-en node $G/sky-swap.mjs http://localhost:$PORT $L/sky-swap en
step sky-swap-ar node $G/sky-swap.mjs http://localhost:$PORT $L/sky-swap ar
step arabic-off node $FIX http://localhost:$PORT $R/tests/e2e/global-setup.ts false
curl -s http://localhost:$PORT/api/globals/site-settings | grep -o '"arabicEnabled":[a-z]*' > "$L/arabic-after.txt"
for r in 1 2 3; do step gates-throttle10-r$r node $G/cards-gates.mjs http://localhost:$PORT $L/gates-throttle10-r$r throttle10; done
for r in 1 2; do step gates-held-r$r node $G/cards-gates.mjs http://localhost:$PORT $L/gates-held-r$r held; done
echo "server left running: $SRV $WPID" >> "$SUM"
echo done >> "$SUM"
