# P3-T5 round 10 evidence: O-14b and O-16 (non-authoritative)

Raw files the executor made. Nothing here is a number of record. The machine was shared throughout:
other sessions, and from this round Antigravity's R-1 in `D:\jazira-r1` (ports 3330/5470). None of
these runs is a fair measure of speed; the verifier's quiet-machine run decides.

The build is `next start` of the code at `a9c881d` on port 3170, with my own `.env` and Docker
project `p3t5`.

- `e2e/`: the P3-T5 spec on that build, retries 0.
  - `next-start-default.log`, `next-start-gpu.log`: the whole spec on both projects.
  - `o14b-only-gpu.log`: the two O-14b throttle tests, first run (on `273fa36`'s code).
  - `o16-only-gpu.log`: the O-16 test alone.
- `gates/`: copies of the CTO's `cards-gates.mjs` and `cards-timeline.mjs` from `ca2fc0a`, run by
  `scripts/run.sh`. These are the copies from before the CTO's O-14b gate change. The gates'
  `result.json` and `probe.json` are here; their videos are kept outside the repository.
- `gates-throttle10-before-ruling-2/`: three `throttle10` runs on the first O-14b build (`273fa36`'s
  code, before the 2 s window). All three ended in stills by `timeout`, before live, on the loaded
  machine. So they did not reach the new drop.
- `mutants/`: this round's must-fail mutants. Each was applied, run and reverted:
  - `m10-stills-drop-disabled`: the in-view drop at rest removed. The `@gpu` O-14b test fails (the
    card stays live).
  - `m11-switch-via-overview`: a switch flies out to the overview first, as before. The O-16 stage
    unit tests fail (`m11-unit.log`), and so does the `@gpu` O-16 test (`m11-e2e-gpu.log`): a
    picture during the move matches the overview.
  - `m12-sixty-frames-only`: the stills check in low back to 60 frames only. The tier unit test
    fails.
- `o16-recordings/`: `scripts/evidence/p3-t5-o16-recordings.mjs`, three direct switches at
  1440 × 900 (en): HVAC → Fire, Fire → Plumbing, Plumbing → Smart. The first attempt at HVAC → Fire
  timed out before live on the loaded machine; these are from the second run, in which all three
  were written.
- `scripts/`:
  - `run.sh`: the order of the runs;
  - `fps.mjs`: a frame-interval check at rest inside HVAC;
  - the gate script copies.
- `dod-fresh-clone/`: the DoD from a new `file://` clone of the branch at `a9c881d`.
