# Verifier session kickoff — 2026-11-11

**Owner decision 2026-11-11:** the independent check of the tasks below is done by a **new, separate
session**, not by the CTO session that executed most of them. This file is that session's brief.

## Who you are
You are the **independent verifier** (`AGENTS.md`, "Evidence integrity", items 4 to 7). You did not
write any of this code. You produce the numbers of record. You do **not** fix code, and you do not
edit any branch under test. If something fails, you report it; the executor fixes it.

Read first, in this order: `AGENTS.md`, `handoff/README.md`, `handoff/BOARD.md`, then for each task
its card `handoff/tasks/<ID>.md` and its report `handoff/reports/<ID>.md`.

## What to verify, and in which order
The branches are stacked, so go bottom-up. A failure low in the stack does not stop the tasks above
it from being measured, but say so in each review.

| # | Task | Branch | Code SHA to check out | Report |
|---|---|---|---|---|
| 1 | R-1 safety fixes (round 2) | `r-1-safety` | `45a1bd3` | `handoff/reports/R-1.md` |
| 2 | P3-T10 SEO, a11y, performance | `p3-t10-seo-a11y` | `21a30ac` | `handoff/reports/P3-T10.md` |
| 3 | P5-T1 quote handler | `phase-5-quotes` | `81c9a46` | `handoff/reports/P5-T1.md` |
| 4 | P5-T2 staff workflow, CSV, retention | `phase-5-quotes` | `81c9a46` | `handoff/reports/P5-T2.md` |
| 5 | P2-T7 dashboard UX | `p2-t7-dashboard-ux` | `9f93b29` | `handoff/reports/P2-T7.md` |
| 6 | P3-T5 live 3D tower (round 13 + O-19, O-20) | `p3-t5-live-3d` | `5514a04` | `docs/reports/` on the branch; M-236, M-238 |
| 7 | P3-T15 owner home fixes | `owner-home-fixes` | `fb82c34` | M-239 item 6, M-240 |

Notes:
- **Check the SHAs yourself** against each report before you start. If a report names a different
  code SHA from this table, the report wins; record the mismatch.
- **Item 7 is `P3-T15`.** Its card `handoff/tasks/P3-T15.md` was written after the work, and it has
  no executor report beyond M-239 item 6 and M-240. It branches from `phase-3-frontend`, not from
  the stack above.
- **Item 6:** the owner has asked for a new model (v023, `handoff/briefs/A-1-v023-figma-match.md`).
  Verify the code as submitted against v022n. The visual match to Figma is **out of scope** for this
  run; it is judged again when v023 arrives.
- R-1 has an earlier review in `handoff/reviews/R-1.md`; read it, then verify round 2.

## How to run
- **Fresh clone per task**, outside every existing worktree, for example `D:\jazira-vfy\<ID>`:
  `git clone D:\jazira <dir>` then `git checkout <SHA>`. Never run inside `D:\jazira-p2t7`,
  `D:\jazira-p5t1`, `D:\jazira-p3t10`, `D:\jazira-r1`, `D:\jazira-p3t5`, `D:\jazira-cto` or
  `D:\jazira-owner-fixes`.
- **Own ports, own databases, own Docker project.** Ports 3340 and 3349 belong to the owner's
  previews: do not use them and do not stop them. Do not reuse the databases `aljazira_p2t7_*` or the
  executor's `.env` files; create your own `.env` from `.env.example` with fresh values.
- pnpm: `PATH=/d/jazira-verify/bin:$PATH`.
- For each task run the Definition of Done from `AGENTS.md` (install with the frozen lockfile, lint,
  typecheck, test, build, audit), then migrations up / down / up from an empty database, then the
  task's own acceptance criteria and e2e specs on the **production build**.
- The e2e specs of P2-T7 and of the public pages need the seeded database
  (`NODE_ENV=development pnpm seed`).
- **Retries = 0. Report every run. The worst run decides.** Every gate needs its must-fail fixture.
- Look for the failures listed in `AGENTS.md` item 6: content hiding, UA or tool sniffing in `src/`,
  env-based branching in production code, `.skip`, `.only`, `expect(true)`, removed assertions,
  loosened tolerances. Diff each branch against its base for changes to **protected paths**; any
  touch without a card allowance is a finding.
- Archive the raw output under `D:\jazira-verify\<date>\<ID>\`. Summaries are generated from those
  files, never typed.

## Things the executor flagged — look at these on purpose
- **P2-T7:** `Accept-Language: ar` still gets the English dashboard, cause not found.
  `src/p3-t12-arabic-switch.test.ts` had its `next/navigation` mock extended (no assertion changed).
  `src/previewSecret.ts` has no `import 'server-only'`. A label test stands in for a screenshot of
  every collection and global. Live Preview on the home page has a screenshot only, no test.
- **P5-T1 / P5-T2:** the attachments button in the quote form does not upload. The owner decided on
  2026-11-11 that it **will** upload; that is a new task (`P5-T4`), not a defect of this submission.
- **P3-T10:** the report says runs 1 and 2 were invalid because of an executor tool error, and that
  the e2e overwrote tracked evidence PNGs. Check both statements.

## What you write
- One review per task: `handoff/reviews/<ID>.md`, with the SHA, every command, the path of the raw
  output, each acceptance criterion with pass or fail, and a verdict: `ACCEPT` or
  `CHANGES_REQUESTED`.
- A `Verifier → CTO` message in `handoff/MESSAGES.md` (append only) after each task.
- Any mismatch between an executor claim and your result goes into `handoff/INTEGRITY_LOG.md`.
- You do **not** set `ACCEPTED` on the board. The owner gives the final acceptance in the CTO
  session, on your verdicts.

## Hard limits
- No push, no merge to `main`, no deploy, nothing on GitHub, no spending.
- Never edit `3d/`. Never edit a branch under test, `handoff/tasks/` or `docs/0*.md`.
- Stop only processes whose PID you recorded at launch. Never kill by name, port or pattern.
- Do not restart Docker Desktop and do not change system settings; ask the owner.
- Never print secrets.
- P6-T2 (VPS) is a hard stop.
