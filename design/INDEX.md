# Design pack - Al Jazira website (offline export of Figma)

Figma file key `tD3pU1vtvSr8akTMJPFLkA`. Exported 2026-10-21 via the Figma MCP server. Everything here works without Figma access.

## How to use

1. **Visual target**: `screenshots/` - all rendered at 1:1 (no server scaling), full-width frames are 1440px wide. Compare your build against `screenshots/sections/<page>/<nn-section>.png` and `screenshots/pages/<nn-page>.png`.
2. **Structure and exact values**: `context/<page>/<nn-section>.md` = verbatim `get_design_context` React+Tailwind reference code per section and per component set (all variants), with `data-node-id` attributes, plus an asset map (code constant -> local file). Treat it as a high-fidelity prototype: convert absolute positioning to real layout, keep the values. Component descriptions (behaviour, animation, CMS notes) are included at the bottom of each file where Figma has them.
3. **Geometry**: `context/_metadata/*.xml` lists every node with x/y/width/height (relative to its parent).
4. **Tokens**: `tokens.md` / `tokens.json`. **Copy**: `copy/*.md`. **Assets**: `assets/` (icons, logo, images).

Pages: 01 Home `13:2` (1440x6204), 02 Services `13:3` (1440x6433), 03 About Us `13:4` (1440x5550), 04 Projects `13:5` (1440x4358), 05 Project Detail - Sofitel Makkah `13:6` (1440x3921), 07 Contact Us `13:8` (1440x2551). Navbar `18:749`, Footer `18:678` and WhatsApp FAB `18:775` are exported from Home only; other pages use instances of the same components (Navbar variant per active page: component `13:489`).

Totals: 437 files + this INDEX, 86.2 MB.

## Page screenshots (12)

| File | Figma node | Name | Size | Notes |
|---|---|---|---|---|
| `screenshots/pages/00-intro-reveal.png` | `28:1615` | 00 Intro – reveal | 659.2 KB | 1440x900 @1x |
| `screenshots/pages/00-intro-start.png` | `28:1609` | 00 Intro – start | 412.7 KB | 1440x900 @1x |
| `screenshots/pages/01-home.png` | `13:2` | 01 Home | 6.1 MB | 1440x6204 @1x |
| `screenshots/pages/02-services.png` | `13:3` | 02 Services | 5.2 MB | 1440x6433 @1x |
| `screenshots/pages/03-about-us.png` | `13:4` | 03 About Us | 4.4 MB | 1440x5550 @1x |
| `screenshots/pages/04-projects.png` | `13:5` | 04 Projects | 6.2 MB | 1440x4358 @1x |
| `screenshots/pages/05-project-detail-sofitel-makkah.png` | `13:6` | 05 Project Detail – Sofitel Makkah | 3.9 MB | 1440x3921 @1x |
| `screenshots/pages/07-contact-us.png` | `13:8` | 07 Contact Us | 1.8 MB | 1440x2552 @1x (frame 2551.x) |
| `screenshots/pages/overlay-lightbox-1.png` | `28:1687` | Overlay – Lightbox 1 | 1.3 MB | 1440x900 @1x |
| `screenshots/pages/overlay-lightbox-2.png` | `28:1688` | Overlay – Lightbox 2 | 1.3 MB | 1440x900 @1x |
| `screenshots/pages/overlay-lightbox-3.png` | `28:1689` | Overlay – Lightbox 3 | 1.4 MB | 1440x900 @1x |
| `screenshots/pages/overlay-message-sent.png` | `28:1686` | Overlay – Message sent | 149.0 KB | 1440x900 @1x |

## Section screenshots (36)

| File | Figma node | Name | Size | Notes |
|---|---|---|---|---|
| `screenshots/sections/01-home/01-hero.png` | `17:199` | 01 Home / Hero | 1.6 MB | 1440x864 @1x |
| `screenshots/sections/01-home/02-who-we-are.png` | `17:222` | 01 Home / Who we are | 605.3 KB | 1440x628 @1x |
| `screenshots/sections/01-home/03-core-services.png` | `17:254` | 01 Home / Core services | 158.0 KB | 1440x764 @1x |
| `screenshots/sections/01-home/04-interactive-systems.png` | `111:1608` | 01 Home / Interactive systems | 840.2 KB | 1440x922 @1x |
| `screenshots/sections/01-home/05-trusted-by-industry-leaders.png` | `18:285` | 01 Home / Trusted by industry leaders | 561.9 KB | 1440x425 @1x |
| `screenshots/sections/01-home/06-featured-projects.png` | `18:308` | 01 Home / Featured projects | 1.3 MB | 1440x1067 @1x |
| `screenshots/sections/01-home/07-trusted-partners.png` | `18:579` | 01 Home / Trusted partners | 87.9 KB | 1440x547 @1x |
| `screenshots/sections/01-home/08-cta.png` | `18:660` | 01 Home / CTA | 763.1 KB | 1440x484 @1x |
| `screenshots/sections/01-home/09-footer.png` | `18:678` | 01 Home / Footer | 321.7 KB | 1440x503 @1x |
| `screenshots/sections/01-home/10-navbar.png` | `18:749` | 01 Home / Navbar | 28.2 KB | 1440x98 @1x |
| `screenshots/sections/01-home/11-whatsapp-fab.png` | `18:775` | 01 Home / WhatsApp FAB (fixed) | 10.2 KB | 290x108 @1x |
| `screenshots/sections/02-services/01-page-header.png` | `24:1478` | 02 Services / Page header | 864.6 KB | 1440x537 @1x |
| `screenshots/sections/02-services/02-services.png` | `24:1490` | 02 Services / Services | 2.3 MB | 1440x2194 @1x |
| `screenshots/sections/02-services/03-specialist-services.png` | `126:1887` | 02 Services / Specialist services | 143.4 KB | 1440x950 @1x |
| `screenshots/sections/02-services/04-approved-materials-brands.png` | `157:3293` | 02 Services / Approved materials & brands | 107.9 KB | 1440x1136 @1x |
| `screenshots/sections/02-services/05-how-we-work.png` | `24:1646` | 02 Services / How we work | 784.1 KB | 1440x629 @1x |
| `screenshots/sections/02-services/06-cta.png` | `24:1677` | 02 Services / CTA | 763.1 KB | 1440x484 @1x |
| `screenshots/sections/03-about-us/01-page-header.png` | `21:1034` | 03 About Us / Page header | 859.4 KB | 1440x537 @1x |
| `screenshots/sections/03-about-us/02-our-story.png` | `21:1046` | 03 About Us / Our story | 632.2 KB | 1440x693 @1x |
| `screenshots/sections/03-about-us/03-core-strengths.png` | `21:1068` | 03 About Us / Core strengths | 1022.7 KB | 1440x683 @1x |
| `screenshots/sections/03-about-us/04-mission-vision.png` | `108:1576` | 03 About Us / Mission & vision | 1.2 MB | 1440x1618 @1x |
| `screenshots/sections/03-about-us/05-meet-our-team.png` | `21:1162` | 03 About Us / Meet our team | 446.2 KB | 1440x1516 @1x |
| `screenshots/sections/04-projects/01-page-header.png` | `19:556` | 04 Projects / Page header | 852.3 KB | 1440x537 @1x |
| `screenshots/sections/04-projects/02-explore-projects.png` | `19:568` | 04 Projects / Explore projects | 3.3 MB | 1440x1786 @1x |
| `screenshots/sections/04-projects/03-impact-in-numbers.png` | `19:884` | 04 Projects / Impact in numbers | 555.4 KB | 1440x421 @1x |
| `screenshots/sections/04-projects/04-portfolio.png` | `19:904` | 04 Projects / Portfolio | 590.6 KB | 1440x657 @1x |
| `screenshots/sections/04-projects/05-cta.png` | `19:926` | 04 Projects / CTA | 715.9 KB | 1440x454 @1x |
| `screenshots/sections/05-project-detail-sofitel-makkah/01-project-hero.png` | `20:880` | 05 Project Detail – Sofitel Makkah / Project hero | 922.9 KB | 1440x526 @1x |
| `screenshots/sections/05-project-detail-sofitel-makkah/02-information-about.png` | `20:895` | 05 Project Detail – Sofitel Makkah / Information & about | 119.0 KB | 1440x946 @1x |
| `screenshots/sections/05-project-detail-sofitel-makkah/03-key-deliverables.png` | `20:947` | 05 Project Detail – Sofitel Makkah / Key deliverables | 579.8 KB | 1440x442 @1x |
| `screenshots/sections/05-project-detail-sofitel-makkah/04-gallery.png` | `20:976` | 05 Project Detail – Sofitel Makkah / Gallery | 740.7 KB | 1440x525 @1x |
| `screenshots/sections/05-project-detail-sofitel-makkah/05-cta.png` | `20:995` | 05 Project Detail – Sofitel Makkah / CTA | 684.4 KB | 1440x438 @1x |
| `screenshots/sections/05-project-detail-sofitel-makkah/06-related-projects.png` | `20:1009` | 05 Project Detail – Sofitel Makkah / Related projects | 693.0 KB | 1440x541 @1x |
| `screenshots/sections/07-contact-us/01-page-header.png` | `23:1366` | 07 Contact Us / Page header | 816.3 KB | 1440x537 @1x |
| `screenshots/sections/07-contact-us/02-get-in-touch.png` | `23:1378` | 07 Contact Us / Get in touch | 143.1 KB | 1440x741 @1x |
| `screenshots/sections/07-contact-us/03-find-our-office.png` | `23:1441` | 07 Contact Us / Find our office | 648.1 KB | 1440x771 @1x |

