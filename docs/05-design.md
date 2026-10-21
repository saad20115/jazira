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
