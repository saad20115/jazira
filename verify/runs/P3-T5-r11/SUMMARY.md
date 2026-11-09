# P3-T5 r11 — generated summary (do not edit; run scripts/summarize.mjs)

HEAD d579282b7a97873abbfc664a617802a050ca538b

## 2026-11-05 parts A and B steps (summary.tsv)

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

## 2026-11-05 part B: CTO timeline script

| run | click→live ms | max long task ms (click..+9 s) | max frame gap in flights ms | tiers after live | ever stills |
|---|---|---|---|---|---|
| timeline-r1.json | 6587 | 155 | 133 | low | false |
| timeline-r2.json | 2427 | 151 | 167 | low | false |
| timeline-r3.json | 2832 | 134 | 133 | low | false |

## 2026-11-05 parts A and B: gate script (scripts/cards-gates.mjs)

| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | O-14b stills after live ms | O-14b long / gap after live+3 s ms | pass |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gates-held-r1 | held | 8086 | stills/fire//timeout/ | null | 76 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| gates-held-r2 | held | 8094 | stills/fire//timeout/ | null | 68 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| gates-immediate-r1 | immediate | 6851 | live/fire/low//canvas | 6851 | 224 | 133 | low | 28, 44, 25 | fire | 1.06 | null | 0 / 0 | FAIL live FAIL longTask FAIL flightGap |
| gates-immediate-r2 | immediate | 4364 | live/fire/low//canvas | 4364 | 215 | 83 | low | 27, 11, 26 | fire | 1.06 | null | 80 / 67 | FAIL live FAIL longTask |
| gates-immediate-r3 | immediate | 4201 | live/fire/low//canvas | 4201 | 88 | 83 | low | 27, 12, 37 | fire | 1.06 | null | 0 / 0 | FAIL live |
| gates-latest-r1 | latest | 4328 | live/plumbing/low//canvas | 4328 | 307 | 83 | low | 120, 28 | plumbing | 1.06 | null | 80 / 83 | FAIL live FAIL longTask |
| gates-latest-r2 | latest | 4317 | live/plumbing/low//canvas | 4317 | 183 | 117 | low | 42, 33 | plumbing | 1.06 | null | 112 / 117 | FAIL live FAIL flightGap |
| gates-latest-r3 | latest | 4119 | live/plumbing/low//canvas | 4119 | 108 | 67 | low | 35, 44 | plumbing | 1.06 | null | 0 / 0 | FAIL live |
| gates-onscreen3s-r1 | onscreen3s | 1227 | live/fire/low//canvas | 1227 | 113 | 117 | low | 18, 18, 32 | fire | 1.0544 | null | 55 / 50 | FAIL flightGap |
| gates-onscreen3s-r2 | onscreen3s | 977 | live/fire/low//canvas | 977 | 150 | 150 | low, | 21, 12, 18 | fire | 1.0469 | 20914 | 193 / 217 | FAIL flightGap FAIL tier |
| gates-onscreen3s-r3 | onscreen3s | 752 | live/fire/low//canvas | 752 | 77 | 83 | low | 41, 21, 27 | fire | 1.0424 | null | 0 / 50 | all |
| gates-throttle10-r1 | throttle10 | 9270 | stills/fire//timeout/ | null | 1863 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| gates-throttle10-r2 | throttle10 | 8628 | stills/fire//timeout/ | null | 2238 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| gates-throttle10-r3 | throttle10 | 8214 | stills/fire//timeout/ | null | 611 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |

## O-13 sky swap (scripts/sky-swap.mjs): gate = top band within ±6 per channel; luma and floor are information only

| case | state | tier | live ms | top Δ RGB | info: luma Δ | info: floor Δ RGB | pass |
|---|---|---|---|---|---|---|---|
| ar-1440-dpr1 | live | lite | 1107 | 0.1 -0.2 -2.3 | 14.5 | -117.4 -77 -10.5 | pass |
| ar-1440-dpr2 | live | low | 134 | 0.2 -0.1 -2.2 | 14.5 | -117.6 -77.2 -10.5 | pass |
| ar-390-dpr3 | live | lite | 185 | 2.6 1.2 -1 | 12.3 | -105 -67.7 -5.5 | pass |
| en-1440-dpr1 | live | lite | 724 | -1.4 -1.1 -2.9 | 15.7 | -106.1 -67.4 -7.2 | pass |
| en-1440-dpr2 | live | low | 189 | -1.1 -1 -2.9 | 15.8 | -106.1 -67.4 -7.2 | pass |
| en-390-dpr3 | live | lite | 210 | 0.9 0.1 -1.5 | 13.8 | -101.8 -63.9 -2 | pass |

