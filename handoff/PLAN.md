# Execution plan — Al Jazira website + dynamic dashboard

Owner: CTO. Executor follows this list **top to bottom** in continuous mode
(`handoff/README.md` → "Continuous mode"). Each row has a card in `handoff/tasks/<ID>.md`.
Status lives only in `BOARD.md`. A card may be refined by the CTO before you reach it — always
read the current card when you start a task.

Design source: Figma `tD3pU1vtvSr8akTMJPFLkA`, exported offline in `design/` (see
`design/INDEX.md`). Design rules and gap decisions: `docs/05-design.md` §"CTO decisions".

## Execution order — revised 2026-10-23 (owner: "build the whole site design and wire it to the dashboard")
The site is now the priority. Work **in this order** (it overrides the table order below):
1. P2-T4 (round 3 fixes) → P2-T5 → P2-T6 → P2-T8 → **P2-T9** → CTO posts "merge phase 2".
2. `phase-3-frontend`: **P3-T1 → P3-T2 → P4-T1 → P4-T2** (real content seeded on the phase-3 branch,
   so every page is built and reviewed with the client's real data, not dev fixtures) → **P3-T3 →
   P3-T4 → P2-T7** (dashboard UX + Live Preview, now that real pages exist) → **P3-T6 → P3-T7 →
   P3-T8 → P3-T9 → P3-T5** (live 3D last, so the A-1 assets are final) → **P3-T10**.
3. Then P5 → P6-T1 → P7 as before. Hard stops unchanged.

### Phase 3 rules — "the site is wired to the dashboard" (apply to every P3 task)
- **Every** visible text, number, image, video, link, list and section toggle on a public page comes
  from the CMS (collections/globals) through `src/lib/cms/*`. Only UI chrome (button verbs, aria
  labels, form messages, "1 / 3") lives in `src/i18n/{ar,en}.ts`. No business content in code.
  Enforce it: a custom ESLint rule in `eslint-rules/` that flags string literals in JSX under
  `src/app/(frontend)` and `src/components` (allow-list: punctuation, `src/i18n`, tests).
- **Edit → publish → visible** without redeploy for every section, via the P2-T1 revalidate tags.
  Evidence per page: a short recording (or before/after screenshots with timestamps) of an editor
  changing one field per section in `/admin`, publishing, and the page updating; a draft change is
  **not** visible to anonymous visitors but is visible in preview.
- **Figma fidelity** (`docs/05-design.md` §"CTO decisions"): side-by-side at 1440 `en` vs
  `design/screenshots/…` for every section, plus `ar` RTL at 1440 / 768 / 390. > 4 px is a finding.
- Empty states: when the CMS has no item for a section, the section hides cleanly (no broken layout).
- **Links (security I3, defence in depth):** every CMS link is rendered through one `<CmsLink>` component
  that re-checks the href at render time (only `https:`, `http:` in dev, `mailto:`, `tel:`, and internal
  paths starting with a single `/`); anything else renders as plain text. This also covers Live Preview.

## Phase 1 — Scaffold & foundations · branch `phase-1-scaffold`
| ID | Task | Depends on |
|---|---|---|
| P1-T1 | Repo, scaffold, pinned versions, tooling | — |
| P1-T2 | Env validation, Payload & Next config, dev DB | P1-T1 |
| P1-T3 | Access helpers, `users` (auth hardening), `media` (upload safety) | P1-T2 |
| P1-T4 | Migration, e2e smoke, CI, phase-1 report | P1-T3 |

## Phase 2 — Content model & dashboard · branch `phase-2-content`
| ID | Task | Depends on |
|---|---|---|
| P2-T1 | Shared field factories & hooks (slug, link, video URL, order, publishable, revalidate) | P1 |
| P2-T2 | `videos`, `brands`, `stats`, `materials` | P2-T1 |
| P2-T3 | `services`, `team` | P2-T1 |
| P2-T4 | `projects` (publishable, rich text, gallery, video, SEO) | P2-T2, P2-T3 |
| P2-T5 | Globals: `site-settings`, `navigation`, `home-page`, page globals | P2-T4 |
| P2-T6 | `quote-requests` (no API create) | P2-T3 |
| P2-T7 | Dashboard UX: Arabic admin, groups, columns, Live Preview, dashboard home, branding — **runs in Phase 3 after P3-T4** (see Execution order) | P3-T4 |
| P2-T8 | Access test suite (Z1–Z6), migrations up/down, phase-2 report | P2-T6 |
| P2-T9 | Login enumeration hardening: constant-time unknown-email login, generic locked message (from the P2-T6 r4 review) | P2-T8 |

## Phase 3 — Public site from Figma · branch `phase-3-frontend`
| ID | Task | Depends on |
|---|---|---|
| P3-T1 | Foundations: tokens, fonts, typography, grid, i18n routing `/ar` `/en`, `proxy.ts` + CSP nonce, data layer | P2 |
| P3-T2 | Shell & primitives: Logo, Button, Eyebrow, NavLink, Navbar, Footer, WhatsApp FAB, Accordion, icons, styleguide route | P3-T1 |
| P3-T3 | Cards & motion: Service Tile/Card, Project Card, Brand/Partner Tile, Team Card/Member, Avatar/Portrait, marquees, Services Carousel | P3-T2 |
| P3-T4 | Home page (all sections) + intro splash | P3-T3 |
| P3-T5 | Interactive systems: live 3D tower inside the card (rotate/zoom/enter-exit systems, related projects) | P3-T4 |
| P3-T6 | Services page (incl. materials & brands table) | P3-T3 |
| P3-T7 | About page (story, strengths, mission & vision, team) | P3-T3 |
| P3-T8 | Projects list + Project detail (gallery + lightbox, related) | P3-T3 |
| P3-T9 | Contact page + Quote Form UI (3 steps) + "Message sent" overlay | P3-T3 |
| P3-T10 | SEO, 404/500, a11y (axe), Lighthouse, visual evidence pack, phase-3 report | P3-T4…T9 |

## Phase 4 — Real content seed · branch `phase-4-seed`
| ID | Task | Depends on |
|---|---|---|
| P4-T1 | Materials + brands seed with normalization (73 rows) — **runs on `phase-3-frontend` after P3-T2** | P3-T2 |
| P4-T2 | Site settings, services, page copy (en from design, ar drafts), placeholders in draft, phase-4 report | P4-T1 |

## Phase 5 — Quote form → dashboard + email · branch `phase-5-quotes` (no Odoo — owner decision 2026-10-23)
| ID | Task | Depends on |
|---|---|---|
| P5-T1 | Quote server handler: zod, anti-abuse (I6), store, enqueue email job | P4 |
| P5-T2 | Email notification job (retries, idempotent, resend), staff workflow, admin CSV export, retention job, CI secret grep, phase-5 report | P5-T1 |
| ~~P5-T3~~ | **Cancelled** — Odoo integration removed | — |

## Phase 6 — Production packaging · branch `phase-6-deploy`
| ID | Task | Depends on |
|---|---|---|
| P6-T1 | Production Dockerfile, `docker-compose.prod.yml`, Nginx site config, backup/restore scripts — built and tested **locally only** | P5-T2 |
| P6-T2 | **HARD STOP** — deployment on the client VPS beside Odoo | P6-T1 + user/client sign-off |

## Phase 7 — Handover · branch `phase-7-handover`
| ID | Task | Depends on |
|---|---|---|
| P7-T1 | Arabic editor guide (screenshots) for the dashboard | P4 |
| P7-T2 | Operations runbook (local + production), final project report | P6-T1 |

## External asset task (not code — owner decided by the user)
| ID | Task | Depends on |
|---|---|---|
| A-1 | **3D asset production**: Blender model of the Figma tower + 5 MEP systems, hero still, real-time GLB (lite + full) with baked lighting, system cameras + hotspot empties, end-frame stills per system (fallback). Brief: `handoff/briefs/A-1-3d-assets.md` | user decision |

## Hard stops — what the user/client must provide
- P6-T2 (email): the SMTP account/provider for production and the sales inbox address that receives quote requests.
- A-1: who produces the 3D/cinematic assets (3D artist, stock models assembled, or AI video) and the budget.
- P6-T2: VPS access, current Odoo setup inventory, full Odoo backup, final domains & DNS.
