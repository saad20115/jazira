# P3-T5 round 12 evidence: O-15 (45° light) and O-18 (wheel exit) (non-authoritative)

Raw files the executor made. Nothing here is a number of record. The machine was shared and loaded
(other sessions, the CTO's verifier servers, Antigravity's R-1); `cpu-load-*.txt` holds the load
reading before and after each run. None of these runs is a fair measure of speed; the verifier's
quiet run decides. Builds are `next start` on port 3170, with my own `.env` and Docker project
`p3t5`. Retries 0; every run is kept. The gate scripts are unchanged copies of the CTO's
`cards-gates.mjs`, `cards-timeline.mjs` and `sky-swap.mjs` from `verify/runs/P3-T5-r11/scripts/`.

- `o15/`: the owner's before and after shots (`scripts/evidence/p3-t5-lighting-shots.mjs`): the
  image, the overview (the hero) and each of the five systems (HVAC and Fire among them), at 1440 ×
  900 and 390 × 844 (touch), `en` and `ar`. Each shot is the card only, taken once the camera has
  landed and the labels are placed.
  - `before/`: the round 11 code (`331ae43`).
  - `after/`: this round's code at `05b2876` (the O-14b rest fix after it changes no picture).
  - The turntable turns slowly at the overview, so the tower's angle differs a little between shots.
- `o18-recordings/`: `scripts/evidence/p3-t5-o18-recordings.mjs` on `05b2876`, 1440 × 900 `en`.
  Inside Fire Fighting: two wheel ticks zoom; a run of ticks into the zoom-out limit stops there;
  after a pause, one more tick exits. The log prints the card's system and hash after each step.
- `o16-recordings/`: the O-16 recording script's log on `05b2876` (all three switches were
  written; the videos are not kept this round, as O-16 did not change).
- `run-05b2876/`: on `05b2876` (`scripts/run-all.sh`): the P3-T5 e2e (both projects), the sky
  check (`sky-swap/`), and the gate scripts (`gates/`: timeline × 3; `onscreen3s`, `immediate`,
  `latest`, `throttle10` × 3; `held` × 2). One `throttle10` run here showed the O-14b gap fixed
  in `0e39a0e` (test `fa5694e`; see the report).
- `run-fa5694e/`: the same e2e and gate runs on the final code (`scripts/run-b.sh`).
  - Its full `gpu` e2e run had one failure: the full-model test (`high-performance GPU`) ended in
    stills by `timeout` at the start. `e2e-gpu-fullmodel-rerun*.log`: the same test twice more
    there, one failing the same way.
- `full-model-ab/`: that test alone, interleaved on round 11's build (`331ae43`, `r11b`) and the
  final code (`r12`), with the load reading before each (`scripts/ab-full.sh`, `summary.txt`).
- `mutants/`: this round's must-fail mutants, each applied, run and reverted:
  - `m16-no-slip-guard`: any wheel-out at the limit exits (no gesture rule). The wheel-exit unit
    tests fail, and so does the `@gpu O-18` test (it exits in the run into the limit).
  - `m17-no-wheel-exit`: the viewer never reports the wheel-out. The `@gpu O-18` test fails.
  - `m18-warmup-wait-is-flying`: the wait for a warm-up counts as flying again. The stage unit test
    fails.
  - The m16 and m17 e2e runs used `next dev` of the mutated tree (a production build per mutant
    was not needed to show the test fails).
- `dod-fresh-clone/`: the DoD from a new clone of the branch at the final code.
- `scripts/`: the run scripts and `look.mjs` (the tuning aid used while choosing the look).
