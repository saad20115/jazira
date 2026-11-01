# D — Back-end, CMS schema, data & migrations audit — snapshot 0c4005b

## Coverage
- **Read in full:**
  - `src/payload.config.ts`;
  - `src/lib/cms/{client,collections,globals,index,tags}.ts`;
  - `src/hooks/revalidate.ts`;
  - `src/collections/Projects.ts`, `Services.ts` (config part), `_shared/publishable.ts`, `_shared/immutableTimestamps.ts`;
  - `src/globals/_shared/publishableGlobal.ts`, `src/globals/index.ts`, `HomePage.ts` (hooks + field list), `SiteSettings.ts` (fields + hooks);
  - `src/fields/order.ts`, `seo.ts`, `slug.ts` (state + hook + factory);
  - `src/jobs/shouldAutoRun.ts`;
  - `src/seed/p4-t2.ts` (lines 1–1540 and 2345–2470), `src/seed/p4-t2-data.ts` (lines 1–800 and 924–999);
  - `scripts/seed.ts`.
- **Read in part (fields, access, hooks):**
  - `Media.ts`, `Videos.ts`, `Brands.ts`, `Stats.ts`, `Materials.ts`, `Team.ts`, `Users.ts`, `QuoteRequests.ts`;
  - `src/fields/richText.ts` (`bodyMediaField`, feature list);
  - `src/seed/materials.ts` (environment guard, typo map, `SEED_ADMIN_USER`).
- **Migrations:**
  - all ten `.ts` files, at least their `up`/`down` headers;
  - the `p2_t6`, `p2_t6_service_title`, `p3_t4_r2`, `p3_t12` and `p4_t2` files in full;
  - the latest JSON snapshot (`20261025_002404_*.json`), parsed for column, null and default checks;
  - `git log` of every migration, compared with the acceptance commits of `BOARD.md` and the reviews (P2-T4 `fa3375d`, P3-T4 `1047b1c`, P3-T12 `13ee7b5`).
- **Data:**
  - `seed/projects.raw.json` (91 rows), parsed and cross-checked against the seed's maps, the featured refs and the photo manifest;
  - `seed/images/projects/manifest.json`;
  - `seed/materials.raw.json` (grep);
  - `docs/content/company-facts.md`, `docs/content/copy-v2/01-home.md`, `design/copy/*.md` (grep);
  - `handoff/tasks/P4-T2.md`;
  - commit `9535922`.
- **Skipped:**
  - the `src/access/*` helpers, `security/*` and the auth hardening internals, which are in other auditors' areas;
  - most migration JSON snapshots other than the latest;
  - the tests (only grepped to see which assertions exist);
  - the `globals/AboutPage|ServicesPage|ProjectsPage|ContactPage|PrivacyPage.ts` field bodies, beyond grepping for factory use and revalidation config.

## Findings

### D-01 [major · confirmed] The seed writes owner-rejected claims into **live** content (navigation, stats), and owner-rejected names into drafts
- **Where:**
  - `src/seed/p4-t2.ts:1336` and `:1381` (`navigation.footerCta.text`, EN and AR);
  - `src/seed/p4-t2-data.ts:225-231` (`stats` "100+ / Completed Projects");
  - `src/seed/p4-t2.ts:1848`, `:1853`, `:2040` (about-page draft).
  - Rendered site-wide: `src/app/(frontend)/[locale]/layout.tsx:333-339` reads `navigation.footerCta`.
- **Code:**
  - `text: 'Send us your drawings or BOQ and our engineers will get back to you within one working day.'`
  - `value: '100+', labelEn: 'Completed Projects'`
  - `quoteAuthor: 'Mr. Rashwan Mahmoud — Founder'`
  - `'(formerly known as IMDAD Group)'`
