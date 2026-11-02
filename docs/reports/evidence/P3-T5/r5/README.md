# P3-T5 round 5 evidence (O-12 long tasks during preparation, Q6 trigger) — non-authoritative

Raw files the executor made. Nothing here is a number of record (AGENTS.md, evidence integrity); the
CTO verifier re-runs its own scripts, the e2e, Lighthouse and the DoD on the submitted SHA.

Every run made is here. The scripts record a screencast of each run; as in round 4 the screencasts
are not committed (about 200 MB; kept on this machine, outside the repository, and available on
request). The raw probe data each script writes is here. Same machine as before (Intel HD 530, ANGLE D3D11), headless, video
recording on as in the CTO scripts. The server is `next start` of code `d55dca2` on port 3170 (my own
`.env`, Docker project `p3t5`).

## `cards-timeline/`
- `candidate-run<n>.log` and `candidate-run<n>/timeline.json`: the CTO's
  `verify/runs/P3-T5-r3/cards-timeline.mjs` (same file as `verify/runs/P3-T5-r4/scripts/`), unmodified,
  run from a byte-identical copy in my scratch folder, from the worktree root, argument `spoofHw` `0`.
  Three fresh browser runs.

## `cards-gates/`
- `<mode>-r<n>.log` and `<mode>-r<n>/` (`result.json`, `probe.json`): the CTO's
  `verify/runs/P3-T5-r4/scripts/cards-gates.mjs`, unmodified (byte-identical copy), modes
  `onscreen3s`, `immediate` and `latest`, three runs each.

## `mutants/` (must-fail)
- `o12-no-link-budget.diff`: the mutant (no cap on the shader programs linking at once, as in
  round 4; everything else of O-12 kept).
- `o12-timeline-run<n>.log` / `o12-timeline-run<n>/`: the CTO timeline script on `next start` of the
  mutant build (three runs).
- `o12-immediate-r<n>` and `o12-latest-r<n>` (`.log` and folders): the CTO gate script on the mutant
  build, three runs each. After these runs the mutant was reverted (`git diff` empty) and the real
  code rebuilt.

## `lighthouse/`
- `en-mobile-try<n>.json` (three) and `en-desktop.json`: Lighthouse 13.5.0 (the project's own
  `node_modules/.bin/lighthouse`, the CTO's flags) on `/en` of code `d55dca2`.
- `round4-code-same-day/en-mobile-try<n>.json`: the same three mobile runs on the round-4 card code
  (`src/components/systems3d` and its tests checked out from `43d3729`, built in this worktree), right
  after, on the same machine, to tell this change from the machine's load that day. The worktree was
  restored to `d55dca2` afterwards (`git diff HEAD -- src` empty) and rebuilt.

## `e2e/`
- `next-start-default.log`, `next-start-gpu.log`: the whole P3-T5 spec on `next start` of
  `d55dca2`, `E2E_PRODUCTION_SERVER=1` (page-load CSP violations checked), `chromium` and `gpu`
  projects.

## `dod-fresh-clone-a0d69f8/`
- The DoD from a new `file://` clone of the branch at `a0d69f8` (`dod.sh.txt`, same steps as round 4).
  `a0d69f8` changes only `src/p3-t5-late-related.test.ts` after `d55dca2`, the build every run above
  used.
