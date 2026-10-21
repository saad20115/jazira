# 05 — Design reference (Figma)

Figma file: **`tD3pU1vtvSr8akTMJPFLkA`** — "Al Jazira – Website v2 (Client layout · Brand colors)".
If the Figma MCP server is available in your session, use `get_design_context` /
`get_screenshot` on the node IDs below. Treat its generated code as a **reference to adapt** to
our components and tokens, never paste it as-is. If Figma is not available, ask the user for
exports — do not guess layouts.

## Pages (page "Website", 1:2)
| Page | Node |
|---|---|
| Home | 13:2 |
| Services | 13:3 |
| About | 13:4 |
| Projects | 13:5 |
| Project detail | 13:6 |
| Contact | 13:8 |

## Components → React components
| Figma component | Node | Notes |
|---|---|---|
| Logo (variants) | 100:515 | SVGs ship as static files in `public/brand/` (not CMS). |
| Navbar (variants) | 13:489 | Sticky, transparent-on-hero variant, mobile drawer. |
| Footer | 13:490 | Icon-only social buttons. |
| Button | 12:36 | Variants → `variant` / `size` props. |
| Eyebrow | 12:47 | |
| Quote Form | 103:422 | Phase 5 wiring. |
| Accordion Item | 105:310 | Accessible (`button` + `aria-expanded`). |
| Service Tile | 109:333 | |
| Services Carousel | 175:3714 | Auto-advance + drag/swipe, pause on hover/focus. |
| 3D Building | 116:1199 | Three.js interactive tower (see below). |
| Team Card | 150:596 · Team Member 150:603 · Portrait 154:890 | Leadership cards, entrance/hover animation. |
| Avatar | 150:318 | Initials fallback. |
| Team Marquee | 151:964 | Staff tier, infinite marquee. |
| Logo Marquee | 18:576 · Brand Tile 156:890 | Brands with `showInMarquee`. |
| Project Card | 15:269 | |

## Tokens (Figma variables → CSS custom properties)
| Token | Hex | Figma var |
|---|---|---|
| `--gold` | #DFA82A | 1:4 |
| `--gold-600` / `--gold-300` / `--gold-50` | (read from Figma) | 1:5 / 1:6 / 1:7 |
| `--navy-950` | #011025 | 1:8 |
| `--navy-900` | (read from Figma) | 1:9 |
| `--navy-800` | #002854 | 1:10 |
| `--body`, `--muted`, `--border`, `--surface`, `--white` | (read from Figma) | 1:12–1:16 |

Brand identity colours (logo guideline): #011025, #002854, #D89F29, #000000, #FFFFFF.
Use `get_variable_defs` to read exact values; do not eyeball.

## Typography
- Latin: **Poppins** (all Figma text styles use it).
- Arabic: **Noto Kufi Arabic** (brand identity). Pair weights to match the Poppins styles.
- Load both with `next/font/google` (self-hosted at build — no runtime calls to Google, keeps CSP strict).
- Text styles to map to CSS utilities/classes: Display/XL, Display/L, Heading/H2–H5, Body/L,
  Body/M (+ Medium, Strong), Body/S (+ Medium), Body/Quote, Caption, Caption/S, Label/Eyebrow,
  Label/Caps, Label/Button, Label/Nav, Label/Link, Label/Tag, Stat/Number, Stat/M.