- **Problem:**
  - `docs/content/company-facts.md` §7 records the owner's answers of 2026-10-24:
    - "Email … **No** reply-time promise ('within one working day' is removed)" (line 97);
    - "Founder's name: **no**. 'Formerly IMDAD Group': **not used**" (line 94);
    - "90+ projects and 100+ buildings" (line 92).
  - `copy-v2/01-home.md:55,83` already applies these: "100+ Buildings Delivered" and the reply-time sentence without the promise.
  - `navigation` and `stats` have no drafts, so the seed publishes these strings the moment it runs.
  - There are 91 real projects, so "100+ Completed Projects" is false.
  - The P4-T2 card says "use `design/copy/` until copy-v2 is approved" only for the **home** copy (scope 4c). The footer and stats are not covered by that exception, and the owner's answers override the old Figma copy.
  - Related, suspected:
    - `site-settings.defaultSeo.image` and `office.mapImage` are set to the `hero-city` design image. That image's alt is `'[placeholder] Modern Gulf city skyline…'` (`p4-t2-data.ts:946-948`, `p4-t2.ts:1251,1262`).
    - `site-settings` is live, so the `[placeholder]` alt text can reach public OG and contact markup.
    - **Check:** render `/en` after the seed and grep the HTML for `[placeholder]`.
- **Impact:** a reply-time promise the owner removed, and an inflated project count, appear on every public page right after `pnpm seed`. The about-page draft would publish the founder's name the owner refused.
- **Fix:**
  - take the footer CTA text and the stat label from `docs/content/copy-v2/01-home.md` (or remove the promise);
  - seed the stat as "90+ / Completed Projects", or "100+ / Buildings Delivered", as copy-v2 does;
  - remove the founder's name and "formerly IMDAD Group" from the about-page seed;
  - do not point live `site-settings` media at `[placeholder]` assets;
  - add a seed test that greps all live, non-publishable seeded strings against a deny-list ("working day", "Rashwan", "formerly", "[placeholder]").

### D-02 [major · confirmed] The project seed invents discipline tags and scope wording that are not in `seed/projects.raw.json`
- **Where:**
  - `src/seed/p4-t2-data.ts:695-700` (`MEP`);
  - `:737-741` (`Data Center MEP`);
  - `:730-734` (`Data & Low Current Systems`).
- **Code:**
  - `case 'MEP': return { category: 'mep', scope: ['mep','hvac','electrical','plumbing','fire-fighting'], scopeSummaryEn: 'Full MEP Works' …`
  - `case 'Data Center MEP': … scope: ['data-center','mep','hvac','electrical','fire-fighting','low-current']`
- **Problem:**
  - The raw rows only say `"scope": "MEP"` (77 rows).
  - `company-facts.md:17` lists fire fighting **separately** from MEP, so tagging every MEP project `fire-fighting` is invented data. The same applies to `low-current` on the RTA data centre, `data-center` on "Data & Low Current", and the word "Full".
  - The raw file's own `_about` says "Never invent missing fields", and AGENTS.md says "Never invent business data".
  - The card defines a **category** map only; it does not define scope expansion.
  - I parsed the manifest: 16 of the 17 **published** projects (the ones with photos) have raw scope `MEP`, so they publish with an invented `fire-fighting` tag.
- **Impact:**
  - `projects.scope` drives the public discipline filter: `getProjects({ discipline })`, `src/lib/cms/collections.ts:159-161`.
  - It also drives "related projects" for the Home interactive systems: `home-page.interactiveSystems.systems[].disciplines`, where Fire maps to `fire-fighting`.
  - As a result, 16 hotel MEP jobs show up as fire-fighting references.
- **Fix:**
  - map each raw scope only to the disciplines that are literally named: `MEP` → `['mep']`, `Data Center MEP` → `['data-center','mep']`, `Data & Low Current Systems` → `['low-current']`;
  - set `scopeSummary` to the raw string (or the Figma card text for the 6 featured projects only);
  - list the expansions as `needsClientReview` questions instead;
  - make the `default:` branch throw instead of silently returning `mep` (`:777-783`).

### D-03 [major · suspected] Changing media or video does not revalidate the pages that embed it
- **Where:**
  - `src/collections/Media.ts:580-581`, `src/collections/Videos.ts:240-241`: `createRevalidateAfterChangeHook({ collection: 'media' })` with no paths;
  - default paths are `['/']` (`src/hooks/revalidate.ts:592`);
  - no getter tags `collection:media` or `collection:videos` (`src/lib/cms/globals.ts:458-494`, `collections.ts:73,194,239,280,307,334,371`).
