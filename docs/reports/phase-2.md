# Phase 2 Report — Content Model, Access Control Suite (`Z1`–`Z6`), Revalidation, Login Enumeration Hardening (`P2-T9`), & Migrations

## Phase 2 — Content model & editor experience

- **Branch**: `phase-2-content`
- **Code Commits**: `1e63291`, `7052566`, `0718e26` (`0718e26d1db3fd379ed317a9caba6329b3ffe2b5`)
- **Evidence Directories**: `docs/reports/evidence/P2-T8/r3/` & `docs/reports/evidence/P2-T9/r1/` (editor flow screenshots also copied to `docs/reports/phase-2/`)

> **Note on `P2-T7` (`M-065`)**: Per CTO decision on 2026-10-23, `P2-T7` (Dashboard UX & Live Preview wired to frontend routes) was moved to Phase 3 (scheduled after `P3-T4` in `handoff/PLAN.md` so Live Preview is built against real frontend routes). Accordingly, the `"preview it live"` portion of the `docs/04-phases.md` Phase 2 editor flow criterion is marked below as **moved to `P2-T7` in Phase 3 (CTO decision)** (`R-7`).

---

### Done

1. **`P2-T1` — Shared Field Factories, Revalidation Hooks, & Publishable Wrapper**:
   - `slugField` (`src/fields/slug.ts:929`), `slugLockedField` (`src/fields/slug.ts:903`), `slugify` (`src/fields/slug.ts:194`), `transliterateArabic` (`src/fields/slug.ts:165`), `resolveUniqueSlug` (`src/fields/slug.ts:217`), and `validateSlug` (`src/fields/slug.ts:450`), tested in `slugField` (`src/fields/slug.test.ts:53`) and `getPayload` (`tests/int/p2-t1-slug.int.test.ts:86`).
   - `orderField` (`src/fields/order.ts:16`), tested in `orderField` (`src/fields/order.test.ts:6`).
   - `linkField` (`src/fields/link.ts:464`), `validateExternalUrl` (`src/fields/link.ts:62`), `validateInternalPath` (`src/fields/link.ts:175`), `resolveLinkHref` (`src/fields/link.ts:262`), and `validateLinkGroupBeforeValidate` (`src/fields/link.ts:399`) wired into `validateLinkGroupBeforeValidate` (`src/fields/link.ts:589`), plus `getEffectiveAllowedProtocols` (`src/fields/link.ts:21`) called at `getEffectiveAllowedProtocols` (`src/fields/link.ts:103`), tested in `validateExternalUrl` (`src/fields/link.test.ts:40`), `getEffectiveAllowedProtocols` (`src/fields/link.test.ts:321`), and `callJsonApi` (`tests/int/p2-t5.int.test.ts:90`).
   - `videoUrlField` (`src/fields/videoUrl.ts:312`), `parseVideoUrl` (`src/fields/videoUrl.ts:116`), and `toEmbedUrl` (`src/fields/videoUrl.ts:265`), tested in `videoUrlField` (`src/fields/videoUrl.test.ts:20`).
   - `limitedRichTextField` (`src/fields/richText.ts:368`), `allowsRichTextUploads` (`src/fields/richText.ts:473`), `paragraphRichTextField` (`src/fields/richText.ts:500`), and `validateLimitedLexicalState` (`src/fields/richText.ts:257`) with `maxParagraphs` (`src/fields/richText.ts:281`), tested in `limitedRichTextField` (`src/fields/richText.test.ts:9`).
   - `seoGroupField` (`src/fields/seo.ts:71`) providing the localized `meta` group on `services`, `projects`, and all 6 page globals, plus `seoPlugin` (`src/payload.config.ts:2`) registered at `seoPlugin` (`src/payload.config.ts:135`).
   - `withPublishable` (`src/collections/_shared/publishable.ts:29`) and `publishableVersions` (`src/collections/_shared/publishable.ts:5`), tested in `publishableVersions` (`src/collections/_shared/publishable.test.ts:8`).
   - `withImmutableCreatedAt` (`src/collections/_shared/immutableTimestamps.ts:140`), `immutableCreatedAtField` (`src/collections/_shared/immutableTimestamps.ts:34`), `stripCreatedAtOnUpdateBeforeOperation` (`src/collections/_shared/immutableTimestamps.ts:62`), `preserveCreatedAtBeforeValidate` (`src/collections/_shared/immutableTimestamps.ts:87`), and `preserveCreatedAtBeforeChange` (`src/collections/_shared/immutableTimestamps.ts:109`), applied across all 10 collections (`Users` (`src/collections/Users.ts:246`), `Media` (`src/collections/Media.ts:553`), `Videos` (`src/collections/Videos.ts:201`), `Brands` (`src/collections/Brands.ts:42`), `Stats` (`src/collections/Stats.ts:53`), `Materials` (`src/collections/Materials.ts:63`), `Services` (`src/collections/Services.ts:134`), `Team` (`src/collections/Team.ts:80`), `Projects` (`src/collections/Projects.ts:568`), `QuoteRequests` (`src/collections/QuoteRequests.ts:322`)).
   - Revalidation hooks: `buildCollectionTags` (`src/hooks/revalidate.ts:58`), `buildGlobalTags` (`src/hooks/revalidate.ts:81`), `captureMainPublishedDocBeforeChange` (`src/hooks/revalidate.ts:373`), `captureMainPublishedGlobalBeforeChange` (`src/hooks/revalidate.ts:419`), `createRevalidateAfterChangeHook` (`src/hooks/revalidate.ts:648`), `createRevalidateAfterDeleteHook` (`src/hooks/revalidate.ts:700`), and `createRevalidateGlobalAfterChangeHook` (`src/hooks/revalidate.ts:745`), tested in `buildCollectionTags` (`src/hooks/revalidate.test.ts:42`).

