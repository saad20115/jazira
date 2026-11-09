# P3-T5 round 4 evidence (O-9 card stall, O-10 Lighthouse mobile, O-11 push-in) — non-authoritative

Raw files the executor made. Nothing here is a number of record (AGENTS.md, evidence integrity); the
CTO verifier re-runs its own timeline script, the e2e, Lighthouse and the DoD on the submitted SHA.

## `cards-timeline/`
- `candidate-run<n>.log` and `candidate-run<n>.timeline.json`: the CTO's script
  `verify/runs/P3-T5-r3/cards-timeline.mjs`, unmodified (run from a copy in my scratch folder, from
  the worktree root, argument `spoofHw` `0`), against `next start` of the final code (O-9, O-10 and
  O-11) on port 3170.
  Same machine (Intel HD 530, ANGLE D3D11), headless, video recording on as in the script. Three
  fresh browser runs; every run made is here.

## `mutants/` (must-fail)
- `o9-no-preparation.diff`: the mutant (the near-viewport effect of `SystemsCard` never prepares, so
  the model loads only after the click, as in round 3).
- `o9-no-preparation-unit.log`: the real-React harness (`src/p3-t5-late-related.test.ts`) on the
  mutant: the three O-9 preparation tests fail.
- `o9-no-preparation-run<n>.log` / `.timeline.json`: the CTO's timeline script against `next start`
  of the mutant build (three runs).
- `o9-no-preparation-e2e-gpu.log`: the `@gpu` O-9 e2e tests on the mutant build: "prepared out of
  sight" fails.
- `o11-no-push-in.diff`, `o11-no-push-in-e2e-gpu.log`: O-11 with no push-in at all; the `@gpu`
  O-11 test fails (the image never grows).
- `o11-loading-only.diff`, `o11-loading-only-e2e-gpu.log`: the push-in only while loading, so the
  image snaps back to scale 1 at the swap; the `@gpu` O-11 test fails at the swap check.

## `pushin-recordings/` (O-11, for the owner to judge by eye)
- `pushin-1440-en/pushin-1440-en.webm`, `pushin-390-en/pushin-390-en.webm`
  (`scripts/evidence/p3-t5-pushin-recordings.mjs`, `next start` of the final code): the page opens,
  jumps to the card and clicks (or taps) the image at once, while the model is still being prepared,
  so the push-in and the cross-fade to the live model show.

## `e2e/`
- `next-start-default.log`, `next-start-gpu.log`: the whole P3-T5 spec on `next start` of the final
  code (with O-11), `E2E_PRODUCTION_SERVER=1` (page-load CSP violations checked), default and
  `gpu` projects.
- `next-start-gpu-run1-full-tier-label.log`: the first `gpu` run, where the spoofed-GPU test still
  required the label `full` (see the report: the probe now times the real GPU under the name).

## `dod-fresh-clone-cc553e3/`
- The DoD from a new `file://` clone of the branch at `cc553e3` (`dod.sh.txt`, same steps as round 3).