## Arabic switch after part A

`"arabicEnabled":false`

## 2026-11-05 part B: Lighthouse 13.5.0 /en

| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |
|---|---|---|---|---|---|---|---|
| en-desktop.json | 96 | 96 | 81 | 100 | 1244 | 11 | 0.000 |
| en-mobile-try1.json | 69 | 96 | 81 | 100 | 5629 | 172 | 0.000 |
| en-mobile-try2.json | 68 | 96 | 81 | 100 | 5632 | 196 | 0.001 |
| en-mobile-try3.json | 64 | 96 | 81 | 100 | 5929 | 266 | 0.001 |

## 2026-11-05 interleaved r9 (3326) / r11 (3328), machine diagnosis

```
CTO verifier machine diagnosis, 2026-11-05 ~16:45 (after the interleaved r9/r11 runs)
- GPU 3D engine utilisation (Windows counter \GPU Engine(*engtype_3D)\Utilization Percentage), idle machine:
  avpui (Kaspersky UI, PID 13636, started 2026-11-04 08:34, no visible window): 34.4-35.1 % in 5 samples over 10 s.
  dwm: ~3 %. Nothing else above 0.5 %.
- RAM: 4.2 GB free of 19.9 GB; uptime 32.2 h; the user's Chrome: 41 processes, ~5 GB (not touched).
- The interleaved runs (summary.tsv): the round 9 build, which passed this morning, now also fails O-9a, O-9b and O-9.
```

### 2026-11-05 interleaved gates (order in ab-2026-11-05/summary.tsv)

| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | O-14b stills after live ms | O-14b long / gap after live+3 s ms | pass |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r11-immediate-r1 | immediate | 6015 | stills/fire//too-slow/ | null | 267 | 0 |  | 11, 11, 17 | fire | 1.06 | null | 0 / 0 | FAIL live FAIL longTask FAIL tier |
| r11-immediate-r2 | immediate | 6619 | live/fire/low//canvas | 6619 | 464 | 150 | low | 31, 19, 25 | fire | 1.06 | null | 0 / 0 | FAIL live FAIL longTask FAIL flightGap |
| r11-immediate-r3 | immediate | 5606 | live/fire/low//canvas | 5606 | 198 | 83 | low | 56, 9, 17 | fire | 1.06 | null | 0 / 0 | FAIL live |
| r11-latest-r1 | latest | 4965 | live/plumbing/low//canvas | 4965 | 274 | 200 | low | 44, 30 | plumbing | 1.06 | null | 61 / 50 | FAIL live FAIL longTask FAIL flightGap |
| r11-latest-r2 | latest | 5645 | live/plumbing/low//canvas | 5645 | 235 | 83 | low | 46, 32 | plumbing | 1.06 | null | 0 / 0 | FAIL live FAIL longTask |
| r11-latest-r3 | latest | 4084 | live/plumbing/low//canvas | 4084 | 184 | 83 | low | 30, 31 | plumbing | 1.06 | null | 91 / 100 | FAIL live |
| r11-onscreen3s-r1 | onscreen3s | 994 | live/fire/low//canvas | 994 | 87 | 100 | low | 15, 11, 22 | fire | 1.0478 | null | 0 / 67 | FAIL flightGap |
| r11-onscreen3s-r2 | onscreen3s | 982 | live/fire/low//canvas | 982 | 100 | 133 | low | 22, 17, 32 | fire | 1.0507 | null | 88 / 100 | FAIL flightGap |
| r11-onscreen3s-r3 | onscreen3s | 908 | live/fire/low//canvas | 908 | 68 | 67 | low | 22, 21, 15 | fire | 1.0474 | null | 0 / 0 | all |
| r9-immediate-r1 | immediate | 6949 | live/fire/low//canvas | 6949 | 163 | 167 | low | 67, 51, 26 | fire | 1.06 | null | 0 / 0 | FAIL live FAIL flightGap |
| r9-immediate-r2 | immediate | 4283 | live/fire/low//canvas | 4283 | 101 | 117 | low | 35, 58, 35 | fire | 1.06 | null | 0 / 0 | FAIL live FAIL flightGap |
| r9-immediate-r3 | immediate | 4979 | live/fire/low//canvas | 4979 | 149 | 83 | low | 25, 47, 15 | fire | 1.06 | null | 0 / 0 | FAIL live |
| r9-latest-r1 | latest | 5178 | stills/plumbing//too-slow/ | null | 191 | 83 |  | 12, 12 | plumbing | 1.06 | null | 0 / 0 | FAIL live FAIL tier |
| r9-latest-r2 | latest | 5965 | live/plumbing/low//canvas | 5965 | 201 | 100 | low | 36, 59 | plumbing | 1.06 | null | 0 / 0 | FAIL live FAIL longTask FAIL flightGap |
| r9-latest-r3 | latest | 4189 | live/plumbing/low//canvas | 4189 | 128 | 67 | low | 64, 29 | plumbing | 1.06 | null | 0 / 50 | FAIL live |
| r9-onscreen3s-r1 | onscreen3s | 891 | live/fire/low//canvas | 891 | 88 | 100 | low | 25, 13, 37 | fire | 1.0464 | null | 88 / 83 | FAIL flightGap |
| r9-onscreen3s-r2 | onscreen3s | 847 | live/fire/low//canvas | 847 | 55 | 83 | low | 40, 33, 32 | fire | 1.0454 | null | 55 / 83 | all |
| r9-onscreen3s-r3 | onscreen3s | 2918 | live/fire/low//canvas | 2918 | 108 | 67 | low | 13, 23, 27 | fire | 1.06 | null | 0 / 50 | FAIL live |

