#!/usr/bin/env bash
# CTO verifier, 2026-11-09: P3-T5 round 11 timing re-run (Kaspersky avpui gone; idle servers 3325/3340 stopped by recorded PID).
# Same interleaved ABBA design as 2026-11-05 ab-r9-r11.sh: round 9 build (3326, p3t5j ade80fd) vs round 11 build
# (3328, p3t5l d579282), same minutes; then r11 throttle10 x3 and held x2. Retries 0; every run kept.
L=/d/jazira-verify/2026-11-09/logs/ab-r9-r11-quiet; mkdir -p "$L"; cd /d/jazira-verify/2026-11-05/p3t5l || exit 1
export PATH="/d/jazira-verify/bin:$PATH"; G=/d/jazira-verify/2026-11-05/scripts/p3t5; SUM="$L/summary.tsv"; echo -e "run\tbuild\tmode\texit\tseconds" > "$SUM"
gpu(){ powershell -NoProfile -File /d/jazira-verify/2026-11-09/scripts/gpu.ps1 > "$L/gpu-$1.txt" 2>&1; }
one(){ b=$1; port=$2; m=$3; r=$4; s=$(date +%s); node $G/cards-gates.mjs http://localhost:$port $L/$b-$m-r$r $m > "$L/$b-$m-r$r.log" 2>&1; echo -e "$b-$m-r$r\t$b\t$m\t$?\t$(( $(date +%s)-s ))" >> "$SUM"; find "$L/$b-$m-r$r" -name '*.webm' -delete; }
gpu before; tasklist //FO CSV > "$L/tasklist-before.csv"
for r in 1 2 3; do for m in immediate latest onscreen3s; do
  if [ $((r % 2)) -eq 1 ]; then one r9 3326 $m $r; one r11 3328 $m $r; else one r11 3328 $m $r; one r9 3326 $m $r; fi
done; done
for r in 1 2 3; do one r11 3328 throttle10 $r; done
for r in 1 2; do one r11 3328 held $r; done
gpu after
echo ab-done >> "$SUM"
