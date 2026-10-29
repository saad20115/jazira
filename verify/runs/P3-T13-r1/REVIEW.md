# P3-T13 round 1 — independent review (reviewer: ctoreview47)

- **Target:** `71df181c335fc4af92de0de22b070667cbd7267a`, checked out from a fresh `git clone file:///D:/jazira` into `D:\ctoreview47-p3t13`. `git lfs pull` had nothing to fetch. The tree stayed clean (`git status --porcelain` empty) after every mutation was reverted.
- **Environment:** Docker project `ctoreview47` (Postgres on 55480, Mailpit on 1047/8047), a fresh `.env` with random secrets (never printed), and production `next start` on **3180**.
- **Seeding:** the executor's own path, `node scripts/evidence/p3-t4-evidence.mjs --mode=seed-only` (no `--skip-brands`, matching their `--mode=prod-intro` run). It used a reviewer-only admin account.
- **Arabic toggle:** `site-settings.arabicEnabled` was `true` after seeding. I set it to `false` through REST (`/ar` → 307 `/en`), then back to `true` (`/ar` → 200). Its final value is `true`, the original.
- **Instruments:** all mine, in this folder:
  - `measure.mjs`: Playwright plus a CDP trace with screenshots, and pixel classification;
  - `chunks.mjs`: a raw HTTP chunk recorder;
  - `r34.mjs`;
  - `analyze.mjs`;
  - `settings.mjs`.
- **Executor code:** none of the executor's evidence code was reused for measurement. Their seeding script was the only exception.
- **Interruption:** a usage-limit pause happened after the matrix was launched. When I resumed, `matrix/results.json` held **54/54 complete runs and 0 errors**. The background job had exited 0, and `ctoreview47` and the 3180 server were still up. So **no run was interrupted or re-run**. Later control and targeted sets were added after the resume, and are listed separately below.
- **Cleanup:** I stopped only my own server PID (18371) and ran `docker compose -p ctoreview47 down -v` (volume removed). No other process or container was touched.

## 1. DoD (fresh clone, reviewer-run)
| Step | Result |
|---|---|
| `pnpm install --frozen-lockfile` | exit 0, **Packages: +765**, "Done in 11m 58.6s using pnpm v10.34.7" (`logs/install.log`) |
| `payload migrate` | exit 0, 10 migrations applied (`logs/migrate.log`) |
| `pnpm lint` | exit 0 (103 s); `[css-logical-properties] Verified 28 public CSS files … (0 violations)` |
| `pnpm typecheck` | exit 0 (21 s) |
| `pnpm format:check` | exit 0, "All matched files use Prettier code style!" |
| `pnpm tokens:check` | exit 0 |
| `pnpm test` (with DB) | exit 0, **Test Files 49 passed (49), Tests 305 passed (305)**, 692 s |
| `pnpm build` | exit 0 (469 s), "Compiled successfully in 4.2min", bundle sentinels verified |
| `pnpm audit --prod` | exit 0, "No known vulnerabilities found" |

DoD matches the executor's claims (765 / 305 / clean audit).

## 2. Code read (quotes from `71df181`)
- **Where and when the decision script runs:** in `<head>`, as a parser-inserted inline script. It comes after the two render-blocking stylesheets and before `<body>`.
  - `src/app/(frontend)/[locale]/layout.tsx:407-411`: `<head><script nonce={cspNonce} dangerouslySetInnerHTML={{ __html: INTRO_PREPAINT_INLINE_SCRIPT }} />`
  - The script runs synchronously only to register **one rAF**. The decision runs inside the callback:
    `window.requestAnimationFrame(function(rafTs){var decide=function(useRafTs){…}; if(document.querySelector('[data-component="intro-splash"]:not([data-intro-forced="true"])')){decide(true);}else if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){decide(false);},{once:true});}});` (`src/components/IntroSplash.tsx:35`)
- **Timestamp:** the rAF argument in the main path, and `performance.now()` at `DOMContentLoaded` in the fallback path:
  `var rawTs=useRafTs&&typeof rafTs==='number'&&rafTs>0?rafTs:(…performance.now()…);` … `if(rawTs>1200){… d.setAttribute('data-intro','seen') …}` … `d.setAttribute('data-intro','active');setInert(true);`
- **DOM order:** the overlay is not first in `<body>`. It is inside `<main>`, after the skip link and the full `<header>`:
  - `layout.tsx:423-431`: `<body><a href="#main-content" …/>{headerNode}<main id="main-content" tabIndex={-1}>{children}</main>{footerNode}</body>`
  - `page.tsx:509-511`: `<IntroSplash …/>` and then `<div className={styles.homeContent} data-home-content="true">`
- **Content hiding (CSS and JS), at any intro state:** none found.
  - The only `data-intro` rules are in `IntroSplash.module.css`, and all target `.overlay` or its children:
    - `:86` `display: none` (overlay default);
    - `:97-100` `html[data-intro='active'] .overlay { display:flex }`;
    - `:102-104` animation;
    - `:106-108` `[data-intro='seen'] .overlay { display:none }`;
    - `:258-262` reduced motion.
  - No `pending` rule; no `visibility`, `opacity`, `content-visibility` or `display` on body/main/header/footer; `globals.css` and `page.module.css` contain no `data-intro`.
  - The JS sets only `inert` on the skip link, header, `[data-home-content]`, footer and the FAB, as R-29 requires (`IntroSplash.tsx:14-20`, `:35`).
- **Viewport, UA and env branches:** none.
  - The inline script reads only `location.pathname` (home regex `^\/(en|ar)?\/?$`), `matchMedia('(prefers-reduced-motion: reduce)')` and `sessionStorage`.
  - `IntroSplash.module.css:246-256` has a `max-width:767.98px` media query that only resizes the glow and moves the Skip button. That is layout, not a timing branch.
