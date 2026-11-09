# R-1 r1 — generated summary (do not edit; run scripts/summarize.mjs)

HEAD df4ecdcab1a4909505a40ce4c1f2ffe8b53fd0fa

## Steps (summary.tsv)

| step | exit | seconds |
|---|---|---|
| install | 0 | 2657 |
| migrate-up | 0 | 47 |
| migrate-down | 0 | 10 |
| migrate-up-again | 0 | 9 |
| migrate-status | 0 | 8 |
| lint | 0 | 143 |
| typecheck | 0 | 20 |
| format-check | 0 | 12 |
| tokens-check | 0 | 1 |
| test | 0 | 795 |
| int-shuffle-1 | 0 | 560 |
| int-shuffle-2 | 0 | 350 |
| build | 0 | 283 |
| audit-full | 1 | 2 |
| audit-high | 0 | 1 |
| seed | 0 | 59 |
| e2e-default | 1 | 5 |
| server left running: 12600 10516 listen 17136 | | |
| done | | |
| e2e-spec-only | 1 | 101 |
| live | 0 | 9 |
| mustfail | 0 | 353 |
| partB-done | | |
| visual-shoot-fix | 0 | 52 |
| visual-shoot-fix2 | 0 | 40 |
| stopped 10516 17136 | | |
| base-build | 0 | 357 |
| started base 13232 29892 listen 41252 | | |
| visual-shoot-base | 0 | 15 |
| arabic-off | 0 | 1 |
| stopped 29892 41252 | | |
| visual-diff | 0 | 1 |
| visual-done | | |

## Test counts (lines from the logs)

```
test: Test Files  59 passed (59)
test: Tests  357 passed (357)
int-shuffle-1: Test Files  15 passed (15)
int-shuffle-1: Tests  70 passed (70)
int-shuffle-2: Test Files  15 passed (15)
int-shuffle-2: Tests  70 passed (70)
```

## e2e-default (unfiltered): first lines of the log

```
TypeError: Cannot read properties of undefined (reading 'config')

   at global-setup.test.ts:7

```

## e2e-spec-only (diagnostic path filter `spec\.ts$`)

```
1) [chromium] › tests\e2e\p3-t2.e2e.spec.ts:4:3 › P3-T2 — Shell & Primitives Interactive E2E (R-9) › mobile drawer focus trap (Tab / Shift+Tab), Escape close + focus restore, Accordion click toggle, and language switcher click
1 failed
15 passed (1.6m)
```

## Arabic switch around the runs

- arabic-before-e2e.txt: `"arabicEnabled":false`
- arabic-after-e2e.txt: `"arabicEnabled":false`
- arabic-before-e2e-spec.txt: `"arabicEnabled":false`
- arabic-after-e2e-spec.txt: `"arabicEnabled":false`
- arabic-after-visual.txt: `"arabicEnabled":false`

## Live checks (live.json)

| check | result |
|---|---|
| admin-login | `200` |
| editor-create | `{"status":201,"role":"editor"}` |
| editor-login | `200` |
| A-02 media create JSON {url,filename} | `{"status":400,"id":null,"remoteHits":0,"message":"The following field is invalid: file"}` |
| A-02 videos create JSON {url,filename} | `{"status":400,"id":null,"remoteHits":0,"message":"The following field is invalid: file"}` |
| A-02 media update JSON {url,filename} | `{"status":400,"remoteHits":0,"message":"The following field is invalid: file"}` |
| A-10 media file headers | `{"status":200,"csp":"default-src 'none'; sandbox","nosniff":"nosniff"}` |
| A-10 media file 404 headers | `{"status":404,"csp":"default-src 'none'; sandbox","nosniff":"nosniff"}` |
| A-10 videos file 404 headers | `{"status":404,"csp":"default-src 'none'; sandbox","nosniff":"nosniff"}` |
| A-06 editor GET /api/payload-jobs/run | `401` |
| A-06 anonymous GET /api/payload-jobs/run | `401` |
| editor-delete | `200` |
| listener total hits | `0` |

## Must-fail per finding (mustfail/summary.tsv): base = fix files at 34f3597 (A01: behavioural mutant), fix = df4ecdc

| case | phase | exit | first assertion |
|---|---|---|---|
| A01 | base | 1 | AssertionError: expected '{"@context":"https://schema.org","@ty…' not to contain '</script>' |
| A01 | fix | 0 |  |
| A02-A10 | base | 1 | AssertionError: expected undefined to be defined |
| A02-A10 | fix | 0 |  |
| A05-A06 | base | 1 | AssertionError: config.jobs.access.run must not use Payload default access function "defaultAccess" (Z1, R-19): expected true to be false // |
| A05-A06 | fix | 0 |  |
| A08-A09 | base | 1 | AssertionError: expected { …(8) } to deeply equal { …(10) } |
| A08-A09 | fix | 0 |  |
| D14 | base | 1 | AssertionError: expected [Function] to throw an error |
| D14 | fix | 0 |  |
| A03 | base | 1 | AssertionError: global-setup.ts must not hardcode Strong!AdminPassword#2026: expected 'import type { FullConfig } from \'@pl…' not to contai |
| A03 | fix | 0 |  |
| E07 | base | 1 | AssertionError: p1-t3.int.test.ts must call assertTestDatabaseIsolation: expected 'import configPromise from \'@payload-…' to contain 'asser |
| E07 | fix | 0 |  |

## Visual (visual/visual.json): differing pixels, reduced motion, intro skipped

| page | base vs fix | fix vs fix2 (noise floor) | size |
|---|---|---|---|
| en-1440 | 0 | 0 | 1440×1784 |
| en-390 | 0 | 0 | 390×2827 |
| ar-1440 | 0 | 0 | 1440×1783 |
| ar-390 | 0 | 0 | 390×2861 |

Base build HEAD: `34f35973ed42ac487b5eeaf8a6eb7f6deca90eee`; clone after the visual run: `df4ecdcab1a4909505a40ce4c1f2ffe8b53fd0fa`
