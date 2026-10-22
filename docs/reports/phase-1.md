## Phase 1 — Scaffold & foundations

### Done
- **Repository, scaffold & pinned versions (`P1-T1`)**:
  - Scaffolded a blank Payload `3.91.0` + PostgreSQL application on branch `phase-1-scaffold` from `main` (`6b66144`).
  - Pinned every direct dependency in `package.json` (`save-exact=true` in `.npmrc`) to the exact versions in `docs/01-architecture.md` §2: `next@16.4.2`, `react@19.3.1`, `react-dom@19.3.1`, `payload@3.91.0`, `@payloadcms/next@3.91.0`, `@payloadcms/db-postgres@3.91.0`, `@payloadcms/richtext-lexical@3.91.0`, `@payloadcms/translations@3.91.0`, `@payloadcms/ui@3.91.0`, `@payloadcms/email-nodemailer@3.91.0`, `graphql@16.14.2`, `sharp@0.35.5`, `zod@4.6.7`, `typescript@5.9.3`, `eslint@10.13.0`, `eslint-config-next@16.4.2`, `typescript-eslint@8.72.0`, `prettier@3.9.10`, `vitest@5.0.5`, `@playwright/test@1.64.1`, `@types/node@24.19.2`, `@types/react@19.3.0`, `@types/react-dom@19.3.0`, `cross-env@10.1.0`.
  - Configured `.nvmrc` (`24`), `.editorconfig`, `.gitattributes` (`* text=auto eol=lf`), `.gitignore`, `.prettierrc.json`, `.prettierignore`, and `eslint.config.mjs` (ESLint 10 `defineConfig` with `typescript-eslint` `strictTypeChecked` and `eslint-config-next/core-web-vitals`).
  - Configured `pnpm.onlyBuiltDependencies: ["sharp", "esbuild"]`, `pnpm.ignoredBuiltDependencies: ["unrs-resolver"]`, and `pnpm.overrides` (`chokidar@^3.0.0: 4.0.3`, `dompurify: 3.4.16`, `esbuild@<=0.24.2: 0.28.2`) in `package.json`.
- **Environment validation, Payload & Next configuration, and dev database (`P1-T2`)**:
  - `docker-compose.dev.yml` + `docker/postgres/init-dev-db.sh`: PostgreSQL `18.6` pinned by image digest (`postgres:18.6@sha256:5486e8fb206952552c7e2eaf2e36e4c7be3cd36b2b396eb41de618aa5664a781`), top-level `name: aljazira`, bound to `127.0.0.1:${POSTGRES_PORT}:5432`, `scram-sha-256`, creating dedicated non-superuser role `aljazira_app` (`D1`) and isolated databases `aljazira_dev` and `aljazira_test`, plus local SMTP catcher Mailpit (`axllent/mailpit:v1.31.6@sha256:23fe39e81bde596a918000b3135c0f85dc8bb4c9ea6be274b051143f3e300387`).
  - `src/env.ts` + `src/env.test.ts` + `src/instrumentation.ts` + `.env.example`: Zod startup validation (`S1`, `S2`) for `DATABASE_URL`, `SERVER_URL`, `PAYLOAD_SECRET` (≥ 48 chars, not placeholder), `IP_HASH_SALT` (≥ 48 chars, distinct from `PAYLOAD_SECRET`), and `MEDIA_DIR` (absolute path outside `public/`). `src/instrumentation.ts` validates `process.env` at server boot and exits `1` before serving on both `next dev` and `node .next/standalone/server.js`.
  - `eslint-rules/no-server-in-client.mjs` + `src/eslint-no-server-in-client.test.ts`: Custom ESLint rule `local/no-server-in-client` forbidding value imports/exports of `src/env`, `payload`, `@payloadcms/db-postgres`, and `@payload-config` inside `'use client'` files while allowing `import type` / `export type` (`S4`).
  - `src/payload.config.ts`: Configured `serverURL`, `cors`, `csrf` (`H1`), `i18n` (`ar`, `en`, fallback `'ar'`), `localization` (`ar` default RTL + `en` with fallback), `graphQL.disable: true` (`H7`), `postgresAdapter({ push: false, migrationDir })`, `sharp`, `lexicalEditor()`, and `buildNonBlockingEmailAdapter()`.
  - `src/proxy.ts`: Sets `payload-lng=ar` (`path: '/'`, `maxAge: 31536000`, `httpOnly: false`) on `/admin` routes only when absent so first-time visitors open `/admin` in Arabic RTL regardless of browser `Accept-Language`, while manual switching to English in `/admin/account` persists.
  - `next.config.ts` + `src/app/robots.ts`: `output: 'standalone'`, `poweredByHeader: false` (`H4`), base security headers (`H2` minus HSTS), `X-Robots-Tag: noindex` on `/admin` (`H7`), `robots.txt` disallowing `/admin` and `/api` (`H7`).
