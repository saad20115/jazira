# Phase 2 Report — Content Model, Access Control Suite (`Z1`–`Z6`), Revalidation, & Migrations

## Phase 2 — Content model & editor experience

- **Branch**: `phase-2-content`
- **Code Commit (`docs/reports/evidence/P2-T8/r1/commit.log`)**: `10e87f4f11df744690995cce29ce4eac2c03bc80`
- **Evidence Directory**: `docs/reports/evidence/P2-T8/r1/`

> **Note on `P2-T7` (`handoff/tasks/P2-T8.md` lines 6–8 & `M-065`)**: Per CTO decision on 2026-10-23, `P2-T7` (Dashboard UX & Live Preview wired to frontend routes) was moved to Phase 3 (scheduled after `P3-T4` in `handoff/PLAN.md` so Live Preview is built against real frontend routes). Accordingly, the `docs/04-phases.md` Phase 2 items for Live Preview / admin UX are marked below as **"moved to `P2-T7` in Phase 3 (CTO decision)"**, not as done.

---

### Done

1. **`P2-T1` — Shared Field Factories, Revalidation Hooks, & Publishable Wrapper**:
   - `slugField` & `slugLockedField` (`src/fields/slug.ts:929`, `src/fields/slug.ts:903`, `slugify` at `src/fields/slug.ts:194`, `transliterateArabic` at `src/fields/slug.ts:165`, `resolveUniqueSlug` at `src/fields/slug.ts:217`, `validateSlug` at `src/fields/slug.ts:450`), tested in `src/fields/slug.test.ts:53` and `tests/int/p2-t1-slug.int.test.ts:57`.
   - `orderField` (`src/fields/order.ts:16`), tested in `src/fields/order.test.ts:6`.
   - `linkField` (`src/fields/link.ts:464`), `validateExternalUrl` (`src/fields/link.ts:62`), `validateInternalPath` (`src/fields/link.ts:175`), `resolveLinkHref` (`src/fields/link.ts:262`), and `validateLinkGroupBeforeValidate` (`src/fields/link.ts:399`, attached to `hooks.beforeValidate` at `src/fields/link.ts:589` so draft, autosave, and publish saves all enforce `I3`), plus `getEffectiveAllowedProtocols` (`src/fields/link.ts:21`, called at `src/fields/link.ts:103`, allowing `http:` only when `NODE_ENV !== 'production'` per `R-9`), tested in `src/fields/link.test.ts:24`, `src/fields/link.test.ts:320`, `tests/int/p2-t5.int.test.ts:1558`, and `tests/int/p2-t8.int.test.ts:1394` (`tests/int/p2-t8.int.test.ts:1471`).
   - `videoUrlField`, `parseVideoUrl`, & `toEmbedUrl` (`src/fields/videoUrl.ts:312`, `src/fields/videoUrl.ts:116`, `src/fields/videoUrl.ts:265`, enforcing the 6-host allowlist `I4`), tested in `src/fields/videoUrl.test.ts:20`.
   - `limitedRichTextField` (`src/fields/richText.ts:368`), `paragraphRichTextField` (`src/fields/richText.ts:495`), & `validateLimitedLexicalState` (`src/fields/richText.ts:257`, enforcing the `I2` Lexical AST allowlist and optional `maxParagraphs` at `src/fields/richText.ts:281`), tested in `src/fields/richText.test.ts:9`.
   - `seoGroupField` (`src/fields/seo.ts:71`), plus `@payloadcms/plugin-seo@3.91.0` (`seoPlugin` at `src/payload.config.ts:2`, wired on `services` and `projects` in `src/payload.config.ts:135`).
   - `withPublishable` & `publishableVersions` (`src/collections/_shared/publishable.ts:29`, `src/collections/_shared/publishable.ts:5`), tested in `src/collections/_shared/publishable.test.ts:6`.
   - `withImmutableCreatedAt` (`src/collections/_shared/immutableTimestamps.ts:140`, `immutableCreatedAtField` at `src/collections/_shared/immutableTimestamps.ts:34`, `stripCreatedAtOnUpdateBeforeOperation` at `src/collections/_shared/immutableTimestamps.ts:62`, `preserveCreatedAtBeforeValidate` at `src/collections/_shared/immutableTimestamps.ts:87`, `preserveCreatedAtBeforeChange` at `src/collections/_shared/immutableTimestamps.ts:109`), applied across all 10 collections (`P2-T6 R-2`, `R-8`, `R-10`).
   - Revalidation hooks (`src/hooks/revalidate.ts`: `buildCollectionTags` at `src/hooks/revalidate.ts:58`, `buildGlobalTags` at `src/hooks/revalidate.ts:81`, `captureMainPublishedDocBeforeChange` at `src/hooks/revalidate.ts:373`, `captureMainPublishedGlobalBeforeChange` at `src/hooks/revalidate.ts:419`, `createRevalidateAfterChangeHook` at `src/hooks/revalidate.ts:648`, `createRevalidateAfterDeleteHook` at `src/hooks/revalidate.ts:700`, `createRevalidateGlobalAfterChangeHook` at `src/hooks/revalidate.ts:745`), tested in `src/hooks/revalidate.test.ts:35`.

2. **`P2-T2` — `videos`, `brands`, `stats`, `materials` Collections & Migration**:
   - `Videos` (`src/collections/Videos.ts:201`, magic-byte MP4/WebM validation `validateAndSanitizeVideoFile` at `src/security/uploadValidation.ts:271`, 100 MiB size cap `MAX_VIDEO_FILE_SIZE_BYTES` at `src/security/uploadValidation.ts:21` and `src/collections/Videos.ts:124`, isolated `VIDEO_UPLOAD_TEMP_DIR` at `src/collections/Videos.ts:40` and `src/collections/Videos.ts:106`, referential-integrity delete guard `preventVideoDeletionWhenReferenced` at `src/collections/Videos.ts:166`), `Brands` (`src/collections/Brands.ts:42`, referential-integrity delete guard `preventBrandDeletionWhenUsedByMaterials` at `src/collections/Brands.ts:13`), `Stats` (`src/collections/Stats.ts:53`, referential-integrity delete guard `preventStatDeletionWhenReferenced` at `src/collections/Stats.ts:18`), and `Materials` (`src/collections/Materials.ts:63`, `minRows: 1` on `brands` at `src/collections/Materials.ts:179`).
   - Migration `src/migrations/20261022_120943_p2_t2_videos_brands_stats_materials.ts` (`src/migrations/index.ts:18`), tested in `tests/int/p2-t2.int.test.ts:147`.

