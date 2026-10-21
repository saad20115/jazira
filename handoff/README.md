# Handoff channel — CTO ⇄ Executor

This folder is the **only** communication channel between the CTO (Claude Code) and the
executor (Antigravity). Both read and write files here. The user only tells each side
"check the channel"; content is never relayed by copy-paste.

| Role | Who | Writes code? | Owns |
|---|---|---|---|
| CTO | Claude Code | **No.** Plans, assigns, reviews, tests, accepts. | `handoff/tasks/`, `handoff/reviews/`, `docs/`, `AGENTS.md` |
| Executor | Antigravity | Yes — everything under the repo except CTO-owned files | `handoff/reports/`, all source code |
| Owner | The user | Decides scope, client questions, approves merges | — |

Neither side edits the other's files. If a spec in `docs/` looks wrong, the executor asks
in its report; only the CTO changes specs.

## Layout
```
handoff/
  README.md            this protocol
  BOARD.md             single source of truth for task status
  tasks/<ID>.md        task cards, written by the CTO
  reports/<ID>.md      executor's report for that task (overwritten each round, history in git)
  reviews/<ID>.md      CTO review rounds for that task (appended, never rewritten)
```
Task IDs: `P<phase>-T<n>` (e.g. `P1-T2`).

## Task lifecycle
```
TODO ──executor──> IN_PROGRESS ──executor──> IN_REVIEW ──CTO──> ACCEPTED
                        ▲                        │
                        └──executor── CHANGES_REQUESTED <──CTO──┘
           any state ──executor──> BLOCKED (question in report) ──CTO──> back to previous state
```
- The executor sets only `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`.
- The CTO sets only `TODO`, `CHANGES_REQUESTED`, `ACCEPTED`.
- **One task at a time.** The executor works on the lowest-numbered task in `TODO` or
  `CHANGES_REQUESTED`, and **stops** after setting `IN_REVIEW`. It never starts the next task
  until the current one is `ACCEPTED`.
- A phase is done when all its tasks are `ACCEPTED`; then the executor opens the phase PR with
  the phase report (format in `AGENTS.md`), and the CTO does a final phase review.

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
4. Set `BOARD.md` to `IN_REVIEW`, commit the report + board (`docs: P1-T1 report`), stop.

"Should work" is not evidence. Paste real output. If you could not run something, say so.

## CTO: how a review is done
The CTO does not trust the report alone. For every review the CTO:
1. Reads the diff commit by commit.
2. Re-runs the evidence commands on a clean checkout (`pnpm install --frozen-lockfile`, lint,
   typecheck, tests, build, audit).
3. Tests behaviour directly: boots the app, probes the API (auth, roles, uploads, headers),
   tries the negative cases in `docs/03-security.md`.
4. From Phase 3: compares every page with Figma (file `tD3pU1vtvSr8akTMJPFLkA`) at 1440 / 768 /
   390 in `ar` and `en`, side by side.

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
