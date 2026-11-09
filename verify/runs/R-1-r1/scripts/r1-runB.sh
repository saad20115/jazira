#!/usr/bin/env bash
# CTO verifier, R-1 part B on the running clone server (3329):
# 1) e2e restricted by a path filter to *.spec.ts (diagnostic: the unfiltered run aborts on tests/e2e/global-setup.test.ts);
# 2) live A-02 / A-10 / A-06 checks; 3) per-finding must-fail. Retries 0; every run kept.
V=/d/jazira-verify/2026-11-09; R=$V/r1; L=$V/logs/r1; PORT=3329; cd "$R" || exit 1
export CI=; export PATH="/d/jazira-verify/bin:$PATH"; set -a; . ./.env; set +a; SUM="$L/summary.tsv"
step(){ name=$1; shift; s=$(date +%s); "$@" > "$L/$name.log" 2>&1; rc=$?; echo -e "$name\t$rc\t$(( $(date +%s)-s ))" >> "$SUM"; return $rc; }
curl -s http://localhost:$PORT/api/globals/site-settings | grep -o '"arabicEnabled":[a-z]*' > "$L/arabic-before-e2e-spec.txt"
step e2e-spec-only corepack pnpm exec playwright test --retries=0 'spec\.ts$'
curl -s http://localhost:$PORT/api/globals/site-settings | grep -o '"arabicEnabled":[a-z]*' > "$L/arabic-after-e2e-spec.txt"
step live node $V/scripts/r1-live.mjs http://localhost:$PORT .env $L/live.json
step mustfail bash $V/scripts/r1-mustfail.sh
echo partB-done >> "$SUM"