## Component-set screenshots (22)

| File | Figma node | Name | Size | Notes |
|---|---|---|---|---|
| `screenshots/components/3d-building.png` | `116:1199` | Component set: 3D Building | 2.5 MB | 2600x1900 @1x |
| `screenshots/components/accordion-item.png` | `105:310` | Component set: Accordion Item | 16.5 KB | 772x310 @1x |
| `screenshots/components/avatar-placeholder.png` | `150:318` | Component set: Avatar/Placeholder | 12.9 KB | 120x120 @1x |
| `screenshots/components/brand-tile.png` | `156:890` | Component set: Brand Tile | 6.8 KB | 232x108 @1x |
| `screenshots/components/button.png` | `12:36` | Component set: Button | 49.8 KB | 700x259 @1x |
| `screenshots/components/eyebrow.png` | `12:47` | Component set: Eyebrow | 4.6 KB | 332x78 @1x |
| `screenshots/components/footer.png` | `13:490` | Component set: Footer | 321.7 KB | 1440x503 @1x |
| `screenshots/components/logo-marquee.png` | `18:576` | Component set: Logo Marquee | 143.6 KB | 1440x412 @1x |
| `screenshots/components/logo.png` | `100:515` | Component set: Logo | 44.9 KB | 660x590 @1x |
| `screenshots/components/nav-link.png` | `12:66` | Component set: Nav Link | 4.4 KB | 420x140 @1x |
| `screenshots/components/navbar.png` | `13:489` | Component set: Navbar | 288.9 KB | 1488x992 @1x |
| `screenshots/components/partner-tile.png` | `15:332` | Component set: Partner Tile | 25.4 KB | 622x206 @1x |
| `screenshots/components/portrait-placeholder.png` | `154:890` | Component set: Portrait/Placeholder | 61.1 KB | 264x340 @1x |
| `screenshots/components/project-card.png` | `15:269` | Component set: Project Card | 853.1 KB | 860x632 @1x |
| `screenshots/components/quote-form.png` | `103:422` | Component set: Quote Form | 231.5 KB | 1720x701 @1x |
| `screenshots/components/service-card.png` | `15:320` | Component set: Service Card | 441.4 KB | 622x408 @1x |
| `screenshots/components/service-tile.png` | `109:333` | Component set: Service Tile | 50.3 KB | 690x330 @1x |
| `screenshots/components/services-carousel.png` | `175:3714` | Component set: Services Carousel | 529.0 KB | 1380x2490 @1x |
| `screenshots/components/team-card.png` | `150:596` | Component set: Team Card | 348.4 KB | 1256x800 @1x |
| `screenshots/components/team-marquee.png` | `151:964` | Component set: Team Marquee | 130.0 KB | 1240x516 @1x |
| `screenshots/components/team-member.png` | `150:603` | Component set: Team Member | 11.4 KB | 302x114 @1x |
| `screenshots/components/whatsapp-fab.png` | `12:93` | Component set: WhatsApp FAB | 29.1 KB | 936x136 @1x |

## Icons (SVG) (15)

| File | Figma node | Name | Size | Notes |
|---|---|---|---|---|
| `assets/icons/contracting.svg` | `15:272` | Icon/contracting | 434 B | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/electrical.svg` | `109:298` | Icon/electrical | 342 B | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/fire.svg` | `15:278` | Icon/fire | 609 B | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/hvac.svg` | `109:292` | Icon/hvac | 668 B | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/maintenance.svg` | `126:1884` | Icon/maintenance | 1.1 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/mep.svg` | `15:275` | Icon/mep | 347 B | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/plumbing.svg` | `109:295` | Icon/plumbing | 645 B | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/smart.svg` | `15:281` | Icon/smart | 349 B | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/social-facebook.svg` | `132:1968` | Icon/social/facebook | 595 B | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/social-instagram.svg` | `132:1963` | Icon/social/instagram | 1.1 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/social-linkedin.svg` | `132:1954` | Icon/social/linkedin | 1.2 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/social-whatsapp.svg` | `132:1971` | Icon/social/whatsapp | 1.6 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/social-x.svg` | `132:1959` | Icon/social/x | 495 B | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/supply.svg` | `109:301` | Icon/supply | 1.1 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/icons/testing.svg` | `109:305` | Icon/testing | 705 B | SVG export of the whole node (download_assets defaultFormat=svg) |

## Logo variants (SVG) (15)

