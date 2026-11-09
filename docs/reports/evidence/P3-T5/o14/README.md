# P3-T5 round 6 evidence: O-14, the card never stays in `loading` (non-authoritative)

Raw files the executor made; nothing here is a number of record. Every run made is here, including the
superseded ones. The machine was loaded (other sessions).

The builds are `next start` on port 3170, with my own `.env` and Docker project `p3t5`, at:
- `7663933`: first O-14 fix, 9 s deadline;
- the 8 s build before `ea52491`;
- `ea52491`: the final O-14 code. `1642a7d` changes tests only.

- `e2e/`: the final build, with the tests of `1642a7d`:
  - `o14-repeat-<n>.log`: the three O-14 tests, repeated;
  - `next-start-default.log`, `next-start-gpu.log`: the whole P3-T5 spec.
- `e2e/superseded/`: earlier runs, kept because every run is reported:
  - directly in it: the first set on `7663933` and the 8 s build (one O-14 repeat ended `timeout`
    instead of `context-lost`, fixed in `ea52491`). It also holds the first mutant logs: `m1`, and `m2`
    against the first version of the context-loss test, which did not catch it.
  - `ea52491-20x/`: the throttling test at 20×. One repeat ended past 10 s, and `m1` was run
    against that test.
  - `ea52491-full/`: the whole spec on `ea52491`, before the test rework.
  - A full GPU run on `7663933`, whose throttling test failed (past 10 s), was overwritten by a rerun; the
    round-6 report records it.
- `mutants/`: the must-fail mutants (`*.diff`), each built, run under `next start` against its test,
  then reverted. The script checked that `git diff -- src` was empty afterwards.
  - `m1-start-timeout-45s`: the card's deadline back to round 5's 45 s, run against the three O-14 tests
    (the never-ending start must fail).
  - `m2-context-loss-not-handled`: a lost context no longer ends the start, run against the context-loss
    test.
- `lighthouse/`: Lighthouse 13.5.0, the CTO's flags, on `7663933`: three mobile runs and one desktop run.
- `v1-swap/`: as in `../o13/v1-swap/`, on the final build.
- `recordings/`: the log of `scripts/evidence/p3-t5-pushin-recordings.mjs` on the final build. The
  videos are kept outside the repository and are available on request.
- `dod-fresh-clone/`: the DoD from a new `file://` clone of the branch at the final code, with the same
  steps as round 5.