- Use CSS logical properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`) so
  RTL/LTR mirror automatically. Mirror directional icons (arrows) in RTL.

## Icons
- One consistent icon style across the site (design decision). Export the service and social
  icons from Figma as SVG React components in `src/components/icons/`. The `services.icon` select
  options = the exported icon names. Editors cannot upload icons.

## 3D building section
- A reference implementation exists (Three.js night tower: podium, setback, gold crown with LED
  band, plaza, trees, lamps, skyline; PBR + bloom; drag-to-rotate). The CTO will provide
  `scene.js` as a starting point. Requirements: lazy-load on viewport, `three` pinned exact,
  pointer + touch rotation, auto-rotate when idle, pause off-screen, static image fallback
  (`home-page.building3d.fallbackImage`) for `prefers-reduced-motion`, no WebGL, or low-end devices.
  Must not hurt LCP (not in the initial bundle).

## Design decisions already made with the client (do not undo)
- Duplicate stats removed — stats appear once.
- Reduced vertical spacing between sections.
- Social icons are icon-only (no text).
- The "ARFA" text was removed.
- Team: leadership as animated cards + moving marquee for the rest of the staff, all CMS-managed.
- Partners/brands live on the Home page only (no separate partners page).
- Materials & brands table lives on the Services page.

## CTO decisions (2026-10-21) — fidelity rules and design gaps
Binding for Phase 3. They fill what the Figma file does not specify.

### Where the design lives
- `design/` is the offline export of the Figma file: page and section screenshots at 1:1
  (`design/screenshots/`), component sheets, tokens (`design/tokens.json`), SVG icons and logos,
  raw images, per-section reference code (`design/context/`), and all page copy
  (`design/copy/`). Start at `design/INDEX.md`. If you also have Figma MCP access, you may use
  it, but `design/` is what the CTO reviews against.
- Reference code in `design/context/` is generated (absolute positioning, Tailwind-ish classes).
  **Never paste it.** Rebuild with our components, tokens and logical properties.

### Fidelity (what "matches Figma" means in review)
- Desktop 1440, `en`: section order, layout, spacing, sizes and alignment match the section
  screenshot; differences > 4 px in spacing/size or any visible misalignment are findings.
- Colours and text styles come **only** from tokens (`design/tokens.json`) — no raw hex or ad-hoc
  font sizes in components. Token values are exact.
- Every interactive state in the component sheets (hover, active, featured, pulse, expanded,
  enter animations) exists in code.
- Images: same crop/aspect ratio as the design; `next/image` with correct `sizes`.

### Gaps in the design and how to fill them
1. **No tablet/mobile frames.** Breakpoints: `≥1280` desktop (container **1160 px**, 140 px side gutters at 1440, section padding ≈ 72 px — see `design/tokens.md`; gutters as in
   design), `768–1279` tablet, `<768` mobile (16 px side gutter at 390). Rules: grids go
   4→2→1 / 3→2→1 columns; side-by-side blocks stack (image first); Display/XL → 44/52 on
   mobile, Display/L → 36/44, H2 → 30/38 (scale the rest proportionally, never < 14 px body);
   navbar collapses to a drawer below 1024; marquees and carousel keep working with touch;
   tables become stacked cards below 768; no horizontal page scroll at any width ≥ 360.
2. **No Arabic/RTL frames.** Arabic is the mirror of English: logical properties only
   (`margin-inline-*`, `inset-inline-*`, `text-align: start`), directional icons flipped, carousel
   and marquee directions reversed in RTL. Arabic font Noto Kufi Arabic with the same weights;
   letter-spacing set to 0 for Arabic text (tracking breaks Arabic joining); line-height +10%.
3. **Intro (`00 Intro – start/reveal`).** Logo reveal splash: once per browser session, ≤ 1.6 s,
   click/Esc to skip, not shown with `prefers-reduced-motion`, must not delay LCP (content renders
   underneath; splash is an overlay that fades out).
4. **Overlays.** "Message sent" dialog = quote form success (focus-trapped, `role="dialog"`,
   Esc closes). Lightbox 1–3 = project gallery viewer (keyboard arrows, swipe, Esc, focus trap).
5. **Map ("Find our office").** No third-party map iframe (CSP/privacy). Use a static map image
   uploaded in the CMS + "Open in Google Maps" link from `site-settings.mapUrl`.
6. **Missing pages.** 404 and 500 follow the Page header style with a CTA back home.
7. **Copy.** English copy in `design/copy/` is the source text. Arabic UI strings (nav, buttons,
   labels) live in i18n dictionaries; Arabic content strings are drafted by the executor and
   listed as `needsClientReview` in the phase report — never presented as final.
8. **Language switcher** (not in the design): in the Navbar at the inline-end side before the CTA,
   styled as a `NavLink` ("EN" on Arabic pages, "ع" on English pages, `lang`/`hreflang` set);
   inside the mobile drawer as a full-width row; also in the Footer bottom bar.
9. **Service detail pages** ("Learn more" exists, no frame): `/[locale]/services/[slug]` built only
   from existing patterns — Page header (service title + short description + image), body
   (Lexical), highlights list styled like "Key deliverables", other services as Service Tiles,
   CTA. No new visual language.
10. **States not drawn** — derive, never improvise per component:
    focus-visible = 2 px `--gold-500` outline, 2 px offset (on dark backgrounds `--gold-300`);
    pressed = hover style + `translateY(1px)`; disabled = 40 % opacity, `cursor: not-allowed`;
    loading = label kept, spinner at inline-end, `aria-busy`. Form fields: border `--border`,
    focus border `--gold-500`, error border + message in **`--danger: #B42318`** (new token —
    the only colour not from Figma; contrast ≥ 4.5:1 on white), success uses the design's
    `success/*` literals. "Message failed" overlay = the "Message sent" dialog with the danger
    icon colour and retry button.
11. **Filters / pagination states**: selected tab = the active `NavLink` treatment (gold
    underline/text as in the design's active state); empty result = Page-header-style message
    with a "Show all" button; page 2+ keep the same layout.
12. **Brand tiles** are wordmarks (brand + country) as designed; `brands.logo` is optional and
    shown only if uploaded. The unused partner-logo sprite in `design/assets/images/` is **not**
    used until the client confirms those logos.
13. **Favicon and default OG image** are generated from `design/assets/logo/icon-*.svg`
    (navy background, gold mark) — committed as static files, not CMS.
14. **Photos**: only 9 real photos exist and the design reuses them. Seed may reuse them as
    placeholders (draft only); never present one photo as several different real projects in
    published content.
15. Tokens not in Figma variables but in the reference code (`design/tokens.md` "Literal colors",
    shadows, radii, gradients) are **allowed** — add them to `tokens.css` under their names from
    `tokens.md`; still no raw values inside components.
