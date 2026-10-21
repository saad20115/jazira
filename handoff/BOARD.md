# Board

Protocol: `handoff/README.md` (continuous mode). Order: `handoff/PLAN.md`.
Executor sets `IN_PROGRESS` / `IN_REVIEW` / `BLOCKED`; CTO sets `TODO` / `CHANGES_REQUESTED` /
`ACCEPTED` / `DEFERRED`. WIP limit: max 2 tasks waiting on the CTO.
A task whose card `handoff/tasks/<ID>.md` does not exist yet is not ready: post a message and
watch the channel.

| ID | Task | Status | Round | Updated | By |
|---|---|---|---|---|---|
| P1-T1 | Repo, scaffold, pinned versions, tooling | ACCEPTED | 2 | 2026-10-21 | CTO |
| P1-T2 | Env validation, Payload & Next config, dev DB | ACCEPTED | 2 | 2026-10-21 | CTO |
| P1-T3 | Access helpers, `users` (auth hardening), `media` (upload safety) | IN_REVIEW | 2 | 2026-10-21 | Antigravity |
| P1-T4 | Migration, e2e smoke, CI, phase-1 report | IN_PROGRESS | 1 | 2026-10-21 | Antigravity |
| P2-T1 | Shared field factories & hooks | TODO | 0 | 2026-10-21 | CTO |
| P2-T2 | `videos`, `brands`, `stats`, `materials` | TODO | 0 | 2026-10-21 | CTO |
| P2-T3 | `services`, `team` | TODO | 0 | 2026-10-21 | CTO |
| P2-T4 | `projects` | TODO | 0 | 2026-10-21 | CTO |
| P2-T5 | Globals | TODO | 0 | 2026-10-21 | CTO |
| P2-T6 | `quote-requests` | TODO | 0 | 2026-10-21 | CTO |
| P2-T7 | Dashboard UX & Live Preview | TODO | 0 | 2026-10-21 | CTO |
| P2-T8 | Access test suite, migrations, phase-2 report | TODO | 0 | 2026-10-21 | CTO |
| P3-T1 | Frontend foundations, i18n, CSP | TODO | 0 | 2026-10-21 | CTO |
| P3-T2 | Shell & primitives + styleguide | TODO | 0 | 2026-10-21 | CTO |
| P3-T3 | Cards & motion components | TODO | 0 | 2026-10-21 | CTO |
| P3-T4 | Home page + intro | TODO | 0 | 2026-10-21 | CTO |
| P3-T5 | 3D building section | TODO | 0 | 2026-10-21 | CTO |
| P3-T6 | Services page | TODO | 0 | 2026-10-21 | CTO |
| P3-T7 | About page | TODO | 0 | 2026-10-21 | CTO |
| P3-T8 | Projects + Project detail | TODO | 0 | 2026-10-21 | CTO |
| P3-T9 | Contact + Quote Form UI | TODO | 0 | 2026-10-21 | CTO |
| P3-T10 | SEO, a11y, performance, phase-3 report | TODO | 0 | 2026-10-21 | CTO |
| P4-T1 | Materials + brands seed | TODO | 0 | 2026-10-21 | CTO |
| P4-T2 | Settings, services, copy, placeholders seed | TODO | 0 | 2026-10-21 | CTO |
| P5-T1 | Quote handler + anti-abuse + email | TODO | 0 | 2026-10-21 | CTO |
| P5-T2 | Odoo client, jobs, retries, mock | TODO | 0 | 2026-10-21 | CTO |
| P5-T3 | HARD STOP — real Odoo test lead | DEFERRED | 0 | 2026-10-21 | CTO |
| P6-T1 | Production packaging (local only) | TODO | 0 | 2026-10-21 | CTO |
| P6-T2 | HARD STOP — VPS deployment | DEFERRED | 0 | 2026-10-21 | CTO |
| P7-T1 | Arabic editor guide | TODO | 0 | 2026-10-21 | CTO |
| P7-T2 | Operations runbook, final report | TODO | 0 | 2026-10-21 | CTO |

## Notes from CTO
- 2026-10-21: `_payload-reference/payload-main/` is **Payload 4.0.0-beta.3**, not 3.91.0. Do not
  use it to learn 3.91 behaviour — read `node_modules/payload` (3.91.0) and the 3.x docs instead.
- 2026-10-21: Docker Desktop was started on this machine; check `docker info` before P1-T2.
- 2026-10-21: `design/` is the offline Figma export (being generated now by the CTO). Once
  `design/INDEX.md` exists, commit it on its own (`docs: add Figma design export`) and add
  `design/` to `.prettierignore`. Never edit files in it.
