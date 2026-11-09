#!/usr/bin/env bash
# CTO verifier, 2026-11-09: P3-T5 round 11 (3328, p3t5l d579282) timelines x3 (O-12, O-9b) and Lighthouse mobile x3 +
# desktop x1 (O-10), same commands as 2026-11-05 p3t5l-runB.sh. Runs after ab-r9-r11-quiet.sh. Retries 0; every run kept.
L=/d/jazira-verify/2026-11-09/logs/r11-timeline-lh; O=/d/jazira-verify/2026-11-09/lighthouse/r11; PORT=3328; mkdir -p "$L" "$O"
cd /d/jazira-verify/2026-11-05/p3t5l || exit 1; export PATH="/d/jazira-verify/bin:$PATH"; SUM="$L/summary.tsv"; echo -e "step\texit\tseconds" > "$SUM"
step(){ name=$1; shift; s=$(date +%s); "$@" > "$L/$name.log" 2>&1; rc=$?; echo -e "$name\t$rc\t$(( $(date +%s)-s ))" >> "$SUM"; return $rc; }
G=/d/jazira-verify/2026-11-05/scripts/p3t5
for r in 1 2 3; do step timeline-r$r node $G/cards-timeline.mjs http://localhost:$PORT $L/timeline-r$r 0; find "$L/timeline-r$r" -name '*.webm' -delete; done
for try in 1 2 3; do
  step lh-mobile-try$try npx -y lighthouse@13.5.0 http://localhost:$PORT/en --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=$O/en-mobile-try$try.json --chrome-flags="--headless=new"
done
step lh-desktop npx -y lighthouse@13.5.0 http://localhost:$PORT/en --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=$O/en-desktop.json --chrome-flags="--headless=new"
echo done >> "$SUM"
