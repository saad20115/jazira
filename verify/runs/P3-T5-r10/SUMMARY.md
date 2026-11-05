# P3-T5 r10 — generated summary (do not edit; run scripts/summarize.mjs)

HEAD 43d12b929780b034761a25e81e907731081c49b1

## Parts A and B steps (summary.tsv)

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

## CTO timeline script (click 2 s after scrolling to the card), part B

| run | click→live ms | max long task ms (click..+9 s) | max frame gap in flights ms | tiers after live |
|---|---|---|---|---|
| timeline-r1.json | 3151 | 140 | 50 | low |
| timeline-r2.json | 1307 | 186 | 183 | lite |
| timeline-r3.json | 3352 | 273 | 100 | low |

## Gate script (scripts/cards-gates.mjs), parts A and B

| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | O-14b stills after live ms | O-14b long / gap after live+3 s ms | pass |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gates-held-r1 | held | 8095 | stills/fire//timeout/ | null | 128 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| gates-held-r2 | held | 8100 | stills/fire//timeout/ | null | 118 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| gates-immediate-r1 | immediate | 3972 | live/fire/low//canvas | 3972 | 207 | 67 | low | 59, 10, 75 | fire | 1.06 | null | 0 / 0 | FAIL live FAIL longTask |
| gates-immediate-r2 | immediate | 4281 | live/fire/low//canvas | 4281 | 194 | 100 | low | 33, 9, 88 | fire | 1.06 | null | 54 / 50 | FAIL live FAIL flightGap |
| gates-immediate-r3 | immediate | 3650 | live/fire/low//canvas | 3650 | 67 | 83 | low | 32, 10, 21 | fire | 1.06 | null | 0 / 0 | FAIL live |
| gates-latest-r1 | latest | 3878 | live/plumbing/low//canvas | 3878 | 103 | 67 | low | 13, 18 | plumbing | 1.06 | null | 0 / 50 | FAIL live |
| gates-latest-r2 | latest | 3993 | live/plumbing/low//canvas | 3993 | 263 | 67 | low | 29, 20 | plumbing | 1.06 | null | 0 / 0 | FAIL live FAIL longTask |
| gates-latest-r3 | latest | 3800 | live/plumbing/low//canvas | 3800 | 129 | 150 | low | 26, 53 | plumbing | 1.06 | null | 0 / 0 | FAIL live FAIL flightGap |
| gates-onscreen3s-r1 | onscreen3s | 889 | live/fire/low//canvas | 889 | 133 | 133 | low | 15, 10, 26 | fire | 1.0469 | null | 0 / 50 | FAIL flightGap |
| gates-onscreen3s-r2 | onscreen3s | 1294 | live/fire/low//canvas | 1294 | 67 | 67 | low | 16, 11, 32 | fire | 1.0546 | null | 0 / 50 | all |
| gates-onscreen3s-r3 | onscreen3s | 1525 | stills/fire//too-slow/ | null | 73 | 50 |  | 11, 8, 7 | fire | 1.0569 | null | 0 / 0 | FAIL live FAIL tier |
| gates-throttle10-r1 | throttle10 | 8297 | stills/fire//timeout/ | null | 1962 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| gates-throttle10-r2 | throttle10 | 9870 | stills/fire//timeout/ | null | 1499 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| gates-throttle10-r3 | throttle10 | 8946 | stills/fire//timeout/ | null | 797 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |

## O-13 sky swap (scripts/sky-swap.mjs): gate = top band within ±6 per channel; luma and floor are information only

| case | state | tier | live ms | top Δ RGB | info: luma Δ | info: floor Δ RGB | pass |
|---|---|---|---|---|---|---|---|
| ar-1440-dpr1 | live | lite | 424 | 0.1 -0.2 -2.3 | 14.5 | -117.4 -77 -10.5 | pass |
| ar-1440-dpr2 | live | lite | 93 | 0.2 -0.1 -2.2 | 14.2 | -117.6 -77.2 -10.5 | pass |
| ar-390-dpr3 | live | lite | 190 | 2.6 1.2 -1 | 12.4 | -105 -67.7 -5.5 | pass |
| en-1440-dpr1 | live | lite | 447 | -1.4 -1.1 -2.9 | 15.8 | -106.1 -67.4 -7.2 | pass |
| en-1440-dpr2 | live | lite | 162 | -1.1 -1 -2.9 | 15.4 | -106.1 -67.4 -7.2 | pass |
| en-390-dpr3 | live | lite | 164 | 0.9 0.1 -1.5 | 13.7 | -101.8 -63.9 -2 | pass |