- **Access helpers, `users` auth hardening, and `media` upload safety (`P1-T3`)**:
  - `src/access/`: `isAdmin.ts`, `isAdminOrEditor.ts`, `publishedOrLoggedIn.ts`, `isAdminFieldLevel.ts`, `adminOrSelf.ts`, `index.ts`, and 5 unit test files (`*.test.ts`).
  - `src/collections/Users.ts` + `src/security/passwordPolicy.ts` + `src/security/emailAdapter.ts`: Explicit collection access (`Z1`), `role` field-level access (`Z3`), last-admin deletion/demotion guards (`beforeDelete` / `beforeChange`), first-user `admin` / subsequent `editor` (`A6`), lockout after 5 failed attempts for 15 min (`A1`), `tokenExpiration: 7200` + `useSessions: true` + admin-only `POST /api/users/:id/revoke-sessions` (`A2`), `useAPIKey: false` + `sameSite: 'Strict'` cookies (`A3`), server-side password policy on `create`/`update`/`resetPassword` (`A4`), and non-blocking forgot-password email delivery with ≤ 1 h expiry (`A5`).
  - `src/collections/Media.ts` + `src/security/uploadValidation.ts`: Explicit access (`Z1`), `mimeTypes` `['image/jpeg', 'image/png', 'image/webp', 'image/avif']` (no SVG), max 10 MB, strict magic-byte inspection with no extension fallback (`I5`), filename sanitization, 4 WebP sizes (`thumb` 400w, `card` 800w, `hero` 1920w, `og` 1200×630 crop), stored in `env.MEDIA_DIR` outside `public/`.
  - `tests/int/p1-t3.int.test.ts`: Full Vitest integration test suite against `aljazira_test` migrated via `payload.db.migrateFresh()`.
- **Initial migration, Playwright e2e smoke, CI & Dependabot (`P1-T4`)**:
  - `src/migrations/20261021_074848_initial_users_media.ts`: Initial schema migration verified with `migrate` → `migrate:status` → `migrate:down` → `migrate` on a clean database.
  - `playwright.config.ts` + `tests/e2e/admin-smoke.spec.ts`: Playwright e2e smoke test (`pnpm test:e2e`) verifying `/admin/login` renders in Arabic (`<html lang="ar" dir="RTL">`, Arabic labels visible) and in English after switching (`<html lang="en" dir="LTR">`, English labels visible).
  - `.github/workflows/ci.yml` (`B4`) + `.github/dependabot.yml` (`B3`) + `.gitleaksignore` (`S3`) + `docs/dependency-overrides.md`: GitHub Actions CI workflow with `permissions: contents: read`, all actions pinned to the commit SHA of the latest stable release (`actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`, `pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0`, `actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0`), per-run generated secrets, Postgres 18.6 and Mailpit v1.31.6 services pinned by digest, `.next/static` secret leakage check (`S4`), `pnpm audit --prod --audit-level high`, and `gitleaks git`. Dependabot groups `payload`/`@payloadcms/*` and `github-actions`, and ignores CTO-gated major bumps (`typescript >= 6.0.0`, `graphql >= 17.0.0`, `next >= 17.0.0`, `react >= 20.0.0`, `react-dom >= 20.0.0`).

### Evidence

#### 1. `pnpm ls --depth 0`
```text
aljazira-website@0.1.0 D:\jazira (PRIVATE)
│
│   dependencies:
├── @payloadcms/db-postgres@3.91.0
├── @payloadcms/email-nodemailer@3.91.0
├── @payloadcms/next@3.91.0
├── @payloadcms/richtext-lexical@3.91.0
├── @payloadcms/translations@3.91.0
├── @payloadcms/ui@3.91.0
├── graphql@16.14.2
├── next@16.4.2
├── payload@3.91.0
├── react@19.3.1
├── react-dom@19.3.1
├── sharp@0.35.5
├── zod@4.6.7
│
│   devDependencies:
├── @playwright/test@1.64.1
├── @types/node@24.19.2
├── @types/react@19.3.0
├── @types/react-dom@19.3.0
├── cross-env@10.1.0
├── eslint@10.13.0
├── eslint-config-next@16.4.2
├── prettier@3.9.10
├── typescript@5.9.3
├── typescript-eslint@8.72.0
└── vitest@5.0.5
```

