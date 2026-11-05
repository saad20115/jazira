#!/usr/bin/env bash
# CTO verifier, P3-T5 r10 part B2: clean re-run of the quiet-machine timing gates and Lighthouse.
# Why: during part B the browser pane stayed (hidden) on the live-3D page of the 3326 owner server; that run is kept
# and reported, this one is the same steps with the pane on a blank local file. Rebuilds the unmutated code first
# (the m11 must-fail left a mutant build in .next). Retries 0.
R=/d/jazira-verify/2026-11-05/p3t5k; L=/d/jazira-verify/2026-11-05/logs/p3t5k-B2; O=/d/jazira-verify/2026-11-05/lighthouse/p3t5k-B2; PORT=3327
mkdir -p "$L" "$O"; cd "$R" || exit 1; export CI=; export PATH="/d/jazira-verify/bin:$PATH"; set -a; . ./.env; set +a
SUM="$L/summary.tsv"; echo -e "step\texit\tseconds" > "$SUM"
step(){ name=$1; shift; s=$(date +%s); "$@" > "$L/$name.log" 2>&1; rc=$?; echo -e "$name\t$rc\t$(( $(date +%s)-s ))" >> "$SUM"; return $rc; }
{ git rev-parse HEAD; git status --short; } > "$L/head.txt"
if [ -n "$(git status --short)" ]; then echo "tree not clean" >> "$SUM"; exit 1; fi
step build corepack pnpm build
PORT=$PORT corepack pnpm start > "$L/next-start.log" 2>&1 &
S=$!; W=$(cat /proc/$S/winpid); echo "$S $W" > "$L/next-start.pid"
for i in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/admin" && break; sleep 2; done
sleep 20
G=/d/jazira-verify/2026-11-05/scripts/p3t5
for r in 1 2 3; do step timeline-r$r node $G/cards-timeline.mjs http://localhost:$PORT $L/timeline-r$r 0; done
for m in onscreen3s immediate latest; do for r in 1 2 3; do step gates-$m-r$r node $G/cards-gates.mjs http://localhost:$PORT $L/gates-$m-r$r $m; done; done
for try in 1 2 3; do
  step lh-mobile-try$try npx -y lighthouse@13.5.0 http://localhost:$PORT/en --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=$O/en-mobile-try$try.json --chrome-flags="--headless=new"
done
step lh-desktop npx -y lighthouse@13.5.0 http://localhost:$PORT/en --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=$O/en-desktop.json --chrome-flags="--headless=new"
echo partB2-done >> "$SUM"
