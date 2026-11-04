# P3-T5 round 7 evidence: O-9a (quick click) and O-9b (first-flight gap) (non-authoritative)

Raw files the executor made; nothing here is a number of record. Every run made on the final build is
here, and the superseded builds' runs too. The machine was loaded throughout (other sessions and apps),
so none of these runs is a fair measure of speed; the verifier's quiet-machine run decides.

The final build is `next start` of `0662857` on port 3170, with my own `.env` and Docker project
`p3t5`. The DB was re-created this round, migrated, seeded, and the seeded home page published (the
verifier's step); videos and screenshots are kept outside the repository.

- `e2e/`: the whole P3-T5 spec on the final build, `chromium` and `gpu` projects, retries 0.
- `gates/`: the CTO's `cards-gates.mjs`, `cards-timeline.mjs` and `sky-swap.mjs` from `ca2fc0a`
  (`verify/runs/P3-T5-r6/scripts/`, unmodified copies), run by `gates.sh`:
  - `immediate`, `latest`, `onscreen3s` and the timeline, three runs each;
  - `throttle10` six runs (the first two in the script, four repeats after the first one ended past
    10 s), `held` two runs;
  - the O-13 sky swap, `en`, three cases.
  - Each gate run keeps `probe.json` (the raw page log) and `result.json`.
- `mutants/`: the must-fail mutants of this round, each applied, run and reverted:
  - `m3-workers-before-policy`: the loader starts its workers before the policy check
    (`src/p3-t5-ktx2-workers.test.ts` fails);
  - `m4-dispose-keeps-workers`: dispose does not end the started workers (the same test fails);
  - `m5-still-remounted`: the round-6 `SystemsCard.tsx`, built and run under `next start` (the new
    e2e test fails at "the same still in the first live frames").
- `superseded/`:
  - `gates-6-before-final/`: the same scripts on the first build of this round's code, before the
    final comment-only change and the test commit;
  - `gates-8-while-waiting/`: a build that let 8 links run while the visitor waits (not kept: no
    faster on this machine, longer main-thread tasks, and one 10× run ended past 10 s);
  - `e2e/`: the new and changed e2e tests on that build.
- `dod-fresh-clone/`: the DoD from a new `file://` clone of the branch at `87d3303` (`0662857` plus
  Prettier formatting of the new e2e test). `dod-first-run-stopped/` holds the steps of the first run
  at `0662857`, stopped after its format check flagged that test.

## What my traces showed (Chrome tracing; the traces themselves are outside the repository)
- **Before the fix, a click right after the scroll:**
  - The hero's shader links ran two or three at a time, with gaps between them.
  - PMREM's filter program, created while the model downloaded, started its link only when the hero's
    compile began (the first flush), then held a link slot for its whole link.
  - The transcoding workers were created, fetched their script and compiled the transcoder only after
    the model had arrived.
- **After the swap, before the fix:**
  - The GPU process's main thread rasterised the canvas's sky layer for the first time (it had waited
    at opacity 0).
  - During that raster an ANGLE shader compile ran (Skia's gradient program). The page's frames
    waited behind it.
  - With the sky removed in a test override, that raster was short and the gap was gone.
  - The entered still was removed from layout and added again at the swap.
- **After the fix:** the canvas layer is rasterised when the canvas joins the card at the click, and
  the still stays one element through the swap.
