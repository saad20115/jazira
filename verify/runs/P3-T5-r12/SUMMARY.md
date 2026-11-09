# P3-T5 r12 — generated summary (do not edit; run scripts/summarize.mjs)

HEAD 1cf1f8d6e4899a4496740e98502c8f11c619e509

## Part A, A2, A3 steps (partA/summary.tsv; A and A2 were broken by the port clash, M-230/M-231)

| step | exit | seconds |
|---|---|---|
| install | 0 | 1602 |
| migrate-up | 0 | 44 |
| migrate-down | 0 | 9 |
| migrate-up-again | 0 | 8 |
| migrate-status | 0 | 8 |
| lint | 0 | 453 |
| typecheck | 0 | 60 |
| format-check | 1 | 23 |
| tokens-check | 0 | 1 |
| test | 1 | 772 |
| build | 0 | 305 |
| audit-full | 1 | 2 |
| audit-high | 0 | 3 |
| seed | 0 | 49 |
| e2e-default-pre | 1 | 1303 |
| publish-home-ar-on | 1 | 1 |
| e2e-default | 1 | 122 |
| e2e-gpu | 1 | 44 |
| e2e-p3t5-prodflag | 1 | 3 |
| owner-shots | 1 | 33 |
| sky-swap-en | 1 | 32 |
| sky-swap-ar | 1 | 1 |
| arabic-off | 1 | 0 |
| gates-throttle10-r1 | 1 | 2 |
| gates-throttle10-r2 | 1 | 2 |
| gates-throttle10-r3 | 1 | 2 |
| gates-held-r1 | 1 | 1 |
| gates-held-r2 | 1 | 3 |
| server left running: 14263 31988 | | |
| done | | |
| --- A2 re-run (part A server died 13:28:14 during e2e-default-pre; cause unknown) | | |
| server A2: 14407 3216 listen 35252 | | |
| e2e-default-pre-A2 | 1 | 4 |
| publish-home-ar-on-A2 | 0 | 1 |
| e2e-default-A2 | 1 | 5 |
| e2e-gpu-A2 | 1 | 5 |
| e2e-p3t5-prodflag-A2 | 1 | 5 |
| owner-shots-A2 | 1 | 34 |
| sky-swap-en-A2 | 1 | 33 |
| sky-swap-ar-A2 | 1 | 32 |
| arabic-off-A2 | 1 | 0 |
| gates-throttle10-r1-A2 | 1 | 2 |
| gates-throttle10-r2-A2 | 1 | 2 |
| gates-throttle10-r3-A2 | 1 | 2 |
| gates-held-r1-A2 | 1 | 3 |
| gates-held-r2-A2 | 1 | 3 |
| server still up at end: 000 | | |
| server left running: 14407 3216 listen 35252 | | |
| done-A2 | | |
| --- A3 re-run on 3331 (A and A2 broken by the CTO port clash on 3330, M-230) | | |
| build-A3 | 0 | 360 |
| server A2: 14792 21772 listen 38924 | | |
| e2e-default-pre-A3 | 1 | 1660 |
| publish-home-ar-on-A3 | 0 | 1 |
| e2e-default-A3 | 1 | 129 |
| e2e-gpu-A3 | 0 | 377 |
| e2e-p3t5-prodflag-A3 | 0 | 73 |
| owner-shots-A3 | 0 | 94 |
| sky-swap-en-A3 | 0 | 15 |
| sky-swap-ar-A3 | 0 | 16 |
| arabic-off-A3 | 0 | 2 |
| gates-throttle10-r1-A3 | 0 | 15 |
| gates-throttle10-r2-A3 | 0 | 16 |
| gates-throttle10-r3-A3 | 0 | 22 |
| gates-held-r1-A3 | 0 | 15 |
| gates-held-r2-A3 | 0 | 14 |
| server still up at end: 200 | | |
| server left running: 14792 21772 listen 38924 | | |
| done-A3 | | |

### e2e-default-pre

