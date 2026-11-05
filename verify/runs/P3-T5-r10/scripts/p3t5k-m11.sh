#!/usr/bin/env bash
# CTO verifier, P3-T5 r10: independent must-fail of the O-16 @gpu test with the executor's m11 mutant
# (switch flies via the overview). Run after part B. Stops only the recorded part-A server.
R=/d/jazira-verify/2026-11-05/p3t5k; L=/d/jazira-verify/2026-11-05/logs/p3t5k-m11; PORT=3327; mkdir -p "$L"; cd "$R" || exit 1
P="corepack pnpm"; SUM="$L/summary.tsv"; echo -e "step\texit\tseconds" > "$SUM"
step(){ name=$1; shift; s=$(date +%s); "$@" > "$L/$name.log" 2>&1; rc=$?; echo -e "$name\t$rc\t$(( $(date +%s)-s ))" >> "$SUM"; return $rc; }
export CI=; export PATH="/d/jazira-verify/bin:$PATH"; set -a; . ./.env; set +a
read SRV WPID < /d/jazira-verify/2026-11-05/logs/p3t5k/next-start.pid
step stop-partA-server taskkill //PID "$WPID" //T //F
sleep 3
step apply-m11 git apply -p1 docs/reports/evidence/P3-T5/r10/mutants/m11-switch-via-overview.diff
git diff --stat > "$L/mutant-diff.txt"; git diff >> "$L/mutant-diff.txt"
step build $P build
PORT=$PORT $P start > "$L/next-start.log" 2>&1 &
S=$!; W=$(cat /proc/$S/winpid); echo "$S $W" > "$L/next-start.pid"
for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/admin" && break; sleep 2; done
step e2e-gpu-o16-mutant env E2E_GPU=1 E2E_PRODUCTION_SERVER=1 corepack pnpm exec playwright test --retries=0 --project=gpu -g "O-16"
step stop-mutant-server taskkill //PID "$W" //T //F
step revert-m11 git checkout -- src/components/systems3d/viewer/systemStage.ts
git status --short > "$L/status-after.txt"; git rev-parse HEAD >> "$L/status-after.txt"
echo m11-done >> "$SUM"