3. **`P2-T3` — `services` & `team` Collections & Migration**:
   - `Services` (`src/collections/Services.ts:134`, versioned/publishable with `Z2` `publishedOrLoggedIn` read access at `src/collections/Services.ts:164`, `validateServiceBeforeValidate` at `src/collections/Services.ts:78`, `service_tier` & `service_icon` enums, `highlights` `maxRows: 8`, `bodyMediaField` extraction from Lexical `body` at `src/collections/Services.ts:358`), and `Team` (`src/collections/Team.ts:80`, public read filtered to `{ active: { equals: true } }` via `activeOrLoggedIn` at `src/collections/Team.ts:18` and `src/collections/Team.ts:108`, `validateLinkedInUrl` on `linkedin` at `src/collections/Team.ts:32` and `src/collections/Team.ts:289`).
   - Migration `src/migrations/20261022_140011_p2_t3_services_team.ts` (`src/migrations/index.ts:23`), tested in `tests/int/p2-t3.int.test.ts:134`.

4. **`P2-T4` — `projects` Collection, Jobs Autorun Guard, Config-Driven `media` Delete Guard, & Migration**:
   - `Projects` (`src/collections/Projects.ts:568`, versioned/publishable with `Z2` `publishedOrLoggedIn` read access at `src/collections/Projects.ts:598`, `validateProjectBeforeValidate` enforcing `video` xor `videoUrl` and draft/publish relationship/enum checks at `src/collections/Projects.ts:179` and `src/collections/Projects.ts:604`, localized `PROJECT_SCOPE_OPTIONS` at `src/collections/Projects.ts:54`, and `revalidateProjectRelatedAndHomeAfterChange` at `src/collections/Projects.ts:405` and `src/collections/Projects.ts:613`).
   - `shouldAutoRunJobs` (`src/jobs/shouldAutoRun.ts:13`, wired in `src/payload.config.ts:125`), tested in `src/jobs/shouldAutoRun.test.ts:5`.
   - Migration `src/migrations/20261022_160652_p2_t4_projects.ts` (`src/migrations/index.ts:28`), tested in `tests/int/p2-t4.int.test.ts:158`.

5. **`P2-T5` — Reusable Field Groups (`src/fields/groups/`) & All 8 Globals (`src/globals/`)**:
   - Field groups (`src/fields/groups/index.ts:1`: `buttonGroup` at `src/fields/groups/button.ts:95`, `ctaGroup` at `src/fields/groups/cta.ts:147`, `pageHeaderGroup` at `src/fields/groups/pageHeader.ts:122`, `sectionIntroGroup` at `src/fields/groups/sectionIntro.ts:130`, `pillarGroup` at `src/fields/groups/pillar.ts:55`, `collapsibleSection` at `src/fields/groups/collapsibleSection.ts:16`), tested in `src/fields/groups/groups.test.ts:16`.
   - Globals (`src/globals/index.ts:28`): `SiteSettings` (`src/globals/SiteSettings.ts:349`, admin-only update at `src/globals/SiteSettings.ts:364`), `Navigation` (`src/globals/Navigation.ts:224`), `HomePage` (`src/globals/HomePage.ts:227`, `interactiveSystems.systems` exact `minRows: 5`, `maxRows: 5` and default discipline mappings at `src/globals/HomePage.ts:471`–`src/globals/HomePage.ts:473`), `ServicesPage` (`src/globals/ServicesPage.ts:12`), `AboutPage` (`src/globals/AboutPage.ts:98`), `ProjectsPage` (`src/globals/ProjectsPage.ts:11`), `ContactPage` (`src/globals/ContactPage.ts:10`), and `PrivacyPage` (`src/globals/PrivacyPage.ts:10`).
   - Migration `src/migrations/20261022_221250_p2_t5_globals.ts` (`src/migrations/index.ts:33`), tested in `src/globals/globals.test.ts:40` and `tests/int/p2-t5.int.test.ts:141`.

6. **`P2-T6` — `quote-requests` Collection, Pure `src/lib/quote/schema.ts`, Client-Bundle Sentinel Guard, `src/lib/ipHash.ts`, `Users.access.unlock: isAdmin`, Admin Pills/Filter Bar, & Migrations**:
   - Pure phone validator & E.164 normalizer `src/lib/quote/schema.ts` (imports only `zod` at `src/lib/quote/schema.ts:1`, `normalizeQuotePhone` at `src/lib/quote/schema.ts:27`, `quotePhoneSchema` at `src/lib/quote/schema.ts:108`), tested in `src/lib/quote/schema.test.ts:12`.
   - Post-build client-bundle sentinel guard `scripts/check-client-bundle-sentinels.mjs` (`scripts/check-client-bundle-sentinels.mjs:22`, `ENV_SERVER_ONLY_SENTINEL` at `src/env.ts:154`, `IPHASH_SERVER_ONLY_SENTINEL` at `src/lib/ipHash.ts:15`, wired in `package.json:13` and `.github/workflows/ci.yml:154`).
   - Salted IP hash helper `src/lib/ipHash.ts` (`hashIp` at `src/lib/ipHash.ts:49`), tested in `src/lib/ipHash.test.ts:7`.
   - `QuoteRequests` (`src/collections/QuoteRequests.ts:322`: `create: () => false` at `src/collections/QuoteRequests.ts:363`, `readOnlyFieldAccess` at `src/collections/QuoteRequests.ts:59`, `workflowFieldAccess` at `src/collections/QuoteRequests.ts:65`, `serviceTitle` snapshot at `src/collections/QuoteRequests.ts:451`, `QuoteStatusPillCell` at `src/components/admin/QuoteStatusPillCell.tsx:72`, `EmailStatusPillCell` at `src/components/admin/EmailStatusPillCell.tsx:52`, `QuoteRequestsFilterBar` at `src/components/admin/QuoteRequestsFilterBar.tsx:17`), and `Users.access.unlock: isAdmin` (`src/collections/Users.ts:261`).
   - Migrations `src/migrations/20261022_231435_p2_t6_quote_requests.ts` (`src/migrations/index.ts:38`) and `src/migrations/20261023_005934_p2_t6_quote_requests_service_title.ts` (`src/migrations/index.ts:43`), tested in `src/collections/QuoteRequests.test.ts:38` and `tests/int/p2-t6.int.test.ts:87`.

