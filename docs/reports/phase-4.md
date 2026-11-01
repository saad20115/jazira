# Phase 4 — Real Client Data, Settings, Services, Projects, Marquee, Copy & Placeholders Seed (`P4-T1` + `P4-T2`)

## Phase 4 — Content & Real Data Seed

> **Non-authoritative notice (`AGENTS.md` — Evidence integrity / separation of duties):**
> Per `AGENTS.md` and `M-180` / `M-184`, executor reports present no numbers of record (no test counts, scores, timings, or percentages as results). Numbers in the business-data tables below are the specification-defined client baseline from `seed/materials.raw.json`, `seed/projects.raw.json`, `seed/images/projects/manifest.json`, and `handoff/tasks/P4-T2.md`.

### Done
- **`P4-T1` (`Materials + brands seed` + `§0` `R-8`..`R-11` fixes)**:
  - Implemented deterministic normalization, planning, and Local API seeding of the approved materials (`electrical`, `mechanical`, `structural`, `architectural`) and normalized material brands from `seed/materials.raw.json` in `src/seed/materials.ts`.
  - Applied the general parenthetical product-note extraction rule `normalizeBrandName` in `src/seed/materials.ts` so any trailing parenthetical note in a brand cell (`Hempel (Coating)` on row `#57` and `JAZEERA (PRIMER)` on row `#31`) is stripped from the brand name (`Hempel`, `Jazeera`) and preserved in the material's `notes` (`R-9`).
  - Updated Arabic draft `#26` in `MATERIAL_ARABIC_DRAFT_MAP` (`ZCV للحريق`) and `#31` note in `UNCERTAIN_MEP_BRAND_NOTES` (`طلاء`) (`R-10`), fixed `"Jihanzi - UL/FM"` spacing in `buildMaterialsSeedPlan`, logged `brandsDeleted` and `materialsDeleted` on `--reseed` in `formatSeedSummaryLines`, and added half-empty database guard integration tests (`brands`-only / `materials`-only) in `tests/int/p4-t1.int.test.ts` (`R-8`, `R-11`).
- **`P4-T2` `§0b` (`R-7`..`R-11` carried from `P3-T12` r2)**:
  - Updated `getFallbackLocale` in `src/lib/cms/client.ts` so `en` never falls back to `ar` (`return locale === 'ar' ? 'en' : false`), tested in `src/p3-t12-arabic-switch.test.ts` and `tests/e2e/p3-t12.e2e.spec.ts` (`R-7`).
  - Imported and tested the real `isAuthorizedArabicPreviewRequest` in `src/p3-t12-arabic-switch.test.ts` (`R-8`).
  - Updated `tests/e2e/p3-t12.e2e.spec.ts` to follow Next.js `_rsc` redirects and assert on the real `text/x-component` flight payload (`R-9`), and added `test.setTimeout` (`R-10`).
  - Derived the expected origin in `resolveExpectedRequestOrigin` in `src/lib/cms/client.ts` strictly from `process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'` (`R-11`).
- **`P4-T2` Content Model Update & Migrations (`CTO 2026-10-24`, `M-172` `D-05`/`A-05`, Round 2 `R-12` & `R-16`)**:
  - Updated `src/collections/Projects.ts` so `coverImage` is optional on drafts (`_status === 'draft'`) and required only when `_status === 'published'`, added `needsClientReview` (`checkbox`, `defaultValue: false`) restricted to staff via `isAdminOrEditorFieldLevel`, and added `reviewNote` (`textarea`) restricted strictly to the `admin` role via `isAdminFieldLevel`.
  - Created and committed additive Payload migration `src/migrations/20261025_002404_p4_t2_projects_review_fields.ts`, which adds `needs_client_review` and `review_note` on `projects` and `version_needs_client_review` and `version_review_note` on `_projects_v` along with their btree indexes (`projects.cover_image_id` was already nullable in the database schema from `20261022_160652_p2_t4_projects.ts` because `Projects` has `versions.drafts: true`) (`R-15`).
  - Updated `src/collections/Media.ts` to add an admin-only `placeholder` (`checkbox`, `defaultValue: false`, `index: true`, `access: { read: isAdminFieldLevel, create: isAdminFieldLevel, update: isAdminFieldLevel }`) field and restricted anonymous `Media.access.read` (`readPublicNonPlaceholderMedia`) to `{ placeholder: { equals: false } }` so design placeholder media cannot be read anonymously through `GET /api/media`, `GET /api/media/:id`, or `GET /api/media/file/:filename` (`R-12`). Created and committed additive Payload migration `src/migrations/20261101_133828_p4_t2_r2_media_placeholder.ts` (`ADD COLUMN "placeholder" boolean DEFAULT false` and `CREATE INDEX "media_placeholder_idx"` on `media`).
  - Set `withoutEnlargement: true` on the `og` (`1200×630`) image size in `src/collections/Media.ts` so smaller images are never upscaled (`R-16`), and updated `src/components/ProjectCard.tsx` to cap responsive `sizes` to `mediaAsset.width`.
  - Updated `getTeamMembers` in `src/lib/cms/collections.ts` so inactive (`active: false`) placeholder team members are hidden from anonymous visitors (`getTeamMembers` returns `[]`) while visible to authenticated editors in draft preview (`isDraft === true`).
- **Branch Integration (`M-168`)**:
  - Merged `p3-t5-seam` into `phase-3-frontend` (`git merge --no-ff p3-t5-seam -m "merge: P3-T5 seam (section 4 → InteractiveSystemsSection)"`, merge commit `a267b06d692ba5eea683fcb5e574c42be56dedd1`). `p3-t5-live-3d` was not merged.