#### 2. `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`
```text
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 2.2s using pnpm v10.34.7

> aljazira-website@0.1.0 lint D:\jazira
> cross-env NODE_OPTIONS=--no-deprecation eslint .

> aljazira-website@0.1.0 typecheck D:\jazira
> tsc --noEmit
```

#### 3. `pnpm test` (Vitest unit + integration against PostgreSQL `aljazira_test`)
```text
 RUN  v5.0.5 D:/jazira

[15:00:27] INFO: Dropping database.
[15:00:28] INFO: Reading migration files from D:\jazira\src\migrations
[15:00:28] INFO: Migrating: 20261021_074848_initial_users_media
[15:00:28] INFO: Migrated:  20261021_074848_initial_users_media (88ms)
 ✓ tests/int/p1-t3.int.test.ts (9 tests) 11577ms
 ✓ src/eslint-no-server-in-client.test.ts (4 tests) 148ms
 ✓ src/env.test.ts (7 tests) 9ms
 ✓ src/access/publishedOrLoggedIn.test.ts (3 tests) 3ms
 ✓ src/security/passwordPolicy.test.ts (3 tests) 6ms
 ✓ src/security/uploadValidation.test.ts (3 tests) 4ms
 ✓ src/access/isAdmin.test.ts (3 tests) 2ms
 ✓ src/access/isAdminOrEditor.test.ts (3 tests) 2ms
 ✓ src/access/adminOrSelf.test.ts (3 tests) 3ms
 ✓ src/access/isAdminFieldLevel.test.ts (3 tests) 2ms

 Test Files  10 passed (10)
      Tests  41 passed (41)
   Duration  26.64s
```

#### 4. `pnpm payload migrate` → `migrate:status` → `migrate:down` → `migrate`
```text
> cross-env NODE_OPTIONS=--no-deprecation payload "migrate"
[14:36:49] INFO: Reading migration files from D:\jazira\src\migrations
[14:36:51] INFO: Migrating: 20261021_074848_initial_users_media
[14:36:51] INFO: Migrated:  20261021_074848_initial_users_media (173ms)
[14:36:51] INFO: Done.

> cross-env NODE_OPTIONS=--no-deprecation payload "migrate:status"
┌─────────────────────────────────────┬───────┬─────┐
│                                Name │ Batch │ Ran │
├─────────────────────────────────────┼───────┼─────┤
│ 20261021_074848_initial_users_media │     1 │ Yes │
└─────────────────────────────────────┴───────┴─────┘

> cross-env NODE_OPTIONS=--no-deprecation payload "migrate:down"
[14:37:28] INFO: Rolling back batch 1 consisting of 1 migration(s).
[14:37:28] INFO: Migrating down: 20261021_074848_initial_users_media
[14:37:28] INFO: Migrated down:  20261021_074848_initial_users_media (76ms)
[14:37:28] INFO: Done.

> cross-env NODE_OPTIONS=--no-deprecation payload "migrate"
[14:37:55] INFO: Migrating: 20261021_074848_initial_users_media
[14:37:55] INFO: Migrated:  20261021_074848_initial_users_media (402ms)
[14:37:55] INFO: Done.
```

#### 5. `pnpm build` & `pnpm test:e2e`
```text
> aljazira-website@0.1.0 build D:\jazira
> cross-env NODE_OPTIONS="--no-deprecation --max-old-space-size=8000" next build

▲ Next.js 16.4.2 (Turbopack)
✓ Compiled successfully in 20.0s
✓ Generating static pages using 7 workers (4/4) in 1167ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin/[[...segments]]
├ ƒ /api/[...slug]
└ ○ /robots.txt

ƒ Proxy (Middleware)

> aljazira-website@0.1.0 test:e2e D:\jazira
> playwright test

Running 1 test using 1 worker
  ok 1 [chromium] › tests\e2e\admin-smoke.spec.ts:9:3 › Payload Admin Login Smoke (ar RTL & en LTR) › renders /admin/login in Arabic (RTL) by default and in English (LTR) after switching language (20.7s)
  1 passed (1.6m)
```