```
1) [chromium] › tests\e2e\p3-t14-motion.e2e.spec.ts:407:3 › P3-T14 — Motion system: content never depends on JavaScript › R-43: at 390px with hasTouch, ServiceCard .description and ProjectCard .ctaRow are visible at rest
2) [chromium] › tests\e2e\p3-t2.e2e.spec.ts:4:3 › P3-T2 — Shell & Primitives Interactive E2E (R-9) › mobile drawer focus trap (Tab / Shift+Tab), Escape close + focus restore, Accordion click toggle, and language switcher click
3) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:339:3 › P3-T5 live 3D card › @smoke image first: the Figma image paints, hover changes nothing, a click starts
4) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:370:3 › P3-T5 live 3D card › reduced motion keeps the stills tier: no 3D download; a system shows its end still and labels
5) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:402:3 › P3-T5 live 3D card › a #systems hash on load enters that system without starting the model
6) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:414:3 › P3-T5 live 3D card › O-7: the tap hint appears once the card is half on screen, never as a target, and starts nothing
7) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:428:3 › P3-T5 live 3D card › O-7: the hint stops at once on hover, and never returns
8) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:445:3 › P3-T5 live 3D card › O-7: the hint stops at once on a click (the click itself starts the model)
9) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:459:3 › P3-T5 live 3D card › O-7: under reduced motion the hand is shown still, once, and does not animate
10) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:479:3 › P3-T5 live 3D card › O-8: after a reload with the hash, no frame shows an empty card (slow images)
11) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:1319:3 › P3-T5 live 3D card › O-9: at the top of the page nothing of the model is fetched (the card is far below)
12) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:1330:3 › P3-T5 live 3D card › O-9: with Save-Data nothing is prepared; a click shows the stills tier
13) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:1437:3 › P3-T5 live 3D card › O-11: under reduced motion the image never pushes in
14) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:1651:3 › P3-T5 live 3D card — WebGL disabled › a browser without WebGL falls back to the stills tier
15) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:1682:3 › P3-T5 live 3D card — software renderer › a software WebGL renderer ends in the stills tier, without a canvas or a 3D download
16) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:1720:3 › P3-T5 live 3D card — phone › O-6: every Fire dot of the still can be tapped at 390 px, and a tap starts nothing
16 failed
9 passed (21.7m)
```

### e2e-default

```
```

### e2e-gpu

```
```

### e2e-p3t5-prodflag

```
```

### e2e-default-pre-A3

```
1) [chromium] › tests\e2e\p3-t14-motion.e2e.spec.ts:407:3 › P3-T14 — Motion system: content never depends on JavaScript › R-43: at 390px with hasTouch, ServiceCard .description and ProjectCard .ctaRow are visible at rest
2) [chromium] › tests\e2e\p3-t2.e2e.spec.ts:4:3 › P3-T2 — Shell & Primitives Interactive E2E (R-9) › mobile drawer focus trap (Tab / Shift+Tab), Escape close + focus restore, Accordion click toggle, and language switcher click
3) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:339:3 › P3-T5 live 3D card › @smoke image first: the Figma image paints, hover changes nothing, a click starts
4) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:370:3 › P3-T5 live 3D card › reduced motion keeps the stills tier: no 3D download; a system shows its end still and labels
5) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:402:3 › P3-T5 live 3D card › a #systems hash on load enters that system without starting the model
6) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:414:3 › P3-T5 live 3D card › O-7: the tap hint appears once the card is half on screen, never as a target, and starts nothing
7) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:428:3 › P3-T5 live 3D card › O-7: the hint stops at once on hover, and never returns
8) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:445:3 › P3-T5 live 3D card › O-7: the hint stops at once on a click (the click itself starts the model)
9) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:459:3 › P3-T5 live 3D card › O-7: under reduced motion the hand is shown still, once, and does not animate
10) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:479:3 › P3-T5 live 3D card › O-8: after a reload with the hash, no frame shows an empty card (slow images)
11) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:1319:3 › P3-T5 live 3D card › O-9: at the top of the page nothing of the model is fetched (the card is far below)
12) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:1330:3 › P3-T5 live 3D card › O-9: with Save-Data nothing is prepared; a click shows the stills tier
13) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:1437:3 › P3-T5 live 3D card › O-11: under reduced motion the image never pushes in
14) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:1651:3 › P3-T5 live 3D card — WebGL disabled › a browser without WebGL falls back to the stills tier
15) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:1682:3 › P3-T5 live 3D card — software renderer › a software WebGL renderer ends in the stills tier, without a canvas or a 3D download
16) [chromium] › tests\e2e\p3-t5-live-3d.e2e.spec.ts:1720:3 › P3-T5 live 3D card — phone › O-6: every Fire dot of the still can be tapped at 390 px, and a tap starts nothing
16 failed
9 passed (27.6m)
```