- **Where `aljazira_intro_seen` is written:**
  - (a) the inline script inside `decide()`, only after the overlay node was found (`IntroSplash.tsx:35`: `if(!ov){return;}` … `sessionStorage.setItem('aljazira_intro_seen','1')`);
  - (b) React `dismissImmediately` → `markIntroSplashSeen` (`IntroSplash.tsx:131-142`, `:95-104`), on animationend, click, Skip or Esc of the home overlay. It is a no-op when `forceState` is set.
  - Non-home paths return before any storage access.

## 3. Measurement method (`measure.mjs`)
- **Browser and matrix:**
  - Playwright 1.64.1 chromium (headless shell), with a **fresh context per run** (empty sessionStorage) and the cache disabled.
  - Viewports: 412×823 (`isMobile`, touch, DPR 1.75, mobile UA), 768×1024 and 1440×900.
  - Throttling modes:
    - unthrottled;
    - **mid-tier**: CDP CPU ×2, 40 ms RTT, 9 Mbps down/up;
    - **throttled**: CPU ×4, Slow 4G = 150 ms, 1.6 Mbps down / 750 kbps up (the executor's values).
  - en and ar, 3 runs each, so 54 runs.
- **`addInitScript`** (runs at document creation, before any page script):
  - a `PerformanceObserver({type:'paint', buffered:true})` for FP and FCP;
  - a `MutationObserver` on `document` (subtree, `attributeFilter:['data-intro']`, filtered to `<html>`) that records `performance.now()`, the value and a DOM snapshot each time `data-intro` changes. This gives the moment the decision callback **actually executed**;
  - a parse-time recorder for header, main, overlay, footer and h1;
  - `animationstart`/`animationend` on the overlay, and `securitypolicyviolation`;
  - a rAF sampler **from the document's first frame**, independent of the decision. Each frame records the computed `visibility`, `display`, `opacity` and `content-visibility` of `body`, `main`, `header` and `footer`, plus the overlay state and the logo opacity.
- **Paint timeline:** `browser.startTracing({screenshots:true})`.
  - I used the trace `Screenshot` events, anchored to the trace `navigationStart` whose `navigationId` matches the `firstPaint` event. The trace FP matched the observer FP within 1–3 ms.
  - Every screenshot was downscaled to 72 px wide and classified:
    - **blank**: ≥ 97 % white **and** a flat top band (std < 3);
    - **overlay**: top 12 % ≥ 97 % `--navy-950` (#011025, L1 < 36), top band std < 6, and ≥ 60 % navy overall. The navbar can never satisfy this;
    - otherwise **page**.
  - I checked the classifier by eye on contact sheets (`contact1.png`, `contact-dcl.png`).
  - **Frames before overlay** = page frames that precede the first overlay frame.
- **Network evidence:** CDP `Network.dataReceived` for the document, plus `chunks.mjs` (a raw `node:http` client with `accept-encoding: identity`).
- **Control:** 15 runs with the rAF sampler **off** (`control/`), to show my sampler does not cause the effects. They reproduce them.
- **Targeted set:** 12 throttled `en` runs with every frame saved (`dclhunt/`).

## 4. Full per-run table (54 runs, `matrix/results.json`; raw per-run samples in `matrix/raw/`)
Times are ms since navigationStart.
- `rafTs (code)` is the timestamp the implementation decides on (`__aljaziraIntroDecision.rafMs`).
- `callback now (MO)` is when `data-intro` was actually set.
- `overlay parsed` is when the overlay node entered the DOM. It is a proxy for a synchronous script placed after the overlay.
- `path`: `rAF` means the overlay was present in the rAF callback; `DCL-fallback` means the decision was taken at `DOMContentLoaded`.

| # | vp | mode | loc | run | FP | FCP | rafTs (code) | callback now (MO) | FP−rafTs | FP−now | overlay parsed | FP−overlayParsed | path | played | 1st overlay paint | logo ≥1 (ms) | hidden (DOM) | hidden (paint) | span | page frames before overlay | hidden content samples | console/CSP |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 412 | unthrottled | en | 1 | 600 | 600 | 342 | 509 | 258 | 91 | 343 | 257 | rAF | play | 601 | 767 | 1792 | 1671 | 1191 | 0 | 0/327 | 0/0 |
| 2 | 412 | unthrottled | en | 2 | 452 | 452 | 244 | 402 | 208 | 50 | 252 | 200 | rAF | play | 453 | 750 | 1627 | 1518 | 1175 | 0 | 0/330 | 0/0 |
| 3 | 412 | unthrottled | en | 3 | 428 | 428 | 231 | 380 | 197 | 48 | 227 | 201 | rAF | play | 428 | 767 | 1598 | 1510 | 1171 | 0 | 0/335 | 0/0 |
| 4 | 412 | mid-tier | en | 1 | 644 | 644 | 328 | 590 | 316 | 54 | 352 | 293 | rAF | play | 642 | 550 | 1794 | 1708 | 1153 | 0 | 0/300 | 0/0 |
| 5 | 412 | mid-tier | en | 2 | 692 | 692 | 339 | 620 | 353 | 72 | 360 | 332 | rAF | play | 690 | 650 | 1839 | 1754 | 1148 | 0 | 0/301 | 0/0 |
| 6 | 412 | mid-tier | en | 3 | 716 | 716 | 383 | 661 | 333 | 55 | 397 | 319 | rAF | play | 713 | 567 | 1883 | 1781 | 1169 | 0 | 0/295 | 0/0 |
| 7 | 412 | throttled | en | 1 | 1628 | 1628 | 1013 | 1565 | 615 | 63 | 1033 | 595 | rAF | play | 1627 | 533 | 2829 | 2847 | 1203 | 0 | 0/210 | 0/0 |
| 8 | 412 | throttled | en | 2 | 1424 | 1424 | 997 | 1355 | 427 | 69 | 1016 | 408 | rAF | play | 1421 | 667 | 2613 | 2644 | 1193 | 0 | 0/228 | 0/0 |
| 9 | 412 | throttled | en | 3 | 1124 | 1408 | 1958 | 1962 | -834 | -838 | 1125 | -1 | DCL-fallback | SKIP | – | – | – | – | – | – | 0/209 | 0/0 |
| 10 | 768 | unthrottled | en | 1 | 588 | 588 | 240 | 448 | 348 | 140 | 264 | 324 | rAF | play | 586 | 767 | 1773 | 1590 | 1188 | 0 | 0/285 | 0/0 |
| 11 | 768 | unthrottled | en | 2 | 528 | 528 | 253 | 429 | 275 | 99 | 251 | 277 | rAF | play | 529 | 767 | 1720 | 1564 | 1191 | 0 | 0/307 | 0/0 |
| 12 | 768 | unthrottled | en | 3 | 468 | 468 | 204 | 370 | 264 | 98 | 218 | 250 | rAF | play | 467 | 767 | 1654 | 1502 | 1187 | 0 | 0/295 | 0/0 |
| 13 | 768 | mid-tier | en | 1 | 500 | 500 | 340 | 439 | 160 | 61 | 360 | 140 | rAF | play | 500 | 683 | 1640 | 1525 | 1141 | 0 | 0/290 | 0/0 |
| 14 | 768 | mid-tier | en | 2 | 692 | 692 | 338 | 601 | 354 | 92 | 358 | 334 | rAF | play | 692 | 650 | 1805 | 1678 | 1112 | 0 | 0/287 | 0/0 |
| 15 | 768 | mid-tier | en | 3 | 680 | 680 | 336 | 597 | 344 | 83 | 361 | 320 | rAF | play | 681 | 567 | 1836 | 1669 | 1155 | 0 | 0/278 | 0/0 |
| 16 | 768 | throttled | en | 1 | 1180 | 1180 | 2089 | 2090 | -909 | -910 | 1175 | 5 | DCL-fallback | SKIP | – | – | – | – | – | – | 0/191 | 0/0 |
| 17 | 768 | throttled | en | 2 | 1632 | 1632 | 962 | 1494 | 670 | 138 | 972 | 660 | rAF | play | 1633 | 483 | 2779 | 3006 | 1146 | 0 | 0/183 | 0/0 |
| 18 | 768 | throttled | en | 3 | 1212 | 1212 | 964 | 1147 | 248 | 65 | 972 | 240 | rAF | play | 1212 | 267 | 2730 | 2256 | 1518 | 0 | 0/186 | 0/0 |
| 19 | 1440 | unthrottled | en | 1 | 712 | 712 | 347 | 553 | 365 | 159 | 308 | 404 | rAF | play | 710 | 767 | 1897 | 1908 | 1186 | 0 | 0/188 | 0/0 |
| 20 | 1440 | unthrottled | en | 2 | 536 | 536 | 236 | 423 | 300 | 113 | 228 | 308 | rAF | play | 536 | 733 | 1703 | 1719 | 1167 | 0 | 0/196 | 0/0 |
| 21 | 1440 | unthrottled | en | 3 | 508 | 508 | 160 | 371 | 348 | 137 | 180 | 328 | rAF | play | 508 | 750 | 1694 | 1664 | 1185 | 0 | 0/214 | 0/0 |
| 22 | 1440 | mid-tier | en | 1 | 644 | 644 | 371 | 539 | 273 | 105 | 391 | 253 | rAF | play | 643 | 717 | 1821 | 1869 | 1179 | 0 | 0/165 | 0/0 |
| 23 | 1440 | mid-tier | en | 2 | 840 | 840 | 350 | 713 | 490 | 127 | 360 | 480 | rAF | play | 838 | 683 | 1950 | 1952 | 1113 | 0 | 0/178 | 0/0 |
| 24 | 1440 | mid-tier | en | 3 | 748 | 748 | 335 | 633 | 413 | 116 | 363 | 386 | rAF | play | 746 | 667 | 1868 | 1879 | 1122 | 0 | 0/202 | 0/0 |
| 25 | 1440 | throttled | en | 1 | 2552 | 2552 | 1281 | 1349 | 1271 | 1204 | 1306 | 1246 | rAF | SKIP | – | – | – | – | – | – | 0/97 | 0/0 |
| 26 | 1440 | throttled | en | 2 | 1168 | 1168 | 1813 | 1814 | -645 | -646 | 1155 | 13 | DCL-fallback | SKIP | – | – | – | – | – | – | 0/131 | 0/0 |
| 27 | 1440 | throttled | en | 3 | 1824 | 1824 | 970 | 1619 | 854 | 205 | 982 | 843 | rAF | play | 1824 | 567 | 3020 | 3162 | 1196 | 0 | 0/133 | 0/0 |
| 28 | 412 | unthrottled | ar | 1 | 556 | 556 | 475 | 495 | 81 | 61 | 220 | 336 | rAF | play | 553 | 767 | 1742 | 1626 | 1189 | 0 | 0/330 | 0/0 |
| 29 | 412 | unthrottled | ar | 2 | 600 | 600 | 360 | 532 | 240 | 68 | 236 | 364 | rAF | play | 598 | 767 | 1793 | 1688 | 1196 | 0 | 0/327 | 0/0 |
| 30 | 412 | unthrottled | ar | 3 | 528 | 528 | 220 | 443 | 308 | 85 | 206 | 322 | rAF | play | 528 | 767 | 1720 | 1598 | 1191 | 0 | 0/328 | 0/0 |
| 31 | 412 | mid-tier | ar | 1 | 1080 | 1080 | 455 | 995 | 625 | 85 | 366 | 714 | rAF | play | 1081 | 517 | 2272 | 2168 | 1191 | 0 | 0/270 | 0/0 |
| 32 | 412 | mid-tier | ar | 2 | 1040 | 1040 | 473 | 968 | 567 | 72 | 379 | 661 | rAF | play | 1038 | 517 | 2240 | 2136 | 1201 | 0 | 0/272 | 0/0 |
| 33 | 412 | mid-tier | ar | 3 | 1112 | 1112 | 488 | 1045 | 624 | 67 | 407 | 705 | rAF | play | 1112 | 500 | 2305 | 2202 | 1192 | 0 | 0/266 | 0/0 |
| 34 | 412 | throttled | ar | 1 | 2736 | 2736 | 1243 | 1258 | 1493 | 1478 | 1071 | 1665 | rAF | SKIP | – | – | – | – | – | – | 0/129 | 0/0 |
| 35 | 412 | throttled | ar | 2 | 2588 | 2588 | 1177 | 2483 | 1411 | 105 | 1029 | 1559 | rAF | play | 2588 | 400 | 3810 | 3725 | 1222 | 0 | 0/123 | 0/0 |
| 36 | 412 | throttled | ar | 3 | 2528 | 2528 | 1163 | 2432 | 1365 | 96 | 1022 | 1506 | rAF | play | 2528 | 500 | 3746 | 3776 | 1218 | 0 | 0/112 | 0/0 |
| 37 | 768 | unthrottled | ar | 1 | 604 | 604 | 364 | 507 | 240 | 97 | 147 | 457 | rAF | play | 604 | 767 | 1797 | 1633 | 1194 | 0 | 0/313 | 0/0 |
| 38 | 768 | unthrottled | ar | 2 | 624 | 624 | 380 | 536 | 244 | 88 | 202 | 422 | rAF | play | 625 | 767 | 1830 | 1647 | 1205 | 0 | 0/321 | 0/0 |
| 39 | 768 | unthrottled | ar | 3 | 540 | 540 | 344 | 461 | 196 | 79 | 181 | 359 | rAF | play | 538 | 767 | 1728 | 1557 | 1189 | 0 | 0/319 | 0/0 |
| 40 | 768 | mid-tier | ar | 1 | 1120 | 1120 | 456 | 1018 | 664 | 102 | 375 | 746 | rAF | play | 1120 | 583 | 2305 | 2164 | 1186 | 0 | 0/228 | 0/0 |
| 41 | 768 | mid-tier | ar | 2 | 1408 | 1408 | 561 | 1281 | 847 | 127 | 471 | 937 | rAF | play | 1407 | 483 | 2611 | 2465 | 1204 | 0 | 0/195 | 0/0 |
| 42 | 768 | mid-tier | ar | 3 | 1176 | 1176 | 519 | 1080 | 657 | 96 | 427 | 749 | rAF | play | 1175 | 667 | 2369 | 2220 | 1194 | 0 | 0/240 | 0/0 |
| 43 | 768 | throttled | ar | 1 | 2700 | 2700 | 1159 | 2562 | 1541 | 138 | 1040 | 1660 | rAF | play | 2698 | 750 | 3892 | 3802 | 1195 | 0 | 0/126 | 0/0 |
| 44 | 768 | throttled | ar | 2 | 2624 | 2624 | 1234 | 1256 | 1390 | 1368 | 1044 | 1580 | rAF | SKIP | – | – | – | – | – | – | 0/128 | 0/0 |
| 45 | 768 | throttled | ar | 3 | 2972 | 2972 | 1207 | 1232 | 1765 | 1740 | 1046 | 1926 | rAF | SKIP | – | – | – | – | – | – | 0/96 | 0/0 |
| 46 | 1440 | unthrottled | ar | 1 | 884 | 884 | 523 | 755 | 361 | 129 | 485 | 399 | rAF | play | 884 | 750 | 2073 | 2086 | 1189 | 0 | 0/187 | 0/0 |
| 47 | 1440 | unthrottled | ar | 2 | 580 | 580 | 389 | 501 | 191 | 79 | 180 | 400 | rAF | play | 577 | 750 | 1756 | 1757 | 1178 | 0 | 0/215 | 0/0 |
| 48 | 1440 | unthrottled | ar | 3 | 744 | 744 | 580 | 608 | 164 | 136 | 268 | 476 | rAF | play | 743 | 750 | 1913 | 1966 | 1170 | 0 | 0/233 | 0/0 |
| 49 | 1440 | mid-tier | ar | 1 | 1072 | 1072 | 418 | 960 | 654 | 112 | 343 | 729 | rAF | play | 1070 | 667 | 2251 | 2262 | 1181 | 0 | 0/188 | 0/0 |
| 50 | 1440 | mid-tier | ar | 2 | 1600 | 1600 | 460 | 1404 | 1140 | 196 | 376 | 1224 | rAF | play | 1601 | 383 | 2793 | 2835 | 1192 | 0 | 0/154 | 0/0 |
| 51 | 1440 | mid-tier | ar | 3 | 1156 | 1156 | 434 | 1021 | 722 | 135 | 355 | 801 | rAF | play | 1156 | 500 | 2317 | 2355 | 1162 | 0 | 0/179 | 0/0 |
| 52 | 1440 | throttled | ar | 1 | 2652 | 2652 | 1226 | 1236 | 1426 | 1416 | 1058 | 1594 | rAF | SKIP | – | – | – | – | – | – | 0/93 | 0/0 |
| 53 | 1440 | throttled | ar | 2 | 2628 | 2628 | 1225 | 1245 | 1403 | 1384 | 1054 | 1574 | rAF | SKIP | – | – | – | – | – | – | 0/81 | 0/0 |
| 54 | 1440 | throttled | ar | 3 | 2612 | 2612 | 1163 | 2465 | 1449 | 147 | 1025 | 1587 | rAF | play | 2609 | 67 | 3780 | 3937 | 1170 | 0 | 0/77 | 0/0 |

`hidden (paint)` is the first screenshot after the last overlay frame that classifies as page with < 50 % navy. During the fade the page shows through, so it can precede the DOM-hidden time.

## 5. Spec rules, per run (54-run matrix)
| Rule | Result |
|---|---|
| First visible → gone ≤ 1.6 s | **PASS 45/45** played. Span 1112–1518 ms; unthrottled and mid-tier max 1205. |
| Logo fully visible ≥ 300 ms | **43/45 measured ≥ 300.** The 2 below (768-thr-en-r3: 267, 1440-thr-ar-r3: 67) are **under-sampled**: rAF samples are 230–400 ms apart under ×4 CPU, and the bracketing samples show logo = 1 for at least 232 ms and 436 ms. Not proven failing. Unthrottled min 733, mid-tier min 383. |
| Gone by 2.5 s from navigationStart | **FAIL 11/45** played runs (DOM hidden 2611–3892 ms; paint 2465–3937). All 11 have FP > 1200. Two are **mid-tier ar**: 768-r2 (FP 1408 → hidden 2611) and 1440-r2 (FP 1600 → 2793). |
| Skipped iff first frame > 1200 ms | **FAIL 14/54**. 11 runs with FP > 1200 played (FP 1212–2700). **3** runs with FP ≤ 1200 were skipped (FP 1124, 1168, 1180): the DCL-fallback path. With ±17 ms tolerance: 13 violations. |
| Mid-tier en and ar play when FP ≤ 1200 | **PASS 16/16** (the other 2 mid-tier runs had FP > 1200 and played anyway; see the 2.5 s row). |
| 0 page frames painted before the overlay (played runs) | **PASS 45/45** at pixel level. The first non-blank screenshot is the overlay in 45/45. **But see §6:** in the DCL path the navbar is painted before any decision. |
| Content never hidden | **PASS 54/54.** 11,871 rAF samples: 0 with body, main, header or footer `visibility≠visible`, `display:none`, `opacity<1` or `content-visibility≠visible`. `inert` is set during the intro, as R-29 requires. |
| No viewport, UA or env branches | **PASS** (code, §2). |
| Console errors and CSP violations | **0 and 0** across the 54 runs, and also across the 15 control and 12 targeted runs. |

**Control without the sampler (15 runs, `control/`):**
- 4 rule-R4 violations: 2 played with FP 1304 and 2644 (hidden 2754 and 3878), and 2 were skipped with FP 1096 and 1120 (DCL path).
- 2 of 11 played runs went past 2.5 s.
- 0 page frames were painted before the overlay.

So the defects do not come from my instrumentation.

## 6. Frames before the overlay: result and method
- **Method:** trace screenshots classified by pixels (§3). This is independent of `data-intro`, `getComputedStyle` and the implementation's own globals.
- **Played runs:**
  - 0 page frames before the overlay in 45/45 (matrix) + 11/11 (control) + 7/7 (targeted).
  - The first non-blank frame lands at FP and already shows the navy overlay.
- **The DCL-fallback path does paint page content before any decision.**
  - Seen in 3/54 matrix, 2/15 control and **5/12** targeted throttled-en runs.
  - The head rAF fired after only the `<header>` had been parsed. The overlay was not in the DOM, so the code attached a `DOMContentLoaded` listener.
  - At FP (1084–1208 ms), Chromium painted the **navbar on a white page** (`contact-dcl.png`, frames `dclhunt/frames/1440-throttled-en-r1/01186-page.jpg` and `412-throttled-en-r2/01090-page.jpg`). Then the hero painted (≈ 1.5 s), then DCL fired at 1813–2090 ms.
  - Because `performance.now()` at DCL was > 1200, the intro was **skipped although FP ≤ 1200**. That is the wrong outcome, but it hides the flash.
  - Had DCL come at ≤ 1200 ms, the overlay would have appeared **after** painted page frames, which is exactly R-31.
  - The guard holds only by luck of timing. The VM unit test never runs this path: the fake `document` has no `readyState` (`src/p3-t4-home.test.ts:851-927`).

## 7. Decision time vs FP: what the "+139…+1927 ms" means
The executor says the decision fires up to 1.9 s before FP "because `<head>` streams before `<main>`". My data does not support that.

- **HTML chunk order** (raw HTTP, `logs/chunks-en.log`):
  - The whole 164,722-byte `/en` document is flushed **in one burst**: 5 socket reads within ≤ 1.2 ms, no `$RC` or `<template id="B:…">` streamed boundaries.
  - Both stylesheets are in `<head>` (bytes 1042 and 1192). The intro script is at 5794, `</head>` at 8194, `<body>` at 8201, the skip link at 8248, `<header>` at 8579, `<main>` at 14716, **the overlay at 14891**, h1 at 17136 and `<footer>` at 82096. All of the first four body landmarks are in the first 65 KB read.
  - Under throttling, CDP shows the document fully received by **≈ 470–510 ms** (2 `dataReceived` events), long before the late FPs. Nothing "streams `<main>` later".
  - In 6/54 runs the header was parsed in an earlier parser tick than the overlay.
- **The real cause is a stale rAF timestamp.**
  - `rafTs` is the frame's begin time. The callback runs only when the main thread is free, after the parsing and script long tasks.
  - **callback − rafTs:**

    | Mode | Median | Max |
    |---|---|---|
    | Unthrottled | 167 ms | 232 ms |
    | Mid-tier | 495 ms | 944 ms |
    | Throttled | 183 ms | 1403 ms |

  - In 14/54 runs `rafTs` is even earlier than the time the script registered the rAF (for example, `scriptMs` 978 vs `rafMs` 967).
- **The callback itself is the first frame.**

  | Mode | FP − callback `performance.now()` (rAF path), median | Max |
  |---|---|---|
  | Unthrottled | 97 ms | 159 ms |
  | Mid-tier | 96 ms | 196 ms |
  | Throttled | 138 ms | 160 ms |

  - That gap is one style, layout and paint pipeline plus presentation.
  - The CSS timeline starts at FP − 31 ms (median; range −106…−15). So **hidden ≈ FP + 1170 ms, whatever `rafTs` was.**
  - The executor's own "1 frame" for a 1382 ms Δ says the same thing: no rAF ran between `rafTs` and FP. The decision **is** taken in the first frame; it just reads the wrong clock.
- **What happens in practice:**
  - (a) **The intro plays when FP > 1200: 11/54 runs.** Example: 1440-thr-ar-r3 had `rafTs` 1163 ≤ 1200, a callback at 2465 and FP 2612.
  - (b) **It runs past 2.5 s from navigationStart: 11/45** played runs, max 3892 ms (768-thr-ar-r1). This includes 2 mid-tier `ar` runs.
  - (c) **Wrong skips with FP ≤ 1200: 3/54** (DCL fallback, §6).
- **Counterfactual** (same 54 runs, misclassifications against "skip iff FP > 1200"):

  | Decision clock | Misclassified |
  |---|---|
  | `rafTs` (current) | **14** |
  | `performance.now()` inside the same rAF callback | **4**: the 3 DCL-path runs, plus 1 borderline (callback 1147, FP 1212) |
  | A synchronous script right after the overlay (overlay parse time) | **16** |

  - FP − overlay-parsed: median 336 / 661 / 1506 ms, max 1926 ms.

## 8. R-34 (`r34.mjs`, `logs/r34.log`)
Every `Storage.setItem` call was recorded by an init-script hook.

| Case | `aljazira_intro_seen` | setItem calls |
|---|---|---|
| `/en/privacy`, `/en/services`, `/ar/projects`, `/en/does-not-exist`, `/en/styleguide`, `/ar/about`: all **404** at this commit (only home exists); ×6 CPU + Slow 4G; FP 2076–4200 ms; one session | null; `data-intro` null | **0** |
| Home `/en` in the same session afterwards | `'1'`; the intro ran | 1 (on `/en`) |
| Home `/en` and `/ar` with the overlay stripped from the HTML | null | **0** |
| Home `/en` with reduced motion | null (`data-intro=seen`) | 0 |
| Home `/en`, `/ar`, `/` normal (control) | `'1'` | 2 each: inline `decide` at 154–243 ms, and React `markIntroSplashSeen` on animationend |

**R-34: PASS.** One caveat: no real non-home page exists yet, so this was tested only on 404 routes.

## 9. Mutation check on the R-26 regression test (`src/p3-t4-home.test.ts:791-830`, run via `npx vitest run src/p3-t4-home.test.ts`)
Each mutation was reverted with `git checkout -- src`, and the tree was confirmed clean.

| # | Mutation | Test result |
|---|---|---|
| M0 | none (baseline) | 11/11 pass |
| **M1** | `IntroSplash.module.css` += `:global(html[data-intro='active']) body { visibility: hidden; }` (**the requested mutation**) | **FAILS** (caught by the `not.toMatch(/data-intro[^\n{]*\b(body…)/)` regex) |
| M2 | same rule in `globals.css` | FAILS (caught by `not.toContain('data-intro')`) |
| M3 | same rule with the selector split over two lines | **passes, not caught** (the regex stops at the newline) |
| M4b | `:global(html:has(.overlay)) :global(body) > :global(main) { visibility:hidden }` in `IntroSplash.module.css` | **passes, not caught** |
| M5 | `:global(html[data-intro='active']) :global([data-home-content='true']) { opacity: 0 }` | **passes, not caught** (the regex has `homeContent`, not `home-content`) |
| M6 | the inline script sets `document.body.style.visibility='hidden'` | fails, but only by accident: the VM fake document has no `body`, so a TypeError is thrown |
| M7 | the inline script sets `main.style.visibility='hidden'` with a null guard | **passes, not caught** |

**Verdict:** the guard catches the requested literal mutation. It can be bypassed by a line break, by `:has()`, by the attribute form of the content wrapper, or by JS. It is better than at round 5, but it is still a string scan (B-09 class).

## 10. Claim checks (`handoff/reports/P3-T13.md`)
| # | Claim | Verdict |
|---|---|---|
| 1 | §3 R-26: "0 runs with `pending` or `body { visibility: hidden }`" | **TRUE.** No `pending` anywhere in `src/`; 0/11,871 hidden-content samples; JS-free CSS check clean. |
| 2 | §3 R-31: "0 frames painted before overlay (`firstVisibleMs === decisionMs`)" | **Outcome true for played runs (45/45 by pixels); proof invalid; one path unsafe.** Their sampler patches `requestAnimationFrame` and overwrites the same-`tMs` entry after `decide` (`p3-t13-evidence.mjs:658-…`), and "visible" is computed style. So `firstVisible === decision` is true by construction, as in B-02. The DCL path paints the navbar with no decision (§6), and they do not report it. |
| 3 | §3 R-32 left `[ ]` with the explanation "`<head>` flushed in the initial chunk … `<main>` … in a subsequent chunk" and "page CSS chunks emitted in the streamed `<main>` payload" | **`[ ]` is honest; the explanation is FALSE.** One burst of 164 KB; both stylesheets are in `<head>`; the document is fully received by ~500 ms even throttled (§7). The cause is the stale `rafTs`. |
| 4 | §3 "Mid-tier en and ar play whenever FP ≤ 1200 (18/18)" | **TRUE in my data (16/16).** But 2/18 mid-tier `ar` runs had FP > 1200, still played, and ended at 2611 and 2793 ms. |
| 5 | §3 R-34 complete | **TRUE** (§8), on 404 routes only. |
| 6 | §3 "Full DoD from a new clone" | **Reproduced** (§1: +765, 305/305, build and audit clean). |
| 7 | §1/§2 R-33 and the doc comment "ending at ≤ 2400ms ≤ 2.5s"; "1200 threshold + 1200 timeline sum to 2400 ≤ 2500" | **FALSE in behaviour.** The timeline starts at ≈ FP, not at `rafTs`; hidden runs up to 3892 ms; 11/45 played runs are past 2.5 s. The comments also disagree with each other: the report says "0%..25% reveal = 300ms", while the CSS and JSDoc say 18 % = 216 ms (`IntroSplash.module.css:41`). |
| 8 | §1 "trimmed ~65 KB so mid-tier en and ar achieve FP ≤ 1200" | **Partly.** Mid-tier en FP 500–840 holds. Mid-tier ar FP was 1040–1600, and 2/9 were > 1200. HTML is now 164,722 bytes. |
| 9 | §1.4 / §6 #4 "explicit trailing `GATE: PASS / GATE: FAIL` on every evidence log" | **Misleading.** `intro-verification.log:3711` ends `GATE: FAIL`, yet `evidence-prod-intro.log` ends `[exit_code=0] GATE: PASS`, and `dod-timing.log` shows `p3-t13-prod-intro … exit=0`. A failed intro gate does not fail the script. It also adds an invented `R-32-HARD-INVARIANTS` gate (`durationFromFpMs <= 1250`, measured from FP), which is not in the spec, and labels it PASS. |
| 10 | §5 "`cspViolationsCount: 0` across all 54 runs" | **TRUE** (0 CSP and 0 console entries in 81 reviewer runs). |
| 11 | §6 #2 "full `src/**/*.css` scan enforcing that no stylesheet … hides body/main/header/footer" | **Overstated:** 4 bypasses (§9). |

## 11. Findings
- **R-36 [major, behaviour] The skip decision reads a stale clock, so the intro plays with FP > 1200 and runs past 2.5 s.**
  - **Where:** `src/components/IntroSplash.tsx:35` (`var rawTs=useRafTs&&…?rafTs:…; if(rawTs>1200)`).
  - **Evidence:**
    - `rafTs` precedes the callback's real execution by a median 167 / 495 / 183 ms and a max of 1403 ms;
    - 11/54 runs played with FP 1212–2700;
    - 11/45 played runs were hidden after 2.5 s (max 3892 ms), including **mid-tier ar** 2611 and 2793;
    - the control without the sampler reproduces it (FP 2644 → hidden 3878).
  - **Fix:**
    - Decide on `performance.now()` read **inside** the rAF callback, not on the `rafTs` argument. In the counterfactual this cuts misclassification from 14 to 4, and the remaining 4 are the DCL path plus one borderline.
    - Because the CSS timeline starts at ≈ FP − 30 ms and FP − callback ≤ 196 ms, a threshold of 1200 still allows hidden ≈ 2.5–2.6 s. The CTO must pick one: a threshold of ~1100 ms on the callback `now`, or a shorter timeline.
- **R-37 [major, R-31/R-32] The DOMContentLoaded fallback paints page content before the decision and skips wrongly.**
  - **Where:** `IntroSplash.tsx:35` (`else if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){decide(false);}…`), and the overlay placed after `<header>` (`page.tsx:509`, `layout.tsx:423-428`).
  - **Evidence:**
    - 3/54 matrix, 2/15 control and 5/12 targeted throttled-en runs;
    - the navbar was painted at FP 1084–1208 with no overlay;
    - the decision was taken at DCL, 1813–2090 ms, and the intro was skipped with FP ≤ 1200.
  - A DCL at ≤ 1200 would produce exactly the R-31 flash. The unit test never runs this path.
  - **Fix:** render the overlay as the **first child of `<body>`** (before the skip link and `<header>`), so the overlay is always in the DOM before any content can paint. Then delete the DCL fallback.
- **R-38 [major, evidence integrity] The R-31 proof still cannot fail.**
  - **Where:** `p3-t13-evidence.mjs:576-700` (a patched `requestAnimationFrame` that replaces the same-`tMs` sample after `decide`, and computed-style "visible") and `:1006` (the gate `firstVisibleMs === decisionMs`).
  - This is B-02 unresolved. The executor's table reports "0 frames" for every row, yet the DCL path's navbar frames are not detected. 0/54 of the executor's runs show a skip, while I measured 9/54 skipped.
  - **Fix:** a paint-level check (trace screenshots or a screencast with pixel classification, as here). Gate on the independent FP and on screenshots, not on `__aljaziraIntroDecision`.
- **R-39 [minor, evidence] A failing gate still exits 0 and records `GATE: PASS` in the wrapper log, plus an invented `HARD-INVARIANTS` gate.**
  - **Where:** `evidence-prod-intro.log` vs `intro-verification.log:3705-3711`; `dod-timing.log` p3-t13-prod-intro exit=0.
  - **Fix:** exit non-zero on any FAIL gate, and drop gates not in the spec.
- **R-40 [minor, report accuracy] The root-cause explanation in §3 and §7 is wrong.**
  - It says head and main stream in separate chunks and that page CSS arrives with `<main>`. In fact there is one 164 KB flush, and both stylesheets are in `<head>` (§7).
  - Option (a) of the Question to the CTO ("flush `<head>` and `<main>` in a single chunk") would therefore change nothing.
  - The comments also disagree: 25 % vs 18 % reveal, and "≤ 2400 ms" vs measured 3892 ms.
- **R-41 [minor, tests] The R-26 guard and the VM test are string-level and bypassable.**
  - **Where:** `src/p3-t4-home.test.ts:791-830` and `:851-927`.
  - **Evidence:** 4 undetected bypasses (M3, M4b, M5, M7). The VM harness never sets `readyState`, so the DCL path is untested, and `fakePerf.now = Math.min(rafTs, 80)` hides the stale-clock issue.
  - **Fix:**
    - parse the CSS with a real parser (postcss), and reject any rule whose selector contains `html[` or `:has(` and that targets anything outside `.overlay` with `visibility`, `display`, `opacity` or `content-visibility`;
    - add VM cases for `loading` → header-only → `DOMContentLoaded`, and for `performance.now() ≫ rafTs`;
    - add a runtime gate based on the screenshot classification.
- **R-42 [nit]** Logo-visible duration under ×4 CPU cannot be resolved with rAF sampling (samples 230–400 ms apart). Measure it from screenshots, for example by gold-pixel area in the centre with the overlay opacity at 1.

## 12. Recommendation on the design question
**Question:** should the decision move from the head rAF to a synchronous inline script right after the overlay element, at the top of the home `<body>`, using `performance.now()`?

**Answer:** move the **overlay** (and a sync script after it) to the top of `<body>`: yes. Use the **sync script's `performance.now()` as the decision clock**: no.

1. **Flash safety: yes, structurally.**
   - The chunk order shows `<head>` contains only non-visible nodes plus render-blocking CSS. In body order, the overlay currently comes 6.3 KB after `<header>` (bytes 8579 vs 14891).
   - In 6/54 runs the header was parsed in an earlier parser tick than the overlay. In 3/54 (and 5/12 targeted) the first frame painted the **navbar alone** (§6).
   - With the overlay as the **first element of `<body>`**, followed immediately by a synchronous inline script that sets `data-intro="active"` (and `--intro-delay:0ms`), no content node can exist in the DOM before the overlay is visible-by-style. So no pre-overlay flash is possible, whatever the parser yields or the chunk boundaries. That also removes the DCL fallback.
2. **Timing: no, the sync parse time is a worse clock than today's.**
   - The overlay is parsed a median 336 / 661 / 1506 ms (max 1926) **before** FP, because the main thread then spends that long on parsing and long tasks before the first frame.
   - Counterfactual: 16/54 misclassified, vs 14 for the current `rafTs` and 4 for `performance.now()` inside the rAF callback.
   - A sync-only decision would play the intro on throttled loads with FP ≈ 2.5 s, ending near 3.7 s.
3. **Recommended shape (still "one rAF, no second frame, no hiding"):**
   - Overlay first in `<body>`. A sync inline script right after it sets `active` provisionally and registers **one** rAF.
   - In that callback, read `performance.now()` (**not** the `rafTs` argument). If it exceeds the threshold, set `seen` and clear `inert`. Because the callback runs before that first frame's style, layout and paint, the overlay is never painted in the skip case.
   - Write `aljazira_intro_seen` only there.
   - The threshold must allow for FP − callback ≤ ~200 ms and a CSS start at ≈ FP − 30 ms. Use ~1100 ms with the 1200 ms timeline, or keep 1200 and shorten the timeline to ≤ 1100 ms. This is a CTO choice.
   - `inert` must be re-applied once the landmarks are parsed (`DOMContentLoaded`), because they do not exist when the sync script runs. A11y R-29 must be re-verified.
   - **Proof required:** the paint-level screenshot check from §6 at 412/768/1440 × 3 modes × en/ar, plus the DCL-style throttled-en hunt, and "skip iff FP > 1200" judged on the independent FP.
4. **Caveat:** in skip cases the overlay is never painted, and the provisional `active` costs no visible frame. The provisional `active` must not write `aljazira_intro_seen`.

## 13. Files
- **Scripts:** `measure.mjs`, `chunks.mjs`, `r34.mjs`, `analyze.mjs`, `settings.mjs`.
- **Results:**
  - `matrix/results.json`, plus raw samples in `matrix/raw/*.json` and run-1 frames in `matrix/frames/`;
  - `control/` (no sampler, 15 runs);
  - `dclhunt/` (12 throttled-en runs, all frames saved);
  - `calib/` and `calib2/` (classifier calibration).
- **Logs:** `logs/` (install, lint, typecheck, format-check, tokens-check, migrate, test, build, audit, seed, matrix, control, dclhunt, r34, chunks-en, chunks-privacy, the `mut-*.log` files and `analysis.md`).
- **Contact sheets:** `contact1.png` (overlay frames) and `contact-dcl.png` (navbar painted before any decision).
- **Clone:** `D:\ctoreview47-p3t13` was left in place, clean at `71df181`. Its Docker project has been removed.
