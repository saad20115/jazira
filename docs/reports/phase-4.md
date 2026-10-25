# Phase 4 — Real Client Data, Settings, Services, Projects, Marquee, Copy & Placeholders Seed (`P4-T1` + `P4-T2`)

## Phase 4 — Content & Real Data Seed

### Done
- **`P4-T1` (`Materials + brands seed` + `§0` `R-8`..`R-11` fixes)**:
  - Implemented deterministic normalization, planning, and Local API seeding of all `73` approved materials (`20` `electrical`, `37` `mechanical`, `8` `structural`, `8` `architectural`) and `83` normalized material brands from `seed/materials.raw.json` in [src/seed/materials.ts](file:///d:/jazira/src/seed/materials.ts).
  - Applied the general parenthetical product-note extraction rule (`extractTrailingParentheticalProductNote` at `src/seed/materials.ts:624`) so any trailing parenthetical note in a brand cell (`Hempel (Coating)` on row `#57` and `JAZEERA (PRIMER)` on row `#31`) is stripped from the brand name (`Hempel`, `Jazeera`) and preserved in the material's `notes` (`R-9`).
  - Updated Arabic draft `#26` to `ZCV للحريق` (`src/seed/materials.ts:341`) and `#31` note to `طلاء` (`src/seed/materials.ts:409`) (`R-10`), fixed `"Jihanzi - UL/FM"` spacing (`src/seed/materials.ts:865`), logged `brandsDeleted` and `materialsDeleted` on `--reseed` (`src/seed/materials.ts:1355`), and added half-empty database guard integration tests (`brands`-only / `materials`-only) in [tests/int/p4-t1.int.test.ts](file:///d:/jazira/tests/int/p4-t1.int.test.ts) (`R-8`, `R-11`).
- **`P4-T2` `§0b` (`R-7`..`R-11` carried from `P3-T12` r2)**:
  - Updated `getFallbackLocale` in [src/lib/cms/client.ts](file:///d:/jazira/src/lib/cms/client.ts) (`src/lib/cms/client.ts:201`) so `en` never falls back to `ar` (`return locale === 'ar' ? 'en' : false`), tested in [src/p3-t12-arabic-switch.test.ts](file:///d:/jazira/src/p3-t12-arabic-switch.test.ts) (`src/p3-t12-arabic-switch.test.ts:535`) and [tests/e2e/p3-t12.e2e.spec.ts](file:///d:/jazira/tests/e2e/p3-t12.e2e.spec.ts) (`tests/e2e/p3-t12.e2e.spec.ts:66`) (`R-7`).
  - Imported and tested the real `isAuthorizedArabicPreviewRequest` in `src/p3-t12-arabic-switch.test.ts:12` (`:101`, `:449`) (`R-8`).
  - Updated `tests/e2e/p3-t12.e2e.spec.ts:51` to follow Next.js `_rsc` redirects (`maxRedirects: 5`) with `RSC: '1'` and `'Next-Router-State-Tree': '%5B%22%22%2C%7B%7D%5D'` and assert on the real `text/x-component` flight payload (`R-9`).
  - Added `test.setTimeout(120_000)` to `tests/e2e/p3-t12.e2e.spec.ts:6` (`R-10`).
  - Derived the expected origin in `resolveExpectedRequestOrigin` (`src/lib/cms/client.ts:309`) strictly from `process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'` (`R-11`).
- **`P4-T2` Content Model Update & Migration (`CTO 2026-10-24` + `M-172` `D-05`/`A-05`)**:
  - Updated [src/collections/Projects.ts](file:///d:/jazira/src/collections/Projects.ts) (`src/collections/Projects.ts:298` & `:904`) so `coverImage` is optional on drafts (`_status === 'draft'`) and required only when `_status === 'published'`, added `needsClientReview` (`checkbox`, `defaultValue: false`) restricted to staff via `isAdminOrEditorFieldLevel` (`src/collections/Projects.ts:1164`–`:1172`), and added `reviewNote` (`textarea`) restricted strictly to the `admin` role (`read`, `create`, `update`: `isAdminFieldLevel` at `src/collections/Projects.ts:1186`–`:1194`).
  - Created and committed additive Payload migration [src/migrations/20261025_002404_p4_t2_projects_review_fields.ts](file:///d:/jazira/src/migrations/20261025_002404_p4_t2_projects_review_fields.ts) (`DROP NOT NULL` on `projects.cover_image_id` and `ADD COLUMN needs_client_review`, `review_note`).
  - Updated [src/components/ProjectCard.tsx](file:///d:/jazira/src/components/ProjectCard.tsx) (`src/components/ProjectCard.tsx:56`–`:64`) to cap responsive `sizes` to `Math.floor(mediaAsset.width / 2)` (`maxCssWidth`) so 2x-enhanced scan thumbnails from `seed/images/projects/manifest.json` never render wider than their intrinsic pixel width.
  - Updated `getTeamMembers` in [src/lib/cms/collections.ts](file:///d:/jazira/src/lib/cms/collections.ts) (`src/lib/cms/collections.ts:347`–`:373`) so inactive (`active: false`) placeholder team members are hidden from anonymous visitors (`getTeamMembers` returns `[]`) while visible to authenticated editors in draft preview (`isDraft === true`).
- **Branch Integration (`M-168`)**:
  - Merged `p3-t5-seam` into `phase-3-frontend` (`git merge --no-ff p3-t5-seam -m "merge: P3-T5 seam (section 4 → InteractiveSystemsSection)"`, merge commit `a267b06d692ba5eea683fcb5e574c42be56dedd1` / `a267b06`). `p3-t5-live-3d` was not merged.
- **`P4-T2` Seed Implementation ([src/seed/p4-t2-data.ts](file:///d:/jazira/src/seed/p4-t2-data.ts), [src/seed/p4-t2.ts](file:///d:/jazira/src/seed/p4-t2.ts), [scripts/seed.ts](file:///d:/jazira/scripts/seed.ts))**:
  - **Scope 1 (`site-settings` & `navigation`)**: Seeded `site-settings` (`arabicEnabled: false`, `companyName`, `tagline`, `phone: '+966 57 353 4185'`, `whatsapp: '966573534185'`, `whatsappLabel`, `email: 'info@aljazira.co'`, `address: '7676 Bathaa Quraish, Makkah Al-Mukarramah, KSA'`, `workingHours`, `office` with `mapImage: null`, `socials: []`, `footerText`, `copyright`, `defaultSeo` with `image: null`, `src/seed/p4-t2.ts:1244`–`:1306`) and `navigation` (`header`, `headerCta`, `footer`, `footerCta` without any unverified reply-time promise, `src/seed/p4-t2.ts:1308`–`:1404`) in both `en` and `ar` (`D-01`).
  - **Scope 2 (`stats`)**: Seeded the `5` design metrics (`45+` `Years of Experience`, `100+` `Buildings Delivered` / `مبنى تم تسليمه`, `85%` `Self-Performed Work`, `21+` `MEP Disciplines`, `3` `Countries Served`, `src/seed/p4-t2-data.ts:215`–`:251`) in `en` and `ar` (`D-01`).
  - **Scope 3 (`services`)**: Seeded all `10` services (`4` `main` + `6` `additional` specialist services) with English copy and highlights from `design/copy/02-services.md` and Arabic drafts (`src/seed/p4-t2-data.ts:272`–`:467`), saved as `_status: 'draft'`.
  - **Scope 4 & 4c (Page Globals as `draft`)**: Seeded `home-page` (from `design/copy/01-home.md` while `docs/content/copy-v2/01-home.md` is in `final draft` status per `M-154`, with `interactiveSystems.systems` populated in **both** `en` and `ar` from `DEFAULT_INTERACTIVE_SYSTEMS_EN`/`_AR`, `interactiveSystems.relatedProjectsLabel` set to `'Related projects'` / `'مشاريع ذات صلة'` per `D-11`, and `statsSection.backgroundImage` set to `bg-pipes.png`, `src/seed/p4-t2.ts:1426`–`:1653`), `services-page`, `about-page` (without any personal founder name or `"formerly known as IMDAD Group"`, and with `90+ completed projects across 100+ buildings` per `D-01`, `src/seed/p4-t2.ts:1841`–`:2112`), `projects-page` (`90+ completed MEP, fire fighting, smart-systems and data-center projects across 100+ buildings`, `src/seed/p4-t2.ts:2115`–`:2225`), `contact-page`, and `privacy-page` (`[placeholder]`) in both `en` and `ar`, all with `_status: 'draft'`.
  - **Scope 4a (`91` Real Projects + `17` Profile Photos)**: Uploaded all `17` enhanced project photos from `seed/images/projects/manifest.json` to `media` with English alt text `"<project> — exterior"` and Arabic alt text `"<project_ar> — واجهة خارجية"`; seeded all `91` projects from `seed/projects.raw.json` with title-only slugs (`slugifyProjectTitle` at `src/seed/p4-t2.ts:187`, `D-09`), literal `rawScope` discipline mappings without invented `fire-fighting` or `low-current` tags (`mapRawProjectScope` at `src/seed/p4-t2-data.ts:688`–`:800`, `D-02`), `status: 'completed'`, `company` mapped to `client` (`"-"`/`""` -> `null`), the `6` Figma featured projects ordered `1..6`, the `17` projects with a photo published (`_status: 'published'`), the `74` projects without a photo kept in draft (`_status: 'draft'`, `coverImage: null`), and `needsClientReview: true` + `reviewNote` on all `91`.
  - **Scope 4b (`20` Owner Marquee Brands)**: Cleared `showInMarquee` on the `16` old Figma marquee brands that are not in the owner's 20-brand list, matched the `4` existing `P4-T1` brands (`Zamil` -> renamed in place to `Zamil Air Conditioners`, `Legrand`, `Alfanar` -> `alfanar`, and `Belden`, `D-10`), created the `16` new marquee brands (`99` brands total: `83` from `P4-T1` + `16` created in `P4-T2`), and ordered all `20` owner-approved marquee brands `1..20` with their HQ countries in `en` and `ar`.
  - **Scope 5 & 6 (Placeholders & Design Assets)**: Uploaded the `9` Figma website images from `design/assets/images/` with `[placeholder]` in their `en` and `ar` alt text (`src/seed/p4-t2-data.ts:956`–`:1011`), and seeded the `13` placeholder `team` members (`5` `leadership` + `8` `staff` marquee roles) with `[placeholder]` in their names and `active: false` (`src/seed/p4-t2-data.ts:819`–`:934`).

---

### Non-Empty Database Seed Check Behaviour After `P4-T2` (`M-172` #6)

`scripts/seed.ts` (`scripts/seed.ts:9`–`:19`) invokes `seedP4T2Content(payload)` (`src/seed/p4-t2.ts:750`–`:897`), which enforces a unified two-tier first-run baseline guard across both `P4-T1` (`brands`, `materials`) and `P4-T2` (`stats`, `services`, `projects`, `team`, `media`):

1. **Without `--reseed` (`reseed === false`, `src/seed/p4-t2.ts:792`–`:800`)**:
   - **Empty database (`brands=0, materials=0, stats=0, services=0, projects=0, team=0`)**: Automatically runs `seedMaterialsAndBrands(payload, { reseed: false })` first (`src/seed/p4-t2.ts:891`–`:897`) to seed the `73` materials and `83` material brands, and then seeds all `P4-T2` collections and globals (`99` total brands, `5` stats, `10` draft services, `91` projects, `13` inactive placeholder team members, `26` media items, `site-settings`, `navigation`, and `6` draft page globals).
   - **Database with `P4-T1` already seeded (`brands=83, materials=73`) and zero `P4-T2` docs (`stats=0, services=0, projects=0, team=0`)**: Skips `seedMaterialsAndBrands` (`brandsAfterClean.totalDocs > 0` at `src/seed/p4-t2.ts:891`) and seeds `P4-T2` on top of the existing `P4-T1` baseline, matching `Zamil` -> `Zamil Air Conditioners`, `Legrand`, `Alfanar` -> `alfanar`, and `Belden`.
   - **Half-empty `P4-T1` state (`(counts.brands > 0) !== (counts.materials > 0)`) OR any existing `P4-T2` docs (`counts.stats > 0 || counts.services > 0 || counts.projects > 0 || counts.team > 0`)**: Immediately throws `[seed] Refusing to run seed on a non-empty database (brands=..., materials=..., stats=..., services=..., projects=..., team=...). The seed is a first-run baseline and never overwrites existing data. Pass --reseed in development to clear and rebuild.` (`src/seed/p4-t2.ts:796`–`:800`) before writing or modifying any row.
2. **With `--reseed` (`reseed === true`, `src/seed/p4-t2.ts:813`–`:882`)**:
   - Refuses to run when `NODE_ENV=production` (`assertSeedEnvironmentAllowed` at `src/seed/materials.ts:1126`–`:1141`).
   - In development/test, when any `P4-T1`/`P4-T2` collection or `media` is non-empty (`hasAnyP4T2Docs || counts.brands > 0 || counts.materials > 0 || counts.media > 0`), first nulls out foreign-key media/stat references on all globals (`clearGlobalsReferencesBeforeReseed` at `src/seed/p4-t2.ts:516`–`:743`), deletes existing rows in dependency order (`projects` -> `services` -> `team` -> `stats` -> `materials` -> `brands` -> `media`), logs all `7` deleted counts (`deletedCounts`), and rebuilds the complete `P4-T1` + `P4-T2` baseline from scratch.

---

### What Is Published vs. Draft (Post-Seed State)

| Collection / Global | Total Seeded | Published / Publicly Visible to Anonymous Visitors | Draft / Inactive (Hidden from Anonymous Visitors) | Notes |
|---|---:|---:|---:|---|
| `materials` | `73` | `73` | `0` | Real approved materials from `seed/materials.raw.json` (`P4-T1`). |
| `brands` | `99` | `99` (`20` with `showInMarquee: true`) | `0` | `83` material brands (`P4-T1`, with `Zamil` matched & renamed to `Zamil Air Conditioners`) + `16` new marquee brands (`P4-T2` Scope 4b). |
| `stats` | `5` | `5` | `0` | `45+`, `100+` (`Buildings Delivered` / `مبنى تم تسليمه`), `85%`, `21+`, `3` (from client-approved design; listed below for confirmation). |
| `services` | `10` | `0` | `10` (`_status: 'draft'`) | `4` `main` + `6` `additional` specialist services; kept in `draft` until client confirms copy. |
| `projects` | `91` | `17` (`_status: 'published'`, have real photo in `manifest.json`) | `74` (`_status: 'draft'`, `coverImage: null`) | All `91` have `needsClientReview: true` (staff-only via `isAdminOrEditorFieldLevel`) and `reviewNote` (admin-only via `isAdminFieldLevel`). Zero `[placeholder]` text on published projects. |
| `team` | `13` | `0` | `13` (`active: false`, prefixed `[placeholder]`) | `5` `leadership` + `8` `staff` marquee roles; `GET /api/team` and anonymous `getTeamMembers` return `0` docs. |
| `media` | `26` | `17` real project photos + `9` design assets | `0` | `17` real project photos have alt `"<project> — exterior"`; `9` Figma design images have alt prefixed `[placeholder]` and are referenced only by draft globals/services/inactive team (`site-settings` references `0` placeholder images). |
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

The 20 marquee brands requested by the owner on 2026-10-24 replace the old Figma marquee list in exact order `1..20`. The HQ countries below (`origin` in `en` and `ar`) should be confirmed by the owner:

| Order | Brand Name (`brands.name`) | Status in Seed | HQ Country (`en`) | HQ Country (`ar` Draft) |
|---:|---|---|---|---|
| 1 | `Schneider Electric` | Created (`P4-T2`) | `France` | `فرنسا` |
| 2 | `ABB` | Created (`P4-T2`) | `Switzerland` | `سويسرا` |
| 3 | `Siemens` | Created (`P4-T2`) | `Germany` | `ألمانيا` |
| 4 | `Carrier` | Created (`P4-T2`) | `USA` | `الولايات المتحدة الأمريكية` |
| 5 | `Trane` | Created (`P4-T2`) | `USA` | `الولايات المتحدة الأمريكية` |
| 6 | `Daikin` | Created (`P4-T2`) | `Japan` | `اليابان` |
| 7 | `York` | Created (`P4-T2`) | `USA` | `الولايات المتحدة الأمريكية` |
| 8 | `Zamil Air Conditioners` | Matched from `P4-T1` (`Zamil`) | `Saudi Arabia` | `المملكة العربية السعودية` |
| 9 | `Grundfos` | Created (`P4-T2`) | `Denmark` | `الدنمارك` |
| 10 | `KSB` | Created (`P4-T2`) | `Germany` | `ألمانيا` |
| 11 | `NAFFCO` | Created (`P4-T2`) | `UAE` | `الإمارات العربية المتحدة` |
| 12 | `Honeywell` | Created (`P4-T2`) | `USA` | `الولايات المتحدة الأمريكية` |
| 13 | `Legrand` | Matched from `P4-T1` | `France` | `فرنسا` |
| 14 | `alfanar` (matched `Alfanar`) | Matched from `P4-T1` | `Saudi Arabia` | `المملكة العربية السعودية` |
| 15 | `Elsewedy Electric` | Created (`P4-T2`) | `Egypt` | `مصر` |
| 16 | `Riyadh Cables` | Created (`P4-T2`) | `Saudi Arabia` | `المملكة العربية السعودية` |
| 17 | `Belden` | Matched from `P4-T1` | `USA` | `الولايات المتحدة الأمريكية` |
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

Every project below is seeded with `status: 'completed'` (owner confirmed 2026-10-24) and `needsClientReview: true`. The `6` Figma featured projects are ordered `1..6` (`featured: true`), the `17` projects with a photo from `seed/images/projects/manifest.json` are `published`, and the `74` projects without a photo are `draft`:

| Order | Ref | English Title (`en`) | Arabic Draft Title (`ar`) | Location (`en`) | Client (`company` -> `client`) | Raw Scope -> Category | Featured | Status (`_status`) | Photo (`manifest.json`) |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `A-p11-1` | Princess Noura University (PNU) | جامعة الأميرة نورة بنت عبدالرحمن (PNU) | KSA | Postech Co. | `Low Current SCS` -> `low-current` | Yes (`#1`) | `draft` | — |
| 2 | `XLSX-13` | Sofitel Makkah Hotel | فندق سوفيتيل مكة | Makkah, KSA | Beyout Makkah Co. | `MEP` -> `mep` | Yes (`#2`) | **`published`** | `sofitel-makkah-hotel.jpg` |
| 3 | `A-p11-8` | Stella Hotel (32 floors) | فندق ستيلا (32 طابقاً) | Dubai, UAE | Target Co. | `MEP` -> `mep` | Yes (`#3`) | `draft` | — |
| 4 | `A-p11-4` | Roads & Transport Authority (RTA) | هيئة الطرق والمواصلات (RTA) | Dubai, UAE | Target Co. | `Data Center MEP` -> `data-center` | Yes (`#4`) | `draft` | — |
| 5 | `A-p11-25` | King Salman Oasis of Science | واحة الملك سلمان للعلوم | KSA | AKNAN | `MEP` -> `mep` | Yes (`#5`) | `draft` | — |
| 6 | `XLSX-27` | AL Maqam Tower (A,B,C,D) | أبراج المقام (أ، ب، ج، د) | Makkah, KSA | ATTAMEER CO. | `MEP` -> `mep` | Yes (`#6`) | **`published`** | `al-maqam-towers.jpg` |
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
| 28 | `XLSX-1` | Hotel AL Janaderiah Palace Hotel | فندق قصر الجنادرية | Makkah, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | **`published`** | `hotel-al-janadriah-tower.jpg` (`XLSX-1\|XLSX-2`) |
| 29 | `XLSX-2` | Hotel AL Janadriah Palace | قصر الجنادرية الفندقي | Makkah, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 30 | `XLSX-3` | Hotel Rehab AL Janadriah | فندق رحاب الجنادرية | Makkah, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | **`published`** | `hotel-rehab-al-janadriah.jpg` |
| 31 | `XLSX-4` | AL Zaher Tower (1) | برج الزاهر (1) | Makkah, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 32 | `XLSX-5` | AL Zaher Tower (2) | برج الزاهر (2) | Makkah, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 33 | `XLSX-6` | Gabal Sawdan Tower | برج جبل سودان | Makkah, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 34 | `XLSX-7` | AL Dahla Tower | برج الدحلة | Makkah, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 35 | `XLSX-8` | Safwat AL Shrooq Hotel | فندق صفوة الشروق | Makkah, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | **`published`** | `safwat-al-shrooq-hotel.jpg` |
| 36 | `XLSX-9` | Manar AL Shrooq Hotel | فندق منار الشروق | Makkah, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 37 | `XLSX-10` | Rawdat AL Shrooq Hotel | فندق روضة الشروق | Makkah, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | **`published`** | `rawdat-al-shrooq-hotel.jpg` |
| 38 | `XLSX-11` | Dar AL Shrooq Hotel | فندق دار الشروق | Makkah, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 39 | `XLSX-12` | Bafel Khyat Tower | برج بافيل خياط | Makkah, KSA | Omar Saeed Bafel Co. | `MEP` -> `mep` | No | `draft` | — |
| 40 | `XLSX-14` | Meridien Makkah Hotel | فندق ميريديان مكة | Makkah, KSA | Beyout Makkah Co. | `MEP` -> `mep` | No | **`published`** | `meridien-makkah-hotel.jpg` |
| 41 | `XLSX-15` | Mawakeb AL Rawdah Hotel | فندق مواكب الروضة | Makkah, KSA | Beyout Makkah Co. | `MEP` -> `mep` | No | `draft` | — |
| 42 | `XLSX-16` | Beyout Makkah Pavilion HQ | المقر الرئيسي لشركة بيوت مكة | Makkah, KSA | Beyout Makkah Co. | `MEP` -> `mep` | No | `draft` | — |
| 43 | `XLSX-17` | Otaybiah Central Market | سوق العتيبية المركزي | Makkah, KSA | Beyout Makkah Co. | `MEP` -> `mep` | No | **`published`** | `otaybiah-central-market.jpg` |
| 44 | `XLSX-18` | Ramada Dar AL Faezeen Hotel | فندق رمادا دار الفائزين | Makkah, KSA | AL Masa Co. | `MEP` -> `mep` | No | **`published`** | `ramada-makkah-hotel.jpg` (`XLSX-18\|XLSX-19`) |
| 45 | `XLSX-19` | Ramada Ashee Hotel | فندق رمادا عشقي | Makkah, KSA | AL Masa Co. | `MEP` -> `mep` | No | `draft` | — |
| 46 | `XLSX-20` | Elaf AL Moltaqa Hotel | فندق إيلاف الملتقى | Makkah, KSA | AL Masa Co. | `MEP` -> `mep` | No | `draft` | — |
| 47 | `XLSX-21` | Eoan Hotel | فندق إيوان | Makkah, KSA | AL Masa Co. | `MEP` -> `mep` | No | `draft` | — |
| 48 | `XLSX-22` | Jeddah Palace Hotel | فندق قصر جدة | Makkah, KSA | AL Jazera Co. | `MEP` -> `mep` | No | **`published`** | `jeddah-palace-hotel.jpg` |
| 49 | `XLSX-23` | Dorrat AL Khalil Hotel | فندق درة الخليل | Makkah, KSA | BAL Jazera Co. | `MEP` -> `mep` | No | `draft` | — |
| 50 | `XLSX-24` | Habibah Hotel Makkah | فندق حبيبة مكة | Makkah, KSA | Nouh Maraq | `MEP` -> `mep` | No | `draft` | — |
| 51 | `XLSX-25` | AL Souhadaa Hotel | فندق الشهداء | Makkah, KSA | AL Jazera Co. | `MEP` -> `mep` | No | `draft` | — |
| 52 | `XLSX-26` | Watany Mall | الوطني مول | Makkah, KSA | AL Jazera Co. | `MEP` -> `mep` | No | `draft` | — |
| 53 | `XLSX-28` | AL Naseem Tower (91 to 99) | برج النسيم (91 إلى 99) | Makkah, KSA | ATTAMEER CO. | `MEP` -> `mep` | No | **`published`** | `al-naseem-towers.jpg` |
| 54 | `XLSX-29` | Aziziah Tower | برج العزيزية | Makkah, KSA | ATTAMEER CO. | `MEP` -> `mep` | No | **`published`** | `aziziah-tower.jpg` |
| 55 | `XLSX-30` | Olayan Tower Qudai | برج العليان كدي | Makkah, KSA | Olayan Group | `MEP` -> `mep` | No | `draft` | — |
| 56 | `XLSX-31` | Ghadeer Tower Qudai | برج غدير كدي | Makkah, KSA | Olayan Group | `MEP` -> `mep` | No | `draft` | — |
| 57 | `XLSX-32` | Culture Center Qudai | المركز الثقافي كدي | Makkah, KSA | Olayan Group | `MEP` -> `mep` | No | `draft` | — |
| 58 | `XLSX-33` | Olayan Tower Aziziah | برج العليان العزيزية | Makkah, KSA | Olayan Group | `MEP` -> `mep` | No | `draft` | — |
| 59 | `XLSX-34` | Olayan Golden Hotel | فندق العليان الذهبي | Makkah, KSA | Olayan Group | `MEP` -> `mep` | No | **`published`** | `olayan-golden-hotel.jpg` |
| 60 | `XLSX-35` | Naaeb AL Haram Hotel | فندق نائب الحرم | Makkah, KSA | Olayan Group | `MEP` -> `mep` | No | **`published`** | `naaeb-al-haram-hotel.jpg` |
| 61 | `XLSX-36` | Shk. Saleh AL Owied | مشروع الشيخ صالح العويد | Makkah, KSA | Olayan Group | `MEP` -> `mep` | No | `draft` | — |
| 62 | `XLSX-37` | Hyper Abraj | هايبر أبراج | Makkah, KSA | AL Zaydi Group | `MEP` -> `mep` | No | **`published`** | `hyper-abraj.jpg` |
| 63 | `XLSX-38` | AL Zaydi Concrete Factory | مصنع الزيدي للخرسانة | Makkah, KSA | AL Zaydi Group | `MEP` -> `mep` | No | **`published`** | `al-zaydi-concrete-factory.jpg` |
| 64 | `XLSX-39` | AL Mona Ajiad Hotel | فندق المنى أجياد | Makkah, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 65 | `XLSX-40` | AL Lewaa Hotel | فندق اللواء | Makkah, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 66 | `XLSX-41` | Abou AL Jadail Kitchen | مطبخ أبو الجدايل | Makkah, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 67 | `XLSX-42` | Abdullah Bokhari Hotel | فندق عبدالله بخاري | Makkah, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 68 | `XLSX-43` | Abdulatif Sendy Hotel | فندق عبداللطيف سندي | Makkah, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 69 | `XLSX-44` | Abou Ghalia Consultant HQ | المقر الرئيسي لاستشارات أبو غالية | Makkah, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 70 | `XLSX-45` | Nursery School | مدرسة رياض أطفال | Makkah, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 71 | `XLSX-46` | Labor Court Bathaa Qwraish | المحكمة العمالية ببطحاء قريش | Makkah, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 72 | `XLSX-47` | National Water Company Building | مبنى شركة المياه الوطنية | Makkah, KSA | AL Zaydi Group | `MEP- Upgrad` -> `mep` | No | **`published`** | `national-water-company-building.jpg` |
| 73 | `XLSX-48` | Awqaf AL Moufty Hotel AL Joumaizah | فندق أوقاف المفتي الجميزة | Makkah, KSA | Awqaf AL Moufty | `MEP` -> `mep` | No | `draft` | — |
| 74 | `XLSX-49` | Awqaf AL Moufty Hotel AL Aziziah | فندق أوقاف المفتي العزيزية | Makkah, KSA | Awqaf AL Moufty | `MEP` -> `mep` | No | `draft` | — |
| 75 | `XLSX-50` | Awqaf AL Moufty Hotel Ibrahim AL Khalil | فندق أوقاف المفتي إبراهيم الخليل | Makkah, KSA | Awqaf AL Moufty | `MEP` -> `mep` | No | `draft` | — |
| 76 | `XLSX-51` | Mena Sanitary Network | شبكة الصرف الصحي بمنى | Makkah, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 77 | `XLSX-52` | Charity Inst. Block Makkah | مجمع المؤسسة الخيرية بمكة | Makkah, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 78 | `XLSX-53` | Charity Inst. Block Jeddah | مجمع المؤسسة الخيرية بجدة | Makkah, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 79 | `XLSX-54` | Issa Bin Laden HQ | المقر الرئيسي لعيسى بن لادن | Makkah, KSA | Issa Bin Laden | `MEP` -> `mep` | No | `draft` | — |
| 80 | `XLSX-55` | Issa Bin Laden HQ Parking | مواقف المقر الرئيسي لعيسى بن لادن | Makkah, KSA | Issa Bin Laden | `MEP` -> `mep` | No | `draft` | — |
| 81 | `XLSX-56` | Hamraa Hospital Jeddah | مستشفى الحمراء بجدة | Makkah, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 82 | `XLSX-57` | Issa Bin Laden Stores (1 to 9) | معارض عيسى بن لادن (1 إلى 9) | Makkah, KSA | Issa Bin Laden | `MEP` -> `mep` | No | `draft` | — |
| 83 | `XLSX-58` | Mena Gate Hotel | فندق بوابة منى | Makkah, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 84 | `XLSX-59` | Awali Mall Makkah | العوالي مول مكة | Makkah, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 85 | `XLSX-60` | Afwaj AL Tawba Hotel (1 to 15) | فندق أفواج التوبة (1 إلى 15) | Makkah, KSA | Afwaj AL Tawba Group | `MEP` -> `mep` | No | `draft` | — |
| 86 | `XLSX-61` | Afwaj AL Tawba Group Store | مستودع مجموعة أفواج التوبة | Makkah, KSA | Afwaj AL Tawba Group | `MEP` -> `mep` | No | `draft` | — |
| 87 | `XLSX-62` | AL Zaydi Kitchen | مطبخ الزيدي | Makkah, KSA | AL Zaydi Group | `MEP` -> `mep` | No | `draft` | — |
| 88 | `XLSX-63` | AL Fraj Stores | معارض الفراج | Makkah, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 89 | `XLSX-64` | Qawafel Makkah Market | سوق قوافل مكة | Makkah, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 90 | `XLSX-65` | Maternity and Children Hospital Makkah | مستشفى الولادة والأطفال بمكة | Makkah, KSA | — | `MEP` -> `mep` | No | `draft` | — |
| 91 | `XLSX-66` | Family Market Makkah | سوق العائلة بمكة | Makkah, KSA | — | `MEP` -> `mep` | No | `draft` | — |

---

### `needsClientReview` Inventory & Client Confirmation Checklist

The checklist below can be sent directly to the client to review and confirm before publishing draft items or enabling the public Arabic locale (`site-settings.arabicEnabled`):

1. **Company Metrics (`stats` collection — 5 items, live)**:
   - [ ] `45+` — `Years of Experience` / `عاماً من الخبرة`
   - [ ] `100+` — `Buildings Delivered` / `مبنى تم تسليمه`
   - [ ] `85%` — `Self-Performed Work` / `تنفيذ ذاتي بكوادرنا`
   - [ ] `21+` — `MEP Disciplines` / `تخصصاً في أعمال الكهروميكانيك`
   - [ ] `3` — `Countries Served` / `دول نخدمها في الخليج` (Saudi Arabia, UAE, Qatar)
2. **20 Marquee Brands & HQ Countries (`brands` where `showInMarquee: true`)**:
   - [ ] Confirm the 20 marquee brands, their display order (`1..20`), and their HQ countries (`France`, `Switzerland`, `Germany`, `USA`, `Japan`, `Saudi Arabia`, `Denmark`, `UAE`, `Egypt`) in the Scope 4b table above.
   - [ ] Confirm display names for the 3 material brands whose Figma mockup names differed from the raw materials list: `Cooper` (`Eaton Cooper`), `System Air` (`Systemair`), `Al-Rajhi Steel` (`Al Rajhi Steel`).
3. **Approved Materials Rows 58–73 (`structural` & `architectural`, `P4-T1`)**:
   - [ ] In `seed/materials.raw.json` rows `58–73`, the `"origin"` column contained a second supplier/manufacturer name rather than a country of origin (`Al-Rajhi Steel` / `SABIC`, `Excon` / `Saudi Readymix`, `Obeikan Glass` / `Guardian`, etc.). Both were seeded as brands with `origin` left empty (`null`). Please confirm the country of origin for each brand in rows `58–73`.
   - [ ] Confirm whether parenthetical notes extracted from brand cells on row `#31` (`JAZEERA (PRIMER)` -> brand `Jazeera`, note `"Primer"`) and row `#57` (`Hempel (Coating)` -> brand `Hempel`, note `"Coating"`) match the intended brand names.
4. **91 Real Projects (`projects` collection)**:
   - [ ] **2 Ambiguous Photo Captions**:
     - Does `hotel-al-janadriah-tower.jpg` (`"Hotel AL Janadriah Tower"`) belong to `XLSX-1` (`Hotel AL Janaderiah Palace Hotel`) or `XLSX-2` (`Hotel AL Janadriah Palace`)?
     - Does `ramada-makkah-hotel.jpg` (`"Ramada Makkah Hotel"`) belong to `XLSX-18` (`Ramada Dar AL Faezeen Hotel`) or `XLSX-19` (`Ramada Ashee Hotel`)?
   - [ ] **Specific Sub-Disciplines on General `"MEP"`, `"MEP Upgrade"`, `"Data Center MEP"`, `"Civil & MEP"`, and `"Data & Low Current Systems"` Projects (`D-02`)**: Raw scopes were mapped literally without inventing sub-discipline tags (`MEP` -> `['mep']`, `Data Center MEP` -> `['data-center', 'mep']`, `Civil & MEP` -> `['civil', 'mep']`, `Data & Low Current Systems` -> `['low-current']`). Please confirm which specific sub-disciplines (`HVAC`, `electrical`, `plumbing`, `fire-fighting`, `low-current`, `data-center`) apply to each project.
   - [ ] **Makkah Section Header Locations (`XLSX-1`..`XLSX-66`)**: Rows `XLSX-1`..`XLSX-66` were listed under the section header `"Makkah"` in the profile, but `XLSX-53` (`Charity Inst. Block Jeddah`) and `XLSX-56` (`Hamraa Hospital Jeddah`) mention `Jeddah` in their title. Please confirm whether their location should be updated to `Jeddah, KSA`.
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
- Fresh-clone DoD logs and live verification outputs in `docs/reports/evidence/P4-T2/r1/`:
  - `commit.log`, `dod-timing.log`, `install.log`, `migrate-up-down-up.log`, `migrate-create-noop.log`, `migrate-status.log`, `lint.log`, `typecheck.log`, `format-check.log`, `tokens-check.log`, `test.log`, `build.log`, `audit.log`, `seed-run-1.log`, `seed-non-empty-refused.log`, `seed-reseed-dev.log`, `seed-production-guard.log`, `seed-reseed-production-guard.log`, `seed-query-verification.log`, `playwright-p3-t12.log`, `citations.log`, `citations-check.log`.
- Editor draft-mode (`en` + `ar`), admin, and anonymous screenshots in `docs/reports/phase-4/P4-T2/r1/`:
  - `anon-home-en-1440.png`, `anon-home-en-375.png`, `draft-home-en-1440.png`, `draft-home-en-375.png`, `draft-home-ar-1440.png`, `draft-home-ar-375.png`, `admin-projects-en.png`, `admin-services-en.png`, `admin-brands-en.png`, `admin-home-page-en.png`.

### Acceptance criteria
- [x] **Idempotent (second run changes nothing)** — Verified in `tests/int/p4-t2.int.test.ts:277` (`refuses a second run without --reseed (first-run baseline guard) and leaves the database unchanged`) and `docs/reports/evidence/P4-T2/r1/seed-non-empty-refused.log` (exits `1` with `Refusing to run seed on a non-empty database` and leaves the `updatedAt` digest unchanged across all collections).
- [x] **Everything is draft except what the scope explicitly publishes (4a: the 17 completed projects with a photo; 4b: the brands). Nothing placeholder is visible to anonymous visitors (query proof + anonymous REST calls)** — Verified in `tests/int/p4-t2.int.test.ts:312` (`hides all drafts, [placeholder] items, and admin-only review fields (needsClientReview, reviewNote) from anonymous visitors across Local API and REST endpoints`) and `docs/reports/evidence/P4-T2/r1/seed-query-verification.log`: anonymous `GET /api/services` returns `totalDocs: 0`, `GET /api/team` returns `totalDocs: 0`, `GET /api/projects` returns `totalDocs: 17` with `0` occurrences of `[placeholder]` and `needsClientReview`/`reviewNote` stripped, and `GET /api/globals/{home-page,services-page,about-page,projects-page,contact-page,privacy-page}` all return empty shells with `_status: undefined`, `hero: undefined`, `pageHeader: undefined`, and `403` on `/versions`.
- [x] **With the seed loaded, every page renders completely in draft mode for an editor (screenshots ar + en)** — Verified in `docs/reports/phase-4/P4-T2/r1/draft-home-en-1440.png`, `docs/reports/phase-4/P4-T2/r1/draft-home-ar-1440.png`, `docs/reports/phase-4/P4-T2/r1/draft-home-en-375.png`, `docs/reports/phase-4/P4-T2/r1/draft-home-ar-375.png`, and `docs/reports/evidence/P4-T2/r1/seed-query-verification.log`.

### Dependencies added/changed
- None.

### Security notes
- All seed operations in `src/seed/materials.ts` and `src/seed/p4-t2.ts` use Payload's Local API with `overrideAccess: false` and `SEED_ADMIN_USER`.
- `src/seed/p4-t2.ts` and `src/seed/p4-t2-data.ts` export server-only sentinels (`P4_T2_SEED_SERVER_ONLY_SENTINEL`, `P4_T2_DATA_SERVER_ONLY_SENTINEL`) checked against `.next/static` by `scripts/check-client-bundle-sentinels.mjs`.
- `Projects.needsClientReview` enforces `read/create/update: isAdminOrEditorFieldLevel` (`src/collections/Projects.ts:1169`–`:1171`), and `Projects.reviewNote` enforces `read/create/update: isAdminFieldLevel` (`src/collections/Projects.ts:1191`–`:1193`, `M-172` / `D-05` / `A-05`), verified in `tests/int/p4-t2.int.test.ts:405`.
- `getFallbackLocale` (`src/lib/cms/client.ts:201`) returns `false` when `locale === 'en'` (`R-7`), and `resolveExpectedRequestOrigin` (`src/lib/cms/client.ts:309`) derives the expected origin strictly from `SERVER_URL` / `NEXT_PUBLIC_SERVER_URL` (`R-11`).

### Deviations from spec
- Pre-submission fixes applied per CTO message `M-172` (`D-01`, `D-02`, `D-05`/`A-05`, `D-09`, `D-10`, `D-11`) are documented with before/after diffs in `handoff/reports/P4-T2.md` §6.

### Questions for CTO
- None (all client confirmation questions are catalogued in the Client Confirmation Checklist above).