2. **`P2-T2` — `videos`, `brands`, `stats`, `materials` Collections & Migration**:
   - `Videos` (`src/collections/Videos.ts:201`) with `validateAndSanitizeVideoFile` (`src/security/uploadValidation.ts:271`), `MAX_VIDEO_FILE_SIZE_BYTES` (`src/security/uploadValidation.ts:21`) wired at `MAX_VIDEO_FILE_SIZE_BYTES` (`src/collections/Videos.ts:124`), `VIDEO_UPLOAD_TEMP_DIR` (`src/collections/Videos.ts:40`) wired at `VIDEO_UPLOAD_TEMP_DIR` (`src/collections/Videos.ts:106`), and `preventVideoDeletionWhenReferenced` (`src/collections/Videos.ts:166`); `Brands` (`src/collections/Brands.ts:42`) with `preventBrandDeletionWhenUsedByMaterials` (`src/collections/Brands.ts:13`); `Stats` (`src/collections/Stats.ts:53`) with `preventStatDeletionWhenReferenced` (`src/collections/Stats.ts:18`); and `Materials` (`src/collections/Materials.ts:63`) with `minRows` (`src/collections/Materials.ts:179`).
   - Migration `20261022_120943_p2_t2_videos_brands_stats_materials` (`src/migrations/index.ts:18`), tested in `callJsonApi` (`tests/int/p2-t2.int.test.ts:30`).

3. **`P2-T3` — `services` & `team` Collections & Migration**:
   - `Services` (`src/collections/Services.ts:134`) with `publishedOrLoggedIn` (`src/collections/Services.ts:164`), `validateServiceBeforeValidate` (`src/collections/Services.ts:78`), and `bodyMediaField` (`src/collections/Services.ts:358`); and `Team` (`src/collections/Team.ts:80`) with `activeOrLoggedIn` (`src/collections/Team.ts:18`) returning `{ active: { equals: true } }` at `active` (`src/collections/Team.ts:23`) and wired at `activeOrLoggedIn` (`src/collections/Team.ts:108`), plus `validateLinkedInUrl` (`src/collections/Team.ts:32`) wired at `validateLinkedInUrl` (`src/collections/Team.ts:289`).
   - Migration `20261022_140011_p2_t3_services_team` (`src/migrations/index.ts:23`), tested in `callJsonApi` (`tests/int/p2-t3.int.test.ts:31`) and `activeMember` (`tests/int/p2-t3.int.test.ts:654`).

4. **`P2-T4` — `projects` Collection, Jobs Autorun Guard, Config-Driven `media` Delete Guard, & Migration**:
   - `Projects` (`src/collections/Projects.ts:568`) with `publishedOrLoggedIn` (`src/collections/Projects.ts:598`), `validateProjectBeforeValidate` (`src/collections/Projects.ts:179`) wired at `validateProjectBeforeValidate` (`src/collections/Projects.ts:604`), `PROJECT_SCOPE_OPTIONS` (`src/collections/Projects.ts:54`), and `revalidateProjectRelatedAndHomeAfterChange` (`src/collections/Projects.ts:405`) wired at `revalidateProjectRelatedAndHomeAfterChange` (`src/collections/Projects.ts:613`).
   - `shouldAutoRunJobs` (`src/jobs/shouldAutoRun.ts:13`) wired in `shouldAutoRunJobs` (`src/payload.config.ts:125`), tested in `shouldAutoRunJobs` (`src/jobs/shouldAutoRun.test.ts:5`).
   - Migration `20261022_160652_p2_t4_projects` (`src/migrations/index.ts:28`), tested in `callJsonApi` (`tests/int/p2-t4.int.test.ts:55`).

5. **`P2-T5` — Reusable Field Groups (`src/fields/groups/`) & All 8 Globals (`src/globals/`)**:
   - Field groups: `buttonGroup` (`src/fields/groups/button.ts:95`), `ctaGroup` (`src/fields/groups/cta.ts:147`), `pageHeaderGroup` (`src/fields/groups/pageHeader.ts:122`), `sectionIntroGroup` (`src/fields/groups/sectionIntro.ts:130`), `pillarGroup` (`src/fields/groups/pillar.ts:55`), and `collapsibleSection` (`src/fields/groups/collapsibleSection.ts:16`), tested in `buttonGroup` (`src/fields/groups/groups.test.ts:17`).
   - Globals (`ALL_GLOBALS` (`src/globals/index.ts:28`)): `SiteSettings` (`src/globals/SiteSettings.ts:349`) with admin-only update `isAdmin` (`src/globals/SiteSettings.ts:364`), `Navigation` (`src/globals/Navigation.ts:224`), `HomePage` (`src/globals/HomePage.ts:227`) with `minRows` (`src/globals/HomePage.ts:471`) and `maxRows` (`src/globals/HomePage.ts:472`), `ServicesPage` (`src/globals/ServicesPage.ts:12`), `AboutPage` (`src/globals/AboutPage.ts:98`), `ProjectsPage` (`src/globals/ProjectsPage.ts:11`), `ContactPage` (`src/globals/ContactPage.ts:10`), and `PrivacyPage` (`src/globals/PrivacyPage.ts:10`).
   - Migration `20261022_221250_p2_t5_globals` (`src/migrations/index.ts:33`), tested in `getCollapsibleGroupNames` (`src/globals/globals.test.ts:114`) and `callJsonApi` (`tests/int/p2-t5.int.test.ts:90`).

