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
16. **Interactive systems / 3D (2026-10-22, client request).** The tower must look like the
    photo-real Figma render (`design/assets/images/tower-render.png`); the 12 "angle" frames in
    116:1199 are the same image, so no real 3D source exists yet. Decision: **pre-rendered
    cinematic shots** (offline Blender renders of a real 3D model of that tower and its MEP
    systems) played as video with an HTML overlay for hotspots, accordion and related projects
    (P3-T5); a **real-time viewer** of the same model with baked lighting behind "Open the live 3D
    model" (P3-T11). The procedural `reference/3d/scene.js` is retired for this section. Assets
    come from task A-1 (external); the code runs on placeholder clips until then.
17. **Interactive systems — revised (2026-10-22, client).** Supersedes the "pre-rendered clips" part
    of §16. Everything happens **inside the card**: the photo-real hero still is the first paint;
    the live Three.js model of the same tower (baked lighting, starts at the exact hero camera)
    replaces it in place on intent; the visitor rotates, zooms, enters and exits each system
    there; no full-screen viewer. The card never hijacks page scroll (click/tap/focus to
    activate). The **city is reduced** to a soft dusk backdrop (low-poly silhouettes + fog or a
    blurred plate) — focus on the tower and its MEP systems. Weak devices keep stills.
18. **Interactive systems — city removed (2026-10-22, client, via the 3D QA session).** Supersedes
    the "city reduced" part of §17. No city at all: only the tower and its plot (plaza ring,
    forecourt, palms, lamps at the base) on a clean dusk sky gradient with a ground fade. The
    camera cannot zoom out to city scale: distance, polar and pan limits come from the GLB scene
    `extras` (tower ≥ ~55 % of the card height at max distance). The tower itself must match
    `design/assets/images/tower-render.png` (mullions, glass, gold pilasters, crown, lobby).
    **Confirmed by the owner (2026-10-22, relayed by the 3D QA session):** the hero still has no city
    either and uses the same dusk sky as the live model, so still and live match exactly (no jump on
    the crossfade). **Approved deviation** from the Figma card image `04-interactive-systems.png`,
    which shows a city behind the tower — reviews must not flag the missing city.

19. **Contrast fixes (CTO decision 2026-10-24, from the P3-T2 review R-11).** Accessibility wins over
    the exact Figma tint in three places. Nothing else changes.
    - **Focus ring on light backgrounds:** a 2 px `--navy-950` (`#011025`) outline with a 2 px
      offset. This replaces `--gold-500`, which is 2.15:1 on white. On dark backgrounds the ring
      stays `--gold-300`.
    - **Small gold text on light backgrounds** (Eyebrow Light, accordion "Show details", text links)
      uses a new token **`--gold-700: #8A6410`**: 5.37:1 on white. Verify it is ≥ 4.5:1 on
      `--gold-50` too, and log the ratio. Gold fills, icons and large display text keep the Figma
      golds.
    - Every text/background token pair used on public pages is listed with its computed ratio in
      the P3-T10 a11y report.

20. **Motion system (owner, 2026-10-25: "the site feels dead").** Figma defines no page-level motion
    (`get_motion_context` on 13:2 returns nothing), so this is the CTO's spec. It applies to **every**
    public page. Character: calm, premium and engineered. Nothing bounces or spins for show.
    - **Tokens** (`design/tokens.json` → `tokens.css`):
      - durations: `--motion-fast` 160 ms, `--motion-base` 260 ms, `--motion-slow` 600 ms,
        `--motion-reveal` 700 ms;
      - easing: `--ease-out` `cubic-bezier(.22,1,.36,1)`, `--ease-in-out` `cubic-bezier(.65,0,.35,1)`;
      - distances: `--reveal-distance` 24 px, `--hover-lift` 4 px (cards 6 px);
      - stagger: `--stagger` 80 ms, at most 6 steps.
    - **Hard rules:**
      - animate `transform`, `opacity` and `clip-path` only, never layout properties;
      - no CLS;
      - **never** delay or hide the LCP element: the hero h1 is never at `opacity:0`;
      - **content is visible without JS.** Hidden "before reveal" states apply only under
        `html[data-motion="on"]`, which a script sets only when `IntersectionObserver` exists. If the
        script fails, everything is simply visible (lesson from P3-T4 R-26);
      - `prefers-reduced-motion: reduce` → every reveal, count-up, parallax and loop is off, and
        content is static and final;
      - hover effects run only under `(hover:hover) and (pointer:fine)`, and the same effect also
        appears on `:focus-visible`;
      - no animation library: one shared IntersectionObserver, CSS for the rest;
      - CSP-safe: no inline styles, CSSOM `setProperty` only (H3a);
      - motion starts after the intro splash ends (`html[data-intro="seen"]` or no intro).
    - **Catalogue:**
      1. **Section reveal** (every section and every card group): fade + `translateY(var(--reveal-distance))`
         over `--motion-reveal`, `--ease-out`, children staggered. It plays once, triggered at 15%
         visibility. Content already on screen at load reveals immediately.
      2. **Header:** transparent over the hero. After 24 px of scroll it becomes solid navy with a
         subtle shadow, and its height eases 88 → 72 px (transform, not layout).
      3. **Hero:**
         - the background settles (`scale` 1.06 → 1, 1.4 s) on first view;
         - the eyebrow, subtitle and CTAs rise in with stagger (the h1 only translates, it never
           fades from 0);
         - the "scroll to explore" cue loops gently;
         - optional parallax of the background (≤ 8%) via `animation-timeline: view()` where it is
           supported, otherwise none.
      4. **Buttons:** hover lifts 2 px with a shadow, and the arrow icon slides 4 px towards
         inline-end. Pressed = `translateY(1px)` (§10). Gold primary gets a soft sheen sweep (≤ 400 ms).
      5. **Links / nav:** the underline grows from inline-start (`scaleX`); the active link keeps it.
      6. **Who we are:** the photo reveals with a `clip-path` wipe from inline-start, and the gold
         corner bracket draws in; the "45+" badge counts up.
      7. **Service cards (carousel and grid):** hover lifts 6 px with a deeper shadow; the icon
         scales to 1.08; a gold top rule grows. The featured card keeps its state.
      8. **Interactive systems:** the accordion animates height via `grid-template-rows 0fr→1fr`;
         the preview image crossfades per system.
      9. **Stats:** numbers count up once on first view (0 → value, 1.2 s, ease-out, tabular
         figures). The suffix ("+", "%") is kept from the CMS text, and non-numeric values stay static.
      10. **Project cards:** hover zooms the image to 1.06 over 600 ms, darkens the overlay, nudges the
          title up 4 px and fades in a "View project" arrow. Cards reveal in a stagger.
      11. **Brand / partner tiles:** hover lifts and turns the border gold. The marquee already
          pauses on hover (P3-T3).
      12. **CTA band:** a very slow background gradient drift (≥ 12 s loop, paused when off-screen).
      13. **Footer:** links slide 2 px on hover; the column groups reveal.
      14. **Inner pages** (Services, About, Projects, Project detail, Contact) use the same primitives:
          section reveal, card hovers, header behaviour, count-ups where there are numbers, and the
          gallery and lightbox per §4.
      15. **Page transitions:** an optional View Transitions cross-fade (≤ 250 ms) for same-origin
          navigation, where supported. Never block navigation.
