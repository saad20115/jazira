# P3-T5 r8 — generated summary (do not edit; run scripts/summarize.mjs)

HEAD 5ab8fc38856ecbf07b2c1a3fb273e917f034fad3

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
| lh-desktop | 0 |

## CTO timeline script (click 2 s after scrolling to the card)

| run | click→live ms | max long task ms (click..+9 s) | max frame gap in flights ms | tiers after live |
|---|---|---|---|---|
| timeline-r1.json | 1698 | 84 | 83 | low |
| timeline-r2.json | 1572 | 60 | 50 | low |
| timeline-r3.json | 1525 | 67 | 67 | low |

## Gate script (scripts/cards-gates.mjs)

| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | pass |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gates-held-r1 | held | 8090 | stills/fire//timeout/ | null | 69 | 0 |  |  | fire | 1.06 | all |
| gates-held-r2 | held | 8092 | stills/fire//timeout/ | null | 66 | 0 |  |  | fire | 1.06 | all |
| gates-immediate-r1 | immediate | 3648 | live/fire/low//canvas | 3648 | 87 | 50 | low | 19, 19, 17 | fire | 1.06 | FAIL live |
| gates-immediate-r2 | immediate | 3763 | live/fire/low//canvas | 3763 | 246 | 67 | low | 45, 35, 21 | fire | 1.06 | FAIL live FAIL longTask |
| gates-immediate-r3 | immediate | 3124 | live/fire/low//canvas | 3124 | 346 | 83 | low | 22, 37, 37 | fire | 1.06 | FAIL live FAIL longTask |
| gates-latest-r1 | latest | 3962 | live/plumbing/low//canvas | 3962 | 222 | 100 | low | 23, 20 | plumbing | 1.06 | FAIL live FAIL longTask FAIL flightGap |
| gates-latest-r2 | latest | 3716 | live/plumbing/low//canvas | 3716 | 272 | 50 | low | 51, 24 | plumbing | 1.06 | FAIL live FAIL longTask |
| gates-latest-r3 | latest | 3993 | live/plumbing/low//canvas | 3993 | 151 | 100 | low | 25, 23 | plumbing | 1.06 | FAIL live FAIL flightGap |
| gates-onscreen3s-r1 | onscreen3s | 630 | live/fire/low//canvas | 630 | 0 | 50 | low | 17, 30, 17 | fire | 1.039 | all |
| gates-onscreen3s-r2 | onscreen3s | 625 | live/fire/low//canvas | 625 | 87 | 50 | low | 25, 22, 17 | fire | 1.0382 | all |
| gates-onscreen3s-r3 | onscreen3s | 818 | live/fire/low//canvas | 818 | 0 | 50 | low | 22, 18, 21 | fire | 1.0464 | all |
| gates-throttle10-r1 | throttle10 | 8372 | stills/fire//timeout/ | null | 923 | 0 |  |  | fire | 1.06 | all |
| gates-throttle10-r2 | throttle10 | 8258 | stills/fire//timeout/ | null | 971 | 0 |  |  | fire | 1.06 | all |
| gates-throttle10-r3 | throttle10 | 9003 | stills/fire//timeout/ | null | 1152 | 0 |  |  | fire | 1.06 | all |

## O-13 sky swap (scripts/sky-swap.mjs): gate = top band within ±6 per channel; luma and floor are information only

| case | state | tier | live ms | top Δ RGB | info: luma Δ | info: floor Δ RGB | pass |
|---|---|---|---|---|---|---|---|
| ar-1440-dpr1 | live | lite | 526 | 0.1 -0.2 -2.3 | 14.5 | -117.4 -77 -10.5 | pass |
| ar-1440-dpr2 | live | lite | 171 | 0.2 -0.1 -2.2 | 14.1 | -117.6 -77.2 -10.5 | pass |
| ar-390-dpr3 | live | lite | 166 | 2.6 1.2 -1 | 12.3 | -105 -67.7 -5.5 | pass |
| en-1440-dpr1 | live | lite | 527 | -1.4 -1.1 -2.9 | 15.8 | -106.1 -67.4 -7.2 | pass |
| en-1440-dpr2 | live | lite | 176 | -1.1 -1 -2.9 | 15.4 | -106.1 -67.4 -7.2 | pass |
| en-390-dpr3 | live | lite | 166 | 0.9 0.1 -1.5 | 13.7 | -101.8 -63.9 -2 | pass |

## Arabic switch after the run

`"arabicEnabled":false`

## Lighthouse 13.5.0 /en

| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |
|---|---|---|---|---|---|---|---|
| en-desktop.json | 97 | 96 | 81 | 100 | 1197 | 1 | 0.000 |
| en-mobile-try1.json | 72 | 96 | 81 | 100 | 5623 | 76 | 0.001 |
| en-mobile-try2.json | 65 | 96 | 81 | 100 | 5534 | 298 | 0.001 |
| en-mobile-try3.json | 72 | 96 | 81 | 100 | 5569 | 95 | 0.001 |
