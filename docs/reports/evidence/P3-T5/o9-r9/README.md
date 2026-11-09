# P3-T5 round 9 evidence: O-12 regression and O-9b first flight (non-authoritative)

Raw files the executor made; nothing here is a number of record. The machine was loaded throughout
(other sessions and apps), so none of these runs is a fair measure of speed; the verifier's
quiet-machine run decides. Videos, screenshots and the Chrome traces themselves are kept outside the
repository (each trace is tens of MB); the page probes and the summaries drawn from them are here.

The final build is `next start` of `09e8490` on port 3170, with my own `.env` and Docker project
`p3t5` (the seeded home page published, as the verifier does).

- `e2e/`: the whole P3-T5 spec on the final build, `chromium` and `gpu` projects, retries 0.
- `gates/`: the CTO's `cards-gates.mjs`, `cards-timeline.mjs` and `sky-swap.mjs` from `ca2fc0a`
  (unmodified copies, run by `gates.sh`), on the final build: every mode, as in the verifier's run.
- `gates-first-six/`: the same gate script, `latest` and `immediate` three runs each, made first on
  the same build (before the commit; the code is identical).
- `mutants/`: this round's must-fail mutants, each applied, run and reverted:
  - `m8-task-time-ignored`: the stage ignores `compileTaskMs` (the stage test fails);
  - `m9-frame-wait-unbounded`: `yieldToFrame` without its bound (the precompile test fails).
- `traces/`:
  - `round8-build-*`: the page probes of traced runs on round 8's build (`2491795`, placeholder
    textures), with `profile-summary-round8-build.txt`. In loading, its long tasks were a major
    garbage collection and a compositor commit that waited; after live, `compileObjects` and three's
    shader-source building for the first system's entered look.
  - `final-build-*`: traced (`r10t`) and profiled (`r10p`) runs on the final build, with
    `long-task-contents-final-build.txt`. The long tasks left in loading contain no JavaScript, no
    garbage collection and no layout: the main thread waits inside a native call.
  - The scripts used: `gates-trace.mjs` and `gates-prof.mjs` (the CTO's gate script with Chrome
    tracing, and V8 sampling, added), `prof-long.cjs` and `longinner.cjs` (the summaries).
- `dod-fresh-clone/`: the DoD from a new `file://` clone of the branch at `09e8490`.