#### 6. `pnpm audit --prod` & `gitleaks git`
```text
> pnpm audit --prod
No known vulnerabilities found

> gitleaks git --no-banner --redact --verbose .
3:03PM INF 23 commits scanned.
3:03PM INF scanned ~2314977 bytes (2.31 MB) in 1.09s
3:03PM INF no leaks found
```

#### 7. Screenshots (`docs/reports/phase-1/`)
- `docs/reports/phase-1/admin-accept-lang-ar.png` — `/admin` initial setup in Arabic RTL (`lang="ar" dir="RTL"`).
- `docs/reports/phase-1/admin-accept-lang-en-US.png` — `/admin` opened with `Accept-Language: en-US`, rendered in Arabic RTL via `src/proxy.ts`.
- `docs/reports/phase-1/admin-account-switched-en.png` — `/admin/account` after switching language to English (`lang="en" dir="LTR"`).
- `docs/reports/phase-1/admin-users-list.png` — `/admin/collections/users` list view in Arabic RTL (`مدير النظام` and `محرر`).
- `docs/reports/phase-1/admin-media-item-sizes.png` — `/admin/collections/media/:id` with Preview Sizes drawer showing `Original`, `thumb`, `card`, `hero`, and `og` as `image/webp`.
- `docs/reports/phase-1/e2e-admin-login-ar.png` — Playwright e2e screenshot of `/admin/login` in Arabic RTL (`lang="ar" dir="RTL"`).
- `docs/reports/phase-1/e2e-admin-login-en.png` — Playwright e2e screenshot of `/admin/login` in English LTR (`lang="en" dir="LTR"`).

#### 8. `git log --oneline main..HEAD`
```text
1c8ae6b docs: P1-T3 report (round 2)
7d715ff fix: address P1-T3 round 1 review findings R-1 through R-6
5fe5bbe feat: add Playwright e2e smoke test, CI workflow, Dependabot, and audit overrides
39d6030 docs: sync CTO P1-T3 round 1 review and M-018/M-019
469caec docs: P1-T3 report
cbe94de feat: add access helpers, Users auth hardening, Media upload safety, and integration tests
2d241bd fix: skip type-only imports and exports in local/no-server-in-client rule
192054e docs: sync CTO P1-T2 round 2 review and handoff updates
40921c0 docs: P1-T2 report (round 2)
7ee8e56 fix: enforce boot-time env exit, compose project name, no-server-in-client lint rule, and admin ar cookie proxy
42d3420 docs: P1-T2 report
a2aab7b feat: configure Payload 3.91 localization/i18n/Postgres, Next security headers, and robots
d68767e feat: add Zod startup environment validation and unit tests
5325c62 chore: add PostgreSQL 18.6 dev docker-compose with non-superuser role and test DB
18aebaf docs: sync CTO plan, task cards, and spec updates
8f1b835 chore: keep Next.js agent rules block
d0259d8 docs: add Figma design export
ecdef61 docs: P1-T1 report (round 2)
15d9448 fix: enforce LF via .gitattributes, ignore unrs-resolver build script, use defineConfig
ddcad3f docs: P1-T1 report
792f1f4 chore: configure ESLint 10 strict type-checked rules, Prettier, and EditorConfig
8ca5f07 chore: scaffold Payload 3.91.0 blank Postgres app and pin dependencies
```