- **Code:** `const basePaths = options.localizedPaths ?? options.paths ?? ['/']`
- **Problem:**
  - Every cached getter returns depth-2 documents with media populated: alt, caption, sizes, focal-point crops, the `pageHeader.image` of every page, project cover and gallery, and `site-settings` OG and map images.
  - A media update purges only the `collection:media*` tags, which no reader uses, and the paths `/ar` and `/en`.
  - `/en/projects/[slug]`, `/en/services`, `/en/about` and `/en/contact` keep the old alt text and caption until something else invalidates them.
  - The spec makes gallery captions come from `media.caption` (02 §Addendum "projects").
- **Impact:** an editor fixes a wrong alt text or caption, or replaces an image, and the public pages keep serving the old values, with no error shown.
- **Runtime check:** publish a project with a cover, load `/en/projects/<slug>`, edit that media's alt in the admin, and reload. The alt is expected to stay stale.
- **Fix:**
  - add `collection:media` (and `collection:videos`) to the tag set of every getter that reads documents with uploads, or simplest, to `getCachedOrDraftGlobal` and to the collection getters;
  - alternatively, give the media hook `layoutPaths: ['/']` (`revalidatePath('/en','layout')`), as `SiteSettings` already does.
  - Related: `getAboutPage` reads the `story.badgeStat` relation (stats) but has no `collection:stats` extra tag (`globals.ts:476-478`). Today it relies on `Stats.ts:90` path revalidation. Make the tag model complete instead of mixing tags and paths.

### D-04 [minor · confirmed] `getMaterials` sorts by a field that does not exist, and the spec's `itemNo` order is lost
- **Where:**
  - `src/lib/cms/collections.ts:292-297`;
  - `Materials.ts:66` (`defaultSort: 'itemNo'`, no `order` field);
  - the latest snapshot JSON shows `public.materials` columns `item_no`, `system`, `created_at`, `updated_at` only.
- **Code:** `cmsFindAllSmallCollection({ collection: 'materials', … sort: 'order', depth: 2 })`
- **Problem:** 02 §materials: "Default sort `itemNo`. Frontend groups by `system`". Sorting on a missing field passes the only test, `tests/int/p3-t1.int.test.ts:296` (`expect(Array.isArray(materialsAr)).toBe(true)`), so the bug is invisible.
- **Impact:** when the Services page (P3-T6) consumes this, the approved materials table will not be in item order.
- **Fix:** use `sort: 'itemNo'`, and add a test that asserts ascending `itemNo`.

### D-05 [minor · confirmed] `reviewNote` is editor-readable and editor-writable; the spec says "admin-only"
- **Where:** `src/collections/Projects.ts:1184-1193`
- **Code:** `access: { read: isAdminOrEditorFieldLevel, create: isAdminOrEditorFieldLevel, update: isAdminOrEditorFieldLevel }`
- **Problem:** 02 line 220: "`reviewNote` (textarea, admin-only, not public)". The implementation is staff-only (admin and editor). Both readings are plausible ("admin" = role, or "admin panel"), but the deviation is not listed anywhere.
- **Impact:** low. The notes contain sourcing remarks, not secrets.
- **Fix:** ask the CTO. If "admin" means the role, switch to `isAdminFieldLevel` for read, create and update.

### D-06 [minor · confirmed] Slug locking depends on process-global in-memory state (test scaffolding running in production)
- **Where:** `src/fields/slug.ts:25-31` (the two module-level `WeakMap`s), `:33-87`, `:661-672`, `:694-700`, `:727-760`, `:946-975`.
- **Code:**
  - `const lockedSlugDocsByPayload = new WeakMap<object, Set<string>>()`
  - the comment: "In-memory fallback registry … even when a test collection registers `slugField()` alone"
- **Problem:**
  - `wasLockedInDoc` ORs the persisted `slugLocked` column with `lockedSet.has(...)`, and the auto-slug history (`autoSlugsByPayloadDoc`) grows for every document ever saved.
  - Lock behaviour therefore depends on whether the same Node process saw an earlier save. It differs after a restart, between replicas, and between the admin process and the `payload run` seed.
  - The file is 1,012 lines for a rule the spec states in one line (02 line 10).
