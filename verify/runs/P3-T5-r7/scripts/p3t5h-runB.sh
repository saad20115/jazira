#!/usr/bin/env bash
# CTO verifier, P3-T5 r7 part B: quiet-machine timing gates (O-9, O-12) and Lighthouse, on the part-A server. Retries 0.
L=/d/jazira-verify/2026-11-05/logs/p3t5h; O=/d/jazira-verify/2026-11-05/lighthouse/p3t5h; PORT=3322; mkdir -p "$O"
cd /d/jazira-verify/2026-11-05/p3t5h || exit 1; export PATH="/d/jazira-verify/bin:$PATH"; SUM="$L/summary.tsv"
step(){ name=$1; shift; s=$(date +%s); "$@" > "$L/$name.log" 2>&1; rc=$?; echo -e "$name\t$rc\t$(( $(date +%s)-s ))" >> "$SUM"; return $rc; }
G=/d/jazira-verify/2026-11-05/scripts/p3t5
for r in 1 2 3; do step timeline-r$r node $G/cards-timeline.mjs http://localhost:$PORT $L/timeline-r$r 0; done
for m in onscreen3s immediate latest; do for r in 1 2 3; do step gates-$m-r$r node $G/cards-gates.mjs http://localhost:$PORT $L/gates-$m-r$r $m; done; done
for try in 1 2 3; do
  step lh-mobile-try$try npx -y lighthouse@13.5.0 http://localhost:$PORT/en --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=$O/en-mobile-try$try.json --chrome-flags="--headless=new"
done
step lh-desktop npx -y lighthouse@13.5.0 http://localhost:$PORT/en --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=$O/en-desktop.json --chrome-flags="--headless=new"
echo partB-done >> "$SUM"