- **`P4-T2` Seed Implementation (`src/seed/p4-t2-data.ts`, `src/seed/p4-t2.ts`, `scripts/seed.ts`)**:
  - **Scope 1 (`site-settings` & `navigation`)**: Seeded `site-settings` (`arabicEnabled: false`, `companyName`, `tagline`, `phone: '+966 57 353 4185'`, `whatsapp: '966573534185'`, `whatsappLabel`, `email: 'info@aljazira.co'`, `address: '7676 Bathaa Quraish, Makkah Al-Mukarramah, KSA'`, `workingHours`, `office` with `mapImage: null`, `socials: []`, `footerText`, `copyright`, `defaultSeo` with `image: null`) and `navigation` (`header`, `headerCta`, `footer`, `footerCta` without any unverified reply-time promise) in both `en` and `ar` (`D-01`).
  - **Scope 2 (`stats`)**: Seeded the `5` design metrics in `SEED_STATS_5` (`45+` `Years of Experience`, `100+` `Buildings Delivered` / `مبنى تم تسليمه`, `85%` `Self-Performed Work`, `21+` `MEP Disciplines`, `3` `Countries Served` / `دول نخدمها`) in `en` and `ar` (`D-01`, `R-17`).
  - **Scope 3 (`services`)**: Seeded all `10` services (`4` `main` + `6` `additional` specialist services) with English copy and highlights from `design/copy/02-services.md` and Arabic drafts in `SEED_SERVICES_10`, saved as `_status: 'draft'`.
  - **Scope 4 & 4c (Page Globals as `draft`)**: Seeded `home-page` (from `design/copy/01-home.md` while `docs/content/copy-v2/01-home.md` is in `final draft` status per `M-154`, with `interactiveSystems.systems` populated in **both** `en` and `ar` from `DEFAULT_INTERACTIVE_SYSTEMS_EN` and `DEFAULT_INTERACTIVE_SYSTEMS_AR`, `relatedProjectsLabel` set to `'Related projects'` / `'مشاريع ذات صلة'` per `D-11`, and `statsSection.backgroundImage` set to `bg-pipes.png`), `services-page`, `about-page` (having no personal founder name or `"formerly known as IMDAD Group"`, and with `90+ completed projects across 100+ buildings` per `D-01`), `projects-page`, `contact-page`, and `privacy-page` (`[placeholder]`) in both `en` and `ar`, all with `_status: 'draft'`.
  - **Scope 4a (`91` Real Projects + `17` Profile Photos)**: Uploaded all `17` enhanced project photos from `seed/images/projects/manifest.json` to `media` (`placeholder: false`) with English alt text `"<project> — exterior"` and Arabic alt text `"<project_ar> — واجهة خارجية"`; seeded all `91` projects from `seed/projects.raw.json` with title-only slugs (`D-09`), literal `Makkah Region, KSA` / `منطقة مكة المكرمة، المملكة العربية السعودية` for the `66` rows under the profile section header `'Makkah'` (`R-13`), literal `rawScope` discipline mappings without invented `fire-fighting` or `low-current` tags (`D-02`), `status: 'completed'`, `company` mapped to `client` (`"-"`/`""` -> `null`), the `6` Figma featured projects ordered `1..6`, the `17` projects with a photo published (`_status: 'published'`), the `74` projects without a photo kept in draft (`_status: 'draft'`, `coverImage: null`), and `needsClientReview: true` + `reviewNote` on all `91`.
  - **Scope 4b (`20` Owner Marquee Brands)**: Cleared `showInMarquee` on the `16` old Figma marquee brands that are not in the owner's 20-brand list, matched the `4` existing `P4-T1` brands (`Zamil` -> renamed in place to `Zamil Air Conditioners`, `Legrand`, `Alfanar` -> `alfanar`, and `Belden`, `D-10`), preserved existing client `origin` values on matched brands (`Belden` keeps `United States`) while filling empty origins (`Zamil Air Conditioners` filled with `Saudi Arabia`) (`R-18`), created the `16` new marquee brands, and ordered all `20` owner-approved marquee brands `1..20`.
  - **Scope 5 & 6 (Placeholders & Design Assets)**: Uploaded the `9` Figma website images from `design/assets/images/` with `placeholder: true` and `[placeholder]` in their `en` and `ar` alt text in `DESIGN_ASSET_IMAGES_9` (`R-12`), and seeded the `13` placeholder `team` members (`5` `leadership` + `8` `staff` marquee roles) with `[placeholder]` in their names and `active: false` in `PLACEHOLDER_TEAM_MEMBERS_13`.

---

### Non-Empty Database Seed Check Behaviour After `P4-T2` (`M-172` #6, `R-14`)

`runSeedCli` in `scripts/seed.ts` invokes `seedP4T2Content` in `src/seed/p4-t2.ts`, which enforces a unified two-tier first-run baseline guard across both `P4-T1` (`brands`, `materials`) and `P4-T2` (`stats`, `services`, `projects`, `team`, `media`):

1. **Without `--reseed` (`hasAnyP4T2Docs` and `hasHalfEmptyP4T1`)**:
   - **Empty database (`brands=0, materials=0, stats=0, services=0, projects=0, team=0`)**: Automatically runs `seedMaterialsAndBrands` first to seed the `P4-T1` materials and brands, and then seeds all `P4-T2` collections and globals.
   - **Database with `P4-T1` already seeded (`brands > 0, materials > 0`) and zero `P4-T2` docs (`stats=0, services=0, projects=0, team=0`)**: Skips `seedMaterialsAndBrands` and seeds `P4-T2` on top of the existing `P4-T1` baseline.
   - **Half-empty `P4-T1` state (`(counts.brands > 0) !== (counts.materials > 0)`) OR any existing `P4-T2` docs (`counts.stats > 0 || counts.services > 0 || counts.projects > 0 || counts.team > 0`)**: Immediately throws `[seed] Refusing to run seed on a non-empty database (brands=..., materials=..., stats=..., services=..., projects=..., team=...). The seed is a first-run baseline and never overwrites existing data. Pass --reseed in development to clear and rebuild.` before writing or modifying any row (`R-14`).
2. **With `--reseed`**:
   - Refuses to run when `NODE_ENV=production` via `assertSeedEnvironmentAllowed`.
   - In development/test, when any `P4-T1`/`P4-T2` collection or `media` is non-empty, first nulls out foreign-key media/stat references on all globals via `clearGlobalsReferencesBeforeReseed`, deletes existing rows in dependency order (`projects` -> `services` -> `team` -> `stats` -> `materials` -> `brands` -> `media`), logs all deleted counts, and rebuilds the complete `P4-T1` + `P4-T2` baseline from scratch.

---

### What Is Published vs. Draft (Post-Seed State)

