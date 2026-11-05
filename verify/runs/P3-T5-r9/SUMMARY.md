# P3-T5 r9 — generated summary (do not edit; run scripts/summarize.mjs)

HEAD ade80fd4920ff1a3d5e37dd2bcfff7426c965179

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
| owner-shots | 0 |
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
| lh-desktop | 1 |

## CTO timeline script (click 2 s after scrolling to the card)

| run | click→live ms | max long task ms (click..+9 s) | max frame gap in flights ms | tiers after live |
|---|---|---|---|---|
| timeline-r1.json | 1403 | 0 | 50 | low |
| timeline-r2.json | 1078 | 0 | 67 | low |
| timeline-r3.json | 1262 | 91 | 50 | low |

## Gate script (scripts/cards-gates.mjs)

| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | pass |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gates-held-r1 | held | 8083 | stills/fire//timeout/ | null | 54 | 0 |  |  | fire | 1.06 | all |
| gates-held-r2 | held | 8091 | stills/fire//timeout/ | null | 77 | 0 |  |  | fire | 1.06 | all |
| gates-immediate-r1 | immediate | 3775 | live/fire/low//canvas | 3775 | 118 | 67 | low | 26, 46, 16 | fire | 1.06 | FAIL live |
| gates-immediate-r2 | immediate | 3603 | live/fire/low//canvas | 3603 | 73 | 50 | low | 31, 24, 20 | fire | 1.06 | FAIL live |
| gates-immediate-r3 | immediate | 3403 | live/fire/low//canvas | 3403 | 70 | 50 | low | 18, 21, 17 | fire | 1.06 | FAIL live |
| gates-latest-r1 | latest | 3806 | live/plumbing/low//canvas | 3806 | 167 | 67 | low | 39, 19 | plumbing | 1.06 | FAIL live |
| gates-latest-r2 | latest | 3619 | live/plumbing/low//canvas | 3619 | 90 | 50 | low | 13, 19 | plumbing | 1.06 | FAIL live |
| gates-latest-r3 | latest | 3816 | live/plumbing/low//canvas | 3816 | 103 | 67 | low | 33, 49 | plumbing | 1.06 | FAIL live |
| gates-onscreen3s-r1 | onscreen3s | 574 | live/fire/low//canvas | 574 | 58 | 83 | low | 14, 18, 15 | fire | 1.0375 | all |
| gates-onscreen3s-r2 | onscreen3s | 708 | live/fire/low//canvas | 708 | 0 | 50 | low | 19, 23, 20 | fire | 1.0424 | all |
| gates-onscreen3s-r3 | onscreen3s | 715 | live/fire/low//canvas | 715 | 50 | 83 | low | 30, 24, 19 | fire | 1.0404 | all |
| gates-throttle10-r1 | throttle10 | 7532 | live/fire/low//canvas | 7532 | 790 | 383 | low |  | fire | 1.06 | all |
| gates-throttle10-r2 | throttle10 | 8529 | stills/fire//timeout/ | null | 705 | 0 |  |  | fire | 1.06 | all |
| gates-throttle10-r3 | throttle10 | 9666 | stills/fire//timeout/ | null | 622 | 0 |  |  | fire | 1.06 | all |

## O-13 sky swap (scripts/sky-swap.mjs): gate = top band within ±6 per channel; luma and floor are information only

| case | state | tier | live ms | top Δ RGB | info: luma Δ | info: floor Δ RGB | pass |
|---|---|---|---|---|---|---|---|
| ar-1440-dpr1 | live | lite | 806 | 0.1 -0.2 -2.3 | 14.5 | -117.4 -77 -10.5 | pass |
| ar-1440-dpr2 | live | lite | 118 | 0.2 -0.1 -2.2 | 14.1 | -117.6 -77.2 -10.5 | pass |
| ar-390-dpr3 | live | lite | 161 | 2.6 1.2 -1 | 12.4 | -105 -67.7 -5.5 | pass |
| en-1440-dpr1 | live | lite | 671 | -1.4 -1.1 -2.9 | 15.7 | -106.1 -67.4 -7.2 | pass |
| en-1440-dpr2 | live | lite | 155 | -1.1 -1 -2.9 | 15.4 | -106.1 -67.4 -7.2 | pass |
| en-390-dpr3 | live | lite | 171 | 0.9 0.1 -1.5 | 13.7 | -101.8 -63.9 -2 | pass |

## Arabic switch after the run

`"arabicEnabled":false`

## Lighthouse 13.5.0 /en

| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |
|---|---|---|---|---|---|---|---|
| en-desktop.json | tool error NO_NAVSTART (kept, no score) | | | | | | |
| en-mobile-try1.json | 70 | 96 | 81 | 100 | 5381 | 194 | 0.001 |
| en-mobile-try2.json | 69 | 96 | 81 | 100 | 5576 | 199 | 0.001 |
| en-mobile-try3.json | 65 | 96 | 81 | 100 | 5862 | 254 | 0.001 |