### e2e-default-A3

```
1) [chromium] › tests\e2e\p3-t14-motion.e2e.spec.ts:407:3 › P3-T14 — Motion system: content never depends on JavaScript › R-43: at 390px with hasTouch, ServiceCard .description and ProjectCard .ctaRow are visible at rest
2) [chromium] › tests\e2e\p3-t2.e2e.spec.ts:4:3 › P3-T2 — Shell & Primitives Interactive E2E (R-9) › mobile drawer focus trap (Tab / Shift+Tab), Escape close + focus restore, Accordion click toggle, and language switcher click
2 failed
23 passed (2.1m)
```

### e2e-gpu-A3

```
24 passed (6.3m)
```

### e2e-p3t5-prodflag-A3

```
14 passed (1.2m)
```

## Part A3 gates (throttle10, held)

| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks ms | O-14b stills after live ms | pass |
|---|---|---|---|---|---|---|---|---|---|---|
| gates-held-r1-A3 | held | 8109 | stills/fire//timeout/ | null | 74 | 0 |  |  | null | all |
| gates-held-r2-A3 | held | 8095 | stills/fire//timeout/ | null | 90 | 0 |  |  | null | all |
| gates-throttle10-r1-A3 | throttle10 | 8924 | stills/fire//timeout/ | null | 719 | 0 |  |  | null | all |
| gates-throttle10-r2-A3 | throttle10 | 8158 | stills/fire//timeout/ | null | 880 | 0 |  |  | null | all |
| gates-throttle10-r3-A3 | throttle10 | 9467 | stills/fire//timeout/ | null | 806 | 0 |  |  | null | all |

## O-13 sky swap, part A3: gate = top band within ±6 per channel

| case | state | tier | top Δ RGB | pass |
|---|---|---|---|---|
| en-1440-dpr1 | live | lite | -1.4 -1.1 -2.9 | pass |
| en-1440-dpr2 | live | lite | -1.1 -1 -2.9 | pass |
| en-390-dpr3 | live | lite | 0.9 0.1 -1.5 | pass |
| ar-1440-dpr1 | live | lite | 0.1 -0.2 -2.3 | pass |
| ar-1440-dpr2 | live | lite | 0.2 -0.1 -2.2 | pass |
| ar-390-dpr3 | live | lite | 2.6 1.2 -1 | pass |

Arabic after A3: `"arabicEnabled":false`

## Part B (quiet window M-232): GPU samples

### gpu-before

```
pid_2028_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 3.3
pid_32216_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 5.3
pid_2028_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 3.5
pid_32216_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 6.2
pid_2028_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 3.9
pid_32216_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 6.6
avpui False
freeGB 3.4
sampled 2026-11-09 14:30:11
```

### gpu-mid

```
pid_2028_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 0.6
pid_2028_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 0.6
pid_884_luid_0x00000000_0x00011007_phys_0_eng_0_engtype_3d 0.6
avpui False
freeGB 3.6
sampled 2026-11-09 14:43:31
```

### gpu-after

```
avpui False
freeGB 4
sampled 2026-11-09 14:48:34
```


## Part B interleaved gates: r11 control (3328) and r12 (3331), order in partB/summary.tsv