7. **`P2-T8` — Access Control Test Suite (`Z1`–`Z6`), Carried-Over Items `R-6`..`R-9` (`M-076`), Migrations Verification, & Editor Flow Evidence**:
   - **Scope 1 (`Z1` Config-Enumeration Test — `src/access/z1-config-enumeration.test.ts`)**:
     - `assertExplicitAccessFunction` (`src/access/z1-config-enumeration.test.ts:41`) and 3 tests (`src/access/z1-config-enumeration.test.ts:75`, `src/access/z1-config-enumeration.test.ts:99`, `src/access/z1-config-enumeration.test.ts:175`) load both the raw configs and the sanitized built `payloadConfig`, iterate every application collection (`users`, `media`, `videos`, `brands`, `stats`, `materials`, `services`, `team`, `projects`, `quote-requests`) and all 8 globals (`site-settings`, `navigation`, `home-page`, `services-page`, `about-page`, `projects-page`, `contact-page`, `privacy-page`), fail if any of `read`/`create`/`update`/`delete` (plus `unlock` on auth collections; globals: `read`/`update`) is missing or references Payload's `defaultAccess`, and evaluate every access function across anonymous, editor, and admin callers.
   - **Scope 2 (`Z5` REST Role Matrix Integration Tests — `tests/int/p2-t8.int.test.ts`)**:
     - Executes real HTTP requests against `@payloadcms/next/routes` (`REST_GET`, `REST_POST`, `REST_PATCH`, `REST_DELETE` at `tests/int/p2-t8.int.test.ts:182`–`tests/int/p2-t8.int.test.ts:185`) with real JWT sessions for `anonymous`, `editor`, and `admin` across all 10 collections (`tests/int/p2-t8.int.test.ts:242`) and all 8 globals (`tests/int/p2-t8.int.test.ts:1008`), plus `Z2` draft isolation (`tests/int/p2-t8.int.test.ts:1154`) and `Z3` editor role self-escalation prevention (`tests/int/p2-t8.int.test.ts:1361`), and prints the markdown Role Matrix tables directly to stdout (`tests/int/p2-t8.int.test.ts:1135`–`tests/int/p2-t8.int.test.ts:1151`).
   - **Scope 3 (`Z6` Frontend/CMS Local API `overrideAccess: false` Lint Rule & Unit Tests)**:
     - Created ESLint rule `local/require-override-access-false` in `eslint-rules/require-override-access-false.mjs` (`GUARDED_PAYLOAD_METHODS` at `eslint-rules/require-override-access-false.mjs:15`, `isFrontendOrCmsFile` at `eslint-rules/require-override-access-false.mjs:36`, `requireOverrideAccessFalseRule` at `eslint-rules/require-override-access-false.mjs:117`), registered as `'error'` in `eslint.config.mjs:6`, `eslint.config.mjs:39`, and `eslint.config.mjs:45`.
     - Tested in `src/eslint-require-override-access-false.test.ts:54` (4 unit tests at `src/eslint-require-override-access-false.test.ts:55`, `src/eslint-require-override-access-false.test.ts:78`, `src/eslint-require-override-access-false.test.ts:94`, `src/eslint-require-override-access-false.test.ts:105`).
   - **Carried-Over Items `R-6`..`R-9` from `handoff/reviews/P2-T5.md` (`M-076`)**:
     - **`R-6` (Report accuracy)**:
       1. In the Global Revalidation Table below, `site-settings` (`src/globals/SiteSettings.ts:24`–`src/globals/SiteSettings.ts:31`, `src/globals/SiteSettings.ts:371`–`src/globals/SiteSettings.ts:375`) and `navigation` (`src/globals/Navigation.ts:12`–`src/globals/Navigation.ts:19`, `src/globals/Navigation.ts:244`–`src/globals/Navigation.ts:248`) explicitly list all **12** localized public page paths (`/ar`, `/ar/services`, `/ar/about`, `/ar/projects`, `/ar/contact`, `/ar/privacy`, `/en`, `/en/services`, `/en/about`, `/en/projects`, `/en/contact`, `/en/privacy`) plus the root layout in both locales (`revalidatePath('/ar', 'layout')`, `revalidatePath('/en', 'layout')`).
       2. `### Deviations from spec` below states the exact count (**8** design-backed additions from `P2-T5`).
       3. Updated the test title at `tests/int/p2-t5.int.test.ts:1558` to `rejects unsafe linkField URLs (javascript:, data:, vbscript:, mixed-case/whitespace schemes, and //host internal paths) on draft, autosave, and publish across globals (R-1, R-6)`.
     - **`R-7` (`limits.log` generator script)**: Committed `scripts/print-limits.ts` (`generateLimitsLogLines` at `scripts/print-limits.ts:58`, CLI entrypoint at `scripts/print-limits.ts:81`) and recorded `docs/reports/evidence/P2-T8/r1/limits.log` during the fresh-clone DoD.
     - **`R-8` (Config-driven collection paths in `Media.ts` + `QuoteRequests.test.ts` slug-list cleanup)**: Replaced the hard-coded collection path list in `src/collections/Media.ts` with `deriveCollectionTargetReferences` (`src/collections/Media.ts:362`), `buildCollectionTargetWhere` (`src/collections/Media.ts:392`), and `findCollectionTargetReferences` (`src/collections/Media.ts:407`, called in `preventMediaDeletionWhenReferenced` at `src/collections/Media.ts:476`–`src/collections/Media.ts:487`), tested in `src/globals/globals.test.ts:212` and `tests/int/p2-t8.int.test.ts:1394`; and removed the hard-coded slug list from `src/collections/QuoteRequests.test.ts:179` (`src/collections/QuoteRequests.test.ts:183`, `src/collections/QuoteRequests.test.ts:186`).
     - **`R-9` (`http:` external links allowed only when `NODE_ENV !== 'production'`)**: Added `PRODUCTION_ALLOWED_LINK_PROTOCOLS` (`src/fields/link.ts:14`) and `getEffectiveAllowedProtocols` (`src/fields/link.ts:21`, called in `validateExternalUrl` at `src/fields/link.ts:103`), tested in `src/fields/link.test.ts:320` and `tests/int/p2-t8.int.test.ts:1394` (`tests/int/p2-t8.int.test.ts:1471`–`tests/int/p2-t8.int.test.ts:1548`).

---

### Evidence

All 13 fresh-clone Definition of Done logs (`commit.log`, `install.log`, `lint.log`, `typecheck.log`, `format.log`, `audit.log`, `limits.log`, `migrate-up.log`, `migrate-down.log`, `migrate-reup.log`, `migrate-create-noop.log`, `test.log`, `build.log`), `citations.log`, and the 3 editor flow screenshots (`editor-flow-1-create-ar-draft.png`, `editor-flow-2-add-en-draft.png`, `editor-flow-3-published-ar.png`) are committed in `docs/reports/evidence/P2-T8/r1/`.

- **Explicit ANSI Strip Disclosure (`R-17`)**: All `.log` files in `docs/reports/evidence/P2-T8/r1/` were recorded with `NO_COLOR=1 FORCE_COLOR=0` and written in UTF-8 without BOM (`hasBom=False`). Because Payload's Pino logger and interactive `migrate:create` prompt still emit CSI / DEC private-mode escape sequences (`\x1b[?25l` etc.) when `NO_COLOR=1` is set, the fresh-clone runner stripped CSI/DEC escape sequences via `$clean = $rawText -replace "\x1b\[\??[0-9;]*[a-zA-Z]", ""` before saving (`hasEsc=False` across all `.log` files).