- **Impact:**
  - hard-to-reproduce slug regeneration or locking differences;
  - an unbounded per-process map;
  - very high review cost.
- **Fix:**
  - make the persisted `slugLocked` the only source of truth, and delete both WeakMaps;
  - update the tests that register `slugField()` alone so they use `slugFields()`;
  - split `slug.ts` into a pure part (`slugify`/`transliterate`/`resolveUniqueSlug`) and a hook part (one `beforeValidate` with an explicit decision table).

### D-07 [minor · confirmed] The Team `afterChange` runs raw SQL through private adapter internals and swallows every error
- **Where:** `src/collections/Team.ts:54-77`
- **Code:**
  - `const executor = (txId ? dbObj.sessions?.[txId]?.db : undefined) ?? dbObj.drizzle`
  - `UPDATE "team_locales" SET "bio" = NULL …`
  - `} catch { // Ignore … }`
- **Problem:**
  - It depends on undocumented `db.sessions`/`drizzle` shapes, and it is cast through `unknown`.
  - If the transaction lookup misses, it runs **outside** the request transaction.
  - Any SQL error is silently ignored, so staff bios in the other locale can survive with no signal.
- **Fix:** clear `bio` for all locales in a collection `beforeChange` (`data.bio = null` when `tier === 'staff'`; on a full-locale save use `req.locale === 'all'`), or call `payload.update({ locale, req, … })` per locale. At minimum, log in the catch.

### D-08 [minor · confirmed] The Materials brand-existence validator queries outside the request transaction
- **Where:** `src/collections/Materials.ts:205-216`
- **Code:** `await req.payload.find({ collection: 'brands', depth: 0, …, overrideAccess: true, pagination: false, where: { id: { in: uniqueIds } } })`, with no `req`.
- **Problem:**
  - Every other hook and validator in scope passes `req` (`Projects.ts:157-163`, `Brands.ts:14-24`, `publishableGlobal.ts:79-86`).
  - Without it, a brand created earlier in the same transaction (a seed or a future import job using one `req`) is invisible, so validation fails. The query also takes a second pool connection.
- **Fix:** pass `req` in the call.

### D-09 [minor · confirmed] Seeded public project slugs embed internal spreadsheet refs and are locked when published
- **Where:**
  - `src/seed/p4-t2.ts:187-200`, `:246-248`;
  - slug lock on publish in `src/fields/slug.ts:861-866`.
- **Code:** `return \`${base}-${refSlug}\``, which produces e.g. `al-maqam-tower-a-b-c-d-xlsx-27`, `princess-noura-university-pnu-a-p11-1`.
- **Problem:**
  - Only Sofitel is special-cased (`XLSX-13`).
  - The 16 other published projects get permanent URLs containing `xlsx-NN` or `a-p11-N` source refs. Those are internal provenance, not content.
  - Every name in the raw list is unique after slugify, so the suffix is not needed for uniqueness. `resolveUniqueSlug` already handles clashes.
- **Fix:** seed `slug` from the title only, and let the slug hook dedupe. Keep the ref in `reviewNote`, where it already is.

### D-10 [minor · confirmed] The marquee seed creates a duplicate brand for Zamil
- **Where:**
  - `src/seed/p4-t2-data.ts:108-114` (`matchExistingNames: ['Zamil Air Conditioners']`);
  - the P4-T1 typo map produces `Zamil` (`src/seed/materials.ts:208`, raw `"SKM/zamil"`, `seed/materials.raw.json:384`).