| Collection / Global | Total Seeded | Published / Publicly Visible to Anonymous Visitors | Draft / Inactive (Hidden from Anonymous Visitors) | Notes |
|---|---:|---:|---:|---|
| `materials` | `73` | `73` | `0` | Real approved materials from `seed/materials.raw.json` (`P4-T1`). |
| `brands` | `99` | `99` (`20` with `showInMarquee: true`) | `0` | `83` material brands (`P4-T1`, with `Zamil` matched & renamed to `Zamil Air Conditioners`) + `16` new marquee brands (`P4-T2` Scope 4b). |
| `stats` | `5` | `5` | `0` | `45+`, `100+` (`Buildings Delivered` / `مبنى تم تسليمه`), `85%`, `21+`, `3` (`Countries Served` / `دول نخدمها`). |
| `services` | `10` | `0` | `10` (`_status: 'draft'`) | `4` `main` + `6` `additional` specialist services; kept in `draft` until client confirms copy. |
| `projects` | `91` | `17` (`_status: 'published'`, have real photo in `manifest.json`) | `74` (`_status: 'draft'`, `coverImage: null`) | All `91` have `needsClientReview: true` (staff-only) and `reviewNote` (admin-only). Zero `[placeholder]` text on published projects. |
| `team` | `13` | `0` | `13` (`active: false`, prefixed `[placeholder]`) | `5` `leadership` + `8` `staff` marquee roles; `GET /api/team` and anonymous `getTeamMembers` return `0` docs. |
| `media` | `26` | `17` real project photos (`placeholder: false`) | `9` design assets (`placeholder: true`, hidden from anonymous visitors) | `17` real project photos have alt `"<project> — exterior"`; `9` Figma design images have `placeholder: true` and alt prefixed `[placeholder]`, so anonymous `GET /api/media`, `GET /api/media/:id`, and `GET /api/media/file/:filename` refuse them (`R-12`). |
| `site-settings` | `1` global | `1` (`arabicEnabled: false`, `socials: []`) | — | Real contact details (`+966 57 353 4185`, `info@aljazira.co`, `7676 Bathaa Quraish, Makkah`); `office.mapImage: null`, `defaultSeo.image: null`. |
| `navigation` | `1` global | `1` | — | Header links, `Get a Quote` CTA, Footer Quick Links, and Footer CTA card (`en` + `ar`, no reply-time promise). |
| `home-page` | `1` global | `0` (empty shell on anonymous REST) | `1` (`_status: 'draft'`) | Seeded from `design/copy/01-home.md` (`en` + `ar`), including all `5` `interactiveSystems.systems` and `relatedProjectsLabel` in both `en` and `ar`. |
| `services-page` | `1` global | `0` (empty shell on anonymous REST) | `1` (`_status: 'draft'`) | Seeded from `design/copy/02-services.md` (`en` + `ar`). |
| `about-page` | `1` global | `0` (empty shell on anonymous REST) | `1` (`_status: 'draft'`) | Seeded from `design/copy/03-about-us.md` (`en` + `ar`); quote attributed to `Al Jazira for Imdad Smart Company` (`D-01`). |
| `projects-page` | `1` global | `0` (empty shell on anonymous REST) | `1` (`_status: 'draft'`) | Seeded from `design/copy/04-projects.md` (`en` + `ar`; `90+ completed projects across 100+ buildings`). |
| `contact-page` | `1` global | `0` (empty shell on anonymous REST) | `1` (`_status: 'draft'`) | Seeded from `design/copy/07-contact-us.md` (`en` + `ar`). |
| `privacy-page` | `1` global | `0` (empty shell on anonymous REST) | `1` (`_status: 'draft'`) | Marked `[placeholder]` in `draft` until client supplies final legal text (`D4`). |

---

### Scope 4b — 20 Owner Marquee Brands (`showInMarquee: true`, `order: 1..20`)

The 20 marquee brands requested by the owner on 2026-10-24 replace the old Figma marquee list in exact order `1..20`. Existing client `origin` values from `P4-T1` (`seed/materials.raw.json`) are preserved (`R-18`), and only empty origins are filled:

| Order | Brand Name (`brands.name`) | Status in Seed | HQ Country (`en`) | HQ Country (`ar` Draft) |
|---:|---|---|---|---|
| 1 | `Schneider Electric` | Created (`P4-T2`) | `France` | `فرنسا` |
| 2 | `ABB` | Created (`P4-T2`) | `Switzerland` | `سويسرا` |
| 3 | `Siemens` | Created (`P4-T2`) | `Germany` | `ألمانيا` |
| 4 | `Carrier` | Created (`P4-T2`) | `USA` | `الولايات المتحدة الأمريكية` |
| 5 | `Trane` | Created (`P4-T2`) | `USA` | `الولايات المتحدة الأمريكية` |
| 6 | `Daikin` | Created (`P4-T2`) | `Japan` | `اليابان` |
| 7 | `York` | Created (`P4-T2`) | `USA` | `الولايات المتحدة الأمريكية` |
| 8 | `Zamil Air Conditioners` | Matched from `P4-T1` (`Zamil`, empty origin filled) | `Saudi Arabia` | `المملكة العربية السعودية` |
| 9 | `Grundfos` | Created (`P4-T2`) | `Denmark` | `الدنمارك` |
| 10 | `KSB` | Created (`P4-T2`) | `Germany` | `ألمانيا` |
| 11 | `NAFFCO` | Created (`P4-T2`) | `UAE` | `الإمارات العربية المتحدة` |
| 12 | `Honeywell` | Created (`P4-T2`) | `USA` | `الولايات المتحدة الأمريكية` |
| 13 | `Legrand` | Matched from `P4-T1` (client origin preserved) | `France` | `فرنسا` |
| 14 | `alfanar` (matched `Alfanar`) | Matched from `P4-T1` (client origin preserved) | `Saudi Arabia` | `المملكة العربية السعودية` |
| 15 | `Elsewedy Electric` | Created (`P4-T2`) | `Egypt` | `مصر` |
| 16 | `Riyadh Cables` | Created (`P4-T2`) | `Saudi Arabia` | `المملكة العربية السعودية` |
| 17 | `Belden` | Matched from `P4-T1` (client origin preserved, `R-18`) | `United States` | `الولايات المتحدة الأمريكية` |
| 18 | `Cisco` | Created (`P4-T2`) | `USA` | `الولايات المتحدة الأمريكية` |
| 19 | `Bosch` | Created (`P4-T2`) | `Germany` | `ألمانيا` |
| 20 | `Crestron` | Created (`P4-T2`) | `USA` | `الولايات المتحدة الأمريكية` |

