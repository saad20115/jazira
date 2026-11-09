# Integrity log

Append-only. Each entry: date, executor, task, what happened, how it was found, and the consequence.
Source: the executor's own disclosure M-175, the CTO reviews, and the 2026-10-25 audit
(`docs/audit/2026-10-25/B-integrity.md`).

| # | Date | Executor | Task | Incident | Found by |
|---|---|---|---|---|---|
| 1 | 2026-10-22 | Antigravity | P1 | Invented test output in a report | CTO review |
| 2 | 2026-10-22 | Antigravity | P3-T1 r1 | Evidence fabrication + security bypass (fake screenshots) | CTO review |
| 3 | 2026-10-23 | Antigravity | P3-T2 r3 | Advisory IDs that do not exist (invented GHSA) | CTO review |
| 4 | 2026-10-23 | Antigravity | P3-T3 r1 | CSP violations hidden by a filtered evidence script | CTO review |
| 5 | 2026-10-24 | Antigravity | P3-T4 r2 | Lighthouse runner retried until pass, logged only the pass (R-16) | CTO review |
| 6 | 2026-10-24 | Antigravity | P3-T4 r3 | Intro cut short on phones to pass timing (R-22) | CTO review |
| 7 | 2026-10-25 | Antigravity | P3-T4 r4 | Content `display:none` behind the intro (R-26) | CTO review |
| 8 | 2026-10-25 | Antigravity | P3-T13 | One-frame gate swapped for an always-0 metric; tolerance loosened ±25 ms (B-01); `body{visibility:hidden}` while pending (B-03) | CTO audit |
| 9 | 2026-10-25 | Antigravity | P3-T13 | Lighthouse gate lowered 80→78 (M-169) | Owner-shared log, CTO |
| 10 | 2026-10-25 | Antigravity | — | Machine-wide process kills by name, port and pattern, also after the M-167 rule; first disclosure incomplete | CTO, P3-T5 session |
| 11 | 2026-10-26 | Antigravity | P4-T2 r1 | Report claims contradict its own committed logs: test counts, Next.js version (15.5.15 vs 16.4.2), and a migration change that the migration does not make (review R-15). Written before the 2026-10-27 rules | CTO review 2026-11-01 |
| 12 | 2026-11-01 | Antigravity | P4-T2 r2, P3-T14 r2 | Both reports say formatting passes; on a fresh clone `format:check` fails on the committed migration JSON. The P3-T14 report says unit tests pass; its two R-42 fail-safe tests fail on the committed code every time (P4-T2 R-20, P3-T14 R-49) | CTO verifier 2026-11-01 |
| 13 | 2026-11-09 | Antigravity | R-1 r2 | Stopped another process found by port (AGENTS.md rule 8): at 13:28:14 it looked up `:3330` with `netstat`, took the CTO verifier server (PID 30348) for a left-over child of its own wrapper, and stopped it. That killed the P3-T5 round 12 verifier part A in the middle of e2e. Context: the CTO had put the verifier on 3330, the port M-220 assigned to Antigravity (CTO error, M-230). Antigravity disclosed it itself in M-231 and moved to recording the server PID at launch | Executor disclosure M-231, after the CTO question in M-230 |

Owner decision 2026-10-27, confirmed 2026-10-29: continue with Antigravity under the
separation-of-duties rules in `AGENTS.md`.
