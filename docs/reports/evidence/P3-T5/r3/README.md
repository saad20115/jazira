# P3-T5 round 3 evidence (owner review O-1…O-6) — non-authoritative

Raw files the executor made. Nothing here is a number of record (AGENTS.md, evidence integrity);
the CTO verifier re-runs DoD, e2e, gpu e2e and Lighthouse on the submitted SHA.

## `lighting/` (O-5, for the owner to judge by eye)
- `before/`: the r2 build (`next start` of `f3654a7`, the build the owner reviewed), taken before any
  round-3 change.
- `after/`: the round-3 build (`next start` of the submitted code SHA).
- Same script for both (`scripts/evidence/p3-t5-lighting-shots.mjs`), same machine (Intel HD 530,
  Chrome/ANGLE D3D11, so the **lite** tier), same steps: "Open the live 3D model", then keys 1–5 on the
  focused card, a shot of the card once each flight has landed. Files are
  `<width>-<locale>-<n>-<view>.png`: widths 1440 and 390 (touch), `en` and `ar`, the overview (`0`)
  and the five systems (`1-hvac` … `5-smart`). `after/` also has `00-image`: the card before the start
  (the Figma image, badge and open button); the script gained that shot after `before/` was taken.
- `after-full-tier/`: the overview and five systems at 1440 `en` with a spoofed high-performance GPU
  name (a one-off copy of the script with the same renderer-name override as the full-tier e2e; not
  committed), so the full model and bloom run; it shows the code path and that nothing blows out, not a
  real full-tier GPU.
- In `before/` the r2 controls show (zoom +/−, Done); in `after/` only the round-3 controls.

## `e2e/`
- On `next dev`: `dev-default-run1.log`; `dev-gpu-run1-keyboard-focus-before-hydration.log` (failed:
  the test focused the card before it was hydrated; fixed in the test, see the report);
  `dev-gpu-run2-keyboard-only.log`.
- `dev-default-mutant-o6-no-spread.log`: the O-6 e2e with dot spreading switched off (must fail; only
  the summary lines were kept).
- `next-start-default-run1.log`, `next-start-gpu-run1.log`: the whole spec on `next start` of the code
  SHA, with `E2E_PRODUCTION_SERVER=1` (page-load CSP violations checked).

## `dod-fresh-clone-run1-55aa82d/`, `dod-fresh-clone-run2-65b63d9/`
- The DoD from a new `file://` clone of the branch (`dod.sh.txt`, same steps as round 2). Run 1
  failed `pnpm lint` and `pnpm typecheck` (the PNG import had no types before the first build; fixed in
  `65b63d9`). Run 2 is on the code SHA.

## `unit/`
- `mutant-header-rule-reverted.log`, `mutant-blend-called-in-warmup.log`: must-fail mutant runs.

## Round 3, part 2 (O-7, O-8)
- `hint-recordings/hint-<width>-<locale>/hint-<width>-<locale>.webm`: the O-7 tap hint on `next start`
  of the code SHA, at 1440 and 390 (touch), `en` and `ar` (`scripts/evidence/p3-t5-hint-recordings.mjs`):
  the first cycle, the one repeat, then a click or tap that starts the model.
- `e2e/dev-default-mutant-*.log`, `e2e/dev-gpu-mutant-*.log`: must-fail mutants of the O-7 and O-8
  tests on `next dev` (no blurred placeholder; hover not stopping the hint, runs 1 and 2; reduced
  motion ignored; `fan_spin` off; the entered header exiting from a still). Run 1 of the hover mutant
  passed against the first version of the test; the test was tightened and run 2 fails.
- `e2e/dev-gpu-o8-run1.log`: the new gpu tests on `next dev`.
- `e2e/next-start-default-run2-o7-o8.log`, `e2e/next-start-gpu-run2-o7-o8.log`: the whole spec on
  `next start` of the code SHA, `E2E_PRODUCTION_SERVER=1`.
- `dod-fresh-clone-run3-8eb916f/`: the DoD from a new clone at the code SHA.