6. **`P2-T6` — `quote-requests` Collection, Pure `src/lib/quote/schema.ts`, Client-Bundle Sentinel Guard, `src/lib/ipHash.ts`, `Users.access.unlock: isAdmin` & Disabled `/verify/:id`, Admin Pills/Filter Bar, & Migrations**:
   - Pure phone validator & E.164 normalizer: `normalizeQuotePhone` (`src/lib/quote/schema.ts:27`) and `quotePhoneSchema` (`src/lib/quote/schema.ts:108`), tested in `normalizeQuotePhone` (`src/lib/quote/schema.test.ts:27`).
   - Post-build client-bundle sentinel guard: `FORBIDDEN_CLIENT_BUNDLE_SENTINELS` (`scripts/check-client-bundle-sentinels.mjs:12`), `ENV_SERVER_ONLY_SENTINEL` (`src/env.ts:154`), `IPHASH_SERVER_ONLY_SENTINEL` (`src/lib/ipHash.ts:15`), and `CMS_CLIENT_SERVER_ONLY_SENTINEL` (`src/lib/cms/client.ts:9`), wired in `check-client-bundle-sentinels` (`package.json:13`) and `noServerInClientRule` (`eslint-rules/no-server-in-client.mjs:125`).
   - Salted IP hash helper: `hashIp` (`src/lib/ipHash.ts:49`), tested in `hashIp` (`src/lib/ipHash.test.ts:10`).
   - `QuoteRequests` (`src/collections/QuoteRequests.ts:322`) with `isAdminOrEditor` (`src/collections/QuoteRequests.ts:365`), `readOnlyFieldAccess` (`src/collections/QuoteRequests.ts:59`), `workflowFieldAccess` (`src/collections/QuoteRequests.ts:65`), `serviceTitle` (`src/collections/QuoteRequests.ts:451`), `QuoteStatusPillCell` (`src/components/admin/QuoteStatusPillCell.tsx:75`), `EmailStatusPillCell` (`src/components/admin/EmailStatusPillCell.tsx:55`), `QuoteRequestsFilterBar` (`src/components/admin/QuoteRequestsFilterBar.tsx:17`), `unlock` (`src/collections/Users.ts:279`), and `disableVerifyEmailEndpointHandler` (`src/collections/Users.ts:233`) wired at `disableVerifyEmailEndpointHandler` (`src/collections/Users.ts:303`).
   - Migrations `20261022_231435_p2_t6_quote_requests` (`src/migrations/index.ts:38`) and `20261023_005934_p2_t6_quote_requests_service_title` (`src/migrations/index.ts:43`), tested in `QuoteRequests` (`src/collections/QuoteRequests.test.ts:39`) and `lockedAdmin` (`tests/int/p2-t6.int.test.ts:779`), where `enforceRoleAndPasswordBeforeValidate` (`src/collections/Users.ts:47`) checks `callerRole` (`src/collections/Users.ts:73`) and keeps `admin` in `callerRole` (`src/collections/Users.ts:78`), verified at `lockedAdmin` (`tests/int/p2-t6.int.test.ts:793`).

7. **`P2-T8` (Rounds 1–3) — Access Control Test Suite (`Z1`–`Z6`), Single Whitelisted `Z6` CMS Wrapper (`src/lib/cms/client.ts`), Repo-Wide `payload` Import Ban (`R-12`), Mechanical Citation Checker (`R-13`), Migrations Verification (`R-15`), & Editor Flow Evidence (`R-20`)**:
   - **Scope 1 (`Z1` Config-Enumeration Test — `src/access/z1-config-enumeration.test.ts`)**:
     - `PAYLOAD_DEFAULT_ACCESS_NAMES` (`src/access/z1-config-enumeration.test.ts:41`) (`defaultAccess`, `defaultUnlockAccess`) and `assertExplicitAccessFunction` (`src/access/z1-config-enumeration.test.ts:43`) verify that every collection and global operation (including `unlock` on every auth collection where `Boolean(col.auth)` is true at `assertExplicitAccessFunction` (`src/access/z1-config-enumeration.test.ts:109`)) is an explicit non-default function (`R-19`).
     - `assertCollectionRichTextFieldsHaveBodyMediaSibling` (`src/collections/Media.ts:398`) verifies that every collection `richText` field allowing uploads (`allowsRichTextUploads` (`src/fields/richText.ts:473`)) has a `bodyMedia` sibling targeting `media`, called in `assertCollectionRichTextFieldsHaveBodyMediaSibling` (`src/access/z1-config-enumeration.test.ts:102`) and `assertCollectionRichTextFieldsHaveBodyMediaSibling` (`src/globals/globals.test.ts:438`) (`R-18`).
   - **Scope 2 (`Z5` REST Role Matrix Integration Tests — `tests/int/p2-t8.int.test.ts`)**:
     - Executes real HTTP requests via `callJsonApi` (`tests/int/p2-t8.int.test.ts:50`) against `REST_GET` (`tests/int/p2-t8.int.test.ts:185`) across all 10 collections (including all 12 cells of `usersOtherRow` (`tests/int/p2-t8.int.test.ts:478`) starting at `usersOtherAnonRead` (`tests/int/p2-t8.int.test.ts:388`) per `R-4`) and all 8 globals, plus `Z2` draft isolation across `services`, `projects`, and all 6 `versionedPageGlobalCases` (`tests/int/p2-t8.int.test.ts:1401`), `Z3` role escalation prevention and `adminPromotesEditor` (`tests/int/p2-t8.int.test.ts:1573`) / `adminRestoresEditor` (`tests/int/p2-t8.int.test.ts:1584`), and `R-11` runtime option smuggling defense at `smuggledUsersOpts` (`tests/int/p2-t8.int.test.ts:1754`).
   - **Scope 3 (`Z6` Repo-Wide Import Ban, Whitelisted CMS Wrapper `src/lib/cms/client.ts`, & Call-Site Lint Rule — `R-6`, `R-11`, `R-12`)**:
     - **Layer 1 (Repo-wide `payload` import & re-export ban — `R-12`)**: `SERVER_PAYLOAD_IMPORT_ALLOWLIST_GLOBS` (`eslint.config.mjs:8`) and `RESTRICTED_PAYLOAD_IMPORTS_CONFIG` (`eslint.config.mjs:29`) are enforced across all `.ts`/`.tsx`/`.js`/`.jsx`/`.mjs`/`.cjs` files via `RESTRICTED_PAYLOAD_IMPORTS_CONFIG` (`eslint.config.mjs:89`) and `no-restricted-imports` (`eslint.config.mjs:117`), and via `isAllowedPayloadServerFile` (`eslint-rules/require-override-access-false.mjs:55`) and `isForbiddenPayloadModuleSource` (`eslint-rules/require-override-access-false.mjs:115`) across `ImportDeclaration`, `ExportNamedDeclaration` (`eslint-rules/require-override-access-false.mjs:400`), `ExportAllDeclaration` (`eslint-rules/require-override-access-false.mjs:404`), dynamic `import()`, and `require()`.
     - **Layer 2 (Single whitelisted wrapper `src/lib/cms/client.ts` — `R-11`, `R-12`)**: `SAFE_CMS_QUERY_WHITELIST_KEYS` (`src/lib/cms/client.ts:21`) and `SAFE_CMS_COUNT_WHITELIST_KEYS` (`src/lib/cms/client.ts:39`) define the exact allowed keys; `buildSafeCmsQueryArgs` (`src/lib/cms/client.ts:180`) and `buildSafeCmsCountArgs` (`src/lib/cms/client.ts:201`) copy **only** whitelisted keys and attach `overrideAccess: false` unconditionally (and `draft` from `resolvePublicDraftFlag` (`src/lib/cms/client.ts:160`)) in `cmsFind` (`src/lib/cms/client.ts:221`), `cmsFindByID` (`src/lib/cms/client.ts:239`), `cmsFindGlobal` (`src/lib/cms/client.ts:261`), and `cmsCount` (`src/lib/cms/client.ts:278`). `noServerInClientRule` (`eslint-rules/no-server-in-client.mjs:125`) bans `@/lib/cms` in `'use client'` files, and `FORBIDDEN_CLIENT_BUNDLE_SENTINELS` (`scripts/check-client-bundle-sentinels.mjs:12`) scans `.next/static` for `CMS_CLIENT_SERVER_ONLY_SENTINEL` (`src/lib/cms/client.ts:9`).
     - **Layer 3 (Call-site ESLint rule `local/require-override-access-false`)**: `GUARDED_PAYLOAD_METHODS` (`eslint-rules/require-override-access-false.mjs:25`), `JUSTIFICATION_COMMENT_REGEX` (`eslint-rules/require-override-access-false.mjs:46`), `inspectOptionsObject` (`eslint-rules/require-override-access-false.mjs:221`), and `requireOverrideAccessFalseRule` (`eslint-rules/require-override-access-false.mjs:294`), tested in `requireOverrideAccessFalseRule` (`src/eslint-require-override-access-false.test.ts:33`) and `buildSafeCmsQueryArgs` (`src/eslint-require-override-access-false.test.ts:191`).

