# Handoff channel — CTO ⇄ Executor

This folder is the **only** communication channel between the CTO (Claude Code) and the
executor (Antigravity). Both read and write files here, and both watch `MESSAGES.md` for the
other side's messages. The user does not relay anything.

| Role | Who | Writes code? | Owns |
|---|---|---|---|
| CTO | Claude Code | **No.** Plans, assigns, reviews, tests, accepts. | `handoff/tasks/`, `handoff/reviews/`, `docs/`, `AGENTS.md` |
| Executor | Antigravity | Yes — everything under the repo except CTO-owned files | `handoff/reports/`, all source code |
| Owner | The user | Decides scope, client questions, GitHub and server access | — |

Neither side edits the other's files. If a spec in `docs/` looks wrong, the executor asks
in its report; only the CTO changes specs.

## Layout
```
handoff/
  README.md            this protocol
  MESSAGES.md          append-only message log between CTO and executor (see below)
  BOARD.md             single source of truth for task status
  tasks/<ID>.md        task cards, written by the CTO
  reports/<ID>.md      executor's report for that task (overwritten each round, history in git)
  reviews/<ID>.md      CTO review rounds for that task (appended, never rewritten)
```
Task IDs: `P<phase>-T<n>` (e.g. `P1-T2`).

## Messages and watching (no human relay)
The user does not carry messages between us. Both sides talk through `handoff/MESSAGES.md` and
both sides **watch** it.

**Format** — append only; never edit or delete an earlier message. Numbers increase by one.
```
## M-<nnn> · <YYYY-MM-DD HH:MM> · CTO → Executor · <subject>
<body: what you need, with links to files>

## M-<nnn> · <YYYY-MM-DD HH:MM> · Executor → CTO · Re M-<nnn> · <subject>
<body>
```
**The executor posts a message whenever** it starts a task, submits a task (`IN_REVIEW`), gets
blocked (`BLOCKED` + the question), or has news the CTO should know (e.g. a long install failed).
A board change without a message is not a submission.

**The executor watches the channel.** After every submission or block, do not end your session:
wait for the CTO's next message by polling every 30 s, for example in PowerShell:
```
$f='handoff/MESSAGES.md'; $n=(Select-String -Path $f -Pattern '· CTO → Executor ·').Count
while ((Select-String -Path $f -Pattern '· CTO → Executor ·').Count -eq $n) { Start-Sleep 30 }
```
If your terminal tool times out, run it again. When it returns, read the new message(s) and the
files they point to, act, and post your reply.

**The CTO watches the channel** the same way for `Executor → CTO` messages, and answers there.
The user is only asked for decisions that are theirs (client data, scope, merges, GitHub access).

## Task lifecycle
```
TODO ──executor──> IN_PROGRESS ──executor──> IN_REVIEW ──CTO──> ACCEPTED
                        ▲                        │
                        └──executor── CHANGES_REQUESTED <──CTO──┘
           any state ──executor──> BLOCKED (question in report) ──CTO──> back to previous state
```
- The executor sets only `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`.
- The CTO sets only `TODO`, `CHANGES_REQUESTED`, `ACCEPTED`, `DEFERRED`.

### Continuous mode (in force from 2026-10-21, M-007)
The executor works through `handoff/PLAN.md` **in order, without stopping**, until every task
is `ACCEPTED` or is a hard stop. The CTO reviews each task as it lands, in parallel.

1. **Submit and move on.** After you set a task to `IN_REVIEW` and post the message, start the
   next task in `PLAN.md` right away. Do not wait for the review.
2. **Fixes come first.** When a review sets a task to `CHANGES_REQUESTED`, finish the commit you
   are on, then fix that task's findings before any new work, resubmit it (`IN_REVIEW`, next
   round, message), and go back to where you were. Fix on the branch that owns the task.
3. **WIP limit = 2.** At most two tasks may be waiting on the CTO (`IN_REVIEW` or
   `CHANGES_REQUESTED`) at once. If you would exceed it, watch the channel until a review
   arrives instead of starting more work.
4. **Blocked ≠ stopped.** If a task needs a decision from the CTO or the user, set it `BLOCKED`,
   post the question, and continue with the next task that does not depend on it.
5. **Hard stops** (marked `HARD STOP` in `PLAN.md`) need the user or the client: real Odoo,
   the production server. Skip them and continue; they are done later together.
6. **Phase branches stack.** Phase N+1 branches from the tip of phase N (`phase-2-content` from
   `phase-1-scaffold`, …). When every task of a phase is `ACCEPTED`, the CTO posts "merge
   phase N"; then you merge that branch into `main` with `--no-ff` and continue.
7. **Done** = every task `ACCEPTED` or `DEFERRED` except hard stops. Post a final message with the
   project report and keep watching the channel.
8. **Context resets.** If your session restarts or your context is cleared, re-read `AGENTS.md`,
   this file, `PLAN.md`, `BOARD.md` and the last 5 messages before doing anything.

## Executor: how to submit a task
1. Set the task row in `BOARD.md` to `IN_PROGRESS` with today's date.
2. Do the work on the phase branch, small Conventional Commits.
3. Write `handoff/reports/<ID>.md`:
   ```
   # <ID> report — round <n>
   ## Done            what was built, with file paths
   ## Evidence        every item the task card asks for: exact commands + trimmed real output
   ## Acceptance      [x]/[ ] each criterion from the task card, one-line proof each
   ## Review findings (round ≥ 2) each R-n from the last review: fixed how / disputed why
   ## Dependencies    name@exact — reason, weekly downloads, last publish, alternatives
   ## Deviations      should be empty
   ## Questions for CTO
   ## Commits         `git log --oneline` for this task
   ```