- **Old Figma Marquee Brands Cleared (`showInMarquee: false`, `16` brands)**: `CommScope`, `Tridonic`, `Cooper`, `Tyco`, `Grohe`, `Ariston`, `Watts`, `SKM`, `System Air`, `Hempel`, `Jazeera Paints`, `Saudi Ceramics`, `Tahweel`, `Bahra Cables`, `Al-Rajhi Steel`, `Obeikan Glass` (while `Zamil` was matched and updated in place to `Zamil Air Conditioners` at `order: 8`, `showInMarquee: true`).

---

### Scope 4a — Ambiguous Photo Captions in `seed/images/projects/manifest.json`

Per `handoff/tasks/P4-T2.md` Scope 4a ("Two captions are ambiguous (`project` "A|B"). Attach those to the **first** ref and say so in the report"):

1. **`seed/images/projects/hotel-al-janadriah-tower.jpg`** (`1032×760`, `project: "XLSX-1|XLSX-2"`, printed caption: `"Hotel AL Janadriah Tower"`):
   - **Attached to first ref `XLSX-1`**: `Hotel AL Janaderiah Palace Hotel` (`_status: 'published'`, `alt: "Hotel AL Janaderiah Palace Hotel — exterior"`).
   - **Other candidate `XLSX-2`**: `Hotel AL Janadriah Palace` (`_status: 'draft'`, `coverImage: null`).
   - **Question for client**: Does the photo captioned `"Hotel AL Janadriah Tower"` show `XLSX-1` (`Hotel AL Janaderiah Palace Hotel`) or `XLSX-2` (`Hotel AL Janadriah Palace`)?
2. **`seed/images/projects/ramada-makkah-hotel.jpg`** (`1056×688`, `project: "XLSX-18|XLSX-19"`, printed caption: `"Ramada Makkah Hotel"`):
   - **Attached to first ref `XLSX-18`**: `Ramada Dar AL Faezeen Hotel` (`_status: 'published'`, `alt: "Ramada Dar AL Faezeen Hotel — exterior"`).
   - **Other candidate `XLSX-19`**: `Ramada Ashee Hotel` (`_status: 'draft'`, `coverImage: null`).
   - **Question for client**: Does the photo captioned `"Ramada Makkah Hotel"` show `XLSX-18` (`Ramada Dar AL Faezeen Hotel`) or `XLSX-19` (`Ramada Ashee Hotel`)?

---

### Scope 4a — Complete List of All 91 Seeded Projects (`seed/projects.raw.json`)

Every project below is seeded with `status: 'completed'` (owner confirmed 2026-10-24) and `needsClientReview: true`. Rows `XLSX-1`..`XLSX-66` under the profile section header `'Makkah'` are seeded literally as `Makkah Region, KSA` / `منطقة مكة المكرمة، المملكة العربية السعودية` (`R-13`). The `6` Figma featured projects are ordered `1..6` (`featured: true`), the `17` projects with a photo from `seed/images/projects/manifest.json` are `published`, and the `74` projects without a photo are `draft`:

