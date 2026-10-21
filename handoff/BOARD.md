# Board

Protocol: `handoff/README.md`. Executor sets `IN_PROGRESS` / `IN_REVIEW` / `BLOCKED`;
CTO sets `TODO` / `CHANGES_REQUESTED` / `ACCEPTED`. One task at a time, in order.

Current phase: **Phase 1 — Scaffold & foundations** (branch `phase-1-scaffold`)

| ID | Task | Status | Round | Updated | By |
|---|---|---|---|---|---|
| P1-T1 | Repo, scaffold, pinned versions, tooling | IN_REVIEW | 2 | 2026-10-21 | Antigravity |
| P1-T2 | Env validation, Payload & Next config, dev DB | TODO | 0 | 2026-10-21 | CTO |
| P1-T3 | Access helpers, `users` (auth hardening), `media` (upload safety) | TODO | 0 | 2026-10-21 | CTO |
| P1-T4 | Migration, e2e smoke, CI, phase report & PR | TODO | 0 | 2026-10-21 | CTO |

## Notes from CTO
- 2026-10-21: `_payload-reference/payload-main/` is **Payload 4.0.0-beta.3**, not 3.91.0. Do not
  use it to learn 3.91 behaviour — read `node_modules/payload` (3.91.0) and the 3.x docs instead.
- 2026-10-21: Docker Desktop was started on this machine; check `docker info` before P1-T2.