| File | Figma node | Name | Size | Notes |
|---|---|---|---|---|
| `assets/logo/compact-dark.svg` | `100:455` | Logo compact-dark | 4.4 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/compact-navy.svg` | `100:475` | Logo compact-navy | 4.4 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/compact-primary.svg` | `100:369` | Logo compact-primary | 8.5 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/compact-reversed.svg` | `100:383` | Logo compact-reversed | 8.5 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/compact-white.svg` | `100:495` | Logo compact-white | 4.4 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/full-dark.svg` | `100:425` | Logo full-dark | 17.3 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/full-navy.svg` | `100:435` | Logo full-navy | 17.4 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/full-primary.svg` | `12:2` | Logo full-primary | 27.7 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/full-reversed.svg` | `100:355` | Logo full-reversed | 27.7 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/full-white.svg` | `100:445` | Logo full-white | 17.3 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/icon-dark.svg` | `100:465` | Logo icon-dark | 2.0 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/icon-navy.svg` | `100:485` | Logo icon-navy | 2.0 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/icon-primary.svg` | `100:397` | Logo icon-primary | 3.9 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/icon-reversed.svg` | `100:411` | Logo icon-reversed | 3.9 KB | SVG export of the whole node (download_assets defaultFormat=svg) |
| `assets/logo/icon-white.svg` | `100:505` | Logo icon-white | 2.0 KB | SVG export of the whole node (download_assets defaultFormat=svg) |

## Images (raw photos, deduplicated) (24)

| File | Figma node | Name | Size | Notes |
|---|---|---|---|---|
| `assets/images/about-team.png` | `3:2` | IMG / about-team | 1.8 MB | 1200x896 original fill; used in: 01-home/02-who-we-are, 01-home/06-featured-projects, 02-services/02-services, 03-about-us/01-page-header, 03-about-us/02-our-story, 03-about-us/04-mission-vision, 04-projects/02-explore-projects, 05-project-detail-sofitel-makkah/01-project-hero, 05-project-detail-sofitel-makkah/04-gallery, 05-project-detail-sofitel-makkah/06-related-projects, overlays/overlay-lightbox-1 |
| `assets/images/bg-pipes.png` | `8:2` | IMG / bg-pipes | 1.6 MB | 1376x768 original fill; used in: 01-home/05-trusted-by-industry-leaders, 02-services/05-how-we-work, 04-projects/03-impact-in-numbers, 05-project-detail-sofitel-makkah/03-key-deliverables |
| `assets/images/header-office.png` | `9:2` | IMG / header-office | 1.6 MB | 1376x768 original fill; used in: 07-contact-us/01-page-header |
| `assets/images/hero-city.png` | `2:2` | IMG / hero-city | 1.8 MB | 1376x768 original fill; used in: 01-home/01-hero, 03-about-us/04-mission-vision, 07-contact-us/03-find-our-office |
| `assets/images/logo-gold-official-raster.png` | `25:199` | IMG / logo-gold (official) - raster, superseded by vector logo | 6.1 KB | 440x128 original fill; used in: not used on website pages |
| `assets/images/partner-logos-sprite-small.png` | `50:200` | second fill in partner sprite node (450x180) | 58.5 KB | 450x180 original fill; used in: not used on website pages |
| `assets/images/partner-logos-sprite.png` | `50:200` | IMG / partner-logos-sprite (6x6 cells of 300x120, from client site) | 448.2 KB | 1800x720 original fill; used in: not used on website pages |
| `assets/images/proj-tower.png` | `7:2` | IMG / proj-tower | 1.8 MB | 1200x896 original fill; used in: 01-home/06-featured-projects, 01-home/08-cta, 02-services/06-cta, 04-projects/01-page-header, 04-projects/02-explore-projects, 04-projects/04-portfolio, 04-projects/05-cta, 05-project-detail-sofitel-makkah/05-cta, 05-project-detail-sofitel-makkah/06-related-projects, components/project-card |
| `assets/images/reference/image-1-small.png` | `76:1644` | 🧩 Assets "image 1" (reference screenshot of a built page, not a website asset) | 46.3 KB | 378x267 |
| `assets/images/reference/image-1.png` | `76:1644` | 🧩 Assets "image 1" (reference screenshot of a built page, not a website asset) | 118.6 KB | 756x533 |
| `assets/images/reference/image-2-small.png` | `76:1647` | 🧩 Assets "image 2" (reference screenshot of a built page, not a website asset) | 65.0 KB | 376x200 |
| `assets/images/reference/image-2.png` | `76:1647` | 🧩 Assets "image 2" (reference screenshot of a built page, not a website asset) | 202.6 KB | 752x400 |
| `assets/images/reference/image-3-small.png` | `76:1650` | 🧩 Assets "image 3" (reference screenshot of a built page, not a website asset) | 73.2 KB | 464x380 |
| `assets/images/reference/image-3.png` | `76:1650` | 🧩 Assets "image 3" (reference screenshot of a built page, not a website asset) | 173.1 KB | 927x760 |
| `assets/images/reference/image-4-small.png` | `76:1653` | 🧩 Assets "image 4" (reference screenshot of a built page, not a website asset) | 31.7 KB | 340x198 |
| `assets/images/reference/image-4.png` | `76:1653` | 🧩 Assets "image 4" (reference screenshot of a built page, not a website asset) | 145.0 KB | 1359x789 |
| `assets/images/reference/image-5-small.png` | `81:1656` | 🧩 Assets "image 5" (reference screenshot of a built page, not a website asset) | 42.0 KB | 361x126 |
| `assets/images/reference/image-5.png` | `81:1656` | 🧩 Assets "image 5" (reference screenshot of a built page, not a website asset) | 759.3 KB | 1442x503 |
| `assets/images/reference/image-6-small.png` | `81:1659` | 🧩 Assets "image 6" (reference screenshot of a built page, not a website asset) | 92.9 KB | 328x182 |
| `assets/images/reference/image-6.png` | `81:1659` | 🧩 Assets "image 6" (reference screenshot of a built page, not a website asset) | 1.1 MB | 1310x727 |
| `assets/images/svc-fire.png` | `5:2` | IMG / svc-fire | 1.9 MB | 896x1200 original fill; used in: 02-services/02-services, 04-projects/02-explore-projects, 05-project-detail-sofitel-makkah/04-gallery, overlays/overlay-lightbox-2 |
| `assets/images/svc-mep.png` | `4:2` | IMG / svc-mep | 2.0 MB | 896x1200 original fill; used in: 01-home/06-featured-projects, 02-services/01-page-header, 02-services/02-services, 03-about-us/03-core-strengths, 04-projects/02-explore-projects, 05-project-detail-sofitel-makkah/04-gallery, 05-project-detail-sofitel-makkah/06-related-projects, components/service-card, overlays/overlay-lightbox-3 |
| `assets/images/svc-smart.png` | `6:2` | IMG / svc-smart | 1.7 MB | 896x1200 original fill; used in: 01-home/06-featured-projects, 02-services/02-services, 04-projects/02-explore-projects |
| `assets/images/tower-render.png` | `170:1050` | IMG / tower-render (Figma AI) | 1.8 MB | 1024x1024 original fill; used in: 01-home/04-interactive-systems, components/3d-building |

## SVG layer assets referenced by the reference code (236)

| File | Figma node | Name | Size | Notes |
|---|---|---|---|---|
| `assets/context/01-home/01-hero/imgArrow.svg` | `17:199` | Hero: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/01-home/01-hero/imgArrow1.svg` | `17:199` | Hero: imgArrow1 | 334 B | asset referenced by design-context code |
| `assets/context/01-home/01-hero/imgEllipse.svg` | `17:199` | Hero: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/01-home/01-hero/imgFrame.svg` | `17:199` | Hero: imgFrame | 347 B | asset referenced by design-context code |
| `assets/context/01-home/01-hero/imgGoldGlow.svg` | `17:199` | Hero: imgGoldGlow | 541 B | asset referenced by design-context code |
| `assets/context/01-home/02-who-we-are/imgArrow.svg` | `17:222` | Who we are: imgArrow | 334 B | asset referenced by design-context code |
| `assets/context/01-home/02-who-we-are/imgCornerBracket.svg` | `17:222` | Who we are: imgCornerBracket | 495 B | asset referenced by design-context code |
| `assets/context/01-home/02-who-we-are/imgEllipse.svg` | `17:222` | Who we are: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgArrow.svg` | `17:254` | Core services: imgArrow | 334 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgEllipse.svg` | `17:254` | Core services: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgIconArrowLeft.svg` | `17:254` | Core services: imgIconArrowLeft | 350 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgIconArrowRight.svg` | `17:254` | Core services: imgIconArrowRight | 366 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgIconArrowRight1.svg` | `17:254` | Core services: imgIconArrowRight1 | 366 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgIconArrowRight2.svg` | `17:254` | Core services: imgIconArrowRight2 | 350 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgIconContracting.svg` | `17:254` | Core services: imgIconContracting | 515 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgIconElectrical.svg` | `17:254` | Core services: imgIconElectrical | 382 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgIconFire.svg` | `17:254` | Core services: imgIconFire | 630 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgIconHvac.svg` | `17:254` | Core services: imgIconHvac | 723 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgIconPlumbing.svg` | `17:254` | Core services: imgIconPlumbing | 660 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgIconSmart.svg` | `17:254` | Core services: imgIconSmart | 406 B | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgIconSupply.svg` | `17:254` | Core services: imgIconSupply | 1.1 KB | asset referenced by design-context code |
| `assets/context/01-home/03-core-services/imgIconTesting.svg` | `17:254` | Core services: imgIconTesting | 748 B | asset referenced by design-context code |
| `assets/context/01-home/04-interactive-systems/imgEllipse.svg` | `111:1608` | Interactive systems: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/01-home/04-interactive-systems/imgIconArrowUpRight.svg` | `111:1608` | Interactive systems: imgIconArrowUpRight | 374 B | asset referenced by design-context code |
| `assets/context/01-home/04-interactive-systems/imgIconChevronDown.svg` | `111:1608` | Interactive systems: imgIconChevronDown | 340 B | asset referenced by design-context code |
| `assets/context/01-home/04-interactive-systems/imgIconChevronUp.svg` | `111:1608` | Interactive systems: imgIconChevronUp | 339 B | asset referenced by design-context code |
| `assets/context/01-home/04-interactive-systems/imgIconCube.svg` | `111:1608` | Interactive systems: imgIconCube | 539 B | asset referenced by design-context code |
| `assets/context/01-home/06-featured-projects/imgArrow.svg` | `18:308` | Featured projects: imgArrow | 334 B | asset referenced by design-context code |
| `assets/context/01-home/06-featured-projects/imgEllipse.svg` | `18:308` | Featured projects: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/01-home/06-featured-projects/imgEllipse1.svg` | `18:308` | Featured projects: imgEllipse1 | 227 B | asset referenced by design-context code |
| `assets/context/01-home/06-featured-projects/imgFrame.svg` | `18:308` | Featured projects: imgFrame | 1.1 KB | asset referenced by design-context code |
| `assets/context/01-home/07-trusted-partners/imgEllipse.svg` | `18:579` | Trusted partners: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/01-home/08-cta/imgArrow.svg` | `18:660` | CTA: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/01-home/08-cta/imgArrow1.svg` | `18:660` | CTA: imgArrow1 | 334 B | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgArrow.svg` | `18:678` | Footer: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgEllipse.svg` | `18:678` | Footer: imgEllipse | 253 B | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgFrame.svg` | `18:678` | Footer: imgFrame | 1.4 KB | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgFrame1.svg` | `18:678` | Footer: imgFrame1 | 352 B | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgFrame2.svg` | `18:678` | Footer: imgFrame2 | 1.0 KB | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgIconSocialFacebook.svg` | `18:678` | Footer: imgIconSocialFacebook | 595 B | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgIconSocialInstagram.svg` | `18:678` | Footer: imgIconSocialInstagram | 1.1 KB | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgIconSocialLinkedin.svg` | `18:678` | Footer: imgIconSocialLinkedin | 1.1 KB | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgIconSocialWhatsapp.svg` | `18:678` | Footer: imgIconSocialWhatsapp | 1.6 KB | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgIconSocialWhatsapp1.svg` | `18:678` | Footer: imgIconSocialWhatsapp1 | 1.6 KB | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgIconSocialX.svg` | `18:678` | Footer: imgIconSocialX | 520 B | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgSymbol.svg` | `18:678` | Footer: imgSymbol | 3.9 KB | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgTaglineAr.svg` | `18:678` | Footer: imgTaglineAr | 12.6 KB | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgTaglineEn.svg` | `18:678` | Footer: imgTaglineEn | 7.1 KB | asset referenced by design-context code |
| `assets/context/01-home/09-footer/imgWordmark.svg` | `18:678` | Footer: imgWordmark | 4.8 KB | asset referenced by design-context code |
| `assets/context/01-home/10-navbar/imgArrow.svg` | `18:749` | Navbar: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/01-home/10-navbar/imgSymbol.svg` | `18:749` | Navbar: imgSymbol | 3.9 KB | asset referenced by design-context code |
| `assets/context/01-home/10-navbar/imgTaglineAr.svg` | `18:749` | Navbar: imgTaglineAr | 12.6 KB | asset referenced by design-context code |
| `assets/context/01-home/10-navbar/imgTaglineEn.svg` | `18:749` | Navbar: imgTaglineEn | 7.1 KB | asset referenced by design-context code |
| `assets/context/01-home/10-navbar/imgWordmark.svg` | `18:749` | Navbar: imgWordmark | 4.9 KB | asset referenced by design-context code |
| `assets/context/01-home/11-whatsapp-fab/imgFrame.svg` | `18:775` | WhatsApp FAB (fixed): imgFrame | 1.4 KB | asset referenced by design-context code |
| `assets/context/01-home/11-whatsapp-fab/imgPulseRing.svg` | `18:775` | WhatsApp FAB (fixed): imgPulseRing | 252 B | asset referenced by design-context code |
| `assets/context/02-services/01-page-header/imgEllipse.svg` | `24:1478` | Page header: imgEllipse | 233 B | asset referenced by design-context code |
| `assets/context/02-services/01-page-header/imgFrame.svg` | `24:1478` | Page header: imgFrame | 292 B | asset referenced by design-context code |
| `assets/context/02-services/02-services/imgArrow.svg` | `24:1490` | Services: imgArrow | 334 B | asset referenced by design-context code |
| `assets/context/02-services/02-services/imgEllipse.svg` | `24:1490` | Services: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/02-services/02-services/imgFrame.svg` | `24:1490` | Services: imgFrame | 618 B | asset referenced by design-context code |
| `assets/context/02-services/03-specialist-services/imgEllipse.svg` | `126:1887` | Specialist services: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/02-services/03-specialist-services/imgIconArrowRight.svg` | `126:1887` | Specialist services: imgIconArrowRight | 366 B | asset referenced by design-context code |
| `assets/context/02-services/03-specialist-services/imgIconElectrical.svg` | `126:1887` | Specialist services: imgIconElectrical | 382 B | asset referenced by design-context code |
| `assets/context/02-services/03-specialist-services/imgIconHvac.svg` | `126:1887` | Specialist services: imgIconHvac | 721 B | asset referenced by design-context code |
| `assets/context/02-services/03-specialist-services/imgIconMaintenance.svg` | `126:1887` | Specialist services: imgIconMaintenance | 1.1 KB | asset referenced by design-context code |
| `assets/context/02-services/03-specialist-services/imgIconPlumbing.svg` | `126:1887` | Specialist services: imgIconPlumbing | 660 B | asset referenced by design-context code |
| `assets/context/02-services/03-specialist-services/imgIconSupply.svg` | `126:1887` | Specialist services: imgIconSupply | 1.1 KB | asset referenced by design-context code |
| `assets/context/02-services/03-specialist-services/imgIconTesting.svg` | `126:1887` | Specialist services: imgIconTesting | 748 B | asset referenced by design-context code |
| `assets/context/02-services/04-approved-materials-brands/imgArrow.svg` | `157:3293` | Approved materials & brands: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/02-services/04-approved-materials-brands/imgEllipse.svg` | `157:3293` | Approved materials & brands: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/02-services/04-approved-materials-brands/imgIconSearch.svg` | `157:3293` | Approved materials & brands: imgIconSearch | 503 B | asset referenced by design-context code |
| `assets/context/02-services/05-how-we-work/imgEllipse.svg` | `24:1646` | How we work: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/02-services/06-cta/imgArrow.svg` | `24:1677` | CTA: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/02-services/06-cta/imgArrow1.svg` | `24:1677` | CTA: imgArrow1 | 334 B | asset referenced by design-context code |
| `assets/context/03-about-us/01-page-header/imgEllipse.svg` | `21:1034` | Page header: imgEllipse | 233 B | asset referenced by design-context code |
| `assets/context/03-about-us/01-page-header/imgWave.svg` | `21:1034` | Page header: imgWave | 291 B | asset referenced by design-context code |
| `assets/context/03-about-us/02-our-story/imgEllipse.svg` | `21:1046` | Our story: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/03-about-us/02-our-story/imgFrame.svg` | `21:1046` | Our story: imgFrame | 484 B | asset referenced by design-context code |
| `assets/context/03-about-us/03-core-strengths/imgEllipse.svg` | `21:1068` | Core strengths: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/03-about-us/03-core-strengths/imgFrame.svg` | `21:1068` | Core strengths: imgFrame | 1.1 KB | asset referenced by design-context code |
| `assets/context/03-about-us/03-core-strengths/imgFrame1.svg` | `21:1068` | Core strengths: imgFrame1 | 435 B | asset referenced by design-context code |
| `assets/context/03-about-us/03-core-strengths/imgFrame2.svg` | `21:1068` | Core strengths: imgFrame2 | 481 B | asset referenced by design-context code |
| `assets/context/03-about-us/03-core-strengths/imgFrame3.svg` | `21:1068` | Core strengths: imgFrame3 | 764 B | asset referenced by design-context code |
| `assets/context/03-about-us/04-mission-vision/imgEllipse.svg` | `108:1576` | Mission & vision: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/03-about-us/04-mission-vision/imgFrame.svg` | `108:1576` | Mission & vision: imgFrame | 618 B | asset referenced by design-context code |
| `assets/context/03-about-us/05-meet-our-team/imgAvatarPlaceholder.svg` | `21:1162` | Meet our team: imgAvatarPlaceholder | 972 B | asset referenced by design-context code |
| `assets/context/03-about-us/05-meet-our-team/imgEllipse.svg` | `21:1162` | Meet our team: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/03-about-us/05-meet-our-team/imgGoldCorner.svg` | `21:1162` | Meet our team: imgGoldCorner | 458 B | asset referenced by design-context code |
| `assets/context/03-about-us/05-meet-our-team/imgIconSocialLinkedin.svg` | `21:1162` | Meet our team: imgIconSocialLinkedin | 1.1 KB | asset referenced by design-context code |
| `assets/context/03-about-us/05-meet-our-team/imgPortraitPlaceholder.svg` | `21:1162` | Meet our team: imgPortraitPlaceholder | 508 B | asset referenced by design-context code |
| `assets/context/04-projects/01-page-header/imgEllipse.svg` | `19:556` | Page header: imgEllipse | 233 B | asset referenced by design-context code |
| `assets/context/04-projects/01-page-header/imgVector.svg` | `19:556` | Page header: imgVector | 320 B | asset referenced by design-context code |
| `assets/context/04-projects/02-explore-projects/imgEllipse.svg` | `19:568` | Explore projects: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/04-projects/02-explore-projects/imgFrame.svg` | `19:568` | Explore projects: imgFrame | 1.1 KB | asset referenced by design-context code |
| `assets/context/04-projects/04-portfolio/imgEllipse.svg` | `19:904` | Portfolio: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/04-projects/04-portfolio/imgFrame.svg` | `19:904` | Portfolio: imgFrame | 484 B | asset referenced by design-context code |
| `assets/context/04-projects/05-cta/imgArrow.svg` | `19:926` | CTA: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/04-projects/05-cta/imgArrow1.svg` | `19:926` | CTA: imgArrow1 | 334 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/01-project-hero/imgFrame.svg` | `20:880` | Project hero: imgFrame | 349 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/01-project-hero/imgWave.svg` | `20:880` | Project hero: imgWave | 293 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/02-information-about/imgArrow.svg` | `20:895` | Information & about: imgArrow | 334 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/02-information-about/imgEllipse.svg` | `20:895` | Information & about: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/02-information-about/imgIconChevronDown.svg` | `20:895` | Information & about: imgIconChevronDown | 340 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/02-information-about/imgIconChevronUp.svg` | `20:895` | Information & about: imgIconChevronUp | 339 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/03-key-deliverables/imgEllipse.svg` | `20:947` | Key deliverables: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/03-key-deliverables/imgFrame.svg` | `20:947` | Key deliverables: imgFrame | 880 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/04-gallery/imgEllipse.svg` | `20:976` | Gallery: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/04-gallery/imgFrame.svg` | `20:976` | Gallery: imgFrame | 364 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/05-cta/imgArrow.svg` | `20:995` | CTA: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/05-cta/imgArrow1.svg` | `20:995` | CTA: imgArrow1 | 334 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/06-related-projects/imgEllipse.svg` | `20:1009` | Related projects: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/05-project-detail-sofitel-makkah/06-related-projects/imgFrame.svg` | `20:1009` | Related projects: imgFrame | 1.1 KB | asset referenced by design-context code |
| `assets/context/07-contact-us/01-page-header/imgEllipse.svg` | `23:1366` | Page header: imgEllipse | 233 B | asset referenced by design-context code |
| `assets/context/07-contact-us/01-page-header/imgFrame.svg` | `23:1366` | Page header: imgFrame | 294 B | asset referenced by design-context code |
| `assets/context/07-contact-us/02-get-in-touch/imgArrow.svg` | `23:1378` | Get in touch: imgArrow | 334 B | asset referenced by design-context code |
| `assets/context/07-contact-us/02-get-in-touch/imgEllipse.svg` | `23:1378` | Get in touch: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/07-contact-us/02-get-in-touch/imgFrame.svg` | `23:1378` | Get in touch: imgFrame | 1.5 KB | asset referenced by design-context code |
| `assets/context/07-contact-us/02-get-in-touch/imgFrame1.svg` | `23:1378` | Get in touch: imgFrame1 | 389 B | asset referenced by design-context code |
| `assets/context/07-contact-us/02-get-in-touch/imgFrame2.svg` | `23:1378` | Get in touch: imgFrame2 | 1.1 KB | asset referenced by design-context code |
| `assets/context/07-contact-us/02-get-in-touch/imgFrame3.svg` | `23:1378` | Get in touch: imgFrame3 | 829 B | asset referenced by design-context code |
| `assets/context/07-contact-us/02-get-in-touch/imgIconCheck.svg` | `23:1378` | Get in touch: imgIconCheck | 342 B | asset referenced by design-context code |
| `assets/context/07-contact-us/02-get-in-touch/imgIconChevronDown.svg` | `23:1378` | Get in touch: imgIconChevronDown | 328 B | asset referenced by design-context code |
| `assets/context/07-contact-us/02-get-in-touch/imgIconSocialWhatsapp.svg` | `23:1378` | Get in touch: imgIconSocialWhatsapp | 1.6 KB | asset referenced by design-context code |
| `assets/context/07-contact-us/02-get-in-touch/imgIconUpload.svg` | `23:1378` | Get in touch: imgIconUpload | 673 B | asset referenced by design-context code |
| `assets/context/07-contact-us/03-find-our-office/imgArrow.svg` | `23:1441` | Find our office: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/07-contact-us/03-find-our-office/imgEllipse.svg` | `23:1441` | Find our office: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/07-contact-us/03-find-our-office/imgFrame.svg` | `23:1441` | Find our office: imgFrame | 794 B | asset referenced by design-context code |
| `assets/context/07-contact-us/03-find-our-office/imgFrame1.svg` | `23:1441` | Find our office: imgFrame1 | 653 B | asset referenced by design-context code |
| `assets/context/07-contact-us/03-find-our-office/imgFrame2.svg` | `23:1441` | Find our office: imgFrame2 | 784 B | asset referenced by design-context code |
| `assets/context/components/accordion-item/imgIconChevronDown.svg` | `105:310` | Accordion Item: imgIconChevronDown | 340 B | asset referenced by design-context code |
| `assets/context/components/accordion-item/imgIconChevronUp.svg` | `105:310` | Accordion Item: imgIconChevronUp | 339 B | asset referenced by design-context code |
| `assets/context/components/avatar-placeholder/imgAvatarPlaceholder.svg` | `150:318` | Avatar/Placeholder: imgAvatarPlaceholder | 964 B | asset referenced by design-context code |
| `assets/context/components/button/imgArrow.svg` | `12:36` | Button: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/components/button/imgArrow1.svg` | `12:36` | Button: imgArrow1 | 334 B | asset referenced by design-context code |
| `assets/context/components/eyebrow/imgEllipse.svg` | `12:47` | Eyebrow: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/components/footer/imgArrow.svg` | `13:490` | Footer: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/components/footer/imgEllipse.svg` | `13:490` | Footer: imgEllipse | 253 B | asset referenced by design-context code |
| `assets/context/components/footer/imgFrame.svg` | `13:490` | Footer: imgFrame | 1.4 KB | asset referenced by design-context code |
| `assets/context/components/footer/imgFrame1.svg` | `13:490` | Footer: imgFrame1 | 352 B | asset referenced by design-context code |
| `assets/context/components/footer/imgFrame2.svg` | `13:490` | Footer: imgFrame2 | 1.0 KB | asset referenced by design-context code |
| `assets/context/components/footer/imgIconSocialFacebook.svg` | `13:490` | Footer: imgIconSocialFacebook | 595 B | asset referenced by design-context code |
| `assets/context/components/footer/imgIconSocialInstagram.svg` | `13:490` | Footer: imgIconSocialInstagram | 1.1 KB | asset referenced by design-context code |
| `assets/context/components/footer/imgIconSocialLinkedin.svg` | `13:490` | Footer: imgIconSocialLinkedin | 1.1 KB | asset referenced by design-context code |
| `assets/context/components/footer/imgIconSocialWhatsapp.svg` | `13:490` | Footer: imgIconSocialWhatsapp | 1.6 KB | asset referenced by design-context code |
| `assets/context/components/footer/imgIconSocialWhatsapp1.svg` | `13:490` | Footer: imgIconSocialWhatsapp1 | 1.6 KB | asset referenced by design-context code |
| `assets/context/components/footer/imgIconSocialX.svg` | `13:490` | Footer: imgIconSocialX | 520 B | asset referenced by design-context code |
| `assets/context/components/footer/imgSymbol.svg` | `13:490` | Footer: imgSymbol | 3.9 KB | asset referenced by design-context code |
| `assets/context/components/footer/imgTaglineAr.svg` | `13:490` | Footer: imgTaglineAr | 12.6 KB | asset referenced by design-context code |
| `assets/context/components/footer/imgTaglineEn.svg` | `13:490` | Footer: imgTaglineEn | 7.1 KB | asset referenced by design-context code |
| `assets/context/components/footer/imgWordmark.svg` | `13:490` | Footer: imgWordmark | 4.8 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgSymbol.svg` | `100:515` | Logo: imgSymbol | 3.9 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgSymbol1.svg` | `100:515` | Logo: imgSymbol1 | 3.9 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgSymbol2.svg` | `100:515` | Logo: imgSymbol2 | 2.0 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgSymbol3.svg` | `100:515` | Logo: imgSymbol3 | 2.0 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgSymbol4.svg` | `100:515` | Logo: imgSymbol4 | 2.0 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgTaglineAr.svg` | `100:515` | Logo: imgTaglineAr | 12.6 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgTaglineAr1.svg` | `100:515` | Logo: imgTaglineAr1 | 12.6 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgTaglineAr2.svg` | `100:515` | Logo: imgTaglineAr2 | 6.4 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgTaglineAr3.svg` | `100:515` | Logo: imgTaglineAr3 | 6.4 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgTaglineAr4.svg` | `100:515` | Logo: imgTaglineAr4 | 6.4 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgTaglineEn.svg` | `100:515` | Logo: imgTaglineEn | 7.1 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgTaglineEn1.svg` | `100:515` | Logo: imgTaglineEn1 | 7.1 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgTaglineEn2.svg` | `100:515` | Logo: imgTaglineEn2 | 7.1 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgTaglineEn3.svg` | `100:515` | Logo: imgTaglineEn3 | 7.1 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgTaglineEn4.svg` | `100:515` | Logo: imgTaglineEn4 | 7.1 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgWordmark.svg` | `100:515` | Logo: imgWordmark | 4.9 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgWordmark1.svg` | `100:515` | Logo: imgWordmark1 | 4.8 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgWordmark2.svg` | `100:515` | Logo: imgWordmark2 | 2.5 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgWordmark3.svg` | `100:515` | Logo: imgWordmark3 | 2.5 KB | asset referenced by design-context code |
| `assets/context/components/logo/imgWordmark4.svg` | `100:515` | Logo: imgWordmark4 | 2.5 KB | asset referenced by design-context code |
| `assets/context/components/navbar/imgArrow.svg` | `13:489` | Navbar: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/components/navbar/imgArrow1.svg` | `13:489` | Navbar: imgArrow1 | 334 B | asset referenced by design-context code |
| `assets/context/components/navbar/imgSymbol.svg` | `13:489` | Navbar: imgSymbol | 3.9 KB | asset referenced by design-context code |
| `assets/context/components/navbar/imgTaglineAr.svg` | `13:489` | Navbar: imgTaglineAr | 12.6 KB | asset referenced by design-context code |
| `assets/context/components/navbar/imgTaglineEn.svg` | `13:489` | Navbar: imgTaglineEn | 7.1 KB | asset referenced by design-context code |
| `assets/context/components/navbar/imgWordmark.svg` | `13:489` | Navbar: imgWordmark | 4.9 KB | asset referenced by design-context code |
| `assets/context/components/portrait-placeholder/imgPortraitPlaceholder.svg` | `154:890` | Portrait/Placeholder: imgPortraitPlaceholder | 508 B | asset referenced by design-context code |
| `assets/context/components/project-card/imgEllipse.svg` | `15:269` | Project Card: imgEllipse | 227 B | asset referenced by design-context code |
| `assets/context/components/project-card/imgFrame.svg` | `15:269` | Project Card: imgFrame | 1.1 KB | asset referenced by design-context code |
| `assets/context/components/project-card/imgFrame1.svg` | `15:269` | Project Card: imgFrame1 | 337 B | asset referenced by design-context code |
| `assets/context/components/quote-form/imgArrow.svg` | `103:422` | Quote Form: imgArrow | 336 B | asset referenced by design-context code |
| `assets/context/components/quote-form/imgArrow1.svg` | `103:422` | Quote Form: imgArrow1 | 334 B | asset referenced by design-context code |
| `assets/context/components/quote-form/imgIconCheck.svg` | `103:422` | Quote Form: imgIconCheck | 342 B | asset referenced by design-context code |
| `assets/context/components/quote-form/imgIconCheck1.svg` | `103:422` | Quote Form: imgIconCheck1 | 328 B | asset referenced by design-context code |
| `assets/context/components/quote-form/imgIconChevronDown.svg` | `103:422` | Quote Form: imgIconChevronDown | 328 B | asset referenced by design-context code |
| `assets/context/components/quote-form/imgIconUpload.svg` | `103:422` | Quote Form: imgIconUpload | 673 B | asset referenced by design-context code |
| `assets/context/components/service-card/imgFrame.svg` | `15:320` | Service Card: imgFrame | 335 B | asset referenced by design-context code |
| `assets/context/components/service-card/imgFrame1.svg` | `15:320` | Service Card: imgFrame1 | 337 B | asset referenced by design-context code |
| `assets/context/components/service-card/imgIcon.svg` | `15:320` | Service Card: imgIcon | 394 B | asset referenced by design-context code |
| `assets/context/components/service-tile/imgIconArrowRight.svg` | `109:333` | Service Tile: imgIconArrowRight | 366 B | asset referenced by design-context code |
| `assets/context/components/service-tile/imgIconArrowRight1.svg` | `109:333` | Service Tile: imgIconArrowRight1 | 366 B | asset referenced by design-context code |
| `assets/context/components/service-tile/imgIconContracting.svg` | `109:333` | Service Tile: imgIconContracting | 515 B | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgArrow.svg` | `175:3714` | Services Carousel: imgArrow | 334 B | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgIconArrowLeft.svg` | `175:3714` | Services Carousel: imgIconArrowLeft | 350 B | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgIconArrowRight.svg` | `175:3714` | Services Carousel: imgIconArrowRight | 366 B | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgIconArrowRight1.svg` | `175:3714` | Services Carousel: imgIconArrowRight1 | 366 B | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgIconArrowRight2.svg` | `175:3714` | Services Carousel: imgIconArrowRight2 | 350 B | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgIconContracting.svg` | `175:3714` | Services Carousel: imgIconContracting | 515 B | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgIconElectrical.svg` | `175:3714` | Services Carousel: imgIconElectrical | 382 B | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgIconFire.svg` | `175:3714` | Services Carousel: imgIconFire | 630 B | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgIconHvac.svg` | `175:3714` | Services Carousel: imgIconHvac | 723 B | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgIconPlumbing.svg` | `175:3714` | Services Carousel: imgIconPlumbing | 660 B | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgIconSmart.svg` | `175:3714` | Services Carousel: imgIconSmart | 406 B | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgIconSupply.svg` | `175:3714` | Services Carousel: imgIconSupply | 1.1 KB | asset referenced by design-context code |
| `assets/context/components/services-carousel/imgIconTesting.svg` | `175:3714` | Services Carousel: imgIconTesting | 748 B | asset referenced by design-context code |
| `assets/context/components/team-card/imgGoldCorner.svg` | `150:596` | Team Card: imgGoldCorner | 456 B | asset referenced by design-context code |
| `assets/context/components/team-card/imgGoldCorner1.svg` | `150:596` | Team Card: imgGoldCorner1 | 442 B | asset referenced by design-context code |
| `assets/context/components/team-card/imgIconSocialLinkedin.svg` | `150:596` | Team Card: imgIconSocialLinkedin | 1.1 KB | asset referenced by design-context code |
| `assets/context/components/team-card/imgPortraitPlaceholder.svg` | `150:596` | Team Card: imgPortraitPlaceholder | 508 B | asset referenced by design-context code |
| `assets/context/components/team-marquee/imgAvatarPlaceholder.svg` | `151:964` | Team Marquee: imgAvatarPlaceholder | 972 B | asset referenced by design-context code |
| `assets/context/components/team-member/imgAvatarPlaceholder.svg` | `150:603` | Team Member: imgAvatarPlaceholder | 968 B | asset referenced by design-context code |
| `assets/context/components/whatsapp-fab/imgFrame.svg` | `12:93` | WhatsApp FAB: imgFrame | 1.4 KB | asset referenced by design-context code |
| `assets/context/components/whatsapp-fab/imgPulseRing.svg` | `12:93` | WhatsApp FAB: imgPulseRing | 252 B | asset referenced by design-context code |
| `assets/context/components/whatsapp-fab/imgPulseRing1.svg` | `12:93` | WhatsApp FAB: imgPulseRing1 | 249 B | asset referenced by design-context code |
| `assets/context/overlays/00-intro-reveal/imgGlow.svg` | `28:1615` | 00 Intro – reveal: imgGlow | 536 B | asset referenced by design-context code |
| `assets/context/overlays/00-intro-reveal/imgSymbol.svg` | `28:1615` | 00 Intro – reveal: imgSymbol | 3.9 KB | asset referenced by design-context code |
| `assets/context/overlays/00-intro-reveal/imgTaglineAr.svg` | `28:1615` | 00 Intro – reveal: imgTaglineAr | 12.5 KB | asset referenced by design-context code |
| `assets/context/overlays/00-intro-reveal/imgTaglineEn.svg` | `28:1615` | 00 Intro – reveal: imgTaglineEn | 7.0 KB | asset referenced by design-context code |
| `assets/context/overlays/00-intro-reveal/imgWordmark.svg` | `28:1615` | 00 Intro – reveal: imgWordmark | 4.9 KB | asset referenced by design-context code |
| `assets/context/overlays/00-intro-start/imgGlow.svg` | `28:1609` | 00 Intro – start: imgGlow | 536 B | asset referenced by design-context code |
| `assets/context/overlays/00-intro-start/imgSymbol.svg` | `28:1609` | 00 Intro – start: imgSymbol | 3.9 KB | asset referenced by design-context code |
| `assets/context/overlays/00-intro-start/imgTaglineAr.svg` | `28:1609` | 00 Intro – start: imgTaglineAr | 12.5 KB | asset referenced by design-context code |
| `assets/context/overlays/00-intro-start/imgTaglineEn.svg` | `28:1609` | 00 Intro – start: imgTaglineEn | 7.1 KB | asset referenced by design-context code |
| `assets/context/overlays/00-intro-start/imgWordmark.svg` | `28:1609` | 00 Intro – start: imgWordmark | 4.8 KB | asset referenced by design-context code |
| `assets/context/overlays/overlay-lightbox-1/imgClose.svg` | `28:1687` | Overlay – Lightbox 1: imgClose | 628 B | asset referenced by design-context code |
| `assets/context/overlays/overlay-lightbox-1/imgNext.svg` | `28:1687` | Overlay – Lightbox 1: imgNext | 601 B | asset referenced by design-context code |
| `assets/context/overlays/overlay-lightbox-1/imgPrev.svg` | `28:1687` | Overlay – Lightbox 1: imgPrev | 599 B | asset referenced by design-context code |
| `assets/context/overlays/overlay-lightbox-2/imgClose.svg` | `28:1688` | Overlay – Lightbox 2: imgClose | 630 B | asset referenced by design-context code |
| `assets/context/overlays/overlay-lightbox-2/imgNext.svg` | `28:1688` | Overlay – Lightbox 2: imgNext | 599 B | asset referenced by design-context code |
| `assets/context/overlays/overlay-lightbox-2/imgPrev.svg` | `28:1688` | Overlay – Lightbox 2: imgPrev | 599 B | asset referenced by design-context code |
| `assets/context/overlays/overlay-lightbox-3/imgClose.svg` | `28:1689` | Overlay – Lightbox 3: imgClose | 630 B | asset referenced by design-context code |
| `assets/context/overlays/overlay-lightbox-3/imgNext.svg` | `28:1689` | Overlay – Lightbox 3: imgNext | 599 B | asset referenced by design-context code |
| `assets/context/overlays/overlay-lightbox-3/imgPrev.svg` | `28:1689` | Overlay – Lightbox 3: imgPrev | 599 B | asset referenced by design-context code |
| `assets/context/overlays/overlay-message-sent/imgArrow.svg` | `28:1686` | Overlay – Message sent: imgArrow | 334 B | asset referenced by design-context code |
| `assets/context/overlays/overlay-message-sent/imgFrame.svg` | `28:1686` | Overlay – Message sent: imgFrame | 766 B | asset referenced by design-context code |

