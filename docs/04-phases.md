# 04 — Phases, scope & acceptance criteria

Workflow per phase: branch `phase-N-…` → commits → PR with the phase report (format in
`AGENTS.md`) → **CTO review** → fixes → CTO approval → merge to `main` → next phase.
Never start the next phase without approval.

---

## Phase 1 — Scaffold & foundations
**Scope**
1. Git repo (private GitHub), `main` protected, PR required. `.gitignore`, `.editorconfig`,
   `.nvmrc` (24), `packageManager` field (pnpm 10.x exact).
2. Scaffold with `create-payload-app@3.91.0` (Postgres, blank). Align all versions to
   `docs/01-architecture.md` §2 exactly. Remove anything from the template we don't use.
3. `docker-compose.dev.yml`: Postgres 18 (pinned tag), named volume, port bound to `127.0.0.1` only.
4. `src/env.ts` — zod-validated env (S1, S2); `.env.example`.
5. Payload config: Postgres adapter with migrations (no prod push), `sharp`, Lexical editor,
   localization `ar` (default, RTL) + `en` with fallback, admin i18n ar/en, `graphQL.disable`,
   `serverURL`/`cors`/`csrf` (H1), `typescript.outputFile`.
6. Collections `users` (roles, auth hardening A1–A6) and `media` (I5) only.
7. `src/access/` helpers + unit tests.
8. `next.config`: `output: 'standalone'`, `poweredByHeader: false`, base security headers (H2 minus HSTS).
9. Tooling: ESLint flat config (strict TS rules), Prettier, `typecheck`, `test`, `test:e2e`
   scripts, Vitest + Playwright configured, one smoke e2e (admin login page renders in ar and en).
10. CI workflow (B4) running all of the above + gitleaks + audit.
11. Initial migration committed.

**Acceptance criteria**
- [ ] Definition of done (AGENTS.md) passes; outputs in report.
- [ ] `pnpm ls payload next react typescript graphql` shows exactly the pinned versions; all
      `@payloadcms/*` identical.
- [ ] App fails fast with a clear message if `PAYLOAD_SECRET` is missing or < 48 chars.
- [ ] Admin opens at `/admin` in Arabic (RTL) and can switch to English.
- [ ] First user becomes `admin`; that admin can create an `editor`; the editor cannot change roles
      (test).
- [ ] 6th wrong password locks the account (test).
- [ ] Uploading `.svg` and an HTML file renamed `.jpg` to `media` is rejected (test).
- [ ] `GET /api/graphql` → 404/disabled.
- [ ] CI green on the PR.

## Phase 2 — Content model & editor experience
**Scope:** all collections and globals in `docs/02-content-model.md`; slug hooks; drafts,
versions, scheduled publish; Live Preview wired to frontend routes; on-change revalidation hooks;
SEO plugin; admin groups, columns, Arabic labels, helpful `admin.description`s; generated types;
migrations.

**Acceptance criteria**
- [ ] Every collection/global has explicit access (Z1) — a test enumerates the config and fails
      if any operation is missing.
- [ ] Z2–Z6 integration tests pass (anonymous / editor / admin).
- [ ] Editor can create a project in Arabic, add English, save draft, preview it live, publish it —
      recorded as a short screen recording or screenshots.
- [ ] Drafts are never returned to anonymous REST or Local API calls with `overrideAccess: false`.
- [ ] Migration up/down works on a clean DB.

## Phase 3 — Public frontend (from Figma)
**Scope:** all pages from `docs/05-design.md` in ar (RTL) and en, built with the design tokens;
shared components mapping 1:1 to Figma components; the interactive 3D building section
(Three.js, lazy-loaded, static image fallback for reduced motion / no WebGL); animations (team
cards, staff marquee, services carousel, brands marquee) honoring `prefers-reduced-motion`;
CSP with nonce (H3); SEO: metadata from CMS, `hreflang`, sitemap, robots (H7), JSON-LD
`Organization` / `LocalBusiness`; 404/500 pages; WhatsApp + phone + email links from
`site-settings`.

**Acceptance criteria**
- [ ] Visual review against Figma for every page at 1440, 768, 390 widths (screenshots in ar + en).
- [ ] Lighthouse (mobile) on Home and Project detail: Performance ≥ 90, Accessibility ≥ 95,
      Best Practices 100, SEO 100. Report attached.
- [ ] WCAG 2.2 AA: keyboard navigation, focus visible, alt text required, contrast, `lang`/`dir`
      correct per locale. axe-core e2e test with zero serious/critical violations.
- [ ] Zero CSP violations in the console on all pages; zero hydration warnings.
- [ ] Content changes in admin appear on the site after publish without redeploy.
- [ ] No hard-coded business content in components (all from CMS or i18n dictionaries).

## Phase 4 — Real content seed
**Scope:** idempotent `pnpm seed` per `docs/02-content-model.md` "Seed data rules": 73 materials,
normalized brands, site settings (contact info), services list from the design, placeholders in draft.

**Acceptance criteria**
- [ ] Running seed twice produces no duplicates.
- [ ] 73 materials, each linked to ≥ 1 brand; report lists every normalization applied and every
      row needing client confirmation.
- [ ] Nothing placeholder is published.

## Phase 5 — Quote form → Odoo CRM
**Scope:** server-side handler (route handler or server action) with zod validation and anti-abuse
(I6); store in `quote-requests`; Payload Jobs task pushes to Odoo (`docs/01-architecture.md` §5,
O1–O4); optional email notification; admin shows status and "retry" action (admin only).

**Acceptance criteria**
- [ ] Tests against a mock Odoo: success, Odoo down (retries then `failed`), invalid response,
      retry after failure does not duplicate the lead.
- [ ] Rate limit + honeypot + min-time verified by tests.
- [ ] A real test lead created in the client's Odoo (staging DB if available) — screenshot — with
      the dedicated integration user.
- [ ] No Odoo credential reachable from client bundles (grep the `.next/static` output in CI).

## Phase 6 — Production deployment (VPS beside Odoo)
**Pre-requisites (CTO + client sign-off):** VPS access method, current Odoo setup inventory
(how it runs, ports, Nginx config, Postgres location), full Odoo backup verified, domains & DNS.

**Scope:** production Dockerfile + `docker-compose.prod.yml` (R1–R3), Nginx server block (H2, H5,
H6, A7), Let's Encrypt, backups + restore test (R5), monitoring (R6), host hardening (R4) only as
agreed, deployment runbook, rollback procedure.

**Acceptance criteria**
- [ ] Odoo site/ERP works exactly as before (checked before and after, screenshots/timestamps).
- [ ] SSL Labs grade A+; securityheaders.com grade A or better.
- [ ] Container runs non-root, read-only FS; `docker inspect` output in report.
- [ ] Backup restored successfully into a scratch DB; procedure documented.
- [ ] Rollback to the previous image tested.

## Phase 7 — Handover
- Arabic editor guide (screenshots) for the client's staff: adding projects, team, brands, media,
  videos, publishing, previewing.
- Operations runbook (deploy, rollback, backup/restore, rotate secrets, update dependencies).
- Credentials handover checklist; remove developer access as agreed.