8. **`P2-T9` — Login Enumeration Hardening (Timing Oracle + Locked-Account Message Oracle)**:
   - `PAYLOAD_PBKDF2_ITERATIONS` (`src/security/loginEnumeration.ts:14`), `DUMMY_PBKDF2_SALT_HEX` (`src/security/loginEnumeration.ts:23`), `isUserCurrentlyLocked` (`src/security/loginEnumeration.ts:39`), `runDummyPayloadPasswordHash` (`src/security/loginEnumeration.ts:60`), `createGenericAuthenticationError` (`src/security/loginEnumeration.ts:87`), `hardenLoginEnumerationBeforeOperation` (`src/security/loginEnumeration.ts:108`) wired into `beforeOperation` (`src/collections/Users.ts:358`), and `maskLockedAuthAfterError` (`src/security/loginEnumeration.ts:152`) wired into `afterError` (`src/collections/Users.ts:363`).
   - Tested in `src/security/loginEnumeration.test.ts` (`hardenLoginEnumerationBeforeOperation` (`src/security/loginEnumeration.test.ts:50`)), `tests/int/p2-t9.int.test.ts` (`unknownAr` (`tests/int/p2-t9.int.test.ts:113`), `afterAttempt5` (`tests/int/p2-t9.int.test.ts:175`), `loginAfterLockWindow` (`tests/int/p2-t9.int.test.ts:251`)), and measured against `next start` in `scripts/measure-login-timing.mjs` (`SAMPLES` (`scripts/measure-login-timing.mjs:29`), `THRESHOLD_PERCENT` (`scripts/measure-login-timing.mjs:31`), output in `docs/reports/evidence/P2-T9/r1/login-timing.log`).

---

### Evidence

All fresh-clone Definition of Done logs (`install.log`, `lint.log`, `typecheck.log`, `format-check.log`, `audit.log`, `limits.log`, `npm-metadata.log`, `migrate-up.log`, `migrate-down.log`, `migrate-fresh.log`, `migrate-noop-check.log`, `migrate-up-down-up.log`, `test.log`, `build.log`, `login-timing.log`, `citations.log`, `citations-check.log`) and the 4 editor flow screenshots (`editor-flow-1-create-ar-draft.png`, `editor-flow-2-add-en-draft.png`, `editor-flow-3-published-ar.png`, `editor-flow-4-account-editor-role-ar.png`) are committed in `docs/reports/evidence/P2-T8/r3/` and `docs/reports/evidence/P2-T9/r1/` (and the screenshots are also in `docs/reports/phase-2/`).

- **Explicit ANSI Strip Disclosure**: All `.log` files in `docs/reports/evidence/P2-T8/r3/` and `docs/reports/evidence/P2-T9/r1/` were recorded in the fresh clone `C:\Users\User21.CSE\AppData\Local\Temp\jazira-dod-p2t8r3-1792746996` at `HEAD: 0718e26d1db3fd379ed317a9caba6329b3ffe2b5` with `NO_COLOR=1 FORCE_COLOR=0`, UTF-8 without BOM (`hasBom=False`), and CSI/DEC escape sequences stripped (`hasEsc=False`).

#### 1. `Z5` REST Role Matrix Tables (`docs/reports/evidence/P2-T8/r3/test.log`)

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