## Design-context reference code and metadata (67)

| File | Figma node | Name | Size | Notes |
|---|---|---|---|---|
| `context/01-home/01-hero.md` | `17:199` | Hero | 9.3 KB | design context, 6515 chars code, 6 assets |
| `context/01-home/02-who-we-are.md` | `17:222` | Who we are | 8.4 KB | design context, 5667 chars code, 4 assets |
| `context/01-home/03-core-services.md` | `17:254` | Core services | 30.9 KB | design context, 26533 chars code, 14 assets |
| `context/01-home/04-interactive-systems.md` | `111:1608` | Interactive systems | 14.7 KB | design context, 10997 chars code, 6 assets |
| `context/01-home/05-trusted-by-industry-leaders.md` | `18:285` | Trusted by industry leaders | 7.3 KB | design context, 4992 chars code, 1 assets |
| `context/01-home/06-featured-projects.md` | `18:308` | Featured projects | 26.5 KB | design context, 23607 chars code, 8 assets |
| `context/01-home/07-trusted-partners.md` | `18:579` | Trusted partners | 19.7 KB | design context, 17036 chars code, 1 assets |
| `context/01-home/08-cta.md` | `18:660` | CTA | 7.8 KB | design context, 5524 chars code, 3 assets |
| `context/01-home/09-footer.md` | `18:678` | Footer | 20.9 KB | design context, 16993 chars code, 15 assets |
| `context/01-home/10-navbar.md` | `18:749` | Navbar | 7.9 KB | design context, 4965 chars code, 5 assets |
| `context/01-home/11-whatsapp-fab.md` | `18:775` | WhatsApp FAB (fixed) | 3.7 KB | design context, 1623 chars code, 2 assets |
| `context/02-services/01-page-header.md` | `24:1478` | Page header | 5.1 KB | design context, 2706 chars code, 3 assets |
| `context/02-services/02-services.md` | `24:1490` | Services | 26.5 KB | design context, 23818 chars code, 7 assets |
| `context/02-services/03-specialist-services.md` | `126:1887` | Specialist services | 21.1 KB | design context, 17520 chars code, 8 assets |
| `context/02-services/04-approved-materials-brands.md` | `157:3293` | Approved materials & brands | 33.0 KB | design context, 30142 chars code, 3 assets |
| `context/02-services/05-how-we-work.md` | `24:1646` | How we work | 10.4 KB | design context, 7886 chars code, 2 assets |
| `context/02-services/06-cta.md` | `24:1677` | CTA | 7.8 KB | design context, 5533 chars code, 3 assets |
| `context/03-about-us/01-page-header.md` | `21:1034` | Page header | 5.0 KB | design context, 2690 chars code, 3 assets |
| `context/03-about-us/02-our-story.md` | `21:1046` | Our story | 8.8 KB | design context, 6082 chars code, 3 assets |
| `context/03-about-us/03-core-strengths.md` | `21:1068` | Core strengths | 13.9 KB | design context, 11112 chars code, 6 assets |
| `context/03-about-us/04-mission-vision.md` | `108:1576` | Mission & vision | 18.0 KB | design context, 15565 chars code, 4 assets |
| `context/03-about-us/05-meet-our-team.md` | `21:1162` | Meet our team | 26.0 KB | design context, 21565 chars code, 5 assets |
| `context/04-projects/01-page-header.md` | `19:556` | Page header | 5.2 KB | design context, 2872 chars code, 3 assets |
| `context/04-projects/02-explore-projects.md` | `19:568` | Explore projects | 59.4 KB | design context, 56890 chars code, 7 assets |
| `context/04-projects/03-impact-in-numbers.md` | `19:884` | Impact in numbers | 6.4 KB | design context, 4112 chars code, 1 assets |
| `context/04-projects/04-portfolio.md` | `19:904` | Portfolio | 8.6 KB | design context, 5867 chars code, 3 assets |
| `context/04-projects/05-cta.md` | `19:926` | CTA | 7.8 KB | design context, 5511 chars code, 3 assets |
| `context/05-project-detail-sofitel-makkah/01-project-hero.md` | `20:880` | Project hero | 5.5 KB | design context, 3059 chars code, 3 assets |
| `context/05-project-detail-sofitel-makkah/02-information-about.md` | `20:895` | Information & about | 17.5 KB | design context, 13754 chars code, 4 assets |
| `context/05-project-detail-sofitel-makkah/03-key-deliverables.md` | `20:947` | Key deliverables | 8.9 KB | design context, 6557 chars code, 3 assets |
| `context/05-project-detail-sofitel-makkah/04-gallery.md` | `20:976` | Gallery | 7.1 KB | design context, 4712 chars code, 5 assets |
| `context/05-project-detail-sofitel-makkah/05-cta.md` | `20:995` | CTA | 6.5 KB | design context, 4088 chars code, 3 assets |
| `context/05-project-detail-sofitel-makkah/06-related-projects.md` | `20:1009` | Related projects | 13.8 KB | design context, 11132 chars code, 5 assets |
| `context/07-contact-us/01-page-header.md` | `23:1366` | Page header | 5.0 KB | design context, 2659 chars code, 3 assets |
| `context/07-contact-us/02-get-in-touch.md` | `23:1378` | Get in touch | 27.6 KB | design context, 23630 chars code, 10 assets |
| `context/07-contact-us/03-find-our-office.md` | `23:1441` | Find our office | 16.8 KB | design context, 13833 chars code, 6 assets |
| `context/_metadata/assets-page-11-2.xml` | `11:2` | 🧩 Assets page | 1.7 KB | get_metadata XML |
| `context/_metadata/design-system-page-0-1.xml` | `0:1` | 🎨 Design System page | 11.9 KB | get_metadata XML |
| `context/_metadata/website-page-1-2.xml` | `1:2` | 🖥 Website page | 93.7 KB | get_metadata XML: every node id, type, name, x/y/w/h (positions relative to parent) |
| `context/components/3d-building.md` | `116:1199` | 3D Building | 3.4 KB | design context, 1056 chars code, 1 assets |
| `context/components/accordion-item.md` | `105:310` | Accordion Item | 5.9 KB | design context, 3043 chars code, 2 assets |
| `context/components/avatar-placeholder.md` | `150:318` | Avatar/Placeholder | 2.8 KB | design context, 492 chars code, 1 assets |
| `context/components/brand-tile.md` | `156:890` | Brand Tile | 3.3 KB | design context, 962 chars code, 0 assets |
| `context/components/button.md` | `12:36` | Button | 5.6 KB | design context, 3609 chars code, 2 assets |
| `context/components/eyebrow.md` | `12:47` | Eyebrow | 3.5 KB | design context, 1565 chars code, 1 assets |
| `context/components/footer.md` | `13:490` | Footer | 20.7 KB | design context, 16854 chars code, 15 assets |
| `context/components/logo-marquee.md` | `18:576` | Logo Marquee | 17.4 KB | design context, 15292 chars code, 0 assets |
| `context/components/logo.md` | `100:515` | Logo | 11.3 KB | design context, 7364 chars code, 20 assets |
| `context/components/nav-link.md` | `12:66` | Nav Link | 5.2 KB | design context, 3336 chars code, 0 assets |
| `context/components/navbar.md` | `13:489` | Navbar | 12.3 KB | design context, 9282 chars code, 6 assets |
| `context/components/partner-tile.md` | `15:332` | Partner Tile | 4.0 KB | design context, 2052 chars code, 0 assets |
| `context/components/portrait-placeholder.md` | `154:890` | Portrait/Placeholder | 3.0 KB | design context, 667 chars code, 1 assets |
| `context/components/project-card.md` | `15:269` | Project Card | 9.2 KB | design context, 6789 chars code, 4 assets |
| `context/components/quote-form.md` | `103:422` | Quote Form | 32.6 KB | design context, 29592 chars code, 6 assets |
| `context/components/service-card.md` | `15:320` | Service Card | 8.5 KB | design context, 5961 chars code, 4 assets |
| `context/components/service-tile.md` | `109:333` | Service Tile | 7.1 KB | design context, 4212 chars code, 3 assets |
| `context/components/services-carousel.md` | `175:3714` | Services Carousel | 36.9 KB | design context, 33019 chars code, 13 assets |
| `context/components/team-card.md` | `150:596` | Team Card | 8.3 KB | design context, 5135 chars code, 4 assets |
| `context/components/team-marquee.md` | `151:964` | Team Marquee | 15.2 KB | design context, 12314 chars code, 1 assets |
| `context/components/team-member.md` | `150:603` | Team Member | 4.4 KB | design context, 1674 chars code, 1 assets |
| `context/components/whatsapp-fab.md` | `12:93` | WhatsApp FAB | 4.4 KB | design context, 2233 chars code, 3 assets |
| `context/overlays/00-intro-reveal.md` | `28:1615` | 00 Intro – reveal | 5.7 KB | design context, 2730 chars code, 5 assets |
| `context/overlays/00-intro-start.md` | `28:1609` | 00 Intro – start | 5.7 KB | design context, 2742 chars code, 5 assets |
| `context/overlays/overlay-lightbox-1.md` | `28:1687` | Overlay – Lightbox 1 | 4.2 KB | design context, 1931 chars code, 4 assets |
| `context/overlays/overlay-lightbox-2.md` | `28:1688` | Overlay – Lightbox 2 | 4.2 KB | design context, 1919 chars code, 4 assets |
| `context/overlays/overlay-lightbox-3.md` | `28:1689` | Overlay – Lightbox 3 | 4.2 KB | design context, 1915 chars code, 4 assets |
| `context/overlays/overlay-message-sent.md` | `28:1686` | Overlay – Message sent | 5.0 KB | design context, 2673 chars code, 2 assets |

