# 02 — Content model (Payload collections & globals)

Conventions
- `(L)` = `localized: true` (ar + en). Arabic is required where the field is required; English
  falls back to Arabic if empty.
- Every collection: `timestamps: true`, explicit `access`, `admin.useAsTitle`, `admin.defaultColumns`,
  Arabic + English `labels`, and `admin.group` as listed.
- "Publishable" = `versions: { drafts: { autosave: { interval: 800 } , schedulePublish: true }, maxPerDoc: 25 }`.
- `order` fields are numbers used for manual sorting (default sort ascending).
- `slug`: unique, indexed, auto-generated from the English title (fallback: transliterated
  Arabic) in a `beforeValidate` hook, editable, validated `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

## Roles
| Role | Can do |
|---|---|
| `admin` | Everything, including users, site settings, and quote requests. |
| `editor` | Create/edit/publish all website content and media. Read quote requests. Cannot manage users, cannot change their own role, cannot delete quote requests. |
| Anonymous (public) | Read **published** content only. Cannot read drafts, users, or quote requests. Cannot write anything through the Payload API. |

Standard access helpers in `src/access/`: `isAdmin`, `isAdminOrEditor`, `publishedOrLoggedIn`
(`({ req }) => req.user ? true : { _status: { equals: 'published' } }`), `isAdminFieldLevel`.
Each one gets a unit test.

## Collections

### `users` — group: System
- `auth`: see `docs/03-security.md` §2 (lockout, cookie flags, token expiry).
- Fields: `name` (text, required), `role` (select `admin|editor`, required, default `editor`,
  `saveToJWT: true`, **field-level update: admin only**).
- Access: read — admin all; editor may read **only `id` and `name`** of other users (field-level
  read admin-or-self on every other field, incl. `email`, `role`, `sessions`; such fields cannot be
  queried or sorted by editors) and their own full record (CTO decision 2026-10-23, P2-T6 R-11);
  create/delete — admin; update — admin or self (but not `role`); **`unlock` — admin only**.
  First user created via the initial admin flow becomes `admin`.

### `media` — group: Media
- Upload: images only. `mimeTypes: ['image/jpeg','image/png','image/webp','image/avif']`
  (**no SVG** — XSS risk). Max 10 MB. `focalPoint: true`.
- `imageSizes`: `thumb` 400w, `card` 800w, `hero` 1920w, `og` 1200×630 crop. Format webp.
- Fields: `alt` (L, required), `caption` (L).
- Access: read public; create/update/delete admin+editor.

### `videos` — group: Media
- Upload: `mimeTypes: ['video/mp4','video/webm']`, max 100 MB (must match Nginx
  `client_max_body_size` for that route).
- Fields: `title` (L, required), `poster` (upload → media).
- Access: as `media`.

### `projects` — group: Content — publishable
From Figma pages "Projects", "Project Detail" and Home "Projects" section (Project Card 15:269).
- `title` (L, required), `slug`
- `category` (select, required): `mep`, `hvac`, `fire-fighting`, `plumbing`, `electrical`,
  `low-current`, `data-center`, `civil` — labels ar/en.
- `client` (L), `location` (L, required), `year` (number, 1990–current+2)
- `status` (select): `completed`, `in-progress`
- `scope` (select hasMany): same options as category (systems delivered)
- `summary` (L, textarea, max 280) — used on cards
- `body` (L, richText Lexical — limited features: headings h2–h4, bold, italic, lists, link,
  upload (media), blockquote. No raw HTML, no iframes.)
- `coverImage` (upload → media, required), `gallery` (upload → media, hasMany, max 30)
- `video` (upload → videos) **or** `videoUrl` (text, validated to YouTube/Vimeo hosts only)
- `featured` (checkbox — shown on Home), `order`
- `meta` (SEO plugin: title, description, image)

### `services` — group: Content — publishable
From Services page (main services + icon cards) and Services Carousel (175:3714) / Service Tile (109:333).
- `title` (L, required), `slug`, `tier` (select `main|additional`, required)
- `icon` (select from the fixed icon set in `docs/05-design.md` — editors pick a name, the
  frontend renders the matching SVG component; editors cannot upload icons)
- `shortDescription` (L, textarea, max 200), `body` (L, richText, same limits as projects)
- `image` (upload → media), `order`, `meta`

### `team` — group: Company
From Team section: animated leadership cards (Team Card 150:596) + moving marquee of other staff
(Team Marquee 151:964). One collection, two tiers.
- `name` (L, required), `position` (L, required)
- `tier` (select `leadership|staff`, required) — leadership = cards, staff = marquee
- `photo` (upload → media; required for leadership, optional for staff → initials Avatar 150:318)
- `bio` (L, textarea, max 400 — leadership only, `admin.condition`)
- `linkedin` (text, URL validated to linkedin.com), `order`, `active` (checkbox, default true)

### `brands` — group: Company
From Logo Marquee (18:576) / Brand Tile (156:890) and the materials table.
- `name` (required, unique), `logo` (upload → media, optional — falls back to wordmark tile)
- `origin` (L — country), `website` (URL)
- `showInMarquee` (checkbox), `order`

### `materials` — group: Company
Approved materials & brands table on the Services page. Seed: `seed/materials.raw.json` (73 rows).
- `itemNo` (number, unique), `system` (select `electrical|mechanical|structural|architectural`)
- `description` (L, required)
- `brands` (relationship → brands, hasMany, required)
- `notes` (L)
- Default sort `itemNo`. Frontend groups by `system` with filter tabs.

### `quote-requests` — group: Sales
Created only by the server-side quote form handler (Phase 5). Never writable through public API.
- `name` (required, max 120), `company` (max 160), `email` (email, required), `phone` (required,
  KSA/international format validation), `service` (relationship → services, optional),
  `message` (textarea, max 3000), `locale` (`ar|en`), `sourcePage` (text),
  `consent` (checkbox, required true)
- **Staff workflow** (revised 2026-10-23 — no Odoo): `status` (`new|contacted|quoted|closed|spam`,
  default `new`, bilingual labels), `assignedTo` (relationship → users, optional), `internalNotes`
  (textarea, max 3000, staff only).
- System fields (read-only in admin, written only by the handler/job): `emailStatus`
  (`pending|sent|failed`), `emailAttempts`, `emailLastError` (max 500, sanitized), `ipHash` (SHA-256
  of IP + secret salt — never store raw IP), `userAgent` (truncated 300)
- Access: create — **nobody via API** (`() => false`; the handler uses Local API with
  `overrideAccess: true` after its own validation); read — admin+editor; update — admin+editor,
  **only** the workflow fields (customer and system fields are read-only for everyone); delete —
  admin only.
- Retention: auto-delete after 24 months (scheduled job) — confirm with client.
- **Form answers (CTO decision 2026-11-10, P5-T1).** The Figma quote form built in P3-T9 asks five
  choice questions that this model did not store. They are added as read-only customer fields, with
  the same option values as `src/lib/quote/schema.ts` and bilingual labels from the form's
  dictionaries: `projectType`, `projectStage`, `servicesNeeded` (multi-select), `projectLocation`,
  `preferredContact`. The form has no service-document picker, so `service` stays empty for web
  submissions and `serviceTitle` holds the chosen service labels in the request locale (max 200).
  The form's file picker uploads nothing; no attachment is stored (open question for the owner).

### `quote-rate-limits` — hidden (CTO decision 2026-11-10, P5-T1, I6)
- One row per quote-form submission attempt: `ipHash` (SHA-256 of IP + salt, D2) and `createdAt`.
  The handler counts rows per hash in the last minute and the last day, in Postgres, so the limit
  survives restarts and works across instances.
- Access: `create`, `read`, `update`, `delete` all `() => false`; hidden from the admin. Only the
  server-side quote handler writes, counts and prunes it (Local API, `overrideAccess: true` with a
  `z6-allow-override-access` reason). Rows older than two days are deleted on each attempt.

## Globals

### `site-settings` — group: Settings — update: admin only; read: public
- `companyName` (L), `email` (default `info@aljazira.co`), `phone` (default `+966 57 353 4185`),
  `whatsapp` (default `966573534185`), `address` (L), `mapUrl` (URL), `workingHours` (L)
- `socials` (array: `platform` select `linkedin|x|instagram|facebook|youtube|tiktok|snapchat`, `url`)
  — rendered as icon-only buttons (per design).
- `footerText` (L), `defaultSeo` (title, description, og image)

### `navigation` — update: admin+editor; read: public
- `header` (array: `label` (L), `link` — internal page select or external URL)
- `footer` columns (array of `title` (L) + links)

### `home-page` — publishable — update: admin+editor; read: public (published)
Sections in Figma order (Home 13:2). Each section has `enabled` (checkbox).
- `hero`: `eyebrow` (L), `title` (L), `subtitle` (L), `image` or `video`, `primaryCta`, `secondaryCta`
- `stats` (array max 4: `value` (text, e.g. "120+"), `label` (L)) — **single source; the design
  removed duplicated stats, render them in one place only.**
- `about`: `title` (L), `text` (L), `image`
- `servicesSection`: `title` (L), `subtitle` (L) — items come from `services` (tier main, ordered)
- `building3d`: `title` (L), `text` (L), `fallbackImage` (upload) — 3D model is code; this is copy
- `projectsSection`: `title` (L) — items: `projects` where `featured`
- `teamSection`: `title` (L), `subtitle` (L) — items from `team`
- `brandsSection`: `title` (L) — items: `brands` where `showInMarquee`
- `cta`: `title` (L), `text` (L), button

### `about-page`, `services-page`, `projects-page`, `contact-page` — publishable
Each: `hero` (`title` (L), `subtitle` (L), `image`) + page-specific intro text (L) + `meta`.

## Seed data rules (Phase 4)
- Source: `seed/materials.raw.json` (parsed verbatim from the client's list). The seed script
  normalizes brand names into `brands` docs and links them. It must be **idempotent**
  (upsert by `itemNo` / brand `name`), run via `pnpm seed`, and never run automatically in prod.
- Known typos to normalize (keep a mapping table in the seed script and report it):
  `CABELS→Cables`, `GEBRIT→Geberit`, `Peddrolla→Pedrollo`, `SAUDI CERMICS→Saudi Ceramics`,
  `EXTENGUISHER→Extinguisher`, `Gauage→Gauge`, `SEFECO/SEFEECO→SEFECO`, `AL ROUF/ALROUF→Al Rouf`,
  `arma flex→Armaflex`, `zamil→Zamil`. Anything else uncertain → leave as-is and list it.
- **CTO additions 2026-10-24 (P4-T1 review):**
  - A parenthetical product note in a brand cell is not part of the brand name:
    `Hempel (Coating)` → brand `Hempel`. The note is kept on the material, and the change is reported.
  - The Figma partner names map to raw names as `Eaton Cooper`↔`Cooper`, `Systemair`↔`System Air`,
    `Al Rajhi Steel`↔`Al-Rajhi Steel`. The **brand name stays the raw/normalized one**. The
    mapping is reported, so the client can confirm the display names.
  - **The seed is a first-run baseline, not a sync.** It runs only when `brands` and `materials`
    are empty. On a non-empty DB it exits 1 with a message, unless `--reseed` is passed, which is
    dev-only and refused in production. It must never overwrite editor changes or create duplicates
    after a rename.
  - **Arabic drafts translate exactly what the English says**, with no added specs. They are listed
    in the report for client review.
- Rows 58–73 (structural/architectural): the client's "origin" column holds a **second supplier**,
  not a country (`needsClientReview`). Seed both as brands with `origin` empty and list them in the
  report for client confirmation.
- No invented projects, people, stats or testimonials. Where real content is missing, seed
  clearly-marked placeholders (`[placeholder]`) left in **draft** status so nothing fake is published.
- **Owner decision 2026-11-08 (overrides the draft rule for the Figma baseline):** "ضع الصور مثل
  ماهي موجوده في فيجما وتغييرها لاحقا يتم من لوحة التحكم". The seed publishes the Figma baseline:
  - the 9 Figma photos are ordinary public media (`placeholder: false`, plain alt text);
  - the 10 services and the 5 page globals (home, services, about, projects, contact) are published.

  Still not public: the privacy page (legal text pending) and the 13 `[placeholder]` team members
  (inactive). `needsClientReview` flags stay, so staff still see what the client must confirm. The
  `placeholder` media flag and its access rule stay: an editor can still hide any image with it.

## Addendum — 2026-10-21 (CTO) — aligned with the Figma copy
The Figma file contains more editable content than the original model. This addendum is binding
and **overrides** the sections above where they differ. Goal: every text, number, image and list
visible in the design is editable in the dashboard (except icons, logo files and the 3D model).
Source of truth for the copy: `design/copy/` (and `design/screenshots/sections/`).

### Reusable groups (define once in `src/fields/groups/`)
- `cta` — `title` (L), `text` (L), `button` (`label` (L) + `link`). Used by home, services,
  projects, project detail (from `projects-page`).
- `pageHeader` — `title` (L), `subtitle` (L), `image` (upload). Breadcrumb ("Home") is i18n, not CMS.
- `sectionIntro` — `eyebrow` (L), `title` (L), `intro` (L).
- `pillar` — `title` (L), `text` (L).

### New collection `stats` — group: Company
**The single source of company numbers** (45+ years, 100+ projects, 85% self-performed,
21+ disciplines, 3 countries…). A number is never typed twice: pages pick stats through
relationship fields (written below as "stat" / "stats").
- `value` (text, required, e.g. "45+", "85%"), `label` (L, required), `order`.
- Access: read public; create/update/delete admin + editor. `useAsTitle`: label.

### `site-settings` — additions
- `arabicEnabled` (checkbox, default `false`, **update: admin only**, read: public). This is the
  public Arabic switch: see `docs/01-architecture.md` "Arabic switch". The admin description reads:
  "Show the Arabic version of the website to visitors".
- `tagline` (L) — intro splash and footer.
- `office` — `title` (L), `address` (L), `mapImage` (upload), `mapUrl` (URL).
- `workingHours` (L), `phone`, `email`, `whatsapp`, `whatsappLabel` (L, "Chat with an engineer").
- `contactCards` order is fixed in code (call, WhatsApp, email, head office, hours).
- Remove `home-page.stats` from the original model (replaced by the `stats` collection).

### `services` — additions
- `number` is derived from `order` (rendered "01"…); no field.
- `highlights` (array, max 6, `text` (L)) — the bullet list on the Services page.
- `icon` options = the 10 Figma icons: `contracting`, `mep`, `fire`, `smart`, `hvac`, `plumbing`,
  `electrical`, `supply`, `testing`, `maintenance`.
- `tier`: `main` (General Contracting, MEP Works, Firefighting Systems, Smart Systems) and
  `additional` (the 6 Specialist Services tiles). `featured` (checkbox) = Service Tile "Featured"
  state.

### `projects` — changes
- `category` options replaced by the design's filter tabs: `mep` (MEP Works), `fire-fighting`
  (Firefighting), `low-current` (Low Current), `data-center` (Data Center), `civil-mep`
  (Civil & MEP). `scope` (hasMany) keeps the 8 discipline options from the original model.
- Additions: `categoryLabel` is i18n (no field); `deliveredBy` (L, "Our own staff");
  `scopeSummary` (L, "Full MEP"); `deliverables` (array, max 10, `text` (L)) — "Key deliverables";
  `details` (array, max 8, `pillar`) — the accordion in "Information & about".
- Gallery captions come from `media.caption` (lightbox "1 / 3 · caption").
- **CTO 2026-10-24 (real project list, `seed/projects.raw.json`, 91 projects):**
  - `coverImage` is required **only to publish**: a validation on `_status === 'published'`. Drafts
    may have no image, because most real projects have no photo yet.
  - `year` is optional (no years are known).
  - Add `needsClientReview` (checkbox) and `reviewNote` (textarea, admin-only, not public).

### `team` — clarification
- Leadership roles in the design: Chairman, Chief Executive Officer, Commercial Director,
  Engineering Manager, Project Manager — `position` is free text (L), not a select.

### Globals — fields per section (each section group has `enabled`, default true)
`home-page` (publishable):
- `hero`: `eyebrow`, `title`, `subtitle` (L); `background` (image upload) **or** `backgroundVideo`
  (upload → videos); `primaryCta`, `secondaryCta` (`button`); `scrollHint` is i18n.
- `whoWeAre`: `badgeStat` (relationship → stats), `title`, `text` (L,
  2 paragraphs as rich text limited to paragraphs), `button`, `image`.
- `coreServices`: `sectionIntro`; items = `services` tier `main` ordered.
- `interactiveSystems`: `sectionIntro`; `systems` (array, exactly the 5 design items, each:
  `title` (L), `text` (L), **`shot`** (select, unique: `hvac|fire|plumbing|power|smart` — the
  cinematic clip shown, defined in code), **`disciplines`** (select hasMany from `projects.scope`
  options — drives "related projects"; defaults: HVAC→`hvac`, Fire→`fire-fighting`,
  Plumbing→`plumbing`, Power→`electrical`, Smart→`low-current`,`data-center`));
  `heroImage` (upload). **CTO 2026-10-25 (P3-T5):** while a 3D release is pinned, the card's poster is always the release still (`/systems/<version>/stills/hero_*`), so the still→live swap matches. `heroImage` is not rendered then; its alt text, if set, is used as the card image's alt. It remains a legacy fallback only;
  `relatedProjectsLabel` (L); `liveModelLabel` (L). Clips and hotspots are versioned static
  assets (not CMS) — editors change text and mappings, not video.
- `statsSection` (the "Trusted by Industry Leaders" block): `title`, `text` (L); `stats` =
  relationship → stats, hasMany, max 4.
- `featuredProjects`: `sectionIntro`, `button`; items = `projects` where `featured`.
- `partners`: `sectionIntro`; items = `brands` where `showInMarquee`.
- `cta`.

`services-page` (publishable): `pageHeader`; `servicesIntro` (`sectionIntro`);
`specialist` (`sectionIntro`); `materials` (`sectionIntro`); `process` — `sectionIntro` +
`steps` (array max 8 of `pillar`, number from order); `cta`; `meta`.

`about-page` (publishable): `pageHeader`; `story` — `badgeStat` (relationship → stats), `title`, `text`
(L rich text, paragraphs only), `quote` (L), `quoteAuthor` (L), `image`; `strengths` —
`sectionIntro` + `items` (array max 6 of `pillar`); `missionVision` — `sectionIntro`,
`mission` (`text` (L) + `pillars` array max 8 of `pillar`), `vision` (same shape), `image`;
`team` — `sectionIntro` (leadership) + `staffTitle`, `staffText` (L); `meta`.

`projects-page` (publishable): `pageHeader`; `impact` — `title`, `text` (L), `stats` (relationship → stats,
hasMany, max 4); `portfolio` — `eyebrow`, `title`, `text` (L rich text, paragraphs), `quote`,
`quoteAuthor` (L), `badgeStat` (relationship → stats), `image`; `cta` (also used on project detail);
`detailLabels` are i18n; `meta`.

Approved additions (P2-T5 review, 2026-10-23 — design-backed): `home-page.whoWeAre.eyebrow`,
`home-page.coreServices.button`, `cta.secondaryButton` + `cta.backgroundImage`, `mission/vision`
`eyebrow`/`title`/`image`, `navigation.headerCta`/`footerCta`, `site-settings.copyright`, socials
platform `whatsapp`, `home-page.meta`.

`contact-page` (publishable): `pageHeader`; `getInTouch` (`sectionIntro`);
`findOffice` (`sectionIntro`); `meta`. Contact details come from `site-settings`.

`privacy-page` (publishable): `pageHeader`, `body` (L rich text), `meta` — content from the
client (D4); placeholder stays in draft.

### Not CMS (i18n dictionaries)
Breadcrumb labels, "Scroll to explore", filter "All …" labels, table headers, form labels and
errors, "Message sent" dialog text, "Back to Projects", status labels, project detail labels
(Client, Location, Scope, Delivered by, Status).

### CTO additions 2026-10-24 (P3-T4 review)
- `home-page.hero` and `home-page.cta`: the display headline is split into **`title`** and
  **`titleAccent`** (both localized text). The accent renders in gold on its own line. No newline
  characters or word-count heuristics. Migration + backfill from the current values.
- `home-page.stats.backgroundImage`: optional upload → `media`. When empty, the section renders plain
  navy. P4-T2 seeds it with the Figma pipes image.
- 2026-10-24 (P3-T4 r2): `titleAccent` is part of the shared `ctaFields` group, so `services-page.cta`
  and `projects-page.cta` have it too. The CTA band is one component on every page and renders the
  accent in gold. The backfill splits only on a newline; any other value is left as it is.