| Order | Ref | English Title (`en`) | Arabic Draft Title (`ar`) | Location (`en`) | Client (`company` -> `client`) | Raw Scope -> Category | Featured | Status (`_status`) | Photo (`manifest.json`) |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `A-p11-1` | Princess Noura University (PNU) | جامعة الأميرة نورة (PNU) | KSA | Postech Co. | `Low Current SCS` -> `low-current` | Yes (`#1`) | `draft` | — |
| 2 | `XLSX-13` | Sofitel Makkah Hotel | فندق سوفيتيل مكة | Makkah Region, KSA | Beyout Makkah Co. | `MEP` -> `mep` | Yes (`#2`) | **`published`** | `sofitel-makkah-hotel.jpg` |
| 3 | `A-p11-8` | Stella Hotel (32 floors) | فندق ستيلا (32 طابقاً) | Dubai, UAE | Target Co. | `MEP` -> `mep` | Yes (`#3`) | `draft` | — |
| 4 | `A-p11-4` | Roads & Transport Authority (RTA) | هيئة الطرق والمواصلات (RTA) | Dubai, UAE | Target Co. | `Data Center MEP` -> `data-center` | Yes (`#4`) | `draft` | — |
| 5 | `A-p11-25` | King Salman Oasis of Science | واحة الملك سلمان للعلوم | KSA | AKNAN | `MEP` -> `mep` | Yes (`#5`) | `draft` | — |
| 6 | `XLSX-27` | AL Maqam Tower (A,B,C,D) | أبراج المقام (أ، ب، ج، د) | Makkah Region, KSA | ATTAMEER CO. | `MEP` -> `mep` | Yes (`#6`) | **`published`** | `al-maqam-towers.jpg` |
| 7 | `A-p11-2` | NOMURA Investment Banking (Middle East) | بنك نومورا للاستثمار (الشرق الأوسط) | KSA | Postech Co. | `Low Current Systems` -> `low-current` | No | `draft` | — |
| 8 | `A-p11-3` | Bank of America (Merrill Lynch) | بنك أوف أمريكا (ميريل لينش) | KSA | Postech Co. | `MEP` -> `mep` | No | `draft` | — |
| 9 | `A-p11-5` | Student Accommodation, Tabuk University | سكن الطلاب، جامعة تبوك | KSA | Target Co. | `MEP` -> `mep` | No | `draft` | — |
| 10 | `A-p11-6` | Medical Science College, Taif University | كلية العلوم الطبية، جامعة الطائف | KSA | Target Co. | `MEP` -> `mep` | No | `draft` | — |
| 11 | `A-p11-7` | Cadillac Showroom - Al Jomaih | معرض كاديلاك — الجميح | KSA | Somit Co. | `MEP` -> `mep` | No | `draft` | — |
| 12 | `A-p11-9` | Police Training Institute | معهد تدريب الشرطة | Qatar | Target Co. | `MEP` -> `mep` | No | `draft` | — |
| 13 | `A-p11-10` | Al Hada Armed Forces Hospital | مستشفى الهدا للقوات المسلحة | KSA | Honeywell Co. | `Fire Alarm System` -> `fire-fighting` | No | `draft` | — |
| 14 | `A-p11-11` | Saudi Post (Jeddah) | البريد السعودي (جدة) | Jeddah, KSA | MERCO Co. | `MEP Upgrade` -> `mep` | No | `draft` | — |
| 15 | `A-p11-12` | Zamzam Health Building 3 | مبنى زمزم الصحي 3 | Makkah, KSA | SVC Co. | `Fire Fighting` -> `fire-fighting` | No | `draft` | — |
| 16 | `A-p11-13` | Jouf Cement Factory | مصنع أسمنت الجوف | KSA | MERCO Sister Company | `Civil & MEP` -> `civil-mep` | No | `draft` | — |
| 17 | `A-p11-14` | 7 Schools (Jazan) | 7 مدارس (جازان) | Jazan, KSA | MERCO Sister Company | `Civil & MEP` -> `civil-mep` | No | `draft` | — |
| 18 | `A-p11-15` | King Fahd Medical Hospital | مستشفى الملك فهد الطبي | Jeddah, KSA | MERCO | `Fire Alarm & CCTV` -> `fire-fighting` | No | `draft` | — |
| 19 | `A-p11-16` | IKEA Store, Riyadh | معرض إيكيا، الرياض | Riyadh, KSA | Sister company | `Structured Cabling` -> `low-current` | No | `draft` | — |
| 20 | `A-p11-17` | IKEA, Hofuf Branch | إيكيا، فرع الهفوف | Hofuf, KSA | MERCO | `Video Wall` -> `low-current` | No | `draft` | — |
| 21 | `A-p11-18` | KAP1 (5 projects) | مشروع KAP1 (5 مشاريع) | KSA | MERCO | `Low Current Systems` -> `low-current` | No | `draft` | — |
| 22 | `A-p11-19` | Shaqra University | جامعة شقراء | KSA | Petrojet | `Data & Low Current Systems` -> `low-current` | No | `draft` | — |
| 23 | `A-p11-20` | Ministry of Municipality Auditorium | قاعة المؤتمرات بوزارة الشؤون البلدية | Riyadh, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 24 | `A-p11-21` | Mobily Terminal Building | مبنى محطة موبايلي | KSA | Petrojet | `MEP` -> `mep` | No | `draft` | — |
| 25 | `A-p11-22` | Al Andalus Intercontinental Hotel | فندق الأندلس إنتركونتيننتال | Jeddah, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 26 | `A-p11-23` | Al Essa Hotel | فندق العيسى | Riyadh, KSA | AKNAN | `MEP` -> `mep` | No | `draft` | — |
| 27 | `A-p11-24` | Al Thumamah Park | منتزه الثمامة | KSA | AKNAN | `MEP` -> `mep` | No | `draft` | — |
| 28 | `XLSX-1` | Hotel AL Janaderiah Palace Hotel | فندق قصر الجنادرية | Makkah Region, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | **`published`** | `hotel-al-janadriah-tower.jpg` (`XLSX-1\|XLSX-2`) |
| 29 | `XLSX-2` | Hotel AL Janadriah Palace | قصر الجنادرية الفندقي | Makkah Region, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 30 | `XLSX-3` | Hotel Rehab AL Janadriah | فندق رحاب الجنادرية | Makkah Region, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | **`published`** | `hotel-rehab-al-janadriah.jpg` |
| 31 | `XLSX-4` | AL Zaher Tower (1) | برج الزاهر (1) | Makkah Region, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 32 | `XLSX-5` | AL Zaher Tower (2) | برج الزاهر (2) | Makkah Region, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 33 | `XLSX-6` | Gabal Sawdan Tower | برج جبل سودان | Makkah Region, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 34 | `XLSX-7` | AL Dahla Tower | برج الدحلة | Makkah Region, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 35 | `XLSX-8` | Safwat AL Shrooq Hotel | فندق صفوة الشروق | Makkah Region, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | **`published`** | `safwat-al-shrooq-hotel.jpg` |
| 36 | `XLSX-9` | Manar AL Shrooq Hotel | فندق منار الشروق | Makkah Region, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 37 | `XLSX-10` | Rawdat AL Shrooq Hotel | فندق روضة الشروق | Makkah Region, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | **`published`** | `rawdat-al-shrooq-hotel.jpg` |
| 38 | `XLSX-11` | Dar AL Shrooq Hotel | فندق دار الشروق | Makkah Region, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 39 | `XLSX-12` | Bafel Khyat Tower | برج بافيل خياط | Makkah Region, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 40 | `XLSX-14` | Meridien Makkah Hotel | فندق ميريديان مكة | Makkah Region, KSA | Beyout Makkah Co. | `MEP` -> `mep` | No | **`published`** | `meridien-makkah-hotel.jpg` |
| 41 | `XLSX-15` | Mawakeb AL Rawdah Hotel | فندق مواكب الروضة | Makkah Region, KSA | Beyout Makkah Co. | `MEP` -> `mep` | No | `draft` | — |
| 42 | `XLSX-16` | Beyout Makkah Pavilion HQ | المقر الرئيسي لشركة بيوت مكة | Makkah Region, KSA | Beyout Makkah Co. | `MEP` -> `mep` | No | `draft` | — |
| 43 | `XLSX-17` | Otaybiah Central Market | سوق العتيبية المركزي | Makkah Region, KSA | Beyout Makkah Co. | `MEP` -> `mep` | No | **`published`** | `otaybiah-central-market.jpg` |
| 44 | `XLSX-18` | Ramada Dar AL Faezeen Hotel | فندق رمادا دار الفائزين | Makkah Region, KSA | AL Masa Co. | `MEP` -> `mep` | No | **`published`** | `ramada-makkah-hotel.jpg` (`XLSX-18\|XLSX-19`) |
| 45 | `XLSX-19` | Ramada Ashee Hotel | فندق رمادا عشقي | Makkah Region, KSA | AL Masa Co. | `MEP` -> `mep` | No | `draft` | — |
| 46 | `XLSX-20` | Elaf AL Moltaqa Hotel | فندق إيلاف الملتقى | Makkah Region, KSA | AL Masa Co. | `MEP` -> `mep` | No | `draft` | — |
| 47 | `XLSX-21` | Eoan Hotel | فندق إيوان | Makkah Region, KSA | AL Masa Co. | `MEP` -> `mep` | No | `draft` | — |
| 48 | `XLSX-22` | Jeddah Palace Hotel | فندق قصر جدة | Makkah Region, KSA | AL Jazera Co. | `MEP` -> `mep` | No | **`published`** | `jeddah-palace-hotel.jpg` |
| 49 | `XLSX-23` | Dorrat AL Khalil Hotel | فندق درة الخليل | Makkah Region, KSA | BAL Jazera Co. | `MEP` -> `mep` | No | `draft` | — |
| 50 | `XLSX-24` | Habibah Hotel Makkah | فندق حبيبة مكة | Makkah Region, KSA | Nouh Maraq | `MEP` -> `mep` | No | `draft` | — |
| 51 | `XLSX-25` | AL Souhadaa Hotel | فندق الشهداء | Makkah Region, KSA | AL Jazera Co. | `MEP` -> `mep` | No | `draft` | — |
| 52 | `XLSX-26` | Watany Mall | الوطني مول | Makkah Region, KSA | AL Jazera Co. | `MEP` -> `mep` | No | `draft` | — |
| 53 | `XLSX-28` | AL Naseem Tower (91 to 99) | برج النسيم (91 إلى 99) | Makkah Region, KSA | ATTAMEER CO. | `MEP` -> `mep` | No | **`published`** | `al-naseem-towers.jpg` |
| 54 | `XLSX-29` | Aziziah Tower | برج العزيزية | Makkah Region, KSA | ATTAMEER CO. | `MEP` -> `mep` | No | **`published`** | `aziziah-tower.jpg` |
| 55 | `XLSX-30` | Olayan Tower Qudai | برج العليان كدي | Makkah Region, KSA | Olayan Group | `MEP` -> `mep` | No | `draft` | — |
| 56 | `XLSX-31` | Ghadeer Tower Qudai | برج غدير كدي | Makkah Region, KSA | Olayan Group | `MEP` -> `mep` | No | `draft` | — |
| 57 | `XLSX-32` | Culture Center Qudai | المركز الثقافي كدي | Makkah Region, KSA | Olayan Group | `MEP` -> `mep` | No | `draft` | — |
| 58 | `XLSX-33` | Olayan Tower Aziziah | برج العليان العزيزية | Makkah Region, KSA | Olayan Group | `MEP` -> `mep` | No | `draft` | — |
| 59 | `XLSX-34` | Olayan Golden Hotel | فندق العليان الذهبي | Makkah Region, KSA | Olayan Group | `MEP` -> `mep` | No | **`published`** | `olayan-golden-hotel.jpg` |
| 60 | `XLSX-35` | Naaeb AL Haram Hotel | فندق نائب الحرم | Makkah Region, KSA | Olayan Group | `MEP` -> `mep` | No | **`published`** | `naaeb-al-haram-hotel.jpg` |
| 61 | `XLSX-36` | Shk. Saleh AL Owied | مشروع الشيخ صالح العويد | Makkah Region, KSA | Olayan Group | `MEP` -> `mep` | No | `draft` | — |
| 62 | `XLSX-37` | Hyper Abraj | هايبر أبراج | Makkah Region, KSA | AL Zaydi Group | `MEP` -> `mep` | No | **`published`** | `hyper-abraj.jpg` |
| 63 | `XLSX-38` | AL Zaydi Concrete Factory | مصنع الزيدي للخرسانة | Makkah Region, KSA | AL Zaydi Group | `MEP` -> `mep` | No | **`published`** | `al-zaydi-concrete-factory.jpg` |
| 64 | `XLSX-39` | AL Mona Ajiad Hotel | فندق المنى أجياد | Makkah Region, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 65 | `XLSX-40` | AL Lewaa Hotel | فندق اللواء | Makkah Region, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 66 | `XLSX-41` | Abou AL Jadail Kitchen | مطبخ أبو الجدايل | Makkah Region, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 67 | `XLSX-42` | Abdullah Bokhari Hotel | فندق عبدالله بخاري | Makkah Region, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 68 | `XLSX-43` | Abdulatif Sendy Hotel | فندق عبداللطيف سندي | Makkah Region, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 69 | `XLSX-44` | Abou Ghalia Consultant HQ | المقر الرئيسي لاستشارات أبو غالية | Makkah Region, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 70 | `XLSX-45` | Nursery School | مدرسة رياض أطفال | Makkah Region, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 71 | `XLSX-46` | Labor Court Bathaa Qwraish | المحكمة العمالية ببطحاء قريش | Makkah Region, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 72 | `XLSX-47` | National Water Company Building | مبنى شركة المياه الوطنية | Makkah Region, KSA | AL Zaydi Group | `MEP- Upgrad` -> `mep` | No | **`published`** | `national-water-company-building.jpg` |
| 73 | `XLSX-48` | Awqaf AL Moufty Hotel AL Joumaizah | فندق أوقاف المفتي الجميزة | Makkah Region, KSA | Awqaf AL Moufty | `MEP` -> `mep` | No | `draft` | — |
| 74 | `XLSX-49` | Awqaf AL Moufty Hotel AL Aziziah | فندق أوقاف المفتي العزيزية | Makkah Region, KSA | Awqaf AL Moufty | `MEP` -> `mep` | No | `draft` | — |
| 75 | `XLSX-50` | Awqaf AL Moufty Hotel Ibrahim AL Khalil | فندق أوقاف المفتي إبراهيم الخليل | Makkah Region, KSA | Awqaf AL Moufty | `MEP` -> `mep` | No | `draft` | — |
| 76 | `XLSX-51` | Mena Sanitary Network | شبكة الصرف الصحي بمنى | Makkah Region, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 77 | `XLSX-52` | Charity Inst. Block Makkah | مجمع المؤسسة الخيرية بمكة | Makkah Region, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 78 | `XLSX-53` | Charity Inst. Block Jeddah | مجمع المؤسسة الخيرية بجدة | Makkah Region, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 79 | `XLSX-54` | Issa Bin Laden HQ | المقر الرئيسي لعيسى بن لادن | Makkah Region, KSA | Issa Bin Laden | `MEP` -> `mep` | No | `draft` | — |
| 80 | `XLSX-55` | Issa Bin Laden HQ Parking | مواقف المقر الرئيسي لعيسى بن لادن | Makkah Region, KSA | Issa Bin Laden | `MEP` -> `mep` | No | `draft` | — |
| 81 | `XLSX-56` | Hamraa Hospital Jeddah | مستشفى الحمراء بجدة | Makkah Region, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 82 | `XLSX-57` | Issa Bin Laden Stores (1 to 9) | معارض عيسى بن لادن (1 إلى 9) | Makkah Region, KSA | Issa Bin Laden | `MEP` -> `mep` | No | `draft` | — |
| 83 | `XLSX-58` | Mena Gate Hotel | فندق بوابة منى | Makkah Region, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 84 | `XLSX-59` | Awali Mall Makkah | العوالي مول مكة | Makkah Region, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 85 | `XLSX-60` | Afwaj AL Tawba Hotel (1 to 15) | فندق أفواج التوبة (1 إلى 15) | Makkah Region, KSA | Afwaj AL Tawba Group | `MEP` -> `mep` | No | `draft` | — |
| 86 | `XLSX-61` | Afwaj AL Tawba Group Store | مستودع مجموعة أفواج التوبة | Makkah Region, KSA | Afwaj AL Tawba Group | `MEP` -> `mep` | No | `draft` | — |
| 87 | `XLSX-62` | AL Zaydi Kitchen | مطبخ الزيدي | Makkah Region, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 88 | `XLSX-63` | AL Fraj Stores | معارض الفراج | Makkah Region, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 89 | `XLSX-64` | Qawafel Makkah Market | سوق قوافل مكة | Makkah Region, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 90 | `XLSX-65` | Maternity and Children Hospital Makkah | مستشفى الولادة والأطفال بمكة | Makkah Region, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 91 | `XLSX-66` | Family Market Makkah | سوق العائلة بمكة | Makkah Region, KSA | — | `MEP` -> `mep` | No | `draft` | — |