#### 1. `Z5` REST Role Matrix Tables (Generated by `tests/int/p2-t8.int.test.ts:242` & `tests/int/p2-t8.int.test.ts:1008`, Printed in `docs/reports/evidence/P2-T8/r1/test.log`)

##### Collections Role Matrix (`anonymous` / `editor` / `admin` × `read` / `create` / `update` / `delete`)

| Target | Anon Read | Anon Create | Anon Update | Anon Delete | Editor Read | Editor Create | Editor Update | Editor Delete | Admin Read | Admin Create | Admin Update | Admin Delete |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `users (self)` | 403 | 403 | 403 | 403 | 200 | 403 | 200 | 403 | 200 | 201 | 200 | 200 |
| `users (other — id & name only for editor per R-11)` | 403 | 403 | 403 | 403 | 200 | 403 | 403 | 403 | 200 | 201 | 200 | 200 |
| `media` | 200 | 403 | 403 | 403 | 200 | 201 | 200 | 200 | 200 | 201 | 200 | 200 |
| `videos` | 200 | 403 | 403 | 403 | 200 | 201 | 200 | 200 | 200 | 201 | 200 | 200 |
| `brands` | 200 | 403 | 403 | 403 | 200 | 201 | 200 | 200 | 200 | 201 | 200 | 200 |
| `stats` | 200 | 403 | 403 | 403 | 200 | 201 | 200 | 200 | 200 | 201 | 200 | 200 |
| `materials` | 200 | 403 | 403 | 403 | 200 | 201 | 200 | 200 | 200 | 201 | 200 | 200 |
| `services` | 200 | 403 | 403 | 403 | 200 | 201 | 200 | 200 | 200 | 201 | 200 | 200 |
| `team` | 200 | 403 | 403 | 403 | 200 | 201 | 200 | 200 | 200 | 201 | 200 | 200 |
| `projects` | 200 | 403 | 403 | 403 | 200 | 201 | 200 | 200 | 200 | 201 | 200 | 200 |
| `quote-requests` | 403 | 403 | 403 | 403 | 200 | 403 | 200 | 403 | 200 | 403 | 200 | 200 |

- **Additional `Z2` / `Z3` / `Z4` / `R-11` / `R-13` Access Matrix Guarantees Verified in `tests/int/p2-t8.int.test.ts` & `tests/int/p2-t6.int.test.ts`**:
  - On `services` and `projects`, anonymous `GET /api/<slug>?draft=true` and `GET /api/<slug>/:id?draft=true` never return unpublished drafts (`404` on draft-only or draft revision; `200` with the published version on `GET /api/<slug>/:id`), while `editor` and `admin` with `?draft=true` receive the draft (`tests/int/p2-t8.int.test.ts:1154`–`tests/int/p2-t8.int.test.ts:1359`).
  - On `team`, anonymous `GET /api/team` only returns active members (`{ active: { equals: true } }` at `src/collections/Team.ts:16`, tested in `tests/int/p2-t3.int.test.ts:289`).
  - On `users`, an `editor` calling `PATCH /api/users/:selfId` with `{ role: 'admin' }` or `payload.update({ collection: 'users', id: editorUser.id, overrideAccess: false, data: { role: 'admin' } })` cannot change their own `role` (`Z3`, `tests/int/p2-t8.int.test.ts:1361`–`tests/int/p2-t8.int.test.ts:1392`); an `editor` reading another user receives ONLY `{ id, name }` (`R-11`, `tests/int/p2-t8.int.test.ts:385`–`tests/int/p2-t8.int.test.ts:408`); and `POST /api/users/unlock` returns `403` for anonymous and `editor` callers (`R-13`, `tests/int/p2-t6.int.test.ts:778`–`tests/int/p2-t6.int.test.ts:888`).
  - On `quote-requests`, `POST /api/quote-requests` and Local API `payload.create({ collection: 'quote-requests', overrideAccess: false })` are rejected for all roles (`Z4`), and customer/system fields are immutable via `readOnlyFieldAccess` (`tests/int/p2-t6.int.test.ts:177`, `tests/int/p2-t6.int.test.ts:246`).

##### Globals Role Matrix (`anonymous` / `editor` / `admin` × `read` / `update`)

| Global | Anon Read | Anon Update | Editor Read | Editor Update | Admin Read | Admin Update |
|---|---|---|---|---|---|---|
| `site-settings` | 200 | 403 | 200 | 403 | 200 | 200 |
| `navigation` | 200 | 403 | 200 | 200 | 200 | 200 |
| `home-page` | 200 | 403 | 200 | 200 | 200 | 200 |
| `services-page` | 200 | 403 | 200 | 200 | 200 | 200 |
| `about-page` | 200 | 403 | 200 | 200 | 200 | 200 |
| `projects-page` | 200 | 403 | 200 | 200 | 200 | 200 |
| `contact-page` | 200 | 403 | 200 | 200 | 200 | 200 |
| `privacy-page` | 200 | 403 | 200 | 200 | 200 | 200 |

#### 2. Complete Global Revalidation Table (`R-6` — Verified Against `src/hooks/revalidate.ts:745`–`src/hooks/revalidate.ts:797` & `src/globals/*.ts`)