#### 2. Complete Global Revalidation Table (`R-6` — Verified Against `createRevalidateGlobalAfterChangeHook` (`src/hooks/revalidate.ts:745`) & `src/globals/*.ts`)

| Global Slug | Publishable? | Invalidated Cache Tags | Invalidated Paths (`ar` & `en`) | When Triggered |
|---|---|---|---|---|
| `site-settings` | No (always live) | `global:site-settings`, `global:site-settings:ar`, `global:site-settings:en` | All **12** localized public pages (`/ar`, `/ar/services`, `/ar/about`, `/ar/projects`, `/ar/contact`, `/ar/privacy`, `/en`, `/en/services`, `/en/about`, `/en/projects`, `/en/contact`, `/en/privacy` via `ALL_PUBLIC_LOCALIZED_PATHS` (`src/globals/SiteSettings.ts:24`) and `localizedPaths` (`src/globals/SiteSettings.ts:373`)) **plus** the root layout in both locales (`revalidatePath('/ar', 'layout')` and `revalidatePath('/en', 'layout')` via `layoutPaths` (`src/globals/SiteSettings.ts:374`)) | Every update |
| `navigation` | No (always live) | `global:navigation`, `global:navigation:ar`, `global:navigation:en` | All **12** localized public pages (`/ar`, `/ar/services`, `/ar/about`, `/ar/projects`, `/ar/contact`, `/ar/privacy`, `/en`, `/en/services`, `/en/about`, `/en/projects`, `/en/contact`, `/en/privacy` via `ALL_PUBLIC_LOCALIZED_PATHS` (`src/globals/Navigation.ts:12`) and `localizedPaths` (`src/globals/Navigation.ts:246`)) **plus** the root layout in both locales (`revalidatePath('/ar', 'layout')` and `revalidatePath('/en', 'layout')` via `layoutPaths` (`src/globals/Navigation.ts:247`)) | Every update |
| `home-page` | Yes (`drafts` + `schedulePublish`) | `global:home-page`, `global:home-page:ar`, `global:home-page:en` | `/ar`, `/en` (page scope via `localizedPaths` (`src/globals/HomePage.ts:246`)) | Only when published or unpublished (`_status === 'published'` or `wasPublished`) |
| `services-page` | Yes (`drafts` + `schedulePublish`) | `global:services-page`, `global:services-page:ar`, `global:services-page:en` | `/ar/services`, `/en/services` (page scope via `localizedPaths` (`src/globals/ServicesPage.ts:30`)) | Only when published or unpublished |
| `about-page` | Yes (`drafts` + `schedulePublish`) | `global:about-page`, `global:about-page:ar`, `global:about-page:en` | `/ar/about`, `/en/about` (page scope via `localizedPaths` (`src/globals/AboutPage.ts:116`)) | Only when published or unpublished |
| `projects-page` | Yes (`drafts` + `schedulePublish`) | `global:projects-page`, `global:projects-page:ar`, `global:projects-page:en`, `collection:projects`, `collection:projects:ar`, `collection:projects:en` (`extraTags` (`src/globals/ProjectsPage.ts:31`)) | `/ar/projects`, `/en/projects` (page scope via `localizedPaths` (`src/globals/ProjectsPage.ts:29`) + `layout` scope via `layoutPaths` (`src/globals/ProjectsPage.ts:30`), covering project detail pages sharing `projects-page.cta`) | Only when published or unpublished |
| `contact-page` | Yes (`drafts` + `schedulePublish`) | `global:contact-page`, `global:contact-page:ar`, `global:contact-page:en` | `/ar/contact`, `/en/contact` (page scope via `localizedPaths` (`src/globals/ContactPage.ts:28`)) | Only when published or unpublished |
| `privacy-page` | Yes (`drafts` + `schedulePublish`) | `global:privacy-page`, `global:privacy-page:ar`, `global:privacy-page:en` | `/ar/privacy`, `/en/privacy` (page scope via `localizedPaths` (`src/globals/PrivacyPage.ts:28`)) | Only when published or unpublished |

#### 3. Verbatim `limits.log` Generated by `pnpm limits` (`generateLimitsLogLines` (`scripts/print-limits.ts:58`), `limits` (`package.json:24`), `docs/reports/evidence/P2-T8/r3/limits.log`)
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

#### 4. Command Outputs (`docs/reports/evidence/P2-T8/r3/` & `docs/reports/evidence/P2-T9/r1/`)
- **`dod-timing.log`** (`M-100`):
  - Fresh clone `C:\Users\User21.CSE\AppData\Local\Temp\jazira-dod-p2t8r3-clean-1792761195` at `HEAD: 0718e26d1db3fd379ed317a9caba6329b3ffe2b5`; total wall time `612.6s` (`612598 ms`) across all 16 timeout-enforced steps (`git-clone`: `4.52s`, `pnpm-install`: `161.86s`, `pnpm-lint`: `37.35s`, `pnpm-typecheck`: `15.85s`, `pnpm-format-check`: `5.04s`, `pnpm-audit`: `1.76s`, `pnpm-limits`: `15.54s`, `npm-metadata`: `2.47s`, `migrate-up`: `18.09s`, `migrate-down-x7`: `55.45s`, `migrate-reup-and-fresh`: `25.78s`, `migrate-create-noop`: `5.97s`, `pnpm-test`: `168.12s`, `pnpm-build`: `64.35s`, `login-timing`: `27.1s`, `git-rev-parse-head`: `0.19s`).
- **`lint.log`**, **`typecheck.log`**, **`format-check.log`**, **`audit.log`**:
  - `pnpm lint`: exit `0`.
  - `pnpm typecheck` (`tsc --noEmit`): exit `0`.
  - `pnpm format:check`: `All matched files use Prettier code style!` (exit `0`).
  - `pnpm audit --prod`: `No known vulnerabilities found` (exit `0`).