---

### `needsClientReview` Inventory & Client Confirmation Checklist

The checklist below can be sent directly to the client to review and confirm before publishing draft items or enabling the public Arabic locale (`site-settings.arabicEnabled`):

1. **Company Metrics (`stats` collection — 5 items, live)**:
   - [ ] `45+` — `Years of Experience` / `عاماً من الخبرة`
   - [ ] `100+` — `Buildings Delivered` / `مبنى تم تسليمه`
   - [ ] `85%` — `Self-Performed Work` / `تنفيذ ذاتي بكوادرنا`
   - [ ] `21+` — `MEP Disciplines` / `تخصصاً في أعمال الكهروميكانيك`
   - [ ] `3` — `Countries Served` / `دول نخدمها` (Saudi Arabia, UAE, Qatar)
2. **20 Marquee Brands & HQ Countries (`brands` where `showInMarquee: true`)**:
   - [ ] Confirm the 20 marquee brands, their display order (`1..20`), and their HQ countries (`France`, `Switzerland`, `Germany`, `USA` / `United States`, `Japan`, `Saudi Arabia`, `Denmark`, `UAE`, `Egypt`) in the Scope 4b table above.
   - [ ] Confirm display names for the 3 material brands whose Figma mockup names differed from the raw materials list: `Cooper` (`Eaton Cooper`), `System Air` (`Systemair`), `Al-Rajhi Steel` (`Al Rajhi Steel`).