| Global Slug | Publishable? | Invalidated Cache Tags | Invalidated Paths (`ar` & `en`) | When Triggered |
|---|---|---|---|---|
| `site-settings` | No (always live) | `global:site-settings`, `global:site-settings:ar`, `global:site-settings:en` | All **12** localized public pages (`/ar`, `/ar/services`, `/ar/about`, `/ar/projects`, `/ar/contact`, `/ar/privacy`, `/en`, `/en/services`, `/en/about`, `/en/projects`, `/en/contact`, `/en/privacy` via `ALL_PUBLIC_LOCALIZED_PATHS` at `src/globals/SiteSettings.ts:24`–`src/globals/SiteSettings.ts:31` and `localizedPaths` at `src/globals/SiteSettings.ts:373`) **plus** the root layout in both locales (`revalidatePath('/ar', 'layout')` and `revalidatePath('/en', 'layout')` via `layoutPaths: ['/']` at `src/globals/SiteSettings.ts:374`) | Every update |
| `navigation` | No (always live) | `global:navigation`, `global:navigation:ar`, `global:navigation:en` | All **12** localized public pages (`/ar`, `/ar/services`, `/ar/about`, `/ar/projects`, `/ar/contact`, `/ar/privacy`, `/en`, `/en/services`, `/en/about`, `/en/projects`, `/en/contact`, `/en/privacy` via `ALL_PUBLIC_LOCALIZED_PATHS` at `src/globals/Navigation.ts:12`–`src/globals/Navigation.ts:19` and `localizedPaths` at `src/globals/Navigation.ts:246`) **plus** the root layout in both locales (`revalidatePath('/ar', 'layout')` and `revalidatePath('/en', 'layout')` via `layoutPaths: ['/']` at `src/globals/Navigation.ts:247`) | Every update |
| `home-page` | Yes (`drafts` + `schedulePublish`) | `global:home-page`, `global:home-page:ar`, `global:home-page:en` | `/ar`, `/en` (page scope via `localizedPaths: ['/']` at `src/globals/HomePage.ts:246`) | Only when published or unpublished (`_status === 'published'` or `wasPublished`) |
| `services-page` | Yes (`drafts` + `schedulePublish`) | `global:services-page`, `global:services-page:ar`, `global:services-page:en` | `/ar/services`, `/en/services` (page scope via `localizedPaths: ['/services']` at `src/globals/ServicesPage.ts:30`) | Only when published or unpublished |
| `about-page` | Yes (`drafts` + `schedulePublish`) | `global:about-page`, `global:about-page:ar`, `global:about-page:en` | `/ar/about`, `/en/about` (page scope via `localizedPaths: ['/about']` at `src/globals/AboutPage.ts:116`) | Only when published or unpublished |
| `projects-page` | Yes (`drafts` + `schedulePublish`) | `global:projects-page`, `global:projects-page:ar`, `global:projects-page:en`, `collection:projects`, `collection:projects:ar`, `collection:projects:en` (`extraTags: ['collection:projects']` at `src/globals/ProjectsPage.ts:31`) | `/ar/projects`, `/en/projects` (page scope via `localizedPaths: ['/projects']` at `src/globals/ProjectsPage.ts:29` + `layout` scope via `layoutPaths: ['/projects']` at `src/globals/ProjectsPage.ts:30`, covering project detail pages sharing `projects-page.cta`) | Only when published or unpublished |
| `contact-page` | Yes (`drafts` + `schedulePublish`) | `global:contact-page`, `global:contact-page:ar`, `global:contact-page:en` | `/ar/contact`, `/en/contact` (page scope via `localizedPaths: ['/contact']` at `src/globals/ContactPage.ts:28`) | Only when published or unpublished |
| `privacy-page` | Yes (`drafts` + `schedulePublish`) | `global:privacy-page`, `global:privacy-page:ar`, `global:privacy-page:en` | `/ar/privacy`, `/en/privacy` (page scope via `localizedPaths: ['/privacy']` at `src/globals/PrivacyPage.ts:28`) | Only when published or unpublished |