| run | mode | click→live or stills ms (O-14) | end state | click→live ms | max long task ms | max flight gap ms | tiers | later clicks ms | O-14b stills after live ms | pass |
|---|---|---|---|---|---|---|---|---|---|---|
| r11-immediate-r1 | immediate | 6455 | live/fire/low//canvas | 6455 | 283 | 100 | low | 17, 44, 15 | null | FAIL live FAIL longTask FAIL flightGap |
| r11-immediate-r2 | immediate | 5074 | live/fire/low//canvas | 5074 | 98 | 117 | low | 76, 13, 30 | null | FAIL live FAIL flightGap |
| r11-immediate-r3 | immediate | 3901 | live/fire/low//canvas | 3901 | 119 | 117 | low | 35, 20, 23 | null | FAIL live FAIL flightGap |
| r11-latest-r1 | latest | 3781 | live/plumbing/low//canvas | 3781 | 109 | 67 | low | 13, 23 | null | FAIL live |
| r11-latest-r2 | latest | 5947 | live/plumbing/low//canvas | 5947 | 273 | 117 | low | 31, 17 | null | FAIL live FAIL longTask FAIL flightGap |
| r11-latest-r3 | latest | 4852 | live/plumbing/low//canvas | 4852 | 120 | 84 | low | 28, 48 | null | FAIL live |
| r11-onscreen3s-r1 | onscreen3s | 750 | live/fire/low//canvas | 750 | 54 | 67 | low | 21, 11, 42 | null | all |
| r11-onscreen3s-r2 | onscreen3s | 1324 | live/fire/low//canvas | 1324 | 85 | 83 | low | 37, 10, 20 | null | all |
| r11-onscreen3s-r3 | onscreen3s | 794 | live/fire/low//canvas | 794 | 84 | 83 | low | 25, 16, 59 | null | all |
| r12-immediate-r1 | immediate | 7367 | live/fire/low//canvas | 7367 | 264 | 150 | low | 26, 10, 27 | null | FAIL live FAIL longTask FAIL flightGap |
| r12-immediate-r2 | immediate | 8113 | stills/fire//timeout/ | null | 106 | 83 |  | 13, 18, 7 | null | FAIL live FAIL tier |
| r12-immediate-r3 | immediate | 4243 | live/fire/low//canvas | 4243 | 290 | 167 | low | 16, 8, 17 | null | FAIL live FAIL longTask FAIL flightGap |
| r12-latest-r1 | latest | 5955 | live/plumbing/low//canvas | 5955 | 250 | 283 | low | 14, 18 | null | FAIL live FAIL longTask FAIL flightGap |
| r12-latest-r2 | latest | 5677 | live/plumbing/low//canvas | 5677 | 391 | 183 | low | 38, 18 | null | FAIL live FAIL longTask FAIL flightGap |
| r12-latest-r3 | latest | 4656 | live/plumbing/low//canvas | 4656 | 181 | 117 | low | 30, 22 | null | FAIL live FAIL flightGap |
| r12-onscreen3s-r1 | onscreen3s | 428 | live/fire/low//canvas | 428 | 244 | 150 | low | 27, 16, 19 | null | FAIL longTask FAIL flightGap |
| r12-onscreen3s-r2 | onscreen3s | 2639 | live/fire/low//canvas | 2639 | 162 | 100 | low | 35, 11, 16 | null | FAIL live FAIL flightGap |
| r12-onscreen3s-r3 | onscreen3s | 807 | live/fire/low//canvas | 807 | 63 | 100 | low | 18, 13, 17 | null | FAIL flightGap |

## Part B r12 timelines

| run | click→live ms | max long task ms | max frame gap in flights ms | ever stills |
|---|---|---|---|---|
| timeline-r1 | 1569 | 72 | 67 | false |
| timeline-r2 | 1430 | 0 | 100 | false |
| timeline-r3 | 3393 | 194 | 83 | false |

## Part B r12 Lighthouse 13.5.0 /en

| run | perf | a11y | bp | seo | LCP ms | TBT ms |
|---|---|---|---|---|---|---|
| en-desktop.json | 100 | 96 | 100 | 100 | 794 | 10 |
| en-mobile-try1.json | 88 | 96 | 100 | 100 | 3591 | 146 |
| en-mobile-try2.json | 89 | 96 | 100 | 100 | 3577 | 103 |
| en-mobile-try3.json | 88 | 96 | 100 | 100 | 3596 | 137 |
