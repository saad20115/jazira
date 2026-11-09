#!/usr/bin/env bash
# CTO verifier, diagnosis for the owner: interleaved timing of the round 9 build (3326, p3t5j ade80fd) and the round 11
# build (3328, p3t5l d579282) on the same machine, same minutes. ABBA order per round so drift hits both. Retries 0.
L=/d/jazira-verify/2026-11-05/logs/ab-r9-r11; mkdir -p "$L"; cd /d/jazira-verify/2026-11-05/p3t5l || exit 1
export PATH="/d/jazira-verify/bin:$PATH"; G=/d/jazira-verify/2026-11-05/scripts/p3t5; SUM="$L/summary.tsv"; echo -e "run\tbuild\tmode\texit\tseconds" > "$SUM"
one(){ b=$1; port=$2; m=$3; r=$4; s=$(date +%s); node $G/cards-gates.mjs http://localhost:$port $L/$b-$m-r$r $m > "$L/$b-$m-r$r.log" 2>&1; echo -e "$b-$m-r$r\t$b\t$m\t$?\t$(( $(date +%s)-s ))" >> "$SUM"; find "$L/$b-$m-r$r" -name '*.webm' -delete; }
for r in 1 2 3; do for m in immediate latest onscreen3s; do
  if [ $((r % 2)) -eq 1 ]; then one r9 3326 $m $r; one r11 3328 $m $r; else one r11 3328 $m $r; one r9 3326 $m $r; fi
done; done
echo ab-done >> "$SUM"
