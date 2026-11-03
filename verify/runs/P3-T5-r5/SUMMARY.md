# P3-T5 r5 — generated summary (do not edit; run scripts/summarize.mjs)

HEAD 71d845727317b6a642b45e254a17d29852c3e969

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
| gates-latest-r3 | 0 |
| lh-mobile-try1 | 0 |
| lh-mobile-try2 | 1 |
| lh-mobile-try3 | 0 |
| lh-desktop | 0 |

## CTO timeline script (click 2 s after scrolling to the card), final code

| run | click→live ms | max long task ms (click..+9 s) | max frame gap in flights ms | tiers after live |
|---|---|---|---|---|
| timeline-r1.json | 7711 | 108 | 100 | low |
| timeline-r2.json | 5555 | 128 | 117 | low |
| timeline-r3.json | 3959 | 88 | 83 | low |

## Gate script (scripts/cards-gates.mjs), final code

| run | mode | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | pass |
|---|---|---|---|---|---|---|---|---|---|
| gates-immediate-r1 | immediate | 8198 | 116 | 117 | low | 5, 11, 9 | fire | 1.06 | FAIL live FAIL flightGap |
| gates-immediate-r2 | immediate | null | 218 | 100 |  | 25, 17, 18 | fire | 1.06 | FAIL live FAIL longTask FAIL flightGap FAIL tier |
| gates-immediate-r3 | immediate | 5670 | 89 | 183 | low | 13, 4, 13 | fire | 1.06 | FAIL live FAIL flightGap |
| gates-latest-r1 | latest | 6130 | 66 | 100 | low | 11, 6 | plumbing | 1.06 | FAIL live FAIL flightGap |
| gates-latest-r2 | latest | 6756 | 83 | 100 | low | 13, 11 | plumbing | 1.06 | FAIL live FAIL flightGap |
| gates-latest-r3 | latest | 6374 | 84 | 67 | low | 9, 9 | plumbing | 1.06 | FAIL live |
| gates-onscreen3s-r1 | onscreen3s | 1071 | 136 | 133 | low | 12, 9, 8 | fire | 1.0523 | FAIL flightGap |
| gates-onscreen3s-r2 | onscreen3s | 1168 | 65 | 167 | low | 8, 9, 10 | fire | 1.0537 | FAIL flightGap |
| gates-onscreen3s-r3 | onscreen3s | null | 116 | 150 |  | 14, 9, 37 | fire | 1.06 | FAIL live FAIL flightGap FAIL tier |

## Lighthouse 13.5.0 /en

| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |
|---|---|---|---|---|---|---|---|
| en-desktop.json | 94 | 96 | 81 | 100 | 1404 | 36 | 0.000 |
| en-mobile-try1.json | 63 | 96 | 81 | 100 | 6123 | 277 | 0.000 |
| en-mobile-try2.json | tool error NO_NAVSTART (kept, no score) | | | | | | |
| en-mobile-try3.json | 62 | 96 | 81 | 100 | 5693 | 358 | 0.001 |
| en-mobile-try4-after-try2-NO_NAVSTART.json | 69 | 96 | 81 | 100 | 5743 | 203 | 0.001 |