#### 3. Verbatim `limits.log` Generated by `scripts/print-limits.ts` (`R-7`, `docs/reports/evidence/P2-T8/r1/limits.log`)
```text
=== REUSABLE FIELD GROUPS ===
group:button.button.label (text): maxLength=100
group:cta.cta.title (text): maxLength=200
group:cta.cta.text (textarea): maxLength=600
group:cta.cta.button.label (text): maxLength=100
group:cta.cta.secondaryButton.label (text): maxLength=100
group:pageHeader.pageHeader.title (text): maxLength=200
group:pageHeader.pageHeader.subtitle (textarea): maxLength=500
group:sectionIntro.sectionIntro.eyebrow (text): maxLength=120
group:sectionIntro.sectionIntro.title (text): maxLength=200
group:sectionIntro.sectionIntro.intro (textarea): maxLength=600
group:pillar.pillar.title (text): maxLength=200
group:pillar.pillar.text (textarea): maxLength=1000

=== GLOBALS ===
--- global:site-settings ---
site-settings.companyName (text): maxLength=200
site-settings.tagline (text): maxLength=280
site-settings.phone (text): maxLength=60
site-settings.whatsapp (text): maxLength=40
site-settings.whatsappLabel (text): maxLength=160
site-settings.address (textarea): maxLength=400
site-settings.mapUrl (text): maxLength=2048
site-settings.workingHours (text): maxLength=200
site-settings.office.title (text): maxLength=200
site-settings.office.address (textarea): maxLength=400
site-settings.office.mapUrl (text): maxLength=2048
site-settings.socials (array): maxRows=10
site-settings.socials.url (text): maxLength=2048
site-settings.footerText (textarea): maxLength=600
site-settings.copyright (text): maxLength=280
site-settings.defaultSeo.title (text): maxLength=160
site-settings.defaultSeo.description (textarea): maxLength=320
--- global:navigation ---
navigation.header (array): maxRows=8
navigation.header.label (text): maxLength=80
navigation.headerCta.label (text): maxLength=100
navigation.footer (array): maxRows=4
navigation.footer.title (text): maxLength=100
navigation.footer.links (array): maxRows=10
navigation.footer.links.label (text): maxLength=80
navigation.footerCta.title (text): maxLength=160
navigation.footerCta.text (textarea): maxLength=320
navigation.footerCta.button.label (text): maxLength=100
navigation.footerCta.whatsappLabel (text): maxLength=120
--- global:home-page ---
home-page.hero.eyebrow (text): maxLength=120
home-page.hero.title (text): maxLength=200
home-page.hero.subtitle (textarea): maxLength=500
home-page.hero.primaryCta.label (text): maxLength=100
home-page.hero.secondaryCta.label (text): maxLength=100
home-page.whoWeAre.eyebrow (text): maxLength=120
home-page.whoWeAre.title (text): maxLength=200
home-page.whoWeAre.button.label (text): maxLength=100
home-page.coreServices.eyebrow (text): maxLength=120
home-page.coreServices.title (text): maxLength=200
home-page.coreServices.intro (textarea): maxLength=600
home-page.coreServices.button.label (text): maxLength=100
home-page.interactiveSystems.eyebrow (text): maxLength=120
home-page.interactiveSystems.title (text): maxLength=200
home-page.interactiveSystems.intro (textarea): maxLength=600
home-page.interactiveSystems.systems (array): minRows=5, maxRows=5
home-page.interactiveSystems.systems.title (text): maxLength=160
home-page.interactiveSystems.systems.text (textarea): maxLength=600
home-page.interactiveSystems.relatedProjectsLabel (text): maxLength=120
home-page.interactiveSystems.liveModelLabel (text): maxLength=120
home-page.statsSection.title (text): maxLength=200
home-page.statsSection.text (textarea): maxLength=500
home-page.statsSection.stats (relationship): maxRows=4
home-page.featuredProjects.eyebrow (text): maxLength=120
home-page.featuredProjects.title (text): maxLength=200
home-page.featuredProjects.intro (textarea): maxLength=600
home-page.featuredProjects.button.label (text): maxLength=100
home-page.partners.eyebrow (text): maxLength=120
home-page.partners.title (text): maxLength=200
home-page.partners.intro (textarea): maxLength=600
home-page.cta.title (text): maxLength=200
home-page.cta.text (textarea): maxLength=600
home-page.cta.button.label (text): maxLength=100
home-page.cta.secondaryButton.label (text): maxLength=100
--- global:services-page ---
services-page.pageHeader.title (text): maxLength=200
services-page.pageHeader.subtitle (textarea): maxLength=500
services-page.servicesIntro.eyebrow (text): maxLength=120
services-page.servicesIntro.title (text): maxLength=200
services-page.servicesIntro.intro (textarea): maxLength=600
services-page.specialist.eyebrow (text): maxLength=120
services-page.specialist.title (text): maxLength=200
services-page.specialist.intro (textarea): maxLength=600
services-page.materials.eyebrow (text): maxLength=120
services-page.materials.title (text): maxLength=200
services-page.materials.intro (textarea): maxLength=600
services-page.process.eyebrow (text): maxLength=120
services-page.process.title (text): maxLength=200
services-page.process.intro (textarea): maxLength=600
services-page.process.steps (array): maxRows=8
services-page.process.steps.title (text): maxLength=200
services-page.process.steps.text (textarea): maxLength=1000
services-page.cta.title (text): maxLength=200
services-page.cta.text (textarea): maxLength=600
services-page.cta.button.label (text): maxLength=100
services-page.cta.secondaryButton.label (text): maxLength=100
--- global:about-page ---
about-page.pageHeader.title (text): maxLength=200
about-page.pageHeader.subtitle (textarea): maxLength=500
about-page.story.eyebrow (text): maxLength=120
about-page.story.title (text): maxLength=200
about-page.story.quote (textarea): maxLength=500
about-page.story.quoteAuthor (text): maxLength=200
about-page.strengths.eyebrow (text): maxLength=120
about-page.strengths.title (text): maxLength=200
about-page.strengths.intro (textarea): maxLength=600
about-page.strengths.items (array): maxRows=6
about-page.strengths.items.title (text): maxLength=200
about-page.strengths.items.text (textarea): maxLength=1000
about-page.missionVision.eyebrow (text): maxLength=120
about-page.missionVision.title (text): maxLength=200
about-page.missionVision.intro (textarea): maxLength=600
about-page.missionVision.mission.eyebrow (text): maxLength=120
about-page.missionVision.mission.title (text): maxLength=200
about-page.missionVision.mission.text (textarea): maxLength=800
about-page.missionVision.mission.pillars (array): maxRows=8
about-page.missionVision.mission.pillars.title (text): maxLength=200
about-page.missionVision.mission.pillars.text (textarea): maxLength=1000
about-page.missionVision.vision.eyebrow (text): maxLength=120
about-page.missionVision.vision.title (text): maxLength=200
about-page.missionVision.vision.text (textarea): maxLength=800
about-page.missionVision.vision.pillars (array): maxRows=8
about-page.missionVision.vision.pillars.title (text): maxLength=200
about-page.missionVision.vision.pillars.text (textarea): maxLength=1000
about-page.team.eyebrow (text): maxLength=120
about-page.team.title (text): maxLength=200
about-page.team.intro (textarea): maxLength=600
about-page.team.staffTitle (text): maxLength=200
about-page.team.staffText (textarea): maxLength=500
--- global:projects-page ---
projects-page.pageHeader.title (text): maxLength=200
projects-page.pageHeader.subtitle (textarea): maxLength=500
projects-page.impact.title (text): maxLength=200
projects-page.impact.text (textarea): maxLength=500
projects-page.impact.stats (relationship): maxRows=4
projects-page.portfolio.eyebrow (text): maxLength=120
projects-page.portfolio.title (text): maxLength=200
projects-page.portfolio.quote (textarea): maxLength=500
projects-page.portfolio.quoteAuthor (text): maxLength=200
projects-page.cta.title (text): maxLength=200
projects-page.cta.text (textarea): maxLength=600
projects-page.cta.button.label (text): maxLength=100
projects-page.cta.secondaryButton.label (text): maxLength=100
--- global:contact-page ---
contact-page.pageHeader.title (text): maxLength=200
contact-page.pageHeader.subtitle (textarea): maxLength=500
contact-page.getInTouch.eyebrow (text): maxLength=120
contact-page.getInTouch.title (text): maxLength=200
contact-page.getInTouch.intro (textarea): maxLength=600
contact-page.findOffice.eyebrow (text): maxLength=120
contact-page.findOffice.title (text): maxLength=200
contact-page.findOffice.intro (textarea): maxLength=600
--- global:privacy-page ---
privacy-page.pageHeader.title (text): maxLength=200
privacy-page.pageHeader.subtitle (textarea): maxLength=500
```

#### 4. Command Outputs (`docs/reports/evidence/P2-T8/r1/`)
- **`commit.log`**:
  ```text
  $ git rev-parse HEAD 
  10e87f4f11df744690995cce29ce4eac2c03bc80
  $ git status --porcelain 
  ```
- **`lint.log`**, **`typecheck.log`**, **`format.log`**, **`audit.log`**:
  - `pnpm lint`: exit `0`.
  - `pnpm typecheck` (`tsc --noEmit`): exit `0`.
  - `pnpm format:check`: `All matched files use Prettier code style!` (exit `0`).
  - `pnpm audit --prod`: `No known vulnerabilities found` (exit `0`).
- **`migrate-up.log`**, **`migrate-down.log`**, **`migrate-reup.log`**, **`migrate-create-noop.log`**:
  - All 7 committed migrations (`20261021_074848_initial_users_media`, `20261022_120943_p2_t2_videos_brands_stats_materials`, `20261022_140011_p2_t3_services_team`, `20261022_160652_p2_t4_projects`, `20261022_221250_p2_t5_globals`, `20261022_231435_p2_t6_quote_requests`, `20261023_005934_p2_t6_quote_requests_service_title` in `src/migrations/index.ts:9`–`src/migrations/index.ts:45`) apply cleanly on an empty PostgreSQL 18 database (`migrate-up.log`), roll back all the way down to zero tables cleanly (`migrate-down.log`), re-apply cleanly (`migrate-reup.log`), and `echo n| pnpm payload migrate:create noop_check` detects zero schema drift (`√ No schema changes detected. Would you like to create a blank migration file? ... no` in `migrate-create-noop.log`).
- **`test.log`**:
  - `34 passed (34)` test files, `183 passed (183)` unit + integration tests (`vitest run "--reporter=verbose" "--no-color"`).
- **`build.log`**:
  - `next build && node scripts/check-client-bundle-sentinels.mjs` (`package.json:13`) compiles cleanly with zero errors and verifies that no server-only sentinel (`ENV_SERVER_ONLY_SENTINEL` at `src/env.ts:154` or `IPHASH_SERVER_ONLY_SENTINEL` at `src/lib/ipHash.ts:15`) is present in `.next/static`.

