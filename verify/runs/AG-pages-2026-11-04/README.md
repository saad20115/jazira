# Verifier run: Antigravity P3-T6..P3-T9 round 1 — 2026-11-04

- **Target:** `phase-3-frontend` at `8d805dd`. A fresh `git clone --no-local D:\jazira` into
  `D:\jazira-verify\2026-11-04\ag-pages`, with `git lfs pull` and a clean `git fsck`.
- **Environment:** Docker project `aljazira-verify9`, production `next start` on 3320, `.env` from `make-env.mjs` with
  fresh secrets (not archived). Retries 0.
- **Steps (`scripts/ag-pages-run.sh`):** DoD, then `next start`, then e2e default (pre-run, publish home, run), then
  page shots, then Arabic off.
  - A script error (a wrong log path) wrote the logs into the old `2026-11-02/logs/ag-r3` folder. They were moved
    out by modification time. The old AG-r3 run is archived in `verify/runs/AG-r3-2026-11-03/`, so nothing of
    record was lost.
- **Content for the review** (verifier copy only):
  - A fresh seed leaves `services` and the page globals as drafts, and all team members inactive. The seed images
    are placeholder media, which the public cannot read (`readPublicNonPlaceholderMedia`).
  - So `scripts/publish-pages-as-fixture.mjs` published the page globals and services as the e2e fixture admin
    (`logs/publish-pages.log`).
  - `scripts/activate-team-as-fixture.mjs` set the team active (`logs/activate-team.log`). That gives
    `page-shots/en-*-about-team-active.png`.
  - The first shots, taken before publishing, are kept outside the archive (`page-shots-1-unpublished`).
- **Arabic** was on for the e2e and the `ar` shots, then off again (`arabic-after.txt`).
- `page-shots/pages.json` holds the status, `dir`, horizontal scroll and console errors per page. These are raw.