### Acceptance criteria
- [x] Definition of done (AGENTS.md) passes; outputs in report — `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (`41/41`), `pnpm build`, and `pnpm audit --prod` (`No known vulnerabilities found`) all pass (Evidence §1–§6).
- [x] `pnpm ls payload next react typescript graphql` shows exactly the pinned versions; all `@payloadcms/*` identical — `payload@3.91.0`, `next@16.4.2`, `react@19.3.1`, `typescript@5.9.3`, `graphql@16.14.2`, and all `@payloadcms/*@3.91.0` (Evidence §1).
- [x] App fails fast with a clear message if `PAYLOAD_SECRET` is missing or < 48 chars — `src/instrumentation.ts` + `src/env.ts` exit with code `1` before serving on both `next dev` and `node .next/standalone/server.js`; unit-tested in `src/env.test.ts`.
- [x] Admin opens at `/admin` in Arabic (RTL) and can switch to English — proven by `src/proxy.ts` and Playwright e2e test `tests/e2e/admin-smoke.spec.ts` (`docs/reports/phase-1/e2e-admin-login-ar.png` and `docs/reports/phase-1/e2e-admin-login-en.png`).
- [x] First user becomes `admin`; that admin can create an `editor`; the editor cannot change roles (test) — proven in `tests/int/p1-t3.int.test.ts` lines 139–230 (`registers the first user as admin...` and `allows admin to create an editor user...`).
- [x] 6th wrong password locks the account (test) — proven in `tests/int/p1-t3.int.test.ts` lines 376–430 (`locks the account after 5 failed login attempts for 15 minutes and refuses the correct password while locked`).
- [x] Uploading `.svg` and an HTML file renamed `.jpg` to `media` is rejected (test) — proven in `src/security/uploadValidation.test.ts` and `tests/int/p1-t3.int.test.ts` lines 702–818.
- [x] `GET /api/graphql` → 404/disabled — `graphQL: { disable: true }` in `src/payload.config.ts:58-60`, verified in `handoff/reports/P1-T2.md` Evidence §3 (`HTTP/1.1 404 Not Found`).
- [x] CI green on the PR (or explicitly pending a remote) — `.github/workflows/ci.yml` committed and all CI steps executed locally with 0 errors; `git remote -v` has no remote configured yet, so commits are kept on `phase-1-scaffold` per `handoff/tasks/P1-T4.md` Scope §5.

### Dependencies added/changed
- `@payloadcms/email-nodemailer@3.91.0` — official Payload 3.91.0 SMTP email adapter used for forgot-password (`A5`) and Phase 5 quote notifications (`~125k` weekly downloads, published with Payload `3.91.0`).
- `pnpm.overrides` in `package.json` (documented with advisories, parent chains, and removal conditions in [`docs/dependency-overrides.md`](../dependency-overrides.md)):
  - `"chokidar@^3.0.0": "4.0.3"` — replaces transitive `chokidar@3.6.0` (under `sass`) to eliminate `braces@3.0.3` (`GHSA-vfj7-8cjw-p6xm`).
  - `"dompurify": "3.4.16"` — upgrades transitive `dompurify@3.4.15` (under `monaco-editor`) to patched `3.4.16` (`GHSA-p98j-92pf-mc4p`, `GHSA-6688-9rhm-gjv2`).
  - `"esbuild@<=0.24.2": "0.28.2"` — upgrades transitive `esbuild@0.18.20` (under `drizzle-kit`) to `0.28.2` (`GHSA-67mh-4wv8-2f99`).

### Security notes
- **S1, S2**: Startup environment validation in `src/env.ts` + boot-time enforcement in `src/instrumentation.ts`.
- **S3**: `.env*` git-ignored; `gitleaks git` runs in CI and locally (`0 leaks found`).
- **S4**: `local/no-server-in-client` ESLint rule + CI `.next/static` secret value grep.
- **A1–A6**: Lockout (`5` attempts / `15m`), server-side sessions (`2h` expiry + logout + admin `POST /api/users/:id/revoke-sessions`), `sameSite: 'Strict'` + `HttpOnly` cookies + `useAPIKey: false`, password policy (≥ 12 chars + common password blocklist), non-blocking forgot-password (`≤ 1h` TTL, `< 100ms` median timing difference), no public self-registration.
- **Z1, Z3**: Explicit collection access on `users` and `media`; `users.role` restricted to `isAdminFieldLevel` on create/update; last-admin deletion/demotion blocked in `beforeDelete`/`beforeChange`.
- **I5**: Strict magic-byte verification (JPEG, PNG, WebP, AVIF only; no SVG/HTML), 10 MB limit, filename sanitization, stored in `env.MEDIA_DIR` outside `public/`.
- **H1, H2, H4, H7**: `serverURL`/`cors`/`csrf` locked to `SERVER_URL`, security headers configured in `next.config.ts`, `poweredByHeader: false`, GraphQL disabled, `robots.txt` + `X-Robots-Tag: noindex` on `/admin`.
- **D1, D2**: Non-superuser database role `aljazira_app`; background email failure logs omit recipient email addresses.
- **B1–B4**: Exact versions + `--frozen-lockfile`, `onlyBuiltDependencies` + `ignoredBuiltDependencies`, `pnpm audit --prod` (`0 vulnerabilities`) + `.github/dependabot.yml` grouping `payload` & `@payloadcms/*`, `.github/workflows/ci.yml` with SHA-pinned actions and `permissions: contents: read`.

### Deviations from spec
None.

### Questions for CTO
None.