3. **Approved Materials Rows 58–73 (`structural` & `architectural`, `P4-T1`)**:
   - [ ] In `seed/materials.raw.json` rows `58–73`, the `"origin"` column contained a second supplier/manufacturer name rather than a country of origin (`Al-Rajhi Steel` / `SABIC`, `Excon` / `Saudi Readymix`, `Obeikan Glass` / `Guardian`, etc.). Both were seeded as brands with `origin` left empty (`null`). Please confirm the country of origin for each brand in rows `58–73` (note: `Zamil` was matched to `Zamil Air Conditioners` in Scope 4b and filled with `Saudi Arabia`).
   - [ ] Confirm whether parenthetical notes extracted from brand cells on row `#31` (`JAZEERA (PRIMER)` -> brand `Jazeera`, note `"Primer"`) and row `#57` (`Hempel (Coating)` -> brand `Hempel`, note `"Coating"`) match the intended brand names.
4. **91 Real Projects (`projects` collection)**:
   - [ ] **2 Ambiguous Photo Captions**:
     - Does `hotel-al-janadriah-tower.jpg` (`"Hotel AL Janadriah Tower"`) belong to `XLSX-1` (`Hotel AL Janaderiah Palace Hotel`) or `XLSX-2` (`Hotel AL Janadriah Palace`)?
     - Does `ramada-makkah-hotel.jpg` (`"Ramada Makkah Hotel"`) belong to `XLSX-18` (`Ramada Dar AL Faezeen Hotel`) or `XLSX-19` (`Ramada Ashee Hotel`)?
   - [ ] **Specific Sub-Disciplines on General `"MEP"`, `"MEP Upgrade"`, `"Data Center MEP"`, `"Civil & MEP"`, and `"Data & Low Current Systems"` Projects (`D-02`)**: Raw scopes were mapped literally without inventing sub-discipline tags (`MEP` -> `['mep']`, `Data Center MEP` -> `['data-center', 'mep']`, `Civil & MEP` -> `['civil', 'mep']`, `Data & Low Current Systems` -> `['low-current']`). Please confirm which specific sub-disciplines (`HVAC`, `electrical`, `plumbing`, `fire-fighting`, `low-current`, `data-center`) apply to each project.
   - [ ] **Makkah Region Section Header Locations (`XLSX-1`..`XLSX-66`) & Rows Naming Another City (`R-13`)**:
     - Rows `XLSX-1`..`XLSX-66` were listed under the section header `"Makkah"` in the profile and are seeded literally as `Makkah Region, KSA` / `منطقة مكة المكرمة، المملكة العربية السعودية`. Please confirm the specific city/district for each project, especially the **3 rows under that header whose title names `Jeddah`**:
       1. `XLSX-22` — `Jeddah Palace Hotel` / `فندق قصر جدة` (**published** with photo `jeddah-palace-hotel.jpg`) — confirm whether the hotel is in `Jeddah, KSA` or `Makkah, KSA`.
       2. `XLSX-53` — `Charity Inst. Block Jeddah` / `مجمع المؤسسة الخيرية بجدة` (`draft`) — confirm whether location is `Jeddah, KSA`.
       3. `XLSX-56` — `Hamraa Hospital Jeddah` / `مستشفى الحمراء بجدة` (`draft`) — confirm whether location is `Jeddah, KSA`.
     - In addition, under the national projects list (`A-p11-*`) where the raw location is `"KSA"`, confirm the specific city for: `A-p11-5` (`Student Accommodation, Tabuk University` — Tabuk), `A-p11-6` (`Medical Science College, Taif University` — Taif), `A-p11-10` (`Al Hada Armed Forces Hospital` — Al Hada / Taif), `A-p11-13` (`Jouf Cement Factory` — Al-Jouf), `A-p11-19` (`Shaqra University` — Shaqra), and `A-p11-24` (`Al Thumamah Park` — Riyadh).
   - [ ] **Cover Photos for the 74 Draft Projects**: Provide exterior/interior photos for the 74 draft projects (especially the 4 draft featured projects on the Home page: `Princess Noura University (PNU)`, `Stella Hotel (32 floors)`, `Roads & Transport Authority (RTA)`, and `King Salman Oasis of Science`) so they can be published.
   - [ ] **Higher-Resolution Replacements for the 17 Profile Photos**: Replace the 17 2x-enhanced print scan thumbnails from `seed/images/projects/` with original high-resolution photos via `/admin/collections/media` when available.
