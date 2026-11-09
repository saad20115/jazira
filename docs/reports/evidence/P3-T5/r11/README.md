# P3-T5 round 11 evidence: the round-12 regressions (O-12, O-9b, O-9, O-10, O-17) (non-authoritative)

Raw files the executor made. Nothing here is a number of record. The machine was shared and often
heavily loaded: other sessions, Antigravity's R-1 in `D:\jazira-r1` (ports 3330/5470), and the CTO's
verifier servers. `cpu-load-*.txt` in `gates/` shows the load reading before and after those runs.
None of these runs is a fair measure of speed; the verifier's quiet-machine run decides.

The gate scripts are copies of the CTO's `cards-gates.mjs` and `cards-timeline.mjs` from `92d9080`
(`verify/runs/P3-T5-r10/scripts/`), run unchanged from my scratch folder. Builds are `next start`
on port 3170, with my own `.env` and Docker project `p3t5`. Retries 0; every run is kept.

- `ab-r9-r10-fix/`: an interleaved comparison on the same machine, to find the cause. Each round
  started `next start` of one build, then ran the timeline once and the gate script three times
  (`onscreen3s`, `immediate`, `onscreen3s`).
  - Builds: `r9` = round 9's code (`09e8490`), `r10` = round 10's (`a9c881d`), `r11a` = this round's
    first fix (the warm-up turn only, before the overview-only rule and the probe confirmation).
  - Order: r9, r10, r11a, r11a, r10, r9, r9, r11a, r10 (folder numbers).
  - Script: `scripts/ab.sh`; summaries: `scripts/sum.mjs`, `scripts/an2.mjs`.
- `traces/`: Chrome traces of the start with the card on screen 3 s before the click
  (`scripts/trace2.mjs`, run by `scripts/traces.sh`), r9 and r11a alternately, on a quieter machine.
  Each file lists every main-thread task of 30 ms or more after the scroll, relative to the click,
  and when the card went live. The traces themselves are not kept (size).
  - `start-*.txt`: a first pass (`scripts/trace.mjs`), r10 and r9, the `immediate` start and the
    card on screen 3 s first: each task of 100 ms or more, with the trace events inside it. The
    first task listed in each file is the profiler starting, not the page. Its sampled-function
    lists are not reliable: that pass mixed in samples from worker threads, which `trace2.mjs`
    fixes.
- `e2e/`: the whole P3-T5 spec on `next start` of the final code (`331ae43`), both projects
  (`scripts/run-e2e.sh`).
- `gates/`: the CTO's gate scripts on the final code (`scripts/run-gates.sh`): timeline × 3, and
  `onscreen3s`, `immediate`, `latest`, `throttle10` × 3 each, `held` × 2. `result.json` and
  `probe.json` per run; their videos are not kept.
- `o16-recordings/`: `scripts/evidence/p3-t5-o16-recordings.mjs` on the final code, three direct
  switches at 1440 × 900 (en).
- `switch-motion/`: `scripts/switch-motion.mjs`, two runs on the final code. Pictures of the card's
  middle during each of three direct switches, and the change between neighbours. A stop on the way
  would show as unchanged pictures before the arrival.
- `mutants/`: this round's must-fail mutants. Each was applied, run and reverted:
  - `m13-first-task-without-turn`: round 10's loop (a warm-up's first task without its turn, and
    the turn before the room wait). The new stage unit test fails.
  - `m15-warm-inside-a-system`: another system may warm up inside a system at rest (round 10's
    rule). The new stage unit test fails.
  - `m14-warmup-during-probe` (O-17): the systems' warm-up starts before the start-up probe. Built
    and run against the whole `gpu` project: it is **not** caught here (`m14-e2e/e2e-gpu.log`). See
    the report for why.
- `dod-fresh-clone/`: the DoD from a new clone of the branch at `331ae43` (`scripts/dod.sh`).
- `scripts/`: every script above.
