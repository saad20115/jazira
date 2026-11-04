# P3-T5 r7 — generated summary (do not edit; run scripts/summarize.mjs)

HEAD 70b5ce65bee425db6e03d118481b5763fed4eb1d

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
| timeline-r1.json | 1402 | 0 | 50 | low |
| timeline-r2.json | 1788 | 71 | 67 | low |
| timeline-r3.json | 1427 | 71 | 50 | low |

## Gate script (scripts/cards-gates.mjs)

| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | pass |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gates-held-r1 | held | 8096 | stills/fire//timeout/ | null | 75 | 0 |  |  | fire | 1.06 | all |
| gates-held-r2 | held | 8097 | stills/fire//timeout/ | null | 67 | 0 |  |  | fire | 1.06 | all |
| gates-immediate-r1 | immediate | 3727 | live/fire/low//canvas | 3727 | 86 | 117 | low | 10, 30, 9 | fire | 1.06 | FAIL live FAIL flightGap |
| gates-immediate-r2 | immediate | 3641 | live/fire/low//canvas | 3641 | 146 | 50 | low | 15, 11, 10 | fire | 1.06 | FAIL live |
| gates-immediate-r3 | immediate | 3816 | live/fire/low//canvas | 3816 | 89 | 50 | low | 9, 4, 9 | fire | 1.06 | FAIL live |
| gates-latest-r1 | latest | 3427 | live/plumbing/low//canvas | 3427 | 120 | 50 | low | 5, 9 | plumbing | 1.06 | FAIL live |
| gates-latest-r2 | latest | 3578 | live/plumbing/low//canvas | 3578 | 100 | 67 | low | 9, 6 | plumbing | 1.06 | FAIL live |
| gates-latest-r3 | latest | 3443 | live/plumbing/low//canvas | 3443 | 169 | 67 | low | 5, 20 | plumbing | 1.06 | FAIL live |
| gates-onscreen3s-r1 | onscreen3s | 842 | live/fire/low//canvas | 842 | 0 | 50 | low | 9, 6, 9 | fire | 1.0464 | all |
| gates-onscreen3s-r2 | onscreen3s | 697 | live/fire/low//canvas | 697 | 0 | 67 | low | 9, 14, 9 | fire | 1.0418 | all |
| gates-onscreen3s-r3 | onscreen3s | 654 | live/fire/low//canvas | 654 | 78 | 67 | low | 3, 13, 5 | fire | 1.0397 | all |
| gates-throttle10-r1 | throttle10 | 8502 | stills/fire//timeout/ | null | 975 | 0 |  |  | fire | 1.06 | all |
| gates-throttle10-r2 | throttle10 | 9658 | stills/fire//timeout/ | null | 1631 | 0 |  |  | fire | 1.06 | all |
| gates-throttle10-r3 | throttle10 | 9071 | stills/fire//timeout/ | null | 1910 | 0 |  |  | fire | 1.06 | all |

## O-13 sky swap (scripts/sky-swap.mjs): gate = top band within ±6 per channel; luma and floor are information only

| case | state | tier | live ms | top Δ RGB | info: luma Δ | info: floor Δ RGB | pass |
|---|---|---|---|---|---|---|---|
| ar-1440-dpr1 | live | lite | 422 | 0.1 -0.2 -2.3 | 14.5 | -117.4 -77 -10.5 | pass |
| ar-1440-dpr2 | live | lite | 163 | 0.2 -0.1 -2.2 | 14.1 | -117.6 -77.2 -10.5 | pass |
| ar-390-dpr3 | live | lite | 174 | 2.6 1.2 -1 | 12.4 | -105 -67.7 -5.5 | pass |
| en-1440-dpr1 | live | lite | 529 | -1.4 -1.1 -2.9 | 15.7 | -106.1 -67.4 -7.2 | pass |
| en-1440-dpr2 | live | lite | 174 | -1.1 -1 -2.9 | 15.4 | -106.1 -67.4 -7.2 | pass |
| en-390-dpr3 | live | lite | 169 | 0.9 0.1 -1.5 | 13.7 | -101.8 -63.9 -2 | pass |

## Arabic switch after the run

`"arabicEnabled":false`

## Lighthouse 13.5.0 /en

| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |
|---|---|---|---|---|---|---|---|
| en-desktop.json | 96 | 96 | 81 | 100 | 1223 | 6 | 0.000 |
| en-mobile-try1.json | 66 | 96 | 81 | 100 | 5685 | 261 | 0.001 |
| en-mobile-try2.json | 67 | 96 | 81 | 100 | 5726 | 237 | 0.001 |
| en-mobile-try3.json | 68 | 96 | 81 | 100 | 5589 | 198 | 0.001 |