- **Problem:**
  - The lookup is case-insensitive but exact-name.
  - The seed ends with both `Zamil` (linked to material #… , marquee cleared) and a new `Zamil Air Conditioners` (marquee, no materials), which are the same manufacturer.
  - `company-facts.md:68` lists the brand as "Zamil".
- **Fix:** add `'Zamil'` to `matchExistingNames`, and list the display-name question in the report, as was done for the P4-T1 Figma ↔ raw names.

### D-11 [minor · confirmed] The "related projects" label is seeded with the 3D badge copy
- **Where:** `src/seed/p4-t2.ts:1480` (and the AR counterpart)
- **Code:** `relatedProjectsLabel: '3D model · live version available'`
- **Problem:** the field is the "Related projects" heading (`HomePage.ts:605`; the test fixture `src/p3-t4-home.test.ts:303` uses `'Related projects'`; `design/copy/05-project-detail-sofitel-makkah.md:69`). The seeded string is the 3D badge text (`design/copy/01-home.md:64`).
- **Fix:** seed `'Related projects'` (and its AR translation). If the badge text needs to be editable, it needs its own field, which is a schema change requiring a migration.

### D-12 [minor · suspected] Public list queries over-fetch (depth 2, no `select`)
- **Where:** `src/lib/cms/collections.ts:166-175` (projects, `limit 24`, `depth: 2`), `:41-60` (services), `:298` (materials).
- **Problem:**
  - Project cards need the title, slug, category, location, scopeSummary and cover.
  - Depth 2 also populates `gallery` (up to 30 media docs each), `bodyMedia` (hidden), `video`, `meta.image` and the `body` JSON, and the result is stored in `unstable_cache`.
  - Next's data cache refuses entries over 2 MB and only logs it. If that happens, the getter silently becomes uncached.
- **Runtime check:** 24 published projects with full galleries; measure `JSON.stringify(result).length` in `getProjects`.
- **Fix:** pass `select` (already whitelisted in `SAFE_CMS_QUERY_WHITELIST_KEYS`) and `depth: 1` for list getters; keep depth 2 only for `getProjectBySlug`.

### D-13 [minor · confirmed] The CMS client hides failures
- **Where:**
  - `src/lib/cms/client.ts:571-581`: `cmsFindByID` → `catch { return null }`;
  - `:214-225`: `withCmsCache` falls back to an **uncached** call whenever an error message contains `'unstable_cache'`;
  - `:270`, `:295`: `resolve*` return `null` / `{draft:false}` on any error.
- **Problem:**
  - A database outage on `cmsFindByID` becomes a 404, not a 500.
  - The `'unstable_cache'` substring also matches Next's own "used `headers()` inside `unstable_cache`" errors. A future misuse would then silently disable caching in production instead of failing.
  - Both behaviours exist for tests: "outside the Next.js incremental cache runtime".
- **Fix:**
  - in `cmsFindByID`, return `null` only for Payload `NotFound`, and rethrow anything else;
  - in `withCmsCache`, inject the cache function (or check `process.env.VITEST`) instead of sniffing messages;
  - log (`payload.logger.warn`) in the auth-resolution catch.

### D-14 [minor · confirmed] The seed is not transactional, and `--reseed` wipes the whole media library
- **Where:**
  - `src/seed/p4-t2.ts:803-872`, where `--reseed` runs `payload.delete({ collection: 'media', where: { id: { exists: true } } })` (plus projects, services, team, stats, materials, brands);
  - the guard keys only on `NODE_ENV` (`src/seed/materials.ts:162-181`);
  - all about 300 Local API writes run sequentially without a shared `req`/transaction.
- **Problem:**
  - A failure midway (e.g. a validation error on project 60) leaves a partly seeded database. The first-run guard (`:786-790`) then refuses to rerun without `--reseed`.
  - On a host where `NODE_ENV` is not exported in the shell, `pnpm seed --reseed` deletes editor uploads too, not only seeded media.
- **Fix:**
  - wrap the seed in one transaction (`const req = await createLocalReq({}, payload); await initTransaction(req)` → pass `req` everywhere → commit or kill);
  - restrict the reseed media deletion to the files the seed created, by filename or by a `seeded` marker in the alt/caption convention;
  - also refuse `--reseed` when `DATABASE_URL` does not point at a local host.

### D-15 [nit · confirmed] Dead code, and shared factories that are duplicated or bypassed
- **Dead tags:** `projects:category:*`, `projects:scope:*` and `projects:featured*` are revalidated in `src/collections/Projects.ts:423-584` (about 160 lines), but no reader uses those tags. `grep` finds them only in `Projects.ts` and `tests/int/p2-t4.int.test.ts`. The home page is already purged through the `collection:projects` extra tag on `getHomePage` (`globals.ts:462`).
- **Bypassed factory:**
  - `withPublishable` (`collections/_shared/publishable.ts:29-38`) is used only by tests.
  - `Projects.ts:590,623` and `Services.ts:162,171` wire `versions` and `captureMainPublishedDocBeforeChange` by hand.
- **Duplicates:**
  - `publishableGlobalVersions` is defined twice (`collections/_shared/publishable.ts:17-25` and `globals/_shared/publishableGlobal.ts:22-30`);
  - the unused aliases `PUBLISHABLE_VERSIONS` and `PUBLISHABLE_GLOBAL_VERSIONS` (`publishable.ts:15,27`) and `CMS_SERVER_ONLY_SENTINEL` (`client.ts:14`);
  - four copies of the positive-ID parser: `Projects.ts:117`, `Services.ts:21`, `HomePage.ts:109`, `publishableGlobal.ts:59`;
  - three near-identical whitelist builders in `client.ts:393-470`.
- **Never written:** the unkeyed `'__mainDocBeforeChange'` and `'__mainGlobalBeforeChange'` fallbacks are read and deleted but never set (`revalidate.ts:193,212,225-226,242,258,268-269`).
- **Hand-rolled validation:** per-collection enum and FK checks (`Projects.ts:179-421`, `Services.ts` `validateServiceBeforeValidate`) duplicate the schema-driven validator that already exists for globals (`publishableGlobal.ts:118-311`).
- **Fix:** see refactor steps 3–6.

### D-16 [nit · confirmed] Latent gaps in shared hooks
- `validateFieldsRecursively` (`globals/_shared/publishableGlobal.ts:125-283`) descends into `collapsible`, `row`, `group` and `array`, but **not** `tabs`. No global uses tabs today; the first one that does will silently lose FK and enum validation. Add a `tabs` branch.
- `captureMainPublishedDocBeforeChange` (`revalidate.ts:347-388`) does a `db.findOne` on **every** update of a publishable collection, including each 800 ms autosave. The `afterChange` returns early on autosave (`:464`), so that read is wasted. Skip the capture when `req.query.autosave`/`draft` is true.

### D-17 [nit · confirmed] The content-model doc contradicts the R-7 locale rule
- **Where:** `docs/02-content-model.md:4-5`: "English falls back to Arabic if empty."
- **Problem:**
  - The code (`client.ts:201-203`: `locale === 'ar' ? 'en' : false`) follows CTO decision R-7 (`handoff/reviews/P3-T12.md:77-80`), and the code is right.
  - The doc is CTO-owned, so the executor cannot fix it.
- **Fix:** the CTO updates 02 line 4–5.

## Checked and clean
- **Access and admin metadata:** all 10 collections and 8 globals have explicit `access`, `timestamps: true`, `useAsTitle`, `defaultColumns`, bilingual `labels` and an `admin.group` (scripted grep). Page globals get `read: publishedOrLoggedIn`, `readVersions` and `update` admin+editor through `withPublishableGlobal`. `site-settings` is update `isAdmin` and `arabicEnabled` is field-level admin. `navigation` is admin+editor.
- **`quote-requests`:** create `() => false`, delete admin; customer and system fields are read-only for everyone, and workflow fields are admin+editor (`QuoteRequests.ts:60-69,361-368`). Matches 02.
- **Projects (CTO 2026-10-24 rules):**
  - `coverImage` is required only on publish (hook `Projects.ts:298-312` plus field `validate`), and the DB column is nullable (`cover_image_id` integer, no NOT NULL);
  - `year` is optional, 1990..now+2;
  - `needsClientReview` is staff-only;
  - migration `20261025_002404` adds both columns and indexes and has a working `down`.
- **Migrations:**
  - all 10 have `down()`, and `index.ts` order is chronological;
  - no migration was edited after its task's acceptance commit (P2-T4 last edit `49640ae` 10-23 00:32 < accept `fa3375d` 01:38; P3-T4 `82a6c89` 10-25 00:32 < `1047b1c` 05:46; P3-T12 `dd5b90c` 02:52 < `13ee7b5` 03:47);
  - the latest snapshot agrees with the config on the sampled points: `quote_requests.locale` default `'en'`, `site_settings.arabic_enabled`, `projects.needs_client_review`/`review_note`, and SEO `meta_*` in `*_locales`, so SEO is localized;
  - the P3-T4 backfill splits only on `chr(10)`, and its `down` re-joins.
  - Caveat, not a finding: `dd5b90c` appended a `quote_requests` default change to the already-created P3-T12 migration before acceptance. Any dev DB that had already run the earlier version will not have the new default.
- **Hooks:**
  - no `afterChange` → `update` recursion anywhere in scope;
  - every lookup passes `req` except D-08;
  - `overrideAccess: true` in hooks is used only for existence and uniqueness checks;
  - the revalidation hooks never throw;
  - the draft/autosave/publish/unpublish logic in `shouldRevalidate*` is sound.
- **CMS client:**
  - `overrideAccess: false` is forced;
  - option whitelists strip `user`, `req`, `draft`, `pagination` and `showHiddenFields`;
  - `draft` is true only with `draftMode()` **and** a verified staff session;
  - limit is clamped to 100;
  - every getter passes `getFallbackLocale`, and for `en` Payload's default fallback is `en`, so `en` never shows Arabic (R-7 holds).
- **`server-only` removal (commit `9535922`):** safe.
  - `p4-t2.ts` and `p4-t2-data.ts` hold only static copy and Local-API calls. They read no secrets or env vars beyond `NODE_ENV`/argv.
  - `@/seed` is in `FRONTEND_FORBIDDEN_SERVER_DIR_PATTERNS` (`eslint.config.mjs:54-55`).
  - Note: the client-bundle sentinel check is weak evidence, because an unused exported sentinel can be tree-shaken out even if the module were bundled. Also, the ESLint rule matches the `@/seed` alias only, not relative imports.
- **Seed data fidelity:**
  - all 91 refs have an Arabic title (91/91 keys);
  - the 6 featured refs exist and match the Figma names;
  - the 17 manifest photos map to existing refs, ambiguous ones go to the first ref as the card requires, and the published projects are exactly those with photos;
  - `reviewNote` is at most 911 characters, under the 1000 max;
  - the team placeholders are `[placeholder]` and `active:false`, and `team.read` is `activeOrLoggedIn`;
  - services and all page globals are `draft`;
  - the first-run guard and the half-empty guard are present.
- **Jobs:** `shouldAutoRunJobs` disables cron in builds, tests, the CLI and replicas, and production requires an explicit `PAYLOAD_JOBS_AUTORUN` (`.env.example:55-58`).

## Questions for the CTO
- The P4-T2 card conflicts with itself:
  - scope 4a says the 17 projects with photos are **published**;
  - acceptance criterion 2 says "Every publishable doc … is **draft**".
  - The seed follows 4a. Which rule wins?
- Does "admin-only" for `reviewNote` mean the admin role or the admin panel? (D-05)

## Refactor themes (max 6)
- **Seed correctness and safety:** `src/seed/p4-t2*.ts`, `src/seed/materials.ts`. Benefit: no invented or owner-rejected data, an atomic seed, and a reseed that cannot destroy editor media. Risk: low; dev-only code, covered by `tests/int/p4-t2.int.test.ts`.
- **One cache-tag model:** `src/lib/cms/{tags,collections,globals}.ts`, `src/hooks/revalidate.ts`, every collection's revalidation options. Every getter declares its dependency tags (including `media`, `videos` and `stats`), and the hooks only purge tags, which removes the hand-kept path lists. Benefit: no stale media or stats. Risk: medium; needs e2e revalidation tests.
- **Shared publishable/validation factories:** `collections/_shared/publishable.ts`, `globals/_shared/publishableGlobal.ts`, `Projects.ts`, `Services.ts`. Use `withPublishable` and a schema-driven validator for collections (the globals one, extended to `tabs`). Benefit: removes about 400 lines of hand-written enum and FK checks. Risk: medium; error message texts change slightly.
- **A simpler slug field:** `src/fields/slug.ts`. Persisted `slugLocked` is the only state; split pure helpers from the hook. Benefit: deterministic behaviour, much less code. Risk: medium; `slug.test.ts` and `p2-t1-slug.int.test.ts` must be adapted, not weakened.
- **CMS client error handling and query shape:** `src/lib/cms/client.ts`, `collections.ts`. Not-found-only `null`, no message-sniffing cache fallback, `select` plus depth 1 for lists, one generic `cachedQuery` helper replacing eight copies. Risk: low to medium.
- **Remove adapter internals from hooks:** `Team.ts`. Benefit: no private-API coupling or silent failures. Risk: low.

## Ordered refactor plan (small, verifiable steps; no schema change)
1. **D-01 and D-11 seed copy.**
   - Files: `src/seed/p4-t2.ts:1336,1381,1480,1848,1853,2040`, `p4-t2-data.ts:226-231`.
   - Change: copy-v2 text, the stat label, and remove the founder's name and "formerly".
   - Verify: a new test asserts the deny-list strings are absent in `navigation`, `site-settings` and `stats` after the seed.
   - Risk: none.
2. **D-02 scope map.**
   - Files: `p4-t2-data.ts:688-784`.
   - Change: literal mapping only, and `default` throws.
   - Verify: a unit test over all 13 raw scope strings; no published project carries `fire-fighting` unless the raw scope names it.
   - Risk: none.
3. **D-09 and D-10.**
   - Files: `p4-t2.ts:187-248`, `p4-t2-data.ts:108-114`.
   - Change: title-only slugs; add `'Zamil'` to the match list.
   - Verify: a test that no seeded slug matches `/(xlsx|a-p11)-\d+$/`, and that there is exactly one Zamil brand.
4. **D-04 and D-08.**
   - Files: `collections.ts:296` (`itemNo`), `Materials.ts:205` (`req`).
   - Verify: an integration test asserts `getMaterials` is ascending by `itemNo`.
5. **D-13.**
   - Files: `client.ts:214-225,571-581`.
   - Change: narrow the catches.
   - Verify: a unit test where a mocked DB error propagates from `cmsFindByID`, and `withCmsCache` rethrows an error containing `unstable_cache`.
6. **D-15 dead code.**
   - Files: `Projects.ts:423-584,631,639` (remove the `projects:*` hooks), `publishable.ts:15,27`, `client.ts:14`, `revalidate.ts` (unkeyed context keys); merge the duplicate `publishableGlobalVersions`; one `parsePositiveIntId` in `src/fields/ids.ts`.
   - Verify: `pnpm typecheck`, `pnpm test`; `grep -r "projects:featured" src` is empty apart from removed tests.
   - Risk: the tests that assert the dead tags must be deleted with a note, not weakened elsewhere.
7. **D-03 tags.**
   - Files: `globals.ts:418-438` and `collections.ts` getters (add `collection:media` and `collection:videos`); `AboutPage` extra tag `collection:stats`.
   - Verify: an e2e test that edits a media alt and sees the change on `/en/projects/<slug>` without a restart.
   - Risk: medium (more purges).
8. **D-07 Team.**
   - Files: `Team.ts:54-77`.
   - Change: replace with a `beforeChange` data rule or per-locale `payload.update({ req })`.
   - Verify: the existing staff-bio test plus a test that a forced SQL error now surfaces.
9. **D-14 seed transaction and reseed scope.**
   - Files: `p4-t2.ts:743-900`, `materials.ts:162-181`.
   - Verify: an integration test that injects a failure at project N; the DB stays empty and the next run succeeds without `--reseed`.
   - Risk: medium.
10. **D-06 slug.**
    - Files: `src/fields/slug.ts`.
    - Change: remove the WeakMaps; persisted lock only; split into a pure module and a hook module.
    - Verify: the full slug test suite, rewritten tests reviewed by the CTO, and a restart-between-saves test.
    - Risk: highest; do it last, as its own task.
11. **D-12 select and depth.**
    - Files: `collections.ts:41-60,166-175`.
    - Change: `select` for card fields, depth 1.
    - Verify: a snapshot of the card props, and the payload size logged before and after.
12. **D-16.**
    - Files: `publishableGlobal.ts:125` (`tabs` branch), `revalidate.ts:356` (skip the capture on autosave).
    - Verify: a unit test with a tabs fixture; an integration test that counts `db.findOne` calls during autosave.
