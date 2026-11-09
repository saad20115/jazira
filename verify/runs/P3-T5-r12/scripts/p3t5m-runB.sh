#!/usr/bin/env bash
# CTO verifier, P3-T5 round 12 part B (quiet window M-232): interleaved ABBA timing, round 11 build (3328, p3t5l d579282)
# as the control vs round 12 (3331, p3t5m 1cf1f8d), then r12 timelines x3 and Lighthouse mobile x3 + desktop x1.
# Same gate scripts as 2026-11-09 ab-r9-r11-quiet.sh. Retries 0; every run kept.
V=/d/jazira-verify/2026-11-09; L=$V/logs/p3t5m-B; O=$V/lighthouse/p3t5m; mkdir -p "$L" "$O"; cd $V/p3t5m || exit 1
export PATH="/d/jazira-verify/bin:$PATH"; G=/d/jazira-verify/2026-11-05/scripts/p3t5; SUM="$L/summary.tsv"; echo -e "run\tbuild\tmode\texit\tseconds" > "$SUM"
gpu(){ powershell -NoProfile -ExecutionPolicy Bypass -Command "\$s=(Get-Counter '\GPU Engine(*engtype_3D)\Utilization Percentage' -SampleInterval 2 -MaxSamples 3).CounterSamples | Where-Object { \$_.CookedValue -gt 0.5 } | ForEach-Object { \$_.InstanceName + ' ' + [math]::Round(\$_.CookedValue,1) }; \$s; 'avpui ' + [bool](Get-Process avpui -ErrorAction SilentlyContinue); 'freeGB ' + [math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB,1); 'sampled ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" > "$L/gpu-$1.txt" 2>&1; }
one(){ b=$1; port=$2; m=$3; r=$4; s=$(date +%s); node $G/cards-gates.mjs http://localhost:$port $L/$b-$m-r$r $m > "$L/$b-$m-r$r.log" 2>&1; echo -e "$b-$m-r$r\t$b\t$m\t$?\t$(( $(date +%s)-s ))" >> "$SUM"; find "$L/$b-$m-r$r" -name '*.webm' -delete; }
step(){ name=$1; shift; s=$(date +%s); "$@" > "$L/$name.log" 2>&1; echo -e "$name\t-\t-\t$?\t$(( $(date +%s)-s ))" >> "$SUM"; }
gpu before; tasklist //FO CSV > "$L/tasklist-before.csv"
for r in 1 2 3; do for m in immediate latest onscreen3s; do
  if [ $((r % 2)) -eq 1 ]; then one r11 3328 $m $r; one r12 3331 $m $r; else one r12 3331 $m $r; one r11 3328 $m $r; fi
done; done
gpu mid
for r in 1 2 3; do step timeline-r$r node $G/cards-timeline.mjs http://localhost:3331 $L/timeline-r$r 0; find "$L/timeline-r$r" -name '*.webm' -delete; done
for try in 1 2 3; do step lh-mobile-try$try npx -y lighthouse@13.5.0 http://localhost:3331/en --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=$O/en-mobile-try$try.json --chrome-flags="--headless=new"; done
step lh-desktop npx -y lighthouse@13.5.0 http://localhost:3331/en --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=$O/en-desktop.json --chrome-flags="--headless=new"
gpu after
echo partB-done >> "$SUM"
