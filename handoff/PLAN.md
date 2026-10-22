# Execution plan — Al Jazira website + dynamic dashboard

Owner: CTO. Executor follows this list **top to bottom** in continuous mode
(`handoff/README.md` → "Continuous mode"). Each row has a card in `handoff/tasks/<ID>.md`.
Status lives only in `BOARD.md`. A card may be refined by the CTO before you reach it — always
read the current card when you start a task.

Design source: Figma `tD3pU1vtvSr8akTMJPFLkA`, exported offline in `design/` (see
`design/INDEX.md`). Design rules and gap decisions: `docs/05-design.md` §"CTO decisions".

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
| P2-T7 | Dashboard UX: Arabic admin, groups, columns, Live Preview, dashboard home, branding | P2-T5, P2-T6 |
| P2-T8 | Access test suite (Z1–Z6), migrations up/down, phase-2 report | P2-T7 |

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
| P4-T1 | Materials + brands seed with normalization (73 rows) | P3 |
| P4-T2 | Site settings, services, page copy (en from design, ar drafts), placeholders in draft, phase-4 report | P4-T1 |

## Phase 5 — Quote form → Odoo · branch `phase-5-quotes`
| ID | Task | Depends on |
|---|---|---|
| P5-T1 | Quote server handler: zod, anti-abuse (I6), store, email notification | P4 |
| P5-T2 | Odoo client (JSON-2 + JSON-RPC), mock Odoo, Jobs queue, retries, idempotency, admin retry, retention job, phase-5 report | P5-T1 |
| P5-T3 | **HARD STOP** — real test lead in client Odoo with the integration user | P5-T2 + client data |

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
- P5-T3: Odoo version, whether a staging DB exists, the dedicated integration user + API key.
- A-1: who produces the 3D/cinematic assets (3D artist, stock models assembled, or AI video) and the budget.
- P6-T2: VPS access, current Odoo setup inventory, full Odoo backup, final domains & DNS.