#### 5. Editor Flow Evidence Screenshots (`docs/reports/evidence/P2-T8/r1/`)
Captured at `1440×900` logged in as an `editor` (`editor-flow-p2t8@aljazira.co`, role `editor`):
1. `docs/reports/evidence/P2-T8/r1/editor-flow-1-create-ar-draft.png` — Step 1: Editor creates a new project in Arabic (`AR`, RTL) with Arabic title `فندق سوفيتيل مكة المكرمة (تدفق المحرر P2-T8)`, Arabic summary, location `مكة المكرمة`, category `أعمال كهروميكانيكية متكاملة (MEP)`, cover image, and sidebar fields (`status: completed`, auto-generated transliterated slug `fndq-swfytyl-mkh-almkrmh-tdfq-almhrr-p2-t8`), saved as a draft (`الحالة: مسودة`, with `حفظ المسودة` and `نشر التغييرات` buttons visible in the top bar).
2. `docs/reports/evidence/P2-T8/r1/editor-flow-2-add-en-draft.png` — Step 2: Editor switches the content locale to English (`EN`) and saves the English draft (`Sofitel Makkah Hotel (Editor Flow P2-T8)`, English summary, location `Makkah Al-Mukarramah`), which automatically updates the unlocked slug to the English slug `sofitel-makkah-hotel-editor-flow-p2-t8` while keeping `الحالة: مسودة`.
3. `docs/reports/evidence/P2-T8/r1/editor-flow-3-published-ar.png` — Step 3: Editor switches back to Arabic (`AR`, RTL) and clicks `نشر التغييرات` (Publish changes); the status badge transitions to `الحالة: منشور` (Published) and the slug `sofitel-makkah-hotel-editor-flow-p2-t8` is locked. *(Note: Live Preview is moved to `P2-T7` in Phase 3 per CTO decision).*

---

### Acceptance criteria

- [x] **Every collection/global has explicit access (`Z1`) — a test enumerates the config and fails if any operation is missing.**
  - Proof: `src/access/z1-config-enumeration.test.ts:75`, `src/access/z1-config-enumeration.test.ts:99`, and `src/access/z1-config-enumeration.test.ts:175` enumerate all 10 application collections and all 8 globals in both raw and built configs, verifying explicit non-default access functions for `read`/`create`/`update`/`delete` (plus `unlock` on `users`; globals: `read`/`update`).
- [x] **`Z2`–`Z6` integration tests pass (`anonymous` / `editor` / `admin`).**
  - Proof: `tests/int/p2-t8.int.test.ts:242` (collections role matrix `Z1`/`Z3`/`Z4`/`Z5`), `tests/int/p2-t8.int.test.ts:1008` (globals role matrix `Z1`/`Z5`), `tests/int/p2-t8.int.test.ts:1154` (`Z2` draft isolation across collections and globals), `tests/int/p2-t8.int.test.ts:1361` (`Z3` editor role escalation prevention), `tests/int/p2-t6.int.test.ts:177` & `tests/int/p2-t6.int.test.ts:246` (`Z4` `quote-requests` API create prohibition and customer/system field immutability), and `src/eslint-require-override-access-false.test.ts:54` (`Z6` frontend/CMS `overrideAccess: false` enforcement) all pass in `docs/reports/evidence/P2-T8/r1/test.log`.
- [x] **Editor can create a project in Arabic, add English, save draft, publish it — recorded as screenshots; Live Preview moved to `P2-T7` in Phase 3 (CTO decision).**
  - Proof: Captured as an `editor` in `docs/reports/evidence/P2-T8/r1/editor-flow-1-create-ar-draft.png` (create Arabic draft), `docs/reports/evidence/P2-T8/r1/editor-flow-2-add-en-draft.png` (add English draft & auto-update slug to English), and `docs/reports/evidence/P2-T8/r1/editor-flow-3-published-ar.png` (publish in Arabic RTL); Live Preview / admin UX moved to `P2-T7` in Phase 3 per CTO decision (`handoff/tasks/P2-T8.md` lines 6–8, `M-065`).
- [x] **Drafts are never returned to anonymous REST or Local API calls with `overrideAccess: false`.**
  - Proof: Verified for `services`, `projects`, and all 6 versioned page globals in `tests/int/p2-t8.int.test.ts:1154`–`tests/int/p2-t8.int.test.ts:1359`, `tests/int/p2-t3.int.test.ts:226`, `tests/int/p2-t4.int.test.ts:269`, and `tests/int/p2-t5.int.test.ts:503`.
- [x] **Migration up/down works on a clean DB.**
  - Proof: All 7 migrations in `src/migrations/index.ts:9`–`src/migrations/index.ts:45` run up (`docs/reports/evidence/P2-T8/r1/migrate-up.log`), roll back all 7 down to an empty DB (`docs/reports/evidence/P2-T8/r1/migrate-down.log`), re-apply cleanly (`docs/reports/evidence/P2-T8/r1/migrate-reup.log`), and produce a clean no-op on `migrate:create` (`docs/reports/evidence/P2-T8/r1/migrate-create-noop.log`).

---

### Dependencies added/changed

- None in Phase 2 (`package.json` and `pnpm-lock.yaml` remain on the exact pinned versions from Phase 1; `pnpm audit --prod` reports `No known vulnerabilities found` in `docs/reports/evidence/P2-T8/r1/audit.log`).

---

### Security notes

- **`Z1`–`Z6` (Access Control Baseline)**:
  - `Z1`: Every collection (`users`, `media`, `videos`, `brands`, `stats`, `materials`, `services`, `team`, `projects`, `quote-requests`) and global (`site-settings`, `navigation`, `home-page`, `services-page`, `about-page`, `projects-page`, `contact-page`, `privacy-page`) defines explicit access functions (`src/access/z1-config-enumeration.test.ts:75`, `src/access/z1-config-enumeration.test.ts:99`).
  - `Z2`: Versioned collections (`services`, `projects`) enforce `read: publishedOrLoggedIn` (`src/access/publishedOrLoggedIn.ts:3`, `src/collections/Services.ts:164`, `src/collections/Projects.ts:598`), which returns `{ _status: { equals: 'published' } }` for anonymous callers, and versioned page globals (`home-page`, `services-page`, `about-page`, `projects-page`, `contact-page`, `privacy-page`) combine `read: publishedOrLoggedIn` with `enforcePublishedReadOnGlobalBeforeOperation` (`src/globals/_shared/publishableGlobal.ts:47`) to return the latest published global snapshot when `!req.user`.
  - `Z3`: `Users.fields[role].access` (`src/collections/Users.ts:393`–`src/collections/Users.ts:397`: `read: isAdminOrSelfFieldLevel`, `create: isAdminFieldLevel`, `update: isAdminFieldLevel`), `enforceRoleAndPasswordBeforeValidate` (`src/collections/Users.ts:42`), `preventLastAdminDemotionBeforeChange` (`src/collections/Users.ts:82`), `preventLastAdminBeforeDelete` (`src/collections/Users.ts:117`), `Users.access.unlock: isAdmin` (`src/collections/Users.ts:261`, `R-13`), and `restrictOtherUserFieldsForEditorAfterRead` (`src/collections/Users.ts:202`, `R-11`).
  - `Z4`: `QuoteRequests.access.create: () => false` (`src/collections/QuoteRequests.ts:363`) and `readOnlyFieldAccess` (`src/collections/QuoteRequests.ts:59`) on all customer, `serviceTitle`, and system fields.
  - `Z5`: Verified against real REST route handlers and real JWT sessions in `tests/int/p2-t8.int.test.ts:242` and `tests/int/p2-t8.int.test.ts:1008`.
  - `Z6`: Enforced at lint time by `local/require-override-access-false` (`eslint-rules/require-override-access-false.mjs:117`, `eslint.config.mjs:45`), tested in `src/eslint-require-override-access-false.test.ts:54`.
