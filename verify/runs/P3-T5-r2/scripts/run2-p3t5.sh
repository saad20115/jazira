#!/usr/bin/env bash
# CTO verifier: gpu e2e + Lighthouse on the P3-T5 clone (production next start). Usage: after-dod-p3t5.sh
R=/d/jazira-verify/2026-11-01/p3t5b; L=/d/jazira-verify/2026-11-01/logs/p3t5b; O=/d/jazira-verify/2026-11-01/lighthouse/p3t5b
PORT=3312; mkdir -p "$O"; cd "$R" || exit 1
export PATH="/d/jazira-verify/bin:$PATH"; set -a; . ./.env; set +a
PORT=$PORT corepack pnpm start > "$L/next-start-run2.log" 2>&1 &
SRV=$!; WPID=$(cat /proc/$SRV/winpid); echo "$SRV $WPID" > "$L/next-start-run2.pid"
for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/admin" && break; sleep 2; done
corepack pnpm exec playwright test --retries=0 > "$L/e2e-default-full.log" 2>&1; echo "e2e-default-full exit $?" >> "$L/after.txt"
E2E_GPU=1 E2E_PRODUCTION_SERVER=1 corepack pnpm exec playwright test --retries=0 --project=gpu > "$L/e2e-gpu.log" 2>&1; echo "e2e-gpu exit $?" >> "$L/after.txt"
E2E_PRODUCTION_SERVER=1 corepack pnpm exec playwright test --retries=0 tests/e2e/p3-t5-live-3d.e2e.spec.ts > "$L/e2e-p3t5-default-prodflag.log" 2>&1; echo "e2e-p3t5-default exit $?" >> "$L/after.txt"
for try in 1 2 3; do
  npx -y lighthouse@13.5.0 http://localhost:$PORT/en --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=$O/en-mobile-try$try.json --chrome-flags="--headless=new" > $O/en-mobile-try$try.log 2>&1; echo "lh mobile try$try exit $?" >> "$L/after.txt"
done
npx -y lighthouse@13.5.0 http://localhost:$PORT/en --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=$O/en-desktop.json --chrome-flags="--headless=new" > $O/en-desktop.log 2>&1; echo "lh desktop exit $?" >> "$L/after.txt"
echo "server left running: $SRV $WPID" >> "$L/after.txt"