## Copy (i18n source) (8)

| File | Figma node | Name | Size | Notes |
|---|---|---|---|---|
| `copy/01-home.md` | `13:2` | Copy - 01 Home | 6.8 KB | all visible strings in section order |
| `copy/02-services.md` | `13:3` | Copy - 02 Services | 5.0 KB | all visible strings in section order |
| `copy/03-about-us.md` | `13:4` | Copy - 03 About Us | 4.5 KB | all visible strings in section order |
| `copy/04-projects.md` | `13:5` | Copy - 04 Projects | 3.2 KB | all visible strings in section order |
| `copy/05-project-detail-sofitel-makkah.md` | `13:6` | Copy - 05 Project Detail – Sofitel Makkah | 3.0 KB | all visible strings in section order |
| `copy/07-contact-us.md` | `13:8` | Copy - 07 Contact Us | 1.7 KB | all visible strings in section order |
| `copy/components.md` | `component sets on 0:1` | Copy - components (all variants) | 5.0 KB | includes strings only visible in non-default states |
| `copy/overlays-and-intro.md` | `28:1609, 28:1615, 28:1686-28:1689` | Copy - intro and overlays | 1.0 KB |  |

## Tokens (2)

| File | Figma node | Name | Size | Notes |
|---|---|---|---|---|
| `tokens.json` | `13:2-13:8, component sets` | Design tokens (machine-readable) | 11.4 KB | colors, text styles, shadows, radii, gradients, spacing, layout |
| `tokens.md` | `same as tokens.json` | Design tokens (human-readable) | 6.5 KB | with sources per table |

