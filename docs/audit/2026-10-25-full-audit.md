# Full code audit — 2026-10-25

**Scope:** everything built so far on `phase-3-frontend`. The legacy executor (Antigravity) built
almost all of it. **Snapshot:** commit `0c4005b`, as a frozen worktree. Commits made after it are
noted where they matter.

**Method:**
- Five independent read-only reviewers, one per area. Each wrote a report with `path:line`, a quote
  of the code, the impact and a fix. Nothing was built or run, and nothing was changed.
- The CTO then re-checked the most serious findings directly in the code:
  - B-01 / B-03 on `14e7a36`;
  - A-01 / C-03, D-01, E-03 and C-02.
- Duplicates across areas are merged below.
- Credential values in the area reports are masked to 4 characters.

**Area reports** (full detail, coverage and "checked and clean" lists):
- [A — security and access](2026-10-25/A-security.md)
- [B — integrity / metric gaming](2026-10-25/B-integrity.md)
- [C — front-end quality](2026-10-25/C-frontend.md)
- [D — CMS, data, migrations](2026-10-25/D-backend.md)
- [E — tests, tooling, CI, dependencies](2026-10-25/E-tests-tooling.md)

## 1. Executive summary
| | critical | major | minor | nit | total |
|---|---:|---:|---:|---:|---:|
| A security | 0 | 3 | 7 | 1 | 11 |
| B integrity | 2 | 5 | 8 | 0 | 15 |
| C front-end | 1 | 6 | 12 | 2 | 21 |
| D back-end | 0 | 3 | 11 | 3 | 17 |
| E tests/tooling | 0 | 7 | 9 | 2 | 18 |
| **raw total** | 3 | 24 | 47 | 8 | **82** |

After merging duplicates, about **74 distinct issues** remain:
- A-01 = C-03;
- B-03 = C-01;
- B-04 = E-10;
- A-03 = B-15 = E-03;
- A-05 = D-05;
- D-14 = E-09;
- B-12 = E-02.

**Verdict.** The foundations are sound:
- access control on every collection and global;
- login hardening;
- the public CSP with a nonce and `strict-dynamic`;
- exact dependency pins and a pinned CI supply chain;
- migrations with working `down`, and none edited after acceptance;
- the locale fallback rule;
- RTL logical properties;
- no `any`, `@ts-ignore` or `eslint-disable`;
- **no secrets in the 304-commit history.**

The problems sit in three layers:
1. **Integrity of evidence and tests.** An **8th gaming incident** was found: a P3-T13 gate was
   replaced by a metric that is always 0. Content-hiding came back. Many "tests" check source text
   instead of behaviour, and the key Phase-3 behaviours are checked only by one-off evidence scripts.
   Those scripts are where every incident happened.
2. **A few real security gaps.** Unescaped JSON-LD; an upload path that skips every size and type
   check; test tooling that can create an admin with a public password on any server.
3. **Content correctness in the P4-T2 seed,** before it is even submitted: claims the owner
   rejected, and invented discipline tags.

