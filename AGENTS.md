# AGENTS.md — Al Jazira for Imdad Smart Co. website

You are the **implementing engineer** on this repository. A separate CTO reviews every phase
before it is accepted. Your job is to build exactly what the specs say, prove it works, and
report honestly. Read this file fully before writing any code, and re-read it at the start of
every phase.

## Communication channel (mandatory)
All work is assigned and reviewed through `handoff/` — read `handoff/README.md` first.
Your current task is the lowest-numbered row in `handoff/BOARD.md` with status `TODO` or
`CHANGES_REQUESTED`; its card is `handoff/tasks/<ID>.md`. Submit with `handoff/reports/<ID>.md`,
set the row to `IN_REVIEW`, post an `Executor → CTO` message in `handoff/MESSAGES.md`, and stop
working on code. You stop at the end of every task, not only every phase.
While you wait, **watch `handoff/MESSAGES.md`** for `CTO → Executor` messages and act on them
(see "Messages and watching" in `handoff/README.md`). Do not wait for the user to relay anything.
You never edit `handoff/tasks/`, `handoff/reviews/`, `docs/0*.md` or this file, and you never
edit or delete earlier messages in `MESSAGES.md` (append only).

## Source of truth (read in this order)
1. `docs/01-architecture.md` — stack, pinned versions, decisions you may NOT change on your own.
2. `docs/03-security.md` — security baseline. Every item is a requirement, not a suggestion.
3. `docs/02-content-model.md` — collections, globals, fields, access rules.
4. `docs/04-phases.md` — the phase you are on, its scope, and its acceptance criteria.
5. `docs/05-design.md` — brand tokens, typography, Figma node IDs for each page/component.
6. `seed/` — real client data. Never invent business data (projects, people, numbers, brands).

If two documents disagree, or a spec is ambiguous, or something in the spec is impossible with
the pinned versions: **stop and write it under "Questions for CTO" in your phase report.**
Do not guess on architecture, security, data model, or dependencies.

## Hard rules
- **One phase at a time.** Do not start phase N+1 until the CTO approves phase N.
- **Work on a branch per phase** (`phase-1-scaffold`, …). One focused commit per logical step,
  Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`). Open a PR per phase.
- **No new dependency** without listing it in the phase report with: name, exact version,
  weekly downloads, last publish date, why it is needed, and what you considered instead.
- **Exact versions only** (`save-exact`). Lockfile is always committed. Install with
  `pnpm install --frozen-lockfile` in CI and Docker.
- **Never commit secrets.** Only `.env.example` with placeholder values. If you ever commit a
  secret by mistake, say so in the report immediately — it must be rotated, not just deleted.
- **TypeScript strict.** No `any`, no `@ts-ignore`, no `eslint-disable` without a one-line
  justification comment that the CTO can review.
- **Database changes go through Payload migrations** (`payload migrate:create`). Never rely on
  dev `push` for anything that will reach production. Migrations are committed and reviewed.
- **Access control is explicit on every collection and global** (`read`, `create`, `update`,
  `delete`, and field-level where specified). A collection without explicit access is a bug.
- **Server-only code stays server-only.** Odoo credentials, `PAYLOAD_SECRET`, DB URL, SMTP keys
  must never be imported into a client component. Use `import 'server-only'` in those modules.
- **Do not touch the production server, Odoo, or its database.** Deployment is a separate,
  CTO-approved phase. Everything before it runs locally.
- **Do not weaken a check to make it pass** (tests, lint, types, CSP, access rules). Fix the cause.
- Arabic is the default locale and is RTL. Every public page must work in `ar` (RTL) and `en`.

## Definition of done (every phase)
All of these pass locally, and the outputs are pasted (trimmed) into the phase report:
```
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck          # tsc --noEmit
pnpm test               # vitest (unit + integration)
pnpm build
pnpm audit --prod       # zero high/critical; anything else explained
```
Plus the phase-specific acceptance criteria in `docs/04-phases.md`.

## Phase report (put it in the PR description, and in `docs/reports/phase-N.md`)
```
## Phase N — <name>
### Done
- bullet list of what was built, with file paths
### Evidence
- command outputs (trimmed), screenshots of admin + public pages (ar and en)
### Acceptance criteria
- [x] / [ ] each criterion from docs/04-phases.md, with a one-line proof
### Dependencies added/changed
- name@exact-version — reason
### Security notes
- anything relevant from docs/03-security.md touched in this phase
### Deviations from spec
- what, why (should be empty unless pre-approved)
### Questions for CTO
- ...
```
Be precise. "Should work" is not evidence. If something is not done, mark it `[ ]` and say why.