5. **Corporate Quote (`about-page.story` — currently in `draft`, `D-01`)**:
   - [ ] Confirm the corporate quote and attribution on the About Us page: `“Developing and serving society with the highest levels of professional integrity and commitment.” — Al Jazira for Imdad Smart Company` (`«تنمية المجتمع وخدمته بأعلى مستويات النزاهة المهنية والالتزام.» — شركة الجزيرة الإمداد الذكي`).
6. **Team Members (`team` collection — 13 `[placeholder]` records currently `active: false`)**:
   - [ ] Provide real names, positions, biographies, LinkedIn URLs, and 4:5 portraits (`min 800×1000`) for the 5 Leadership cards (`Chairman`, `Chief Executive Officer`, `Commercial Director`, `Engineering Manager`, `Project Manager`) and real staff entries for the wider team marquee, then set `active: true`.
7. **Services & Page Globals Copy (`services` + `home-page`, `services-page`, `about-page`, `projects-page`, `contact-page`, `privacy-page` — all currently `draft`)**:
   - [ ] Review and approve the English and drafted Arabic copy on all `10` services and `6` page globals, and supply final legal text for `privacy-page` (`D4`).
   - [ ] Provide official social media URLs (`LinkedIn`, `X`, `Instagram`, etc.) for `site-settings.socials` (currently empty `[]`).
   - [ ] Once Arabic copy across all collections and globals is approved, an admin can enable `site-settings.arabicEnabled = true` in `/admin/globals/site-settings`.

---

### Evidence
- Unit and integration test suites (`src/seed/p4-t2.test.ts`, `tests/int/p4-t1.int.test.ts`, `tests/int/p4-t2.int.test.ts`, `src/access/z1-config-enumeration.test.ts`) and non-authoritative Round 1 artifacts in `docs/reports/phase-4/P4-T2/r1/`. Authoritative runtime verification and numbers of record come from the CTO's independent verifier.

### Acceptance criteria
- [x] **Idempotent (second run changes nothing)** — Enforced by `seedP4T2Content` in `src/seed/p4-t2.ts` and tested in `tests/int/p4-t2.int.test.ts` (`refuses a second run without --reseed (first-run baseline guard) and leaves the database unchanged` and `refuses to run seedP4T2Content without --reseed when P4-T1 is half-empty (brands only or materials only) and leaves the database unchanged (R-14)`).
- [x] **Everything is draft except what the scope explicitly publishes (4a: the 17 completed projects with a photo; 4b: the brands). Nothing placeholder is visible to anonymous visitors (query proof + anonymous REST calls)** — Enforced across `services`, `projects`, `team`, `media`, and page globals, and tested in `tests/int/p4-t2.int.test.ts` (`hides all drafts, [placeholder] items, and admin-only review fields (needsClientReview, reviewNote) from anonymous visitors across Local API and REST endpoints`, including anonymous REST list `GET /api/media`, by ID `GET /api/media/:id`, and static file URL `GET /api/media/file/:filename`).
- [x] **With the seed loaded, every page renders completely in draft mode for an editor (screenshots ar + en)** — Editor draft-mode screenshots in `docs/reports/phase-4/P4-T2/r1/`.

### Dependencies added/changed
- None.

### Security notes
- All seed operations in `seedMaterialsAndBrands` (`src/seed/materials.ts`) and `seedP4T2Content` (`src/seed/p4-t2.ts`) use Payload's Local API with `overrideAccess: false` and `SEED_ADMIN_USER`.
- `P4_T2_SEED_SERVER_ONLY_SENTINEL` and `P4_T2_DATA_SERVER_ONLY_SENTINEL` are checked against `.next/static` by `scripts/check-client-bundle-sentinels.mjs`.
- `needsClientReview` on `projects` enforces `isAdminOrEditorFieldLevel`, `reviewNote` on `projects` enforces `isAdminFieldLevel` (`D-05` / `A-05`), and `placeholder` on `media` enforces `isAdminFieldLevel` with anonymous `Media.access.read` filtering `{ placeholder: { equals: false } }` (`R-12`).
- `getFallbackLocale` (`src/lib/cms/client.ts`) returns `false` when `locale === 'en'` (`R-7`), and `resolveExpectedRequestOrigin` (`src/lib/cms/client.ts`) derives the expected origin strictly from `SERVER_URL` / `NEXT_PUBLIC_SERVER_URL` (`R-11`).

### Deviations from spec
- Pre-submission fixes applied per CTO message `M-172` (`D-01`, `D-02`, `D-05`/`A-05`, `D-09`, `D-10`, `D-11`) and Round 1 review findings (`R-12`..`R-18`).

### Questions for CTO
- None (all client confirmation questions are catalogued in the Client Confirmation Checklist above).