## Arabic switch after the run

`"arabicEnabled":false`

## Lighthouse 13.5.0 /en, part B

| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |
|---|---|---|---|---|---|---|---|
| en-desktop.json | tool error NO_NAVSTART (kept, no score) | | | | | | |
| en-mobile-try1.json | 61 | 96 | 81 | 100 | 5771 | 380 | 0.001 |
| en-mobile-try2.json | 67 | 96 | 81 | 100 | 5501 | 257 | 0.001 |
| en-mobile-try3.json | 56 | 96 | 81 | 100 | 5818 | 530 | 0.001 |

## Part B2: clean re-run of part B (browser pane on a blank file; see README)

`43d12b929780b034761a25e81e907731081c49b1`

### Part B2 steps

| step | exit |
|---|---|
| build | 0 |
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

### Part B2 timeline

| run | click→live ms | max long task ms (click..+9 s) | max frame gap in flights ms | tiers after live |
|---|---|---|---|---|
| timeline-r1.json | 1954 | 353 | 67 | low |
| timeline-r2.json | 4091 | 420 | 100 | low |
| timeline-r3.json | 2890 | 275 | 133 | low |

### Part B2 gates

| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | O-14b stills after live ms | O-14b long / gap after live+3 s ms | pass |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gates-immediate-r1 | immediate | 3977 | live/fire/low//canvas | 3977 | 82 | 117 | low | 26, 13, 22 | fire | 1.06 | null | 0 / 50 | FAIL live FAIL flightGap |
| gates-immediate-r2 | immediate | 3719 | live/fire/low//canvas | 3719 | 97 | 100 | low | 43, 16, 19 | fire | 1.06 | null | 0 / 50 | FAIL live FAIL flightGap |
| gates-immediate-r3 | immediate | 3711 | live/fire/low//canvas | 3711 | 174 | 83 | low | 25, 16, 21 | fire | 1.06 | null | 0 / 0 | FAIL live |
| gates-latest-r1 | latest | 3879 | live/plumbing/low//canvas | 3879 | 140 | 67 | low | 30, 23 | plumbing | 1.06 | null | 0 / 50 | FAIL live |
| gates-latest-r2 | latest | 3780 | live/plumbing/low//canvas | 3780 | 119 | 67 | low | 27, 17 | plumbing | 1.06 | null | 0 / 67 | FAIL live |
| gates-latest-r3 | latest | 4063 | live/plumbing/lite//canvas | 4063 | 311 | 67 | lite | 30, 18 | plumbing | 1.06 | null | 0 / 0 | FAIL live FAIL longTask |
| gates-onscreen3s-r1 | onscreen3s | 770 | live/fire/low//canvas | 770 | 63 | 100 | low | 38, 42, 73 | fire | 1.0431 | null | 52 / 50 | FAIL flightGap |
| gates-onscreen3s-r2 | onscreen3s | 7230 | live/fire/low//canvas | 7230 | 701 | 67 | low | 26, 25, 29 | fire | 1.06 | null | 0 / 0 | FAIL live FAIL longTask |
| gates-onscreen3s-r3 | onscreen3s | 2585 | live/fire/low//canvas | 2585 | 81 | 100 | low | 16, 12, 21 | fire | 1.0599 | null | 54 / 83 | FAIL live FAIL flightGap |

### Part B2 Lighthouse 13.5.0 /en

| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |
|---|---|---|---|---|---|---|---|
| en-desktop.json | 96 | 96 | 81 | 100 | 1264 | 13 | 0.000 |
| en-mobile-try1.json | 58 | 96 | 81 | 100 | 5808 | 484 | 0.001 |
| en-mobile-try2.json | 65 | 96 | 81 | 100 | 5653 | 296 | 0.000 |
| en-mobile-try3.json | 65 | 96 | 81 | 100 | 5674 | 288 | 0.001 |

## m11 must-fail (executor mutant: the switch flies via the overview), @gpu O-16 test only

| step | exit |
|---|---|
| stop-partA-server | 0 |
| apply-m11 | 0 |
| build | 0 |
| e2e-gpu-o16-mutant | 1 |
| stop-mutant-server | 0 |
| revert-m11 | 0 |

Lines from `m11/logs/e2e-gpu-o16-mutant.log`:

```
Error: hvac → fire: nearest the overview
Expected: > 8
Received:   0.011188936781609196
1 failed
```
