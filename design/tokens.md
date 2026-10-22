# Design tokens - Al Jazira website

Machine-readable version: `tokens.json`. Figma file `tD3pU1vtvSr8akTMJPFLkA`.

**Sources.** Colors and text styles are Figma **variables/styles** returned by `get_variable_defs` on nodes: `103:422`, `105:310`, `12:36`, `13:2`, `13:3`, `13:4`, `13:489`, `13:490`, `13:5`, `13:6`, `13:8`, `150:596`, `151:964`, `15:269`, `175:3714`, `28:1609`, `28:1686`, `28:1687`. `get_variable_defs` cannot run on the Design System page itself (`0:1`), so it was run on the page frames and component sets. Shadows, radii, gradients, spacing and layout are **not** Figma variables: they were read from the `get_design_context` reference code (frequency of Tailwind arbitrary values) and from `get_metadata` geometry, as noted per table.

## Colors (Figma variables)

| Token | Hex | CSS var suggestion |
|---|---|---|
| `border` | `#e3e7ee` | `--border` |
| `gold/300` | `#efcb76` | `--gold-300` |
| `gold/50` | `#fbf4e3` | `--gold-50` |
| `gold/500` | `#dfa82a` | `--gold-500` |
| `gold/600` | `#c38f1c` | `--gold-600` |
| `navy/600` | `#1c3b6e` | `--navy-600` |
| `navy/800` | `#002854` | `--navy-800` |
| `navy/900` | `#0b1a33` | `--navy-900` |
| `navy/950` | `#011025` | `--navy-950` |
| `surface` | `#f6f8fb` | `--surface` |
| `text/body` | `#5b6475` | `--text-body` |
| `text/muted` | `#8a93a3` | `--text-muted` |
| `white` | `#ffffff` | `--white` |

Literal colors also used in the code (not variables):

| Name (ours) | Value |
|---|---|
| overlay/navy-55 | `rgba(1,16,37,0.55)` |
| overlay/navy-90 | `rgba(1,16,37,0.9)` |
| glass/white-8 | `rgba(255,255,255,0.08)` |
| glass/white-5 | `rgba(255,255,255,0.05)` |
| glass/white-6 | `rgba(255,255,255,0.06)` |
| glass/white-14 | `rgba(255,255,255,0.14)` |
| glass/border-white-16 | `rgba(255,255,255,0.16)` |
| glass/border-white-28 | `rgba(255,255,255,0.28)` |
| gold/tint-15 | `rgba(223,168,42,0.15)` |
| success/bg | `rgba(33,161,107,0.18)` |
| success/text | `#73eba6` |
| whatsapp | `#25d366` |
| navy/deep | `#030a1a` |

## Typography (Figma text styles)

Font family: **Poppins** everywhere (weights 400/500/600/700 + 400 italic). Figma letter-spacing is a percent of the font size; the px column is the CSS value (it matches the `tracking-[...]` values in the reference code).

| Style | Weight | Size px | Line-height px | Letter-spacing (Figma %) | Letter-spacing px |
|---|---|---|---|---|---|
| `Body/L` | 400 Regular | 18 | 30 | 0.0 | 0.0 |
| `Body/M` | 400 Regular | 16 | 26 | 0.0 | 0.0 |
| `Body/M Medium` | 500 Medium | 16 | 26 | 0.0 | 0.0 |
| `Body/M Strong` | 600 SemiBold | 16 | 26 | 0.0 | 0.0 |
| `Body/Quote` | 400 Italic | 16 | 26 | 0.0 | 0.0 |
| `Body/S` | 400 Regular | 14 | 22 | 0.0 | 0.0 |
| `Body/S Medium` | 500 Medium | 14 | 22 | 0.0 | 0.0 |
| `Caption` | 400 Regular | 13 | 20 | 0.0 | 0.0 |
| `Caption/S` | 400 Regular | 12 | 18 | 0.0 | 0.0 |
| `Display/L` | 700 Bold | 56 | 64 | -1.2 | -0.672 |
| `Display/XL` | 700 Bold | 72 | 80 | -1.5 | -1.08 |
| `Heading/H2` | 700 Bold | 44 | 52 | -1.0 | -0.44 |
| `Heading/H3` | 700 Bold | 28 | 36 | -0.4 | -0.112 |
| `Heading/H4` | 600 SemiBold | 20 | 28 | 0.0 | 0.0 |
| `Heading/H5` | 600 SemiBold | 17 | 24 | 0.0 | 0.0 |
| `Label/Button` | 600 SemiBold | 15 | 22 | 0.0 | 0.0 |
| `Label/Caps` | 600 SemiBold | 12 | 16 | 10.0 | 1.2 |
| `Label/Eyebrow` | 600 SemiBold | 12 | 16 | 8.0 | 0.96 |
| `Label/Link` | 600 SemiBold | 14 | 22 | 0.0 | 0.0 |
| `Label/Nav` | 500 Medium | 15 | 22 | 0.0 | 0.0 |
| `Label/Tag` | 600 SemiBold | 11 | 14 | 6.0 | 0.66 |
| `Stat/M` | 700 Bold | 40 | 48 | -1.0 | -0.4 |
| `Stat/Number` | 700 Bold | 56 | 60 | -1.0 | -0.56 |

