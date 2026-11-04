# P3-T5 r6 — generated summary (do not edit; run scripts/summarize.mjs)

HEAD 88e6f2463fdcffbe6793db85c62bbc1420ec57c6

## DoD and e2e steps (summary.tsv)

| step | exit |
|---|---|
| install | 0 |
| migrate-up | 0 |
| migrate-down | 0 |
| migrate-up-again | 0 |
| migrate-status | 0 |
| lint | 0 |
| typecheck | 0 |
| format-check | 1 |
| tokens-check | 0 |
| test | 1 |
| build | 0 |
| audit-full | 1 |
| audit-high | 0 |
| seed | 0 |
| e2e-default-pre | 1 |
| publish-home-ar-on | 0 |
| e2e-default | 1 |
| e2e-gpu | 0 |
| e2e-p3t5-prodflag | 0 |
| owner-shots | 1 |
| sky-swap-en | 0 |
| sky-swap-ar | 0 |
| arabic-off | 0 |
| gates-throttle10-r1 | 0 |
| gates-throttle10-r2 | 0 |
| gates-throttle10-r3 | 0 |
| gates-held-r1 | 0 |
| gates-held-r2 | 0 |
| timeline-r1 | 0 |
| timeline-r2 | 0 |
| timeline-r3 | 0 |
| gates-onscreen3s-r1 | 0 |
| gates-onscreen3s-r2 | 0 |
| gates-onscreen3s-r3 | 0 |
| gates-immediate-r1 | 0 |
| gates-immediate-r2 | 0 |
| gates-immediate-r3 | 0 |
| gates-latest-r1 | 0 |
| gates-latest-r2 | 0 |
| gates-latest-r3 | 0 |
| lh-mobile-try1 | 0 |
| lh-mobile-try2 | 0 |
| lh-mobile-try3 | 0 |
| lh-desktop | 0 |

## CTO timeline script (click 2 s after scrolling to the card)

| run | click→live ms | max long task ms (click..+9 s) | max frame gap in flights ms | tiers after live |
|---|---|---|---|---|
| timeline-r1.json | 4077 | 50 | 150 | low |
| timeline-r2.json | 1971 | 58 | 83 | low |
| timeline-r3.json | 1960 | 66 | 117 | low |

## Gate script (scripts/cards-gates.mjs)

| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | pass |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gates-held-r1 | held | 8077 | stills/fire//timeout/ | null | 60 | 0 |  |  | fire | 1.06 | all |
| gates-held-r2 | held | 8096 | stills/fire//timeout/ | null | 69 | 0 |  |  | fire | 1.06 | all |
| gates-immediate-r1 | immediate | 4911 | live/fire/low//canvas | 4911 | 58 | 83 | low | 9, 4, 5 | fire | 1.06 | FAIL live |
| gates-immediate-r2 | immediate | 5190 | live/fire/low//canvas | 5190 | 74 | 117 | low | 5, 4, 6 | fire | 1.06 | FAIL live FAIL flightGap |
| gates-immediate-r3 | immediate | 4899 | live/fire/low//canvas | 4899 | 71 | 100 | low | 8, 6, 4 | fire | 1.06 | FAIL live FAIL flightGap |
| gates-latest-r1 | latest | 5282 | live/plumbing/low//canvas | 5282 | 70 | 100 | low | 7, 7 | plumbing | 1.06 | FAIL live FAIL flightGap |
| gates-latest-r2 | latest | 5131 | live/plumbing/low//canvas | 5131 | 59 | 117 | low | 12, 6 | plumbing | 1.06 | FAIL live FAIL flightGap |
| gates-latest-r3 | latest | 4980 | live/plumbing/low//canvas | 4980 | 85 | 100 | low | 10, 11 | plumbing | 1.06 | FAIL live FAIL flightGap |
| gates-onscreen3s-r1 | onscreen3s | 761 | live/fire/low//canvas | 761 | 58 | 117 | low | 12, 5, 8 | fire | 1.0424 | FAIL flightGap |
| gates-onscreen3s-r2 | onscreen3s | 693 | live/fire/low//canvas | 693 | 0 | 67 | low | 10, 8, 7 | fire | 1.0418 | all |
| gates-onscreen3s-r3 | onscreen3s | 1095 | live/fire/lite//canvas | 1095 | 50 | 67 | lite | 4, 12, 8 | fire | 1.0523 | all |
| gates-throttle10-r1 | throttle10 | 9481 | stills/fire//timeout/ | null | 756 | 0 |  |  | fire | 1.06 | all |
| gates-throttle10-r2 | throttle10 | 8645 | stills/fire//timeout/ | null | 760 | 0 |  |  | fire | 1.06 | all |
| gates-throttle10-r3 | throttle10 | 8295 | stills/fire//too-slow/ | null | 564 | 0 |  |  | fire | 1.06 | all |

## O-13 sky swap (scripts/sky-swap.mjs): gate = top band within ±6 per channel; luma and floor are information only

| case | state | tier | live ms | top Δ RGB | info: luma Δ | info: floor Δ RGB | pass |
|---|---|---|---|---|---|---|---|
| ar-1440-dpr1 | live | lite | 884 | 0.1 -0.2 -2.3 | 14.5 | -117.4 -77 -10.5 | pass |
| ar-1440-dpr2 | live | lite | 163 | 0.2 -0.1 -2.2 | 14.2 | -117.6 -77.2 -10.5 | pass |
| ar-390-dpr3 | live | lite | 163 | 2.6 1.2 -1 | 12.5 | -105 -67.7 -5.5 | pass |
| en-1440-dpr1 | live | lite | 2491 | -1.4 -1.1 -2.9 | 15.8 | -106.1 -67.4 -7.2 | pass |
| en-1440-dpr2 | live | low | 173 | -1.1 -1 -2.9 | 15.8 | -106.1 -67.4 -7.2 | pass |
| en-390-dpr3 | live | lite | 190 | 0.9 0.1 -1.5 | 13.8 | -101.8 -63.9 -2 | pass |

## Arabic switch after the run

`"arabicEnabled":false`

## Lighthouse 13.5.0 /en

| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |
|---|---|---|---|---|---|---|---|
| en-desktop.json | 96 | 96 | 81 | 100 | 1251 | 21 | 0.000 |
| en-mobile-try1.json | 68 | 96 | 81 | 100 | 5457 | 230 | 0.000 |
| en-mobile-try2.json | 67 | 96 | 81 | 100 | 5629 | 236 | 0.001 |
| en-mobile-try3.json | 68 | 96 | 81 | 100 | 5473 | 216 | 0.001 |