- **`migrate-up-down-up.log`**, **`migrate-fresh.log`**, **`migrate-up.log`**, **`migrate-down.log`**, **`migrate-noop-check.log`** (`R-8`, `R-15`, `M-099`, `M-100`):
  - All 7 committed migrations (`migrations` (`src/migrations/index.ts:9`)) apply cleanly on an empty PostgreSQL 18 database (`aljazira_dev` in `migrate-up.log`), roll back all 7 individual batches (`Batch 7`..`Batch 1`) down to `database_name = aljazira_dev` with `user_table_count = 0` and `enum_count = 0` verified by SQL (`migrate-down.log`), re-apply cleanly and pass `echo y| pnpm payload migrate:fresh` (`migrate-fresh.log`), and `echo n| pnpm payload migrate:create noop_check` exits `0` in `5.97s` with `√ No schema changes detected. Would you like to create a blank migration file? ... no` (`migrate-noop-check.log`).
- **`test.log`** (`R-16`):
  - `37 passed (37)` test files, `197 passed (197)` unit + integration tests (`pnpm test --reporter=verbose --no-color`, 1,667 lines).
- **`build.log`**:
  - `next build && node scripts/check-client-bundle-sentinels.mjs` (`check-client-bundle-sentinels` (`package.json:13`)) compiles cleanly with zero errors and verifies that no server-only sentinel (`FORBIDDEN_CLIENT_BUNDLE_SENTINELS` (`scripts/check-client-bundle-sentinels.mjs:12`)) is present in `.next/static`.
- **`login-timing.log`** (`P2-T9`):
  - `node scripts/measure-login-timing.mjs` against `next start` (20 interleaved samples per category after 3 warmup rounds): `unknown_email` median `266.88 ms`, `existing_wrong_password` median `277.85 ms`, `locked_account` median `275.16 ms`, overall median `274.10 ms`, maximum pairwise median difference `10.97 ms` (`4.00%` < `15.0%` threshold), and all 60 responses return HTTP `401` with the byte-identical JSON body.

#### 5. Editor Flow & Admin Screenshots (`docs/reports/evidence/P2-T8/r3/` & `docs/reports/phase-2/`, `R-2`, `R-20`)
- `docs/reports/evidence/P2-T8/r3/editor-flow-1-create-ar-draft.png` (`docs/reports/phase-2/editor-flow-1-create-ar-draft.png`): Proves an editor can create and save an Arabic (`ar`, RTL) project draft (`مشروع الأنظمة الكهروميكانيكية — أبراج المقام بمكة المكرمة`, `الحالة: مسودة`).
- `docs/reports/evidence/P2-T8/r3/editor-flow-2-add-en-draft.png` (`docs/reports/phase-2/editor-flow-2-add-en-draft.png`): Proves switching the content locale to English (`en`) and saving the English project draft (`MEP Systems Execution — Al Maqam Towers (Makkah)`) updates the unlocked slug to `mep-systems-execution-al-maqam-towers-makkah` while keeping draft status (`الحالة: مسودة`).
- `docs/reports/evidence/P2-T8/r3/editor-flow-3-published-ar.png` (`docs/reports/phase-2/editor-flow-3-published-ar.png`): Proves publishing the project in Arabic (`ar`, RTL) transitions the status to `الحالة: تم النشر` and locks the slug `mep-systems-execution-al-maqam-towers-makkah`.
- `docs/reports/evidence/P2-T8/r3/editor-flow-4-account-editor-role-ar.png` (`docs/reports/phase-2/editor-flow-4-account-editor-role-ar.png`): Proves on `/admin/account` that the logged-in staff account (`editor-r20@aljazira.co`, `م. سعد المالكي (محرر المبيعات)`) has the disabled `الدور` (`role`) field set to `محرر` (`editor`) (`R-20`).

---

### Acceptance criteria

- [x] **Every collection/global has explicit access (`Z1`) — a test enumerates the config and fails if any operation is missing.**
  - Proof: `assertExplicitAccessFunction` (`src/access/z1-config-enumeration.test.ts:43`) and `PAYLOAD_DEFAULT_ACCESS_NAMES` (`src/access/z1-config-enumeration.test.ts:41`) enumerate all 10 application collections and all 8 globals in both raw and built configs via the config loop, verifying explicit non-default access functions for `read`/`create`/`update`/`delete` (plus `unlock` on every auth collection where `Boolean(col.auth)` is true at `assertExplicitAccessFunction` (`src/access/z1-config-enumeration.test.ts:109`)).
- [x] **`Z2`–`Z6` integration tests pass (`anonymous` / `editor` / `admin`).**
  - Proof: `callJsonApi` (`tests/int/p2-t8.int.test.ts:50`), `usersOtherRow` (`tests/int/p2-t8.int.test.ts:478`), `versionedPageGlobalCases` (`tests/int/p2-t8.int.test.ts:1401`), `adminPromotesEditor` (`tests/int/p2-t8.int.test.ts:1573`), `smuggledUsersOpts` (`tests/int/p2-t8.int.test.ts:1754`), and `requireOverrideAccessFalseRule` (`src/eslint-require-override-access-false.test.ts:33`) all pass in `docs/reports/evidence/P2-T8/r3/test.log`.
- [x] **Editor can create a project in Arabic, add English, save draft, publish it (recorded as screenshots); "preview it live" is moved to `P2-T7` in Phase 3 (CTO decision) (`R-7`).**
  - Proof: Create Arabic draft (`docs/reports/evidence/P2-T8/r3/editor-flow-1-create-ar-draft.png`), add English draft (`docs/reports/evidence/P2-T8/r3/editor-flow-2-add-en-draft.png`), publish in Arabic (`docs/reports/evidence/P2-T8/r3/editor-flow-3-published-ar.png`), and editor account role proof (`docs/reports/evidence/P2-T8/r3/editor-flow-4-account-editor-role-ar.png`); `"preview it live"` is moved to `P2-T7` in Phase 3 per CTO decision (`M-065`, `R-7`).
