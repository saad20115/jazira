# P3-T5 r4 — generated summary (do not edit; run scripts/summarize.mjs)

HEAD 43d37293f02bb528dd722a1d623983fd835784dc

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
| publish-home | 0 |
| e2e-default | 1 |
| e2e-gpu | 0 |
| e2e-p3t5-prodflag | 0 |
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
| lh-mobile-try1 | 0 |
| lh-mobile-try2 | 0 |
| lh-mobile-try3 | 0 |
| lh-desktop | 0 |

## CTO timeline script (click 2 s after scrolling to the card), final code

| run | click→live ms | max long task ms (click..+9 s) | max frame gap in flights ms | tiers after live |
|---|---|---|---|---|
| timeline-r1.json | 1818 | 466 | 117 | low |
| timeline-r2.json | 1878 | 98 | 67 | low |
| timeline-r3.json | 1903 | 211 | 50 | low |

## Gate script (scripts/cards-gates.mjs), final code

| run | mode | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | pass |
|---|---|---|---|---|---|---|---|---|---|
| gates-immediate-r1 | immediate | 4156 | 234 | 67 | low | 8, 6, 9 | fire | 1.06 | FAIL live FAIL longTask |
| gates-immediate-r2 | immediate | 4144 | 238 | 67 | low | 4, 13, 7 | fire | 1.06 | FAIL live FAIL longTask |
| gates-immediate-r3 | immediate | 3701 | 262 | 67 | low | 5, 5, 5 | fire | 1.06 | FAIL live FAIL longTask |
| gates-latest-r1 | latest | 3743 | 318 | 67 | low | 8, 9 | plumbing | 1.06 | FAIL live FAIL longTask |
| gates-latest-r2 | latest | 4740 | 351 | 67 | low | 3, 12 | plumbing | 1.06 | FAIL live FAIL longTask |
| gates-onscreen3s-r1 | onscreen3s | 683 | 115 | 50 | low | 9, 8, 6 | fire | 1.0411 | all |
| gates-onscreen3s-r2 | onscreen3s | 849 | 140 | 67 | low | 9, 9, 8 | fire | 1.0469 | all |
| gates-onscreen3s-r3 | onscreen3s | 1255 | 61 | 67 | low | 8, 20, 14 | fire | 1.0548 | all |

## Must-fail: mutant o9-no-preparation (mutant-o9/)

| run | click→live ms | max long task ms |
|---|---|---|
| timeline-r1.json | 5509 | 579 |
| timeline-r2.json | 4376 | 339 |
| timeline-r3.json | 4415 | 283 |

| run | mode | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | pass |
|---|---|---|---|---|---|---|---|---|---|
| gates-onscreen3s-r1 | onscreen3s | 3823 | 348 | 67 | low | 5, 7, 11 | fire | 1.06 | FAIL live FAIL longTask |
| gates-onscreen3s-r2 | onscreen3s | 4822 | 225 | 117 | low | 6, 7, 8 | fire | 1.06 | FAIL live FAIL longTask FAIL flightGap |
| gates-onscreen3s-r3 | onscreen3s | 4179 | 208 | 100 | low | 5, 13, 6 | fire | 1.06 | FAIL live FAIL longTask FAIL flightGap |

## Lighthouse 13.5.0 /en

| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |
|---|---|---|---|---|---|---|---|
| en-desktop.json | 95 | 96 | 81 | 100 | 1351 | 17 | 0.000 |
| en-mobile-try1.json | 71 | 96 | 81 | 100 | 5550 | 139 | 0.001 |
| en-mobile-try2.json | 68 | 96 | 81 | 100 | 5569 | 216 | 0.001 |
| en-mobile-try3.json | 68 | 96 | 81 | 100 | 5478 | 224 | 0.001 |
