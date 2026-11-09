#!/usr/bin/env bash
# CTO verifier, P3-T5 r12 at 1cf1f8d (code fa5694e), part A3: re-run on 3331 (SERVER_URL in the clone .env moved to 3331) after
# the CTO port clash on 3330 (M-230) killed part A at 13:28:14 and blocked A2 (EADDRINUSE at 13:37). Rebuild first (SERVER_URL changed).
# Everything except the quiet-machine timing gates. Retries 0; every run kept; new output folders end in -A3.
# Disclosed: before A2 the CTO restored docs/reports in the clone (3 tracked PNGs the part A e2e had overwritten) without
# keeping copies.
R=/d/jazira-verify/2026-11-09/p3t5m; L=/d/jazira-verify/2026-11-09/logs/p3t5m; PORT=3331; cd "$R" || exit 1
P="corepack pnpm"; SUM="$L/summary.tsv"
step(){ name=$1; shift; s=$(date +%s); "$@" > "$L/$name.log" 2>&1; rc=$?; echo -e "$name\t$rc\t$(( $(date +%s)-s ))" >> "$SUM"; return $rc; }
export CI=; export PATH="/d/jazira-verify/bin:$PATH"; set -a; . ./.env 2>/dev/null; set +a
echo "--- A3 re-run on 3331 (A and A2 broken by the CTO port clash on 3330, M-230)" >> "$SUM"
git status --short > "$L/status-before-A3.txt"
step build-A3 $P build
PORT=$PORT $P start > "$L/next-start-A3.log" 2>&1 &
SRV=$!; WPID=$(cat /proc/$SRV/winpid); echo "$SRV $WPID" > "$L/next-start-A3.pid"
for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/admin" && break; sleep 2; done
LP=$(netstat -ano | tr -d '\r' | awk -v p=":$PORT\$" '$2 ~ p && $4=="LISTENING" {print $5; exit}'); echo "$LP" > "$L/next-start-A3.listen-pid"
echo "server A2: $SRV $WPID listen $LP" >> "$SUM"
FIX=/d/jazira-verify/2026-11-01/scripts/publish-as-fixture.mjs; G=/d/jazira-verify/2026-11-05/scripts/p3t5
step e2e-default-pre-A3 $P exec playwright test --retries=0
step publish-home-ar-on-A3 node $FIX http://localhost:$PORT $R/tests/e2e/global-setup.ts true
step e2e-default-A3 $P exec playwright test --retries=0
step e2e-gpu-A3 env E2E_GPU=1 E2E_PRODUCTION_SERVER=1 corepack pnpm exec playwright test --retries=0 --project=gpu
step e2e-p3t5-prodflag-A3 env E2E_PRODUCTION_SERVER=1 corepack pnpm exec playwright test --retries=0 tests/e2e/p3-t5-live-3d.e2e.spec.ts
step owner-shots-A3 node $G/owner-shots.mjs http://localhost:$PORT $L/owner-shots-A3
step sky-swap-en-A3 node $G/sky-swap.mjs http://localhost:$PORT $L/sky-swap-A3 en
step sky-swap-ar-A3 node $G/sky-swap.mjs http://localhost:$PORT $L/sky-swap-A3 ar
step arabic-off-A3 node $FIX http://localhost:$PORT $R/tests/e2e/global-setup.ts false
curl -s http://localhost:$PORT/api/globals/site-settings | grep -o '"arabicEnabled":[a-z]*' > "$L/arabic-after-A3.txt"
for r in 1 2 3; do step gates-throttle10-r$r-A3 node $G/cards-gates.mjs http://localhost:$PORT $L/gates-throttle10-r$r-A3 throttle10; done
for r in 1 2; do step gates-held-r$r-A3 node $G/cards-gates.mjs http://localhost:$PORT $L/gates-held-r$r-A3 held; done
curl -s -o /dev/null -w "server still up at end: %{http_code}\n" "http://localhost:$PORT/en" >> "$SUM"
echo "server left running: $SRV $WPID listen $LP" >> "$SUM"
echo done-A3 >> "$SUM"
