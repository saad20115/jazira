#!/usr/bin/env bash
# CTO verifier, P3-T5 r5 at 71d8457 (code a0d69f8). Retries 0 everywhere; every run kept.
R=/d/jazira-verify/2026-11-02/p3t5f; L=/d/jazira-verify/2026-11-02/logs/p3t5f; O=/d/jazira-verify/2026-11-02/lighthouse/p3t5f
PORT=3316; mkdir -p "$L" "$O"; cd "$R" || exit 1
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
step e2e-gpu env E2E_GPU=1 E2E_PRODUCTION_SERVER=1 corepack pnpm exec playwright test --retries=0 --project=gpu
step e2e-p3t5-prodflag env E2E_PRODUCTION_SERVER=1 corepack pnpm exec playwright test --retries=0 tests/e2e/p3-t5-live-3d.e2e.spec.ts
G=/d/jazira-verify/2026-11-02/scripts/p3t5
for r in 1 2 3; do step timeline-r$r node $G/cards-timeline.mjs http://localhost:$PORT $L/timeline-r$r 0; done
for m in onscreen3s immediate; do for r in 1 2 3; do step gates-$m-r$r node $G/cards-gates.mjs http://localhost:$PORT $L/gates-$m-r$r $m; done; done
for r in 1 2 3; do step gates-latest-r$r node $G/cards-gates.mjs http://localhost:$PORT $L/gates-latest-r$r latest; done
for try in 1 2 3; do
  step lh-mobile-try$try npx -y lighthouse@13.5.0 http://localhost:$PORT/en --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=$O/en-mobile-try$try.json --chrome-flags="--headless=new"
done
step lh-desktop npx -y lighthouse@13.5.0 http://localhost:$PORT/en --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=$O/en-desktop.json --chrome-flags="--headless=new"
echo "server left running: $SRV $WPID" >> "$SUM"
echo done >> "$SUM"
