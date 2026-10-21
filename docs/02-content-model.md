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
- Access: read — admin all, editor self only; create/delete — admin; update — admin or self
  (but not `role`). First user created via the initial admin flow becomes `admin`.

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
- System fields (read-only in admin): `odooStatus` (`pending|sent|failed`), `odooLeadId`,
  `odooLastError` (max 500, sanitized), `odooAttempts`, `ipHash` (SHA-256 of IP + secret salt —
  never store raw IP), `userAgent` (truncated 300)
- Access: create — **nobody via API** (`() => false`; the handler uses Local API with
  `overrideAccess: true` after its own validation); read — admin+editor; update — admin only
  (status fields); delete — admin only.
- Retention: auto-delete after 24 months (scheduled job) — confirm with client.

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
- Rows 58–73 (structural/architectural): the client's "origin" column holds a **second supplier**,
  not a country (`needsClientReview`). Seed both as brands with `origin` empty and list them in the
  report for client confirmation.
- No invented projects, people, stats or testimonials. Where real content is missing, seed
  clearly-marked placeholders (`[placeholder]`) left in **draft** status so nothing fake is published.