## Gaps (what the design does NOT contain) and export issues

### Not in the design
1. **No tablet or mobile frames.** Every frame is 1440px desktop; no breakpoints, no responsive variants of any component, no mobile navigation (hamburger / drawer) design.
2. **No Arabic / RTL frames or Arabic copy.** All copy is English (the only Arabic is the vector tagline inside the logo artwork). There is no language switcher in the Navbar (`13:489`) or Footer (`13:490`).
3. **Page number 06 is missing.** Frames go 01-05 then 07 Contact Us; whatever page "06" was meant to be is not in the file.
4. **No 404 / error page, no Privacy Policy / Terms / Cookie pages, no search results page.**
5. **Only one project detail page** (05 Sofitel Makkah). It must serve as the template for all projects; there are no per-project variants.
6. **No service detail pages**, although service cards and the Services carousel have "Learn more" links.
7. **Missing interaction states:** Button (`12:36`) has only Default/Hover (no focus, active/pressed, disabled, loading). Nav Link (`12:66`) has Default/Hover/Active (no focus). There are no form-field focus, error/validation, disabled or loading states, and no "message failed" overlay. Quote Form (`103:422`) has Steps 1-3 only, without validation errors.
8. **Projects page filters and pagination** (`19:568`: Filters, Tab / All systems / Architectural / Electrical / Mechanical / Structural, Pagination) are shown only in their default state. There are no designs for a selected filter, page 2, or an empty result.
9. **Lightbox:** 3 static frames (`28:1687`-`28:1689`). There is no thumbnail strip, loading state or mobile/swipe version.
10. **Intro / preloader:** 2 static keyframes (`28:1609` start and `28:1615` reveal). Timing and easing are not in the frames; only component descriptions describe motion. Motion and prototype data were not exported (`get_motion_context` was not run).
11. **Placeholder content:**
    - Team portraits and avatars are placeholders (`150:318` Avatar / Placeholder, `154:890` Portrait / Placeholder). The component descriptions say they come from a dashboard/CMS.
    - The "Find our office" map (`23:1441`) is a drawn vector placeholder, not a real map embed.
    - The 3D building (`116:1199`) is 12 static angle renders of one image (`assets/images/tower-render.png`). The "live 3D model" it links to is not in the file.
    - Only 9 photos exist, and they are reused across many sections and projects. For example, `about-team.png` appears as several different projects.
