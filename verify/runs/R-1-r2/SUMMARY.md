# R-1 r2 — generated summary (do not edit; run scripts/summarize.mjs)

HEAD 0b325e51eaface00504263c2f86265733dc47abb

## Steps (summary.tsv)

| step | exit | seconds |
|---|---|---|
| install | 0 | 3790 |
| migrate-up | 0 | 149 |
| migrate-down | 0 | 13 |
| migrate-up-again | 0 | 12 |
| migrate-status | 0 | 9 |
| lint | 0 | 218 |
| typecheck | 0 | 53 |
| format-check | 0 | 59 |
| tokens-check | 0 | 1 |
| test | 1 | 1078 |
| int-shuffle-1 | 0 | 344 |
| int-shuffle-2 | 0 | 357 |
| build | 0 | 343 |
| audit-full | 1 | 3 |
| audit-high | 0 | 1 |
| seed | 0 | 86 |
| started devdb 18217 44700 listen 30160 | | |
| e2e-against-devdb-server | 127 | 3 |
| stopped devdb 44700 30160 | | |
| e2e-db-migrate | 0 | 8 |
| e2e-db-seed | 0 | 37 |
| started e2edb 18284 2828 listen 36252 | | |
| e2e-unfiltered | 1 | 85 |
| stopped e2edb 2828 36252 | | |
| done | | |
| test-2 | 0 | 572 |

## Test counts

```
test.log: FAIL  tests/int/p3-t1.int.test.ts > P3-T1 Integration — Z6 data layer, R-23 pagination/limit caps, draft isolation, and /api/preview > R-15: when 101 docs exist in a small collecti
test.log: Test Files  1 failed | 58 passed (59)
test.log: Tests  1 failed | 360 passed (361)
test-2.log: Test Files  59 passed (59)
test-2.log: Tests  361 passed (361)
int-shuffle-1.log: Test Files  15 passed (15)
int-shuffle-1.log: Tests  70 passed (70)
int-shuffle-2.log: Test Files  15 passed (15)
int-shuffle-2.log: Tests  70 passed (70)
```

## test.log failure (first lines)

```
FAIL  tests/int/p3-t1.int.test.ts > P3-T1 Integration — Z6 data layer, R-23 pagination/limit caps, draft isolation, and /api/preview > R-15: when 101 docs exist in a small collection (stats), cmsFindA
Error: Test timed out in 60000ms.
```

## R1-2 live refusal: e2e run against a server on the dev DB

```
Error: Playwright E2E safety guard: server at "http://localhost:3329" is not connected to E2E test database "aljazira_verify_test" (server returned tagline "MEP CONTRACTING · FIREFIGHTING · SMART SYSTEMS" instead of the probe written to "aljazira_verify_test")
234 |         `Playwright E2E safety guard: server at "${baseURL}" is not connected to E2E test database "${dbName}" (server returned tagline "${String(observedTagline)}" instead of the probe written to "${dbName}"). Refusing to call first-register or mutate g
```

r12-live-refusal.txt (the user counts failed: psql had no password, a CTO tooling error):

```
dev users before: Password for user verify_su: 
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: fe_sendauth: no password supplied
"arabicEnabled":false
dev users after: Password for user verify_su: 
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: fe_sendauth: no password supplied
"arabicEnabled":false
e2e users after: Password for user verify_su: 
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: fe_sendauth: no password supplied
```

## Unfiltered e2e against a server on the e2e/test DB

```
1) [chromium] › tests\e2e\p3-t2.e2e.spec.ts:4:3 › P3-T2 — Shell & Primitives Interactive E2E (R-9) › mobile drawer focus trap (Tab / Shift+Tab), Escape close + focus restore, Accordion click toggle, and language switcher click
1 failed
15 passed (1.4m)
```

Arabic before/after: `"arabicEnabled":false` / `"arabicEnabled":false`

## Round 2 must-fail (mustfail/summary.tsv): base = the files at bfe0bd5, fix = 0b325e5

| case | phase | exit | first assertion |
|---|---|---|---|
| R1-2-R1-3-R1-4 | base | 1 | AssertionError: promise resolved "'mock-jwt-token'" instead of rejecting |
| R1-2-R1-3-R1-4 | fix | 0 |  |
| R1-5 | base | 1 | AssertionError: expected [Function] to throw an error |
| R1-5 | fix | 0 |  |