- **`I2`, `I3`, `I4`, `I5`, `D2`, `S4`, & `R-9` (Input, Upload, Link, & Bundle Hardening)**:
  - `I2`: Lexical rich-text AST allowlist (`validateLimitedLexicalState` at `src/fields/richText.ts:257`, paragraph-only mode and `maxParagraphs` at `src/fields/richText.ts:281`).
  - `I3` & `R-9`: `validateExternalUrl` (`src/fields/link.ts:62`), `validateInternalPath` (`src/fields/link.ts:175`), and `validateLinkGroupBeforeValidate` (`src/fields/link.ts:399`) run on draft, autosave, and publish saves; `getEffectiveAllowedProtocols` (`src/fields/link.ts:21`, called at `src/fields/link.ts:103`) permits `http:` only when `NODE_ENV !== 'production'`, restricting production external links to `https:`, `mailto:`, and `tel:`.
  - `I4`: 6-host video URL allowlist (`ALLOWED_VIDEO_HOSTS` at `src/fields/videoUrl.ts:3`, `parseVideoUrl` at `src/fields/videoUrl.ts:116`, and `ALLOWED_VIDEO_EMBED_HOSTS` / `validateVideoEmbedUrl` at `src/fields/link.ts:133`, `src/fields/link.ts:145`).
  - `I5`: Magic-byte verification and randomized filenames for `videos` (`validateAndSanitizeVideoFile` at `src/security/uploadValidation.ts:271`) and isolated `VIDEO_UPLOAD_TEMP_DIR` (`src/collections/Videos.ts:40`, `src/collections/Videos.ts:106`).
  - `D2` & `S4`: Salted SHA-256 IP hashing (`src/lib/ipHash.ts:49`), pure `zod`-only client quote schema (`src/lib/quote/schema.ts:1`), `local/no-server-in-client` ESLint rule (`eslint-rules/no-server-in-client.mjs:119`), and post-build `.next/static` sentinel scanner (`scripts/check-client-bundle-sentinels.mjs:22`).

---

### Deviations from spec

1. **`P2-T7` (Dashboard UX & Live Preview) moved to Phase 3 (`M-065`, `handoff/tasks/P2-T8.md` lines 6–8, CTO decision)**: Moved to Phase 3 (after `P3-T4`) so Live Preview and admin preview URLs are wired against real rendered frontend routes.
2. **8 Approved Design-Backed Field Additions in `P2-T5` (`handoff/reviews/P2-T5.md` `R-5`, `R-6`)**:
   1. `home-page.whoWeAre.eyebrow` (`src/globals/HomePage.ts:384`) — localized eyebrow label (`design/copy/01-home.md` `17:222`).
   2. `home-page.coreServices.button` (`src/globals/HomePage.ts:446`) — `buttonGroup` for "View All Services" (`design/copy/01-home.md` `17:254`).
   3. `cta.secondaryButton` and `cta.backgroundImage` (`src/fields/groups/cta.ts:116`, `src/fields/groups/cta.ts:128`) — secondary "Call Us Now" button and optional background image in `ctaGroup`.
   4. `about-page.missionVision.mission.eyebrow`, `title`, `image` and `about-page.missionVision.vision.eyebrow`, `title`, `image` (`src/globals/AboutPage.ts:24`, `src/globals/AboutPage.ts:35`, `src/globals/AboutPage.ts:84`, `src/globals/AboutPage.ts:293`) — localized eyebrow/title and optional card image on Mission & Vision cards (`design/copy/03-about-us.md` `108:1576`).
   5. `navigation.headerCta` and `navigation.footerCta` (`src/globals/Navigation.ts:74`, `src/globals/Navigation.ts:172`) — header "Get a Quote" button and footer "Have a project in mind?" CTA block (`design/copy/01-home.md` `18:749`, `18:678`).
   6. `site-settings.copyright` (`src/globals/SiteSettings.ts:294`) — localized copyright line in the footer (`design/copy/01-home.md` `18:678`).
   7. `site-settings.socials[].platform` `'whatsapp'` (`src/globals/SiteSettings.ts:11`) — added `'whatsapp'` to `SOCIAL_PLATFORM_VALUES`.
   8. `home-page.meta` (`src/globals/HomePage.ts:721`) — per-page SEO `seoGroupField()` override on `home-page` matching the other 5 page globals.
3. **`P2-T6` Approved Decisions & Guard Implementation (`handoff/reviews/P2-T6.md` `R-1`, `R-4`, `R-5`, `R-6`, `R-11`, `R-12`, `R-13`)**:
   - `src/lib/ipHash.ts` enforces server-only execution via a runtime `if (typeof window !== 'undefined')` guard (`src/lib/ipHash.ts:17`), the `local/no-server-in-client` ESLint rule (`eslint-rules/no-server-in-client.mjs:17`), and the post-build `.next/static` sentinel check (`src/lib/ipHash.ts:15`, `scripts/check-client-bundle-sentinels.mjs:13`) rather than `import 'server-only'` so the Payload CLI (`tsx`) can load `src/payload.config.ts` outside Next's `"react-server"` export condition (`src/env.ts:8`–`src/env.ts:12`).
   - Added read-only `serviceTitle` snapshot field on `quote-requests` (`src/collections/QuoteRequests.ts:451`, `R-4`).
   - Configured `Users.admin.useAsTitle: 'name'` (`src/collections/Users.ts:245`, `R-5`), staff read access to `id` + `name` of other users (`src/collections/Users.ts:257`, `src/collections/Users.ts:202`, `R-11`), and `Users.access.unlock: isAdmin` (`src/collections/Users.ts:261`, `R-13`).

---

### Questions for CTO

- None. Ready for Phase 2 review and merge into `main`.