4. Set `BOARD.md` to `IN_REVIEW`, commit the report + board (`docs: P1-T1 report`), post an
   `Executor → CTO` message in `MESSAGES.md` with the commit range, then start the next task
   (continuous mode). Check the channel at every commit boundary for new CTO messages.

"Should work" is not evidence. Paste real output. If you could not run something, say so.

## CTO: how a review is done
The CTO does not trust the report alone. For every review the CTO:
1. Reads the diff commit by commit.
2. Re-runs the evidence commands on a clean checkout (`pnpm install --frozen-lockfile`, lint,
   typecheck, tests, build, audit).
3. Tests behaviour directly: boots the app, probes the API (auth, roles, uploads, headers),
   tries the negative cases in `docs/03-security.md`.
4. From Phase 3: compares every page with Figma (file `tD3pU1vtvSr8akTMJPFLkA`, exported in
   `design/`) at 1440 / 768 / 390 in `ar` and `en`, side by side, against the fidelity rules in
   `docs/05-design.md` §"CTO decisions".

Then appends a round to `handoff/reviews/<ID>.md`:
```
## Round <n> — <date> — ACCEPTED | CHANGES_REQUESTED
### Findings
- R-1 [blocker|major|minor] <file:line> — what is wrong — what "fixed" looks like
### Verified
- what the CTO re-ran or tested, and the result
```
`blocker`/`major` must be fixed before acceptance. `minor` may be deferred only if the CTO
says so in the review.

### Liveness (added 2026-10-21 after a 3-hour silent stall)
- Post a one-line `Executor → CTO` status message at least every **45 minutes** of work
  ("P1-T3: integration tests 14/20 passing, fixing lockout test").
- Any command that runs longer than **10 minutes**, hangs, or any tool/API error you cannot
  recover from (e.g. `503 UNAVAILABLE`) → stop it, post what happened, then continue with what
  you can. Never wait silently on a stuck command.
- Integration tests must have timeouts (Vitest `testTimeout`/`hookTimeout`) and close every DB
  connection in `afterAll`, so a test run can never hang.

### Evidence files (added 2026-10-22 after invented test output in a report)
- Run every command you cite with its output saved **unedited** to
  `docs/reports/evidence/<ID>/r<round>/<name>.log` (e.g. `pnpm lint 2>&1 | tee …/lint.log`),
  from a **fresh clone of the commit you submit**, and commit those logs with the report.
- The report quotes **only** from those files (copy, never retype or summarise inside a quote).
  Test titles, error messages and counts must match the log byte for byte.
- If something was not run, write "not run" — never reconstruct output.
- Every evidence set starts with `commit.log` (`git rev-parse HEAD` and `git status --porcelain`
  of the fresh clone), and `migrate-up-down-up.log` starts from an **empty** database.
- (added 2026-10-22, P2-T4 R-12) Record logs with `NO_COLOR=1 FORCE_COLOR=0` (no ANSI codes), UTF-8
  without BOM. **Never type a file:line by hand:** generate `citations.log` with `git grep -n` for
  every identifier you cite and cite only from it. A behaviour claim cites a test title that
  appears in `test.log`. A wrong citation or an invented identifier is a major finding.
- (added 2026-10-23) A test is described from **its code** (locale, nesting, data), not from intent.
  Never mention a file that is not in the submitted commit. If logs are post-processed (e.g. ANSI
  colour stripped because Payload forces colour), say exactly how; any other edit is forbidden.
- (added 2026-10-23) A screenshot is described in **one line naming what it proves**. Never list UI
  text, controls or nav items you did not read in the image itself.
- (added 2026-10-23, P2-T8 R-3) `citations.log` contains **only** the lines returned by
  `git grep -n -e '<identifier>'` for each cited identifier (one block per identifier, with the
  command line). A dump of whole files is rejected.
- (added 2026-10-23, P2-T8 R-13..R-16 — evidence integrity)
  - **Citation checker (mandatory from now on):** `pnpm check:citations <report.md> <citations.log>`
    (a script in `scripts/`, run in CI on every `handoff/reports/*.md` and `docs/reports/*.md` changed
    in a PR). Every citation must be written as `` `identifier` (`path:line`) `` and the checker fails
    unless the identifier text occurs on that exact line at the submitted commit. `git grep` patterns
    in `citations.log` must be identifiers (≥ 3 chars, letters/digits/`_$.-` only) — no empty,
    punctuation-only or common-word patterns. Its output goes into `citations-check.log`.
  - **Evidence of a reviewed round is immutable.** Never edit files under `docs/reports/evidence/<ID>/r<n>/`
    after that round was submitted; corrections go in the next round's folder.
  - **Every log shows where it ran:** each DoD script step prints `pwd` and `git rev-parse HEAD` first;
    logs from the working tree instead of the fresh clone are rejected.
  - Numbers you quote (downloads, sizes, timings) come from a command whose output is in a log.
- (added 2026-10-23, P3-T1 R-1/R-2 — machine-captured evidence)
  - Console, CSP, hydration and network evidence come from a **committed script** in
    `scripts/evidence/` (e.g. Playwright collecting `console`, `pageerror`,
    `securitypolicyviolation` events and the request list) that writes JSON or log files. The
    reviewer re-runs it.
  - Screenshots are only for visuals. **Any text overlaid on or pasted under a screenshot is
    forbidden**, and so is any artefact made to look like tool output.
  - Commit hashes in reports and logs are printed by `git rev-parse HEAD` inside the clone, never
    typed by hand.
  - A fresh clone starts in an empty directory with no copied `node_modules`. `install.log` must show
    packages being added.

### Migrations (added 2026-10-23)
- Never edit a committed migration, merged or not. Every schema change is a new migration; add a
  backfill step when existing rows need the new data.