- [x] **Drafts are never returned to anonymous REST or Local API calls with `overrideAccess: false`.**
  - Proof: Verified for `services`, `projects`, and all 6 versioned page globals in `versionedPageGlobalCases` (`tests/int/p2-t8.int.test.ts:1401`) and `smuggledProjectFindOpts` (`tests/int/p2-t8.int.test.ts:1781`).
- [x] **Migration up/down works on a clean DB.**
  - Proof: All 7 migrations in `migrations` (`src/migrations/index.ts:9`) run up (`docs/reports/evidence/P2-T8/r3/migrate-up.log`), roll back all 7 in individual batches `7..1` down to `user_table_count = 0` and `enum_count = 0` (`docs/reports/evidence/P2-T8/r3/migrate-down.log`), re-apply cleanly and pass `migrate:fresh` (`docs/reports/evidence/P2-T8/r3/migrate-fresh.log`), and produce a clean no-op on `migrate:create` (`docs/reports/evidence/P2-T8/r3/migrate-noop-check.log`).

---

### Dependencies added/changed (`R-1`, `R-17` — Verified in `docs/reports/evidence/P2-T8/r3/npm-metadata.log`)

1. `@payloadcms/plugin-seo` via `plugin-seo` (`package.json:31`) (pinned at `3.91.0`, added in `4db27b4`):
   - **Name & Exact Version**: `@payloadcms/plugin-seo@3.91.0`
   - **Weekly Downloads (`api.npmjs.org/downloads/point/last-week/@payloadcms%2Fplugin-seo`, `2026-10-12` to `2026-10-18`)**: `169,689` downloads/week (`docs/reports/evidence/P2-T8/r3/npm-metadata.log`).
   - **Publish Date (`registry.npmjs.org/@payloadcms%2Fplugin-seo`)**: `3.91.0` published `2026-10-15T20:21:08.442Z` (latest `3.92.0` published `2026-10-22T16:22:45.099Z`, `docs/reports/evidence/P2-T8/r3/npm-metadata.log`).
   - **Why it is needed**: Explicitly required by `docs/01-architecture.md` §1 and `docs/04-phases.md` Phase 2; registered via `seoPlugin` (`src/payload.config.ts:135`) while localized `meta` fields with exact character caps (`160`/`320`) are defined via `seoGroupField` (`src/fields/seo.ts:71`).
   - **What was considered instead**: Using only custom fields without installing `@payloadcms/plugin-seo` was rejected because `docs/01-architecture.md` pins `@payloadcms/plugin-seo` at `3.91.0` in the stack table.
2. `dompurify` (`package.json:59`) (pinned at `3.4.17` in `pnpm.overrides`, updated from `3.4.16` to `3.4.17` in `9fb4516`):
   - **Name & Exact Version**: `dompurify@3.4.17`
   - **Weekly Downloads (`api.npmjs.org/downloads/point/last-week/dompurify`, `2026-10-12` to `2026-10-18`)**: `42,123,483` downloads/week (`docs/reports/evidence/P2-T8/r3/npm-metadata.log`).
   - **Publish Date (`registry.npmjs.org/dompurify`)**: `3.4.17` published `2026-10-12T12:41:28.880Z` (`3.3.3` published `2026-03-11T08:31:17.200Z`, `docs/reports/evidence/P2-T8/r3/npm-metadata.log`).
   - **Why it is needed**: Security patch bump on the transitive `dompurify` override (`@payloadcms/richtext-lexical` dependency) to keep `pnpm audit --prod` at 0 vulnerabilities.
   - **What was considered instead**: Keeping `dompurify` at `3.4.16` was rejected because `3.4.17` is the latest patched `3.4.x` release.

---

### Security notes

- **`Z1`–`Z6` (Access Control Baseline)**:
  - `Z1`: Every collection and global defines explicit non-default access functions, verified by `assertExplicitAccessFunction` (`src/access/z1-config-enumeration.test.ts:43`).
  - `Z2`: Versioned collections (`services`, `projects`) enforce `publishedOrLoggedIn` (`src/access/publishedOrLoggedIn.ts:3`), and versioned page globals combine `publishedOrLoggedIn` with `enforcePublishedReadOnGlobalBeforeOperation` (`src/globals/_shared/publishableGlobal.ts:47`).
  - `Z3`: `isAdminOrSelfFieldLevel` (`src/collections/Users.ts:418`), `isAdminFieldLevel` (`src/collections/Users.ts:419`), `enforceRoleAndPasswordBeforeValidate` (`src/collections/Users.ts:47`), `preventLastAdminDemotionBeforeChange` (`src/collections/Users.ts:87`), `preventLastAdminBeforeDelete` (`src/collections/Users.ts:122`), `unlock` (`src/collections/Users.ts:279`), `disableVerifyEmailEndpointHandler` (`src/collections/Users.ts:233`), and `restrictOtherUserFieldsForEditorAfterRead` (`src/collections/Users.ts:207`).
  - `Z4`: `QuoteRequests` (`src/collections/QuoteRequests.ts:322`) sets `create: () => false` alongside `isAdminOrEditor` (`src/collections/QuoteRequests.ts:365`) and enforces `readOnlyFieldAccess` (`src/collections/QuoteRequests.ts:59`) on all customer, `serviceTitle`, and system fields.
  - `Z5`: Verified against real REST route handlers and real JWT sessions in `callJsonApi` (`tests/int/p2-t8.int.test.ts:50`).
  - `Z6` (`R-6`, `R-11`, `R-12`): Enforced by three layers: (1) repo-wide import & re-export ban on `'payload'`, `'payload/*'`, `'@payload-config'`, `'@/payload.config'`, and `getPayload` outside `SERVER_PAYLOAD_IMPORT_ALLOWLIST_GLOBS` (`eslint.config.mjs:8`) via `RESTRICTED_PAYLOAD_IMPORTS_CONFIG` (`eslint.config.mjs:29`) and `isAllowedPayloadServerFile` (`eslint-rules/require-override-access-false.mjs:55`); (2) the single whitelisted wrapper `src/lib/cms/client.ts` (`SAFE_CMS_QUERY_WHITELIST_KEYS` (`src/lib/cms/client.ts:21`), `SAFE_CMS_COUNT_WHITELIST_KEYS` (`src/lib/cms/client.ts:39`), `buildSafeCmsQueryArgs` (`src/lib/cms/client.ts:180`), `buildSafeCmsCountArgs` (`src/lib/cms/client.ts:201`)); and (3) call-site inspection in `requireOverrideAccessFalseRule` (`eslint-rules/require-override-access-false.mjs:294`).