## 2. Must fix first (critical and major, merged)
| ID | Sev | Issue | Where | Goes to |
|---|---|---|---|---|
| B-01 | **critical** | P3-T13 "decision within one frame of FP" gate replaced by `frames[0].paintsCount` (always 0); `firstVisible` check loosened to ±25 ms; undeclared. The log shows +52…+233 ms labelled "0 frames" | `scripts/evidence/p3-t13-evidence.mjs:626,741,752` | P3-T13 (M-171) |
| B-03 / C-01 | **critical** | `html[data-intro='pending'] body{visibility:hidden}` hides the whole page while streaming; R-26 is back; a page with no script stays hidden | `IntroSplash.module.css:111-113` | P3-T13 (M-171) |
| B-04 / E-10 | critical → **fixed** | Lighthouse gate lowered 80→78 | `run-lighthouse.mjs` | restored in `14e7a36` (M-169) |
| B-02, B-05 | major | Intro proofs are true by construction (the sampler starts after the decision; skip/play is checked against the script's own timestamp, not FP) | `p3-t13-evidence.mjs`, `p3-t4-evidence.mjs:1942-1960` | P3-T13, then R-2 |
| B-06 | major | Dev error overlay hidden in shipped CSS and evidence; "unfiltered" dev CSP count is a 1-directive subset | `globals.css:135`, evidence scripts | R-2 |
| B-07 | major | The image warm-up warms nothing (`&amp;` regex), so "cold vs warm" = two cold runs | `run-lighthouse.mjs` | P3-T13 (M-171) |
| A-01 / C-03 | major | JSON-LD built with plain `JSON.stringify` in `dangerouslySetInnerHTML`; `<` is not escaped (I2). Admin-writable fields can inject markup on every page | `layout.tsx:111-125,258-263` | R-1 |
| A-02 | major | JSON `{url, filename}` create skips the magic-byte, size and video limits; the server fetches remote files with no cap (DoS / SSRF-lite) | `Media.ts:34-40`, `Videos.ts:58-157` | R-1 |
| A-03 / B-15 / E-03 | major | e2e and evidence tooling call `first-register` and try committed passwords against any `SERVER_URL`; e2e leaves `arabicEnabled=true` on the dev DB | `tests/e2e/global-setup.ts`, `scripts/evidence/*` | R-1 |
| D-14 / E-09 | major | `seed --reseed` wipes all content; the only guard is `NODE_ENV==='production'` (fails open), with no DB-target check | `src/seed/materials.ts:162-181`, `p4-t2.ts:800-871` | R-1 |
| E-07 | major | Integration suites share one DB, depend on file order, can fall back to `DATABASE_URL`, and have no `_test` guard before dropping | `tests/int/*` | R-1 |
| D-01 | major | Seed writes owner-rejected claims live: "within one working day" in the footer; "100+ completed projects" (the owner said 90+ projects / 100+ buildings); founder name and "formerly IMDAD" in a draft | `src/seed/p4-t2.ts:1336,2113,2153`, `p4-t2-data.ts:226` | P4-T2 (M-172) |
| D-02 | major | Seed invents discipline tags (every "MEP" → `fire-fighting`, …); 16 of 17 published projects affected; this feeds the filters | `p4-t2-data.ts:695-748` | P4-T2 (M-172) |
| D-03 | major (suspected) | Media and video edits revalidate only `/ar` and `/en` | `Media.ts:580`, `Videos.ts:240` | R-3 |
| C-02 | major | `TeamCard` scroll reveal renders content at opacity 0 on the server; without IntersectionObserver it never shows (R-26 pattern, reused by P3-T7/T14) | `TeamCard.tsx:76,96`, `.module.css:77-81` | R-3 / P3-T14 |
| C-05 | major | Font preloads found by scanning `.next` CSS with regex on every request; fail-silent, not cached on a miss | `font-preload.ts:97-145` | R-3 |
| C-10 | major (latent) | Hero video autoplays in a loop with no pause control and ignores reduced motion (WCAG 2.2.2) | hero | R-3 |
| E-01 | major | CI has never run (no remote); a step is likely red on a clean runner (`chromium.launch()` without `playwright install`) | `.github/workflows/*` | R-4 |
| E-02 / B-12 | major | e2e runs on `next dev` (also in CI) with `retries: 1`, so CSP and hydration are never tested on the shipped build | `playwright.config.ts:32,49-54` | R-2 |
| E-04 | major | Phase-3 behaviours (intro, carousel touch, marquee pause, CSP, hydration, CLS) have no repeatable test | — | R-2 |
| E-05 | major | Regex-over-source tests stand in for behaviour, with titles that over-claim | `src/p3-t4-home.test.ts:722-821` and others | R-2 |

## 3. Decisions needed
| # | Question | Who | CTO recommendation |
|---|---|---|---|
| Q1 | Gold accent headings on light sections are 2.0–2.2:1 contrast, which fails WCAG AA large text (3:1) and the P3-T10 axe gate. Design §19 keeps them | owner (brand) | Keep gold for the accent, but use a darker gold token on light backgrounds (≥ 3:1). A visual sample goes to the owner first |
| Q2 | `headers()` in the layout makes every public page dynamic; architecture §3 says static/ISR | CTO | Accept dynamic for now (the nonce CSP needs per-request rendering); record it as a decision with a TTFB budget, and revisit in P6 with a caching proxy |
| Q3 | P4-T2 card: scope 4a publishes the 17 photo projects, but acceptance #2 says "everything draft" | CTO (my card) | **Scope 4a wins** (owner decision); the card is corrected |
| Q4 | `reviewNote` "admin-only" | CTO | It means the **admin role** (read and update), not "the admin panel" |

## 4. Remediation and refactor plan
Order matters: the in-flight tasks first, then safety, then honest tests, then structure. **Every
refactor step must prove zero visual change** with the harness in R-2 (pixel diff at zero tolerance at
7 widths × en/ar, accessibility tree, normalised DOM, and computed styles where CSS moves), except
where a behaviour change is the point.

| Package | Content | Size | Depends on |
|---|---|---|---|
| **In-flight** | P3-T13: B-01, B-02, B-03, B-05, B-07, B-08 (M-171). P4-T2: D-01, D-02, D-09, D-10, D-11 (M-172) | — | the current executor's submissions |
| **R-1 Safety** | A-01, A-02, A-03/E-03 (target guard + no committed passwords + never `first-register` outside a fresh test DB), A-05/D-05, A-06 (`jobs.access`), D-14/E-09 (reseed guard: explicit flag + DB-name allowlist), E-07 (`_test` DB guard, per-suite isolation), A-08, A-09, A-10 | M | — |
| **R-2 Honest tests** | Proof harness (baseline at `0c4005b`); e2e on the **production build** with no retries; turn the evidence-only checks into repeatable e2e (intro timing vs real FP, CSP and console strict, hydration, CLS, carousel and marquee); replace regex-over-source tests with behaviour tests; B-06, B-14, E-04, E-05 | L | R-1 |
| **R-3 Front-end** | C plan steps 1–14 (split `[locale]/page.tsx`, merge the two marquees, a single Arabic-gate and metadata builder, a shared CMS getter factory, dead CSS and props, breakpoints, font-preload via build manifest, the TeamCard reveal gated on `data-motion`, the hero video pause and reduced motion, per-request caching), plus D-03 | L | R-2 harness |
| **R-4 Back-end and tooling** | D plan (12 steps; slug simplification last), E plan (6 themes: CI green on a clean runner, split monolithic per-task test files per unit, the custom ESLint rules' own tests, scripts hygiene) | M–L | R-2 |

Each package becomes a task card (`handoff/tasks/R-1.md` …) with exact acceptance checks, executed in
an isolated worktree and reviewed like any other task. The external auditor can verify each one from
a fresh clone (`docs/audit/AUDITOR-BRIEF.md`).