## Shadows (from reference code)

| Name (ours) | CSS box-shadow |
|---|---|
| card/rest | `0 6px 8px rgba(1,16,37,0.04)` |
| card/hover | `0 10px 28px 0 rgba(1,16,37,0.12)` |
| card/raised | `0 14px 32px 0 rgba(1,16,37,0.12)` |
| card/soft | `0 8px 12px rgba(1,16,37,0.05)` |
| panel/lg | `0 24px 50px 0 rgba(1,16,37,0.16)` |
| panel/xl | `0 30px 70px 0 rgba(1,16,37,0.3)` |
| button/gold | `0 8px 10px rgba(223,168,42,0.35)` |
| button/gold-hover | `0 12px 14px rgba(223,168,42,0.5)` |
| fab/whatsapp | `0 10px 24px 0 rgba(18,115,51,0.35)` |
| dark/elevated | `0 10px 12px rgba(1,16,37,0.2)` |

Figma `drop-shadow-[...]` in the code is a layer drop shadow; for rectangular cards use it as `box-shadow`.

## Gradients (from reference code)

- **image-overlay/top-to-bottom**: linear-gradient(to bottom, rgba(1,16,37,0.15) -> rgba(1,16,37,0.9)) family; many photo overlays use navy/950 at 0.15-0.9 alpha
- **gold-accent-line**: linear-gradient(to right, #dfa82a -> transparent/gold-300) (progress/underline accents)
- **marquee-edge-fade**: linear-gradient(to right, #f6f8fb -> rgba(246,248,251,0)) on the Trusted Partners marquee edges
- **navy-panel**: linear-gradient(to bottom, #002854 -> #011025)

## Radii (from reference code)

| Name (ours) | Value |
|---|---|
| pill | 100px |
| xs | 4px |
| sm | 8px (buttons, inputs) |
| md | 10px |
| lg | 12px |
| xl | 14px (cards) |
| 2xl | 16px (cards/panels) |
| 3xl | 18px |
| 4xl | 20px |
| fab | 30px (60px circle) |

## Spacing (from reference code)

- Scale in use (px): 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72, 80
- Button padding: 14px 24px 14px 26px (Label/Button 15/22)
- Tag/eyebrow padding: 5-6px 14px
- Card grid gap: 16-24px

## Layout (from get_metadata geometry)

- Desktop frame width **1440px**. Content container **1160px** with **140px** side gutters (every content section; measured as the min/max x of section children).
- Section vertical padding: typically **72px** top and bottom (range 56-83px). Stats bands use 65px; CTAs 83px.
- Page header (inner pages): 537px tall, centered text column 640px wide (x 400-1040), text starts at y=190 (below the 80px navbar overlay).
- Home hero: 864px tall; headline box 1000px wide, sub-copy 640px, centered.
- Navbar: 80px tall, overlays the top of the hero/page header (both start at y=0); Light and Dark theme variants x 5 active-page variants (component 13:489).
- WhatsApp FAB: 60x60 circle, #25d366, shadow fab/whatsapp; fixed; button right edge 30px from viewport right, bottom 30px (instance 18:775 at x=1144,y=796 in the first 900px of Home; button offset 206,14 inside a 280x88 component that also holds a left tooltip).
- Footer: 503px tall.

## Notes

- `03-about-us/04-mission-vision` contains a few `Inter:Regular` text runs; everything else is Poppins, so treat Inter as a design slip unless told otherwise.
- Breakpoints: none defined in the file (desktop-only design).
