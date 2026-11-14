# Reviewer guide — Al Jazira website (branch `owner-latest`)

Welcome. This branch holds the latest state of the public site, the admin dashboard (Payload CMS) and the
live 3D tower, for a code review. Nothing here is deployed; nothing is merged into `main`.

## What is in this branch

`owner-latest` merges three work branches. None of them is accepted yet:

| Part                                                                    | Source branch                                | State             |
| ----------------------------------------------------------------------- | -------------------------------------------- | ----------------- |
| Public site, Figma baseline, home fixes, live 3D card                   | `cto-preview-3d`                             | site preview      |
| Admin dashboard: nav order, Arabic switch, dashboard home, Live Preview | `p2-t7-dashboard-ux`                         | changes requested |
| Admin dashboard: quote handling, staff workflow, CSV export, retention  | `p2-t7-dashboard-ux` (via `phase-5-quotes`)  | accepted          |
| Admin dashboard: safety fixes                                           | `p2-t7-dashboard-ux` (via `r-1-safety`)      | changes requested |
| Admin dashboard: SEO and accessibility                                  | `p2-t7-dashboard-ux` (via `p3-t10-seo-a11y`) | changes requested |
| 3D release v023b and the glass shader                                   | `a1-v023b-site`                              | in progress       |

Stack: Next.js 16.4.2, Payload 3.91.0, Postgres 18 in Docker, three.js 0.186.1, TypeScript strict,
vitest and Playwright, pnpm 10.34.7, Node 24.

## Run it locally (Windows or macOS/Linux)

Needs Node 24, Docker, Git with Git LFS (the 3D model and textures are in LFS).

```bash
git clone -b owner-latest https://github.com/saad20115/jazira.git
cd jazira
git lfs pull
corepack enable
cp .env.example .env
```

Fill `.env`:

- Pick a free `POSTGRES_PORT` and a matching port in `DATABASE_URL` / `TEST_DATABASE_URL`.
- `SERVER_URL`: `http://localhost:3000`.
- `PAYLOAD_SECRET`, `IP_HASH_SALT` and the two database passwords: use `openssl rand -base64 48`. Shorter or hex
  secrets can be refused by the startup check.
- `SALES_INBOX`: any address; mail goes to the local Mailpit.

Then:

```bash
docker compose -p aljazira-review -f docker-compose.dev.yml --env-file .env up -d
pnpm install --frozen-lockfile
pnpm payload migrate
NODE_ENV=development pnpm seed      # services, projects, brands, page copy (no users)
pnpm build
pnpm start                           # http://localhost:3000
```

- Site: `/en` (Arabic is built but switched off for the public until enabled in Site Settings).
- Admin: `/admin`. The database has no users after the seed, so the first visit asks you to create the first
  admin.
- Live 3D tower: home page, "Open the live 3D model".
- Mail catcher (Mailpit): the `MAILPIT_UI_PORT` in `.env`.

## Where to look

| Area                               | Path                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| Rules of the project (read first)  | `AGENTS.md`, `docs/01-architecture.md`, `docs/03-security.md`, `docs/02-content-model.md` |
| Collections, globals, access rules | `src/collections/`, `src/globals/`, `src/access/`                                         |
| Admin customisation                | `src/admin/`, `src/components/admin/`, `src/payload.config.ts`                            |
| Quote form and server handler      | `src/app/(frontend)/[locale]/contact/`, `src/lib/quote/`, `src/jobs/`                     |
| Public pages and components        | `src/app/(frontend)/`, `src/components/`                                                  |
| Live 3D viewer                     | `src/components/systems3d/` (contract, viewer, glass shader in `viewer/createViewer.ts`)  |
| 3D release served to the site      | `3d/web/` (Git LFS; synced by `scripts/sync-3d-assets.mjs`)                               |
| Migrations                         | `src/migrations/`                                                                         |
| Tests                              | `src/**/*.test.ts`, `tests/int/`, `tests/e2e/`                                            |
| Task cards, reviews, decisions     | branch `dev` → `handoff/`                                                                 |

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test             # needs TEST_DATABASE_URL and the Playwright browser: pnpm exec playwright install chromium
pnpm test:e2e         # needs the seeded database and a running build
pnpm audit --prod
```

## Known open findings (from the independent verifier, `handoff/reviews/` on `dev`)

- R1-6: the dashboard refuses to save an edit to the alt text of an existing image, or the title of an
  existing video (400 "file").
- R1-7: the secret entropy floor refuses some valid random secrets.
- P10-1: `/contact` raises a CSP `eval` violation.
- P10-2: a published service page can stay 404 after the full e2e suite.
- P27-1: the Live Preview e2e leaves an autosave draft that breaks a P3-T8 spec.
- P27-2: two labels in the Arabic dashboard are still in English.
- 3D: a shimmer near the top of the tower while it moves (thin lines in the window texture). A model-side fix
  (v023c) is pending.

Please send findings with the file, the line, and how to reproduce them.