12. **Trusted Partners / brand tiles** use text wordmarks (brand + country), not logos. A real partner-logo sprite exists on the Assets page (`50:200`, exported as `assets/images/partner-logos-sprite.png`, 6x6 cells of 300x120) but is not used in the design.
13. **No dark/light theme switch.** Navbar Light/Dark variants exist only to sit over light or dark page tops.
14. **No favicon or social share (OG) image** in the file. The Logo icon variants (`assets/logo/icon-*.svg`) can be used to make them.
15. **Assets-page items that are not website assets:** `76:1644`-`81:1659` ("image 1-6") are screenshots of a reference build (saved under `assets/images/reference/`). `25:199` is an old raster logo that the vector logo replaced.

### Export issues
- **Nothing failed to download.** Every screenshot, SVG and raw image downloaded without error.
- **`get_variable_defs` on page `0:1` (Design System page) was rejected** ("select a layer first"). Variables were collected from the 6 page frames and from component sets instead (see `tokens.md`).
- **`context/04-projects/02-explore-projects.md` (`19:568`):** the tool output was cut at its 25k-token limit, but only after the code. The reference code is complete, ending with the closing `}`. Only the trailing "Notes" block may be incomplete.
- **SVG exports:** Figma included the gray canvas rect (`#E5E5E5`) in every icon and logo export, and the gray component-set frame rect (`#9AA3B2`) in every logo. Both rects were removed so the SVGs have transparent backgrounds. Nothing else was edited.
- **Raster images:** the reference code's raster assets turned out to be identical copies of the 9 library photos. They were deduplicated into `assets/images/`, and the asset maps in `context/*.md` point to those shared files. The SVG layer assets stay in `assets/context/<page>/<section>/`.
- **Screenshots wider or taller than the node:** Navbar (`10-navbar.png`, 1440x98) and WhatsApp FAB (`11-whatsapp-fab.png`, 290x108) include their drop-shadow and pulse bleed. Every other screenshot is exactly 1:1 with its node.
- **Copy files** (`copy/*.md`) were extracted automatically from the reference code. Strings passed as component props (button labels, eyebrows, brand tiles, accordion bodies) are included, but a prop string can come before the element text in the list. Check exact order against the section screenshot.