- **`A1` & `A5` Spirit (`P2-T9` Login Enumeration Hardening)**:
  - `hardenLoginEnumerationBeforeOperation` (`src/security/loginEnumeration.ts:108`) and `maskLockedAuthAfterError` (`src/security/loginEnumeration.ts:152`) run 600,000-iteration PBKDF2-SHA256 via `runDummyPayloadPasswordHash` (`src/security/loginEnumeration.ts:60`) on unknown and locked accounts and return identical `401` JSON responses (`docs/reports/evidence/P2-T9/r1/login-timing.log`).
- **`I2`, `I3`, `I4`, `I5`, `D2`, `S4`, `R-9`, `R-10`, & `R-18`**:
  - `I2` & `R-18`: `validateLimitedLexicalState` (`src/fields/richText.ts:257`) and `assertCollectionRichTextFieldsHaveBodyMediaSibling` (`src/collections/Media.ts:398`).
  - `I3` & `R-9`: `validateExternalUrl` (`src/fields/link.ts:62`), `validateInternalPath` (`src/fields/link.ts:175`), `validateLinkGroupBeforeValidate` (`src/fields/link.ts:399`), and `getEffectiveAllowedProtocols` (`src/fields/link.ts:21`).
  - `I4`: `ALLOWED_VIDEO_HOSTS` (`src/fields/videoUrl.ts:3`), `parseVideoUrl` (`src/fields/videoUrl.ts:116`), and `ALLOWED_VIDEO_EMBED_HOSTS` (`src/fields/link.ts:133`).
  - `I5` & `R-10`: `validateAndSanitizeVideoFile` (`src/security/uploadValidation.ts:271`), `VIDEO_UPLOAD_TEMP_DIR` (`src/collections/Videos.ts:40`), and fail-closed `findCollectionTargetReferences` (`src/collections/Media.ts:469`).
  - `D2` & `S4`: `hashIp` (`src/lib/ipHash.ts:49`), `noServerInClientRule` (`eslint-rules/no-server-in-client.mjs:125`), and `FORBIDDEN_CLIENT_BUNDLE_SENTINELS` (`scripts/check-client-bundle-sentinels.mjs:12`).

---

### Deviations from spec

1. **No Odoo Integration — Replaced by `quote-requests` Workflow & Email Notifications (`62ad56c`, owner & CTO decision 2026-10-23, `R-8`)**: Per owner decision on 2026-10-23, the Odoo integration (`P5-T3`) was removed; `QuoteRequests` (`src/collections/QuoteRequests.ts:322`) uses the dashboard workflow fields (`status`, `assignedTo`, `internalNotes`) and email notification tracking fields (`emailStatus`, `emailAttempts`, `emailLastError`).
2. **`P2-T7` (Dashboard UX & Live Preview) moved to Phase 3 (`M-065`, CTO decision, `R-7`)**: Moved to Phase 3 (after `P3-T4`) so Live Preview and admin preview URLs are wired against real rendered frontend routes.
3. **8 Approved Design-Backed Field Additions in `P2-T5` (`R-5`, `R-6`)**:
   1. `eyebrow` (`src/globals/HomePage.ts:384`) in `home-page.whoWeAre` — localized eyebrow label.
   2. `buttonGroup` (`src/globals/HomePage.ts:446`) in `home-page.coreServices` — button for "View All Services".
   3. `secondaryButton` (`src/fields/groups/cta.ts:116`) and `backgroundImage` (`src/fields/groups/cta.ts:128`) in `ctaGroup`.
   4. `eyebrow` (`src/globals/AboutPage.ts:24`), `title` (`src/globals/AboutPage.ts:35`), `image` (`src/globals/AboutPage.ts:84`), and section `image` (`src/globals/AboutPage.ts:293`).
   5. `headerCta` (`src/globals/Navigation.ts:74`) and `footerCta` (`src/globals/Navigation.ts:172`) in `Navigation`.
   6. `copyright` (`src/globals/SiteSettings.ts:294`) in `SiteSettings`.
   7. `whatsapp` (`src/globals/SiteSettings.ts:19`) in `SOCIAL_PLATFORM_VALUES`.
   8. `seoGroupField` (`src/globals/HomePage.ts:721`) in `HomePage`.
4. **`P2-T6` Approved Decisions & Guard Implementation**:
   - `hashIp` (`src/lib/ipHash.ts:49`) enforces server-only execution via `window` (`src/lib/ipHash.ts:17`), `noServerInClientRule` (`eslint-rules/no-server-in-client.mjs:125`), and `IPHASH_SERVER_ONLY_SENTINEL` (`src/lib/ipHash.ts:15`).
   - Added read-only `serviceTitle` (`src/collections/QuoteRequests.ts:451`) snapshot field on `quote-requests`.
   - Configured `useAsTitle` (`src/collections/Users.ts:263`), `isAdminOrEditor` (`src/collections/Users.ts:275`), `restrictOtherUserFieldsForEditorAfterRead` (`src/collections/Users.ts:207`), `unlock` (`src/collections/Users.ts:279`), and `disableVerifyEmailEndpointHandler` (`src/collections/Users.ts:233`).

---

### Questions for CTO

- None.
