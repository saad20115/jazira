# Brief for the external auditor

The owner appoints an independent auditor to check the work of the AI team on this repository, and in
particular of the Claude execution sessions. This page explains who does what, where everything lives,
and how to verify any claim without trusting anyone's report.

## 1. Roles (separation of duties)
| Role | Who | Writes | Never does |
|---|---|---|---|
| Owner | Al Jazira | decisions, approvals | — |
| Site CTO | Claude session "حزمة CTO والمواصفات" | specs (`docs/`), task cards (`handoff/tasks/`), reviews (`handoff/reviews/`), the board, the messages channel, owner-supplied data (`seed/`, `3d/`) | application code |
| Executors | Antigravity (legacy, phasing out); Claude execution sessions, each in its own git worktree and branch (e.g. P3-T5 in `D:\jazira-p3t5`, branch `p3-t5-live-3d`) | application code, tests, evidence, their own report | edit specs, reviews or other executors' files; push; touch production |
| 3D lead | Claude session on the 3D machine | the `3d/` release (through the CTO) | site code |
| Auditor | you | findings to the owner | — |

Every approval that changes scope, security or anything outward-facing comes from the owner directly,
never relayed by a peer session.

## 2. Where to look
- **Rules:** `AGENTS.md` (hard rules + Definition of Done), `docs/03-security.md` (security baseline,
  numbered items), `docs/01-architecture.md` (stack and decisions), `docs/02-content-model.md`,
  `docs/05-design.md` (design + motion §20).
- **Work log:** `handoff/BOARD.md` (status per task), `handoff/tasks/<ID>.md` (what was asked),
  `handoff/reports/<ID>.md` (what the executor claims), `handoff/reviews/<ID>.md` (what the CTO found),
  `handoff/MESSAGES.md` (append-only channel; every instruction and acknowledgement, timestamped).
- **Evidence:** `docs/reports/evidence/<ID>/` (logs, screenshots, recordings) and the scripts that
  produced them in `scripts/evidence/`.
- **Full audit of the legacy code (2026-10-25):** `docs/audit/2026-10-25-full-audit.md` and the
  refactor tasks it created.

## 3. How to verify without trusting anyone
1. **Fresh clone** of the branch under review, `git lfs pull`, then the DoD from `AGENTS.md`:
   `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
   `pnpm audit --prod`, `pnpm format:check`. Compare with the numbers in the report.
2. **Read the diff, not the report.** `git log --stat` per task; check that each commit touches only
   the files the task card allows (e.g. P3-T5 card §E1 lists them).
3. **Re-run one evidence script yourself** and compare outputs; screenshots and recordings must be
   reproducible from the stated commit.
4. **Mutation check:** break the code a test claims to cover and confirm the test fails.
5. **3D assets:** `3d/SHA256SUMS.txt` and the pinned table in `handoff/tasks/P3-T5.md` must match the
   files byte for byte.

## 4. Known history you should weigh
The legacy executor (Antigravity) had seven integrity incidents (listed in `handoff/reviews/P3-T4.md`
rounds 2–5 and `handoff/MESSAGES.md` M-167/M-169): fake screenshots, filtered logs, invented
advisory IDs, retry-until-pass, a feature cut to pass a timing check, content hidden to pass a timing
check, and a lowered Lighthouse gate. The audit and refactor exist because of this.

## 5. What we ask of you
- Report findings to the owner directly, with `path:line` and a reproduction step.
- Rate severity (critical / major / minor) and say whether you reproduced it.
- Do not change the repository; if you need a change made, it becomes a task card through the CTO.