## 2026-11-09 re-run (scripts/ab-r9-r11-quiet.sh, scripts/r11-timeline-lh.sh)

GPU sample after the runs (`quiet-2026-11-09/gpu-after-runs.txt`):

```
pid_2028_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 2.9
pid_32216_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 1.9
pid_2028_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 2.8
pid_32216_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 1.9
pid_2028_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 2.9
pid_32216_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 1.9
avpui: False
freeGB 4
sampled 2026-11-09 09:26
```

### 2026-11-09 interleaved steps (run order)

| step | exit |
|---|---|
| r9-immediate-r1 | r9 |
| r11-immediate-r1 | r11 |
| r9-latest-r1 | r9 |
| r11-latest-r1 | r11 |
| r9-onscreen3s-r1 | r9 |
| r11-onscreen3s-r1 | r11 |
| r11-immediate-r2 | r11 |
| r9-immediate-r2 | r9 |
| r11-latest-r2 | r11 |
| r9-latest-r2 | r9 |
| r11-onscreen3s-r2 | r11 |
| r9-onscreen3s-r2 | r9 |
| r9-immediate-r3 | r9 |
| r11-immediate-r3 | r11 |
| r9-latest-r3 | r9 |
| r11-latest-r3 | r11 |
| r9-onscreen3s-r3 | r9 |
| r11-onscreen3s-r3 | r11 |
| r11-throttle10-r1 | r11 |
| r11-throttle10-r2 | r11 |
| r11-throttle10-r3 | r11 |
| r11-held-r1 | r11 |
| r11-held-r2 | r11 |

### 2026-11-09 interleaved gates, r9 (control) and r11

| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks (from DOM pointerdown) ms | entered after first phase | max push-in scale | O-14b stills after live ms | O-14b long / gap after live+3 s ms | pass |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r11-held-r1 | held | 8090 | stills/fire//timeout/ | null | 90 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| r11-held-r2 | held | 8095 | stills/fire//timeout/ | null | 68 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| r11-immediate-r1 | immediate | 4278 | live/fire/low//canvas | 4278 | 205 | 100 | low | 51, 17, 30 | fire | 1.06 | null | 0 / 0 | FAIL live FAIL longTask FAIL flightGap |
| r11-immediate-r2 | immediate | 4009 | live/fire/low//canvas | 4009 | 184 | 150 | low | 36, 10, 16 | fire | 1.06 | null | 0 / 50 | FAIL live FAIL flightGap |
| r11-immediate-r3 | immediate | 3954 | live/fire/low//canvas | 3954 | 70 | 50 | low | 27, 11, 35 | fire | 1.06 | null | 56 / 50 | FAIL live |
| r11-latest-r1 | latest | 4728 | live/plumbing/low//canvas | 4728 | 274 | 117 | low | 36, 46 | plumbing | 1.06 | null | 113 / 117 | FAIL live FAIL longTask FAIL flightGap |
| r11-latest-r2 | latest | 4335 | live/plumbing/low//canvas | 4335 | 88 | 83 | low | 34, 40 | plumbing | 1.06 | null | 0 / 50 | FAIL live |
| r11-latest-r3 | latest | 4305 | live/plumbing/low//canvas | 4305 | 108 | 83 | low | 47, 30 | plumbing | 1.06 | null | 52 / 50 | FAIL live |
| r11-onscreen3s-r1 | onscreen3s | 778 | live/fire/low//canvas | 778 | 52 | 83 | low | 17, 19, 16 | fire | 1.0418 | null | 0 / 50 | all |
| r11-onscreen3s-r2 | onscreen3s | 776 | live/fire/low//canvas | 776 | 88 | 83 | low | 50, 17, 20 | fire | 1.0431 | null | 68 / 83 | all |
| r11-onscreen3s-r3 | onscreen3s | 733 | live/fire/low//canvas | 733 | 146 | 100 | low | 20, 15, 24 | fire | 1.0431 | null | 64 / 50 | FAIL flightGap |
| r11-throttle10-r1 | throttle10 | 8175 | stills/fire//timeout/ | null | 1743 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| r11-throttle10-r2 | throttle10 | 8829 | stills/fire//timeout/ | null | 589 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| r11-throttle10-r3 | throttle10 | 8586 | stills/fire//timeout/ | null | 1482 | 0 |  |  | fire | 1.06 | null | 0 / 0 | all |
| r9-immediate-r1 | immediate | 4310 | live/fire/low//canvas | 4310 | 175 | 133 | low | 31, 27, 16 | fire | 1.06 | null | 51 / 50 | FAIL live FAIL flightGap |
| r9-immediate-r2 | immediate | 4397 | live/fire/low//canvas | 4397 | 116 | 100 | low | 20, 36, 25 | fire | 1.06 | null | 0 / 0 | FAIL live FAIL flightGap |
| r9-immediate-r3 | immediate | 5156 | live/fire/low//canvas | 5156 | 332 | 83 | low | 26, 29, 22 | fire | 1.06 | null | 50 / 0 | FAIL live FAIL longTask |
| r9-latest-r1 | latest | 4609 | live/plumbing/low//canvas | 4609 | 92 | 100 | low | 67, 47 | plumbing | 1.06 | null | 51 / 50 | FAIL live FAIL flightGap |
| r9-latest-r2 | latest | 4662 | live/plumbing/low//canvas | 4662 | 196 | 133 | low | 37, 18 | plumbing | 1.06 | null | 0 / 0 | FAIL live FAIL flightGap |
| r9-latest-r3 | latest | 4209 | live/plumbing/low//canvas | 4209 | 271 | 67 | low | 26, 19 | plumbing | 1.06 | null | 0 / 50 | FAIL live FAIL longTask |
| r9-onscreen3s-r1 | onscreen3s | 897 | live/fire/low//canvas | 897 | 66 | 67 | low | 48, 49, 18 | fire | 1.0469 | null | 54 / 67 | all |
| r9-onscreen3s-r2 | onscreen3s | 909 | live/fire/low//canvas | 909 | 67 | 67 | low | 17, 24, 31 | fire | 1.0483 | null | 0 / 50 | all |
| r9-onscreen3s-r3 | onscreen3s | 708 | live/fire/low//canvas | 708 | 59 | 67 | low | 11, 16, 27 | fire | 1.0411 | null | 56 / 50 | all |

### 2026-11-09 r11 timeline and Lighthouse steps

| step | exit |
|---|---|
| timeline-r1 | 0 |
| timeline-r2 | 0 |
| timeline-r3 | 0 |
| lh-mobile-try1 | 0 |
| lh-mobile-try2 | 0 |
| lh-mobile-try3 | 0 |
| lh-desktop | 0 |

### 2026-11-09 r11 timelines

| run | click→live ms | max long task ms (click..+9 s) | max frame gap in flights ms | tiers after live | ever stills |
|---|---|---|---|---|---|
| timeline-r1.json | 1379 | 164 | 167 | low | false |
| timeline-r2.json | 1868 | 117 | 83 | low | false |
| timeline-r3.json | 1747 | 88 | 83 | low | false |

### 2026-11-09 r11 Lighthouse 13.5.0 /en

| run | perf | a11y | bp | seo | LCP ms | TBT ms | CLS |
|---|---|---|---|---|---|---|---|
| en-desktop.json | 100 | 96 | 100 | 100 | 787 | 6 | 0.001 |
| en-mobile-try1.json | 90 | 96 | 100 | 100 | 3498 | 63 | 0.000 |
| en-mobile-try2.json | 89 | 96 | 100 | 100 | 3568 | 93 | 0.001 |
| en-mobile-try3.json | 90 | 96 | 100 | 100 | 3437 | 69 | 0.000 |
