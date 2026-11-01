# C — Front-end code quality & architecture audit — snapshot 0c4005b

Auditor scope: `src/app/(frontend)/**`, `src/app/{global-not-found,sitemap,robots}.ts(x)`, `src/components/**`
(public components; `components/admin/*` skipped), `src/styles/**`, `src/i18n/**`, `src/lib/cms/**`,
`src/lib/link-safety.ts` (read for client-bundle impact only), `design/tokens.json` → `scripts/generate-tokens.mjs`
→ `src/styles/tokens.css`. Specs: `docs/01-architecture.md` §3, `docs/03-security.md` (I2, H3),
`docs/05-design.md` §3/§19/§20, `handoff/reviews/P3-T4.md`, `handoff/tasks/P3-T13.md`, `P3-T10.md`.

## Coverage
- **Read in full:** `[locale]/page.tsx` (944), `page.module.css` (955), `[locale]/layout.tsx` (435),
  `[...rest]/page.tsx`, `not-found.tsx`, `global-not-found.tsx`, `sitemap.ts`, `robots.ts`;
  `IntroSplash.tsx` + `.module.css`; `Navbar.tsx`, `Footer.tsx`, `ServicesCarousel.tsx` (+ CSS head/
  responsive), `Accordion.tsx`, `LogoMarquee.tsx` (+ CSS), `TeamMarquee.tsx` (CSS diffed against
  LogoMarquee), `TeamCard.tsx` (+ CSS states), `Button`, `CmsLink`, `CspSafeImage`, `media-utils`,
  `HomeScrollHintButton`, `WhatsAppFab`, `ProjectCard`, `Logo`, `BrandTile`, `TeamMember`;
  `lib/cms/{client,collections,globals,tags,index}.ts`; `i18n/{index,en}.ts`; `styles/{globals.css,
  grid.module.css,breakpoints.css,fonts.ts,font-preload.ts}`; head of `tokens.css` and
  `generate-tokens.mjs`.
- **Mechanical sweeps (scripts, results quoted below):** unused CSS-module classes per module; unused
  dictionary keys; unused tokens; `!important`; physical CSS properties; hard-coded colours outside
  `tokens.css`; media-query inventory; `prefers-reduced-motion` coverage per stylesheet;
  `'use client'` inventory; `as unknown as` / `eslint-disable` / `@ts-ignore`; hydration hazards
  (`Date`, `Math.random`, `toLocale*`); token contrast ratios (WCAG formula, node one-liner).
- **Skimmed only:** `styleguide/*` and `%5Fspecimen/*` (dev-only, 404 in production — verified gate at
  `styleguide/page.tsx:96`, `%5Fspecimen/page.tsx:247`), `ServiceTile/ServiceCard/PartnerTile/Portrait/
  Avatar/Eyebrow/NavLink`.
- **Skipped:** `src/app/(payload)/**`, `components/admin/**`, `proxy.ts` CSP logic, revalidation hooks,
  quote/ipHash (other audit areas). `node_modules` is absent, so Next 16 docs in
  `node_modules/next/dist/docs/` could not be consulted; claims that depend on Next 16 internals are
  marked *suspected*.
- Uncommitted working-tree changes in `D:\jazira` (`scripts/evidence/*`, `handoff/MESSAGES.md`) are not in
  the snapshot and were not audited.

## Findings

### C-01 [critical · confirmed in code; runtime magnitude needs a throttled trace] The P3-T13 intro script hides the whole `<body>` while the page streams — R-26 content-hiding is back, undeclared
- Where: `src/components/IntroSplash.module.css:111-113`; `src/components/IntroSplash.tsx:35` (inline
  script, `decide()` / `pending` branch); introduced by `32069ea` "fix(intro): … guard streaming DOM
  (P3-T13)".
- Code: `:global(html[data-intro='pending']) body { visibility: hidden; }` and in the script
  `if(document.readyState==='loading'&&(ov||!document.querySelector('[data-home-content="true"]'))){d.setAttribute('data-intro','pending'); … obs=new MutationObserver(… decide(rafTs) …)`
- Problem:
  - On a first home visit, if the first rAF fires before the overlay, the skip button **and the
    `<footer>`** have been parsed (normal on a slow connection), the script sets `data-intro="pending"`
    and the entire body becomes invisible until the footer is parsed (MutationObserver) or
    `DOMContentLoaded`.
  - This is the pattern the CTO removed in M-156 / R-26: "Content visibility must never depend on JS
    or on the intro." It also breaks `docs/05-design.md` §3: "must not delay LCP (content renders
    underneath …)".
  - It is exactly what makes the P3-T13 acceptance line "0 frames of the page are painted before the
    overlay" pass: the page cannot paint because it is hidden.
  - The decision is no longer made inside the single first rAF (R-31/R-32). It is re-run later from a
    MutationObserver or `DOMContentLoaded` with the stale `rafTs` (then `Math.max(rafTs, performance.now())`).
    The unit test still passes because it checks the source text:
    `expect(INTRO_PREPAINT_INLINE_SCRIPT.match(/requestAnimationFrame/g)?.length).toBe(1)`
    (`src/p3-t4-home.test.ts:811`). The test also only mocks `readyState: 'interactive'` (`:856`), so
    the `pending` path is never exercised.
  - Edge case: if `MutationObserver` is missing, `pending` is set and nothing ever clears it, so the body
    stays hidden forever (no `DOMContentLoaded` fallback is registered on that branch).
  - Nothing in the snapshot declares this rule: no message, report or deviation mentions `pending` or
    `visibility: hidden` on body. The doc comments at `IntroSplash.tsx:22-34` and `:106-119` still
    describe a single-rAF decision and omit it.
- Impact: first-visit FCP/LCP on slow networks is held until the footer HTML arrives. The only effect is
  a better score on the timing gate (the sixth/seventh gaming incident pattern in the brief). It ships
  on the `phase-3-frontend` branch.
- Fix: delete the `pending` rule and branch. If the overlay is not in the DOM at the first rAF, decide
  `seen` (skip the intro) instead of hiding the page. Add a test that runs the script with
  `readyState: 'loading'` and asserts that `data-intro` never becomes a value that hides content.
  Runtime check: a WebPageTest/Chrome trace at Slow 4G of `/en` on a first visit, recording
  `getComputedStyle(document.body).visibility` per frame.

### C-02 [major · confirmed] `TeamCard` scroll reveal SSRs its content invisible; only JS reveals it, and the no-IntersectionObserver path never does
- Where: `src/components/TeamCard.tsx:76`, `:96-98`, `:121-125`; `src/components/TeamCard.module.css:77-81`
- Code: `useState<boolean>(!animateOnScroll)` → server HTML gets `.scrollPending` →
  `.scrollPending .content { opacity: 0; transform: translateY(28px); }`. In the effect,
  `if (!node || typeof IntersectionObserver === 'undefined') { return }` returns without setting
  `hasEntered`.
- Problem: this is the same R-26 class as C-01. Content visibility depends on hydration plus an
  observer. With JS blocked, a hydration error or a missing IO, the team portraits stay at opacity 0.
  Today it is only used in the styleguide (`styleguide/page.tsx:751`). The About page (P3-T7) and the
  site-wide motion pass (P3-T14, §20 "reveal") will reuse it.
- Impact: a latent invisible-content bug that is about to be copied site-wide.
- Fix: progressive enhancement. Hide only under a class the client adds (for example
  `html[data-reveal-ready] .scrollPending .content`, set in an effect). Treat "no IO" as entered.
  Build one shared `useReveal()` for P3-T14 so the pattern is written once.

### C-03 [major · confirmed] JSON-LD is serialized with plain `JSON.stringify` inside `dangerouslySetInnerHTML` (breaks I2)
- Where: `src/app/(frontend)/[locale]/layout.tsx:111-125`, `:258-263`
- Code: `return JSON.stringify({ … name: siteSettings?.companyName || … })` → `dangerouslySetInnerHTML={{ __html: buildOrganizationJsonLd(…) }}`
- Problem: `docs/03-security.md` I2 allows `dangerouslySetInnerHTML` only for JSON-LD "built from a
  serializer that escapes `<`". `JSON.stringify` does not escape `<`, so a `companyName` containing
  `</script>…` closes the element and injects markup. CSP nonces block injected scripts but not injected
  HTML. The input is admin-only, which limits the risk; it is still a baseline requirement and the code
  ships today. P3-T10 §2 plans the right serializer, but the unsafe one is already live.
- Fix: one `serializeJsonLd(obj)` helper (`JSON.stringify(obj).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')`)
  with a unit test using `</script><img src=x>`. Also record the second, CTO-approved
  `dangerouslySetInnerHTML` (the intro script, `layout.tsx:408-411`) as an exception in I2 so the
  spec matches the code.

### C-04 [major · confirmed (computed); spec conflict → Question for CTO] Gold accent headings on light sections are 2.0–2.2:1, which fails WCAG AA for large text and the P3-T10 axe gate
- Where: `page.module.css:20-22` `.goldText` used by `renderAccentHeading` (`page.tsx:231`) in the Who
  (white), Core Services (`--surface`), Interactive (white) and Featured Projects (`--surface`) H2s;
  `.whoBadgeNumber` (`page.module.css:247-250`, gold on a white card); `BrandTile.module.css:39-44`
  `.origin` uses `--text-muted` on white (small text).
- Code: `--gold-500: #dfa82a` on `#ffffff` = **2.15:1**, on `#f6f8fb` = **2.02:1**; `--text-muted` on
  white = **3.10:1** (my computation, WCAG relative-luminance formula).
- Problem: `docs/05-design.md` §19 keeps "large display text" in the Figma gold. WCAG 1.4.3 still
  requires ≥ 3:1 for large text (h2 is 44 px/700). `docs/04-phases.md:69` requires AA contrast, and
  P3-T10 requires "zero serious or critical" axe violations; axe reports color-contrast as *serious*.
  The specs contradict each other, and the home page will fail P3-T10 as written. The BrandTile caption
  is small text at 3.10:1, which §19's exceptions do not cover.
- Fix: CTO decision needed. Options: `--gold-700` (5.37:1) for gold text on light surfaces, gold kept
  for fills and dark sections; or a documented, axe-scoped exception. Change `.origin` to `--text-body`.

### C-05 [major · confirmed in code; production behaviour suspected] Font preloads come from scanning built CSS on disk at request time
- Where: `src/styles/font-preload.ts:97-145`, called on every request from `layout.tsx:386`.
- Code: `fs.readdirSync(path.resolve('.next/static/chunks'))` … regex over `@font-face` blocks;
  `if (result.ar.length > 0 || result.en.length > 0) { cachedFontPreloadMap = result }`
- Problem:
  - It is synchronous filesystem I/O in the render path, resolved against `process.cwd()`. It depends
    on Turbopack's CSS location (`.next/static/chunks`) and on `.next/static` being copied next to
    `server.js` in `output: 'standalone'`, which Next does not do by itself.
  - When nothing is found, the empty result is not cached, so every request re-scans the directory.
  - It fails silently, and that silently brings back R-3 (Arabic CLS 0.12–0.13).
  - The comment (`:57-58`) says Poppins 400/500/600/700, but the filter keeps only `400|700` (`:84`).
  - It also scans `.next/dev/static/chunks`, which can pick up stale dev CSS in a prod build.
- Fix: produce the per-locale preload list at build time (for example, a post-build script writing
  `font-preloads.json`, imported statically), or use `next/font` with two per-locale font modules plus
  `ReactDOM.preload()`. Add a test that fails when the list is empty after `pnpm build`.

### C-06 [major · confirmed; spec conflict never raised] Every public page renders dynamically, while §3 says "static/ISR"
- Where: `layout.tsx:374` `const requestHeaders = await headers()` (intentional, for the H3 nonce;
  comment at `:369-371`); `lib/cms/client.ts:285` `draftMode()` in every query.
- Problem: `docs/01-architecture.md` §3: "Rendering: static/ISR for public pages, revalidated on content
  change". A per-request nonce (H3) forces dynamic rendering of the whole tree, so the two decisions
  conflict. The conflict was never put to the CTO: there is no match for ISR, "dynamic rendering" or
  "statically" in `handoff/MESSAGES.md` or the reports. The `unstable_cache` data cache keeps database
  load down, but every request still renders the full RSC tree (8 sections, header, footer) on the
  server.
- Impact: higher TTFB and server CPU than the architecture assumes. Capacity planning for the shared VPS
  (P6) rests on a wrong premise.
- Fix: raise it as a Question for CTO. Options: keep dynamic rendering (and update §3); or nonce only
  where needed (e.g. hashes for the two inline scripts, which allows static HTML) and keep ISR.

### C-07 [minor · confirmed by call-site count; DB count needs a query log] No per-request memoisation of CMS getters; draft mode multiplies auth lookups
- Where: `layout.tsx:137-149` `loadShellGlobals` is called from both `LocaleShellHeader` (`:238`) and
  `LocaleShellFooter` (`:303`). `page.tsx:283-286` and `:347-360` fetch `site-settings` and `home-page`
  again. `globals.ts:46` + `client.ts:592-595`: each getter calls `resolvePublicDraftFlag()` and then
  `cmsFindGlobal` calls `resolvePublicDraftContext()` again.
- Problem: one `/en` home request makes 5 `getSiteSettings`, 2 `getNavigation` and 2 `getHomePage`
  cache lookups. In draft mode each of the ~13 getter calls runs `payload.auth()` twice (plus one in
  `LocaleShellHeader:241-242`), about 27 auth/user lookups per Live Preview render.
- Fix: wrap `resolvePublicDraftContext` and each public getter in React `cache()`; pass the draft
  context into `cmsFind*` instead of resolving it twice; load shell globals once in the layout and pass
  them to header and footer.

### C-08 [minor · confirmed] `withCmsCache` silently drops caching on any error that mentions `unstable_cache`
- Where: `src/lib/cms/client.ts:209-226`
- Code: `if (msg.includes('incrementalCache missing') || msg.includes('unstable_cache')) { return fn() }`
- Problem: Next's "used `headers()` inside a function cached with `unstable_cache()`" error contains that
  substring. A future misuse would turn into an uncached database hit on every request in production,
  with no log. String-matching framework error messages is brittle.
- Fix: detect the test runtime explicitly (inject the cache wrapper, or `process.env.VITEST`) and
  re-throw everything else. Separately, check the Next 16 docs (`node_modules/next/dist/docs`) for the
  status of `unstable_cache` versus `'use cache'`/`cacheTag` before P3-T6 adds more getters.

### C-09 [minor · confirmed] Section H2 gold accents still come from word-count heuristics tuned to the seed copy
- Where: `page.tsx:118-214` (`splitAccentHeadingParts`, modes `who|services|interactive|projects`, an
  Arabic regex `/^[\u0600-\u06FF]/`, `words.length >= 6`, `splitAt = words.length === 4 ? 2 : …`).
- Problem: R-2 (P3-T4) rejected heuristics for hero/CTA ("No heuristics") and added `titleAccent`. The
  four section headings kept a heuristic whose rules fit the current Figma strings. When an editor
  changes a title, the gold span moves unpredictably, and nothing in the admin explains or controls it.
  R-24 noted that the report claimed accent columns for these sections that do not exist.
- Fix: add a `titleAccent` field to the section-head groups (content-model change, CTO approval and a
  migration). Until then, render the title without an accent instead of guessing.

### C-10 [major · confirmed; latent until an editor uploads a hero video] The hero background video autoplays in a loop with no pause control and ignores reduced motion
- Where: `page.tsx:521-529`
- Code: `<video autoPlay className={styles.heroBgMedia} loop muted playsInline src={heroBgVideoUrl} />`
- Problem: WCAG 2.2.2 (Level A) requires a pause mechanism for motion that lasts more than 5 s. The
  intro, carousel and marquees all honour `prefers-reduced-motion`; the video does not. There is no
  `poster`, so the hero is blank until the first frame decodes, which hurts LCP.
- Fix: render the `<video>` only when `prefers-reduced-motion: no-preference` (poster image
  otherwise), add a visible pause toggle, and set `poster` = `heroBgImage` with `preload="metadata"`.

### C-11 [minor · confirmed] Copy-paste duplication across components and data layers
- `LogoMarquee.tsx` (175 lines) and `TeamMarquee.tsx` (194) are the same component with a different
  item renderer. Their CSS differs only in names, gaps and speeds (`diff` shows ~20 changed lines out
  of 234/221).
- The pause/play SVG pair is copied three times: `ServicesCarousel.tsx:460-469`,
  `LogoMarquee.tsx:117-126`, `TeamMarquee.tsx:120-129`.
- The reduced-motion store (`subscribeReducedMotion`/`getReducedMotionSnapshot`) is duplicated in
  `ServicesCarousel.tsx:44-64` and `TeamCard.tsx:36-53`. It is re-inlined in
  `HomeScrollHintButton.tsx:30-33` and in the intro script.
- The Arabic gate is written twice: `canServeArabicLocaleForCurrentRequest` vs
  `enforceArabicEnabledOrRedirect` (`layout.tsx:48-109`) repeat the same three try/catch blocks.
- Metadata building is duplicated between `layout.tsx:151-219` and `page.tsx:271-328`. Every new page
  (P3-T6..T9) will copy it a third time.
- `collections.ts` repeats the same "draft? direct : withCmsCache(tags, key)" block 8 times
  (`:64-83`, `:103-125`, `:185-207`, `:227-249`, `:255-287`, `:289-314`, `:316-337`, `:343-378`).
- There are two language-switch builders: `Navbar.buildLanguageSwitchHref` (`Navbar.tsx:139-149`) and
  `i18n.switchLocaleInPathname` (`i18n/index.ts:37-54`, used by Footer). They behave differently for
  paths without a locale prefix.
- The locale type is declared three times: `SupportedLocale`, `SupportedCmsLocale` (`client.ts:16`) and
  `RevalidateLocale` (`tags.ts:7`).
- Impact: fixes land in one copy and not the other. For example, LogoMarquee hides its pause button
  (C-17) and TeamMarquee does not.
- Fix: see the refactor plan (steps 4–7).

### C-12 [minor · confirmed] Dead code and dead styles
- `page.module.css` has 8 unused classes: `.whiteText`, `.liveModelBadge`, `.liveModelBadgeIcon`,
  `.openModelButton`, `.systemBodyStack`, `.relatedProjectsRow`, `.relatedProjectsLabel`,
  `.relatedProjectLink` (`:24-26`, `:393-446`, `:463-513`). Their markup was removed in
  `8bb22e7`/`537eed7`. They belong to P3-T5 and should come back with it, not linger.
- `grid.module.css` `.section`, `.grid2`, `.grid3` are referenced nowhere, not even in the styleguide.
- `breakpoints.css:9-13` declares `@custom-media` (no PostCSS plugin or Lightning CSS draft flag in
  `next.config.ts`) and `--bp-*` properties that cannot be used in media queries. Neither is referenced.
- `IntroSplash.tsx:128-129`: `overlayRef` and `skipButtonRef` are assigned and never read (since
  `32069ea`). `shouldSkipIntroSplash`/`markIntroSplashSeen` (`:66-104`) run only in tests; the real
  logic is the inline string. `INERT_TARGET_SELECTORS` (`:14-20`) is retyped as a literal inside the
  string, so the two can drift.
- `Footer` props `privacyLink`, `quickLinks`, `quickLinksTitle`, `ctaEyebrow` and `ctaButtonHref` are
  never passed by the layout; only the styleguide uses them.
- Duplicate dictionary keys: `a11y.mobileMenuOpen/Close` vs `nav.openMenu/closeMenu`;
  `footer.social*` (8 keys, unused) vs `footer.socialAria*`; `footer.quickLinksHeading` vs
  `quickLinksTitle`; `nav.about/contact` vs `nav.aboutUs/contactUs`; `footer.ctaButton`,
  `footer.languageToggle`, `home.interactive3dBadge`. Keys for future pages (quoteForm, filters,
  lightbox) are excluded from this list on purpose.
- Fix: delete. Each removal is pixel-neutral; prove it with the diff harness in the plan.

### C-13 [minor · confirmed] Intro tests assert constants and substrings, not behaviour
- Where: `src/p3-t4-home.test.ts:418`, `:808-820`; `IntroSplash.tsx:11-12`;
  `IntroSplash.module.css:104,130,171,190,209`.
- Problem: `INTRO_TOTAL_DURATION_MS ≤ 1600` and `INTRO_MAX_FIRST_PAINT_MS + INTRO_TOTAL_DURATION_MS ≤ 2500`
  are asserted on TypeScript constants, while the CSS hard-codes `1200ms` five times. Changing the CSS
  to 3 s keeps the test green. The script is checked with `toContain` / `not.toContain('painted')`, so
  the tests check the text of the script, not what it does. That is how C-01 passed.
- Fix: drive the CSS from one custom property (`--intro-duration`) set from the constant, or parse the
  stylesheet in the test. Execute the script under jsdom/vm for `readyState` `loading`, `interactive`
  and `complete`, and assert the resulting `data-intro` and body visibility.

### C-14 [minor · confirmed] The breakpoint system is not enforced
- Inventory: `max-width: 1023px` ×11, `767.98px` ×7, `1279.98px` ×3, `767px` ×2, `639px` ×2
  (`Footer.module.css:79`, `Accordion.module.css:107`), `min-width: 1024px` ×1, `1440px` ×2. The
  documented scale (`breakpoints.css:1-8`) is 767.98 / 1023.98 / 1279.98, and 639 is not in it.
- Impact: there are 0.98 px gaps at fractional widths (browser zoom), where neither the `≤1023` nor the
  `≥1024` rule applies. The footer switches to its mobile layout at 639 px while every other section
  switches at 767.98, so 640–767 px renders a mixed layout. The visual review checks only 390/768/1440,
  so it never sees this.
- Fix: normalise to the documented values (pixel-neutral at the review widths; check 640/700/1023.5
  separately). Add a lint rule to `scripts/check-css-logical-properties.mjs` that rejects off-scale
  breakpoints.

### C-15 [minor · confirmed; one item suspected] Route modules double as utility libraries
- Where: `page.tsx` exports `extractLexicalParagraphs`, `splitStatValueAndSuffix`,
  `splitAccentHeadingParts`, `renderAccentHeading` and `AccentHeadingMode` (`:46-235`). `layout.tsx`
  exports `buildEnglishRedirectTarget`, `canServeArabicLocaleForCurrentRequest` and
  `enforceArabicEnabledOrRedirect` (`:38-109`), which `page.tsx:36` and `[...rest]/page.tsx:7` import.
  `global-not-found.tsx:66-67` imports the layout and the not-found page as components. The server
  layout imports a string constant from a `'use client'` module
  (`layout.tsx:9` ← `IntroSplash.tsx:35`).
- Problem: route files become hard to change, and the tests import pages to reach pure helpers.
  *Suspected:* importing a non-component value from a `'use client'` module into a Server Component
  relies on bundler behaviour, because RSC turns client-module exports into client references. It
  works today (the CTO saw the intro run), but it is fragile. Check: view-source of `/en` shows the full
  script text in `<head>`.
- Fix: move the helpers to `src/lib/home/*.ts` and `src/lib/i18n/arabic-gate.ts`, and the inline script
  to `src/components/intro/intro-script.ts` (no directive).

### C-16 [minor · confirmed] The site origin is resolved three different ways, bypassing `@/env`
- Where: `layout.tsx:127-135` (`NEXT_PUBLIC_SERVER_URL || SERVER_URL || 'http://localhost:3000'`),
  `lib/cms/client.ts:309-317` (`SERVER_URL || NEXT_PUBLIC_SERVER_URL || …`, the opposite order),
  `sitemap.ts:9` (`env.SERVER_URL`).
- Problem: `NEXT_PUBLIC_SERVER_URL` is declared in neither `env.ts` nor `.env.example`. If it is set
  and differs from `SERVER_URL`, `metadataBase`/canonical/OG/JSON-LD disagree with the sitemap and with
  the admin-referer check used for Arabic preview. Both fall back silently to localhost.
- Fix: one `getSiteOrigin()` built on the validated `env.SERVER_URL`.

### C-17 [minor · suspected on touch devices] The LogoMarquee pause button is invisible and unclickable until hover or focus
- Where: `LogoMarquee.module.css:84-101`
- Code: `.controlsBar { … opacity: 0; pointer-events: none; }` and
  `.marquee:hover .controlsBar, .marquee:focus-within .controlsBar … { opacity: 1; pointer-events: auto; }`
- Problem: WCAG 2.2.2 needs a mechanism every user can reach. On touch devices there is no hover, so
  the control may never be operable (a tap may or may not emulate `:hover`). `TeamMarquee`'s bar is
  always visible, which makes the two inconsistent (see C-11).
- Check: on a real phone (iOS Safari and Android Chrome), try to pause the partners marquee.
  Fix: keep it visible, as in TeamMarquee, or show it at `(hover: none)`.

### C-18 [nit · confirmed] Small accessibility issues
- The pause toggles combine `aria-pressed` with a label that changes Pause/Play
  (`ServicesCarousel.tsx:455-456`, `LogoMarquee.tsx:112-113`, `TeamMarquee.tsx:115-116`), so screen
  readers announce the state twice. Use either a fixed label with `aria-pressed`, or a changing label
  without it.
- Accordion triggers are not wrapped in headings (`Accordion.tsx:74-96`), so the five system titles are
  missing from the heading outline (APG accordion pattern).
- The fallback `nav.brandName: 'Site logo'` (`en.ts:24`) becomes the accessible name of the brand link
  and of the intro `role="region"` whenever `companyName` is empty.
- `Navbar.tsx:359-365` sets `lang="ar"` on a link whose `aria-label` is mostly English (`en.ts:37`), so
  the English text is read with Arabic voice rules.

### C-19 [nit · confirmed] Comments that no longer match the code
- `tokens.css:1-5` says "AUTO-GENERATED … from `design/tokens.json`", but 51 custom-property lines (plus
  gradients) are typed directly in `scripts/generate-tokens.mjs` (e.g. `:238-253`).
  `pnpm tokens:check` only proves the file matches the script, not Figma.
- `layout.tsx:372-373` says the shell queries "run inside `<LocaleShellHeader>` and
  `<LocaleShellFooter>`". They are not rendered as components; they are called as plain async functions
  and awaited (`:391-403`), so they block the layout like any other await.
- `font-preload.ts:57-58` lists the Poppins weights wrongly (C-05). `IntroSplash.tsx:22-34` / `:106-119`
  describe behaviour that `32069ea` changed (C-01).

### C-20 [minor · confirmed] Client-boundary choices ship more JavaScript than needed
- `Navbar.tsx:1` makes the whole header a client component (logo, nav list, CTA `Button`,
  `CmsLink` + `lib/link-safety.ts` (264 lines), and both full dictionaries via `getDictionary`) only for
  `isScrolled` and the drawer. The same dictionary import, which pulls `ar.ts` and `en.ts` together, is
  in every client component (`Accordion`, `ServicesCarousel`, `LogoMarquee`, `TeamMarquee`,
  `TeamCard`, `IntroSplash`).
- `HomeScrollHintButton.tsx` is a client component for something an `<a href="#who-we-are">` plus CSS
  `scroll-behavior` (under `prefers-reduced-motion: no-preference`) does without JS. That version also
  works before hydration.
- Fix: a server `Navbar` that renders the markup, plus two islands (`<ScrollState/>` setting a
  `data-scrolled` attribute, and `<MobileDrawer/>`). Pass resolved strings to client components instead
  of `locale` + `getDictionary`. Measure with `next build` "First Load JS" for `/[locale]` before and
  after.

### C-21 [minor · confirmed] `ServicesCarousel` re-renders on every pointer move and keeps its geometry in two places
- Where: `ServicesCarousel.tsx:292-301` (`setDragOffsetPx(deltaX)` on each `pointermove`, while also
  writing `--drag-x` directly); CSS variables are synced three ways (ref callback `:134-140`, effect
  `:142-144`, handlers `:286-313`); `CARD_STEP_PX = 310`/`CARD_GAP_PX = 20` (`:39-40`) repeat
  `--carousel-step: 310px`, `.slide { inline-size: 290px }`, `gap: var(--space-20)`
  (`ServicesCarousel.module.css:4,49,72-75`).
- Impact: every drag frame re-renders all slides (ServiceTile + icons). The step lives in two places
  that can drift.
- Fix: keep the drag delta in a ref and write only the CSS variable; read the step from
  `getComputedStyle` (or measure the first slide) instead of a TypeScript constant.

## Checked and clean
- **RTL / logical properties:** zero physical `margin/padding-left/right`, `left/right:` or
  `text-align: left/right` in any public stylesheet. `scripts/check-css-logical-properties.mjs` runs in
  `pnpm lint`. Directional icons are mirrored in one place (`globals.css:130-133`). Carousel and
  marquee keyboard and drag directions flip for `ar` (`ServicesCarousel.tsx:251-273`, `:316-330`;
  `LogoMarquee.module.css:70-76`).
- **Tokens:** no hard-coded colour outside `tokens.css` (grep for `#hex`/`rgb(`/`hsl(`: 0 hits). Only
  15 of 310 tokens are unused. There is no `!important` anywhere in `src`.
- **Type-safety escapes:** no `any`, `@ts-ignore` or `eslint-disable` in the audited tree. The 15
  `as unknown as` casts are all in `lib/cms/client.ts`, around Payload's generic `find` signatures.
- **Hydration:** no `Date`, `Math.random` or `toLocale*` in public components. `useId` is used for
  ARIA ids. `suppressHydrationWarning` on `<html>` is justified by the pre-paint script.
- **Effects and listeners:** every `addEventListener`, `IntersectionObserver`, `ResizeObserver`,
  `setInterval` and `matchMedia` subscription in Navbar, ServicesCarousel, LogoMarquee, TeamMarquee,
  TeamCard and IntroSplash has a cleanup. The intro inline script's `window` keydown listener is never
  removed, but it checks `data-intro` and is harmless.
- **Reduced motion:** every stylesheet with keyframe or transform motion has a
  `prefers-reduced-motion` block (12 files). The exceptions are the hero video (C-10) and the TeamCard
  reveal when JS is missing (C-02).
- **Landmarks and headings on home:** a skip link to `main#main-content` (`tabIndex=-1`); one `h1`;
  section `h2`s; card `h3`s; footer column `h2`s. The draft banner is an `aside`. The drawer has
  `role=dialog` + `aria-modal`, a focus trap, Esc, focus restore and a scroll lock with restore.
- **Images:** every content image goes through `CspSafeImage` with explicit width/height and `sizes`.
  `ProjectCard` caps `sizes` at the asset width. The hero has `fetchPriority="high"` and
  `loading="eager"`.
- **CMS access in the data layer:** `overrideAccess: false` on every Local API call; property
  whitelists; limit clamp; draft only with a verified staff user (`client.ts:280-298`). Every module is
  `server-only`.
- **Dev-only routes:** `/styleguide` and `/_specimen` call `notFound()` in production.
- **Empty and error states on home:** every CMS fetch has `.catch(() => null|[])`, and each section is
  hidden when it is disabled or empty. Known gap, already tracked in P3-T10 §3: there is no
  `error.tsx`/500 page yet (`errors.serverError*` keys exist and are unused).

## Refactor themes (max 6)
- **Intro: honest and testable.** `IntroSplash.tsx`, `IntroSplash.module.css`, new
  `components/intro/intro-script.ts`, `p3-t4-home.test.ts`. Benefit: removes C-01, gives one source for
  selectors and duration (C-12, C-13), and adds behavioural tests. Risk: medium, because the intro is
  the most-reviewed surface. Re-run the P3-T13 matrix.
- **Server-first shell.** `layout.tsx`, `Navbar.tsx`, `Footer.tsx`, `HomeScrollHintButton.tsx`, a new
  `lib/cms/request-cache.ts`. Benefit: less client JS (C-20), one shell fetch and per-request
  memoisation (C-07), and comments that match the code (C-19). Risk: medium (drawer focus behaviour,
  scroll state).
- **Shared motion primitives.** New `hooks/useReducedMotion.ts`, `useReveal.ts`, a generic
  `Marquee.tsx` + CSS, and `icons/PlayPauseIcon`. Benefit: C-02 and C-11 fixed once, before P3-T14
  copies the patterns site-wide, and C-17 made consistent. Risk: low–medium (marquee timing must match
  frame for frame).
- **Section building blocks for P3-T6..T9.** `SectionHead` (eyebrow + h2 + intro + divider),
  `CtaBand`, `StatsBand`, `buildPageMetadata()`, `lib/home/*`. Benefit: cuts `page.tsx` from ~944
  lines to ~300, prevents four more copies of the CTA, stats and metadata code (C-11, C-15), and gives
  one place for the accent rule (C-09). Risk: low if the class names and DOM stay byte-identical.
- **Data-layer hygiene.** `lib/cms/collections.ts`, `globals.ts`, `client.ts`, `tags.ts`, a new
  `lib/site-origin.ts`. Benefit: one `cachedQuery()` instead of 8 copies, no silent cache fallback (C-08),
  one origin source (C-16) and one locale type. Risk: low; the data is identical, so check HTML parity.
- **CSS and token hygiene.** `page.module.css`, `grid.module.css`, `breakpoints.css`, and the
  `Footer`/`Accordion`/`Navbar` media queries plus the lint script. Benefit: no dead rules (C-12),
  enforced breakpoints (C-14), and motion tokens ready for §20. Risk: low; pixel-diff at the review
  widths plus 640/1023.5.

---

## Refactor plan (ordered, each step small, independently verifiable, zero visual change)

### Step 0 — The proof harness (before any code change)
1. **Freeze the content.** Restore one seeded DB dump (P4-T2 seed) for every run. Pin the clock and
   viewport. Set `sessionStorage.aljazira_intro_seen='1'` (intro off) for page diffs, plus a separate
   intro run.
2. **Pixel baseline from `0c4005b`.** Playwright `toHaveScreenshot` (full page) for `/en` and `/ar`
   (Arabic flag on) × widths **390, 640, 768, 1023, 1024, 1280, 1440** ×
   `reducedMotion: 'reduce'` (freezes the marquee and carousel autoplay) and `animations: 'disabled'`.
   Threshold `maxDiffPixels: 0`, with `threshold: 0` per pixel. Store the baseline under
   `tests/visual/__baseline__/0c4005b/`.
3. **Motion-on spot checks.** Same pages with motion on, screenshotted after
   `document.getAnimations().forEach(a => { a.pause(); a.currentTime = 0 })` so marquees and the
   carousel sit at t=0.
4. **Structure and semantics.** For each page, save `await page.locator('body').ariaSnapshot()` (a11y
   tree) and a normalised DOM dump of `main` (CSS-module hash suffixes stripped with
   `/_[A-Za-z0-9-]{5,}\b/`). Both must be identical after every step unless the step says otherwise.
5. **Bundle and response baseline.** `next build` route table ("First Load JS" for `/[locale]`); size
   of `/en` HTML; count of `payload.auth` and `findGlobal` calls per request (Payload logger at debug or
   a vitest spy). Record all of these in the PR.
6. **CI.** Run `tests/visual` on every refactor PR. Any non-zero pixel diff fails the step.

### Steps (each one PR or commit; run the full DoD plus Step 0 checks after each)
1. **Revert the `pending` body-hiding (C-01).** Files: `IntroSplash.module.css:111-113`, `IntroSplash.tsx:35`.
   Expected visual result: identical with the intro off. With the intro on, the P3-T13 matrix is
   re-run, and the report states how many slow-network runs now skip the intro. *This is a behaviour
   change by design: it removes the hidden-body frames, so the frame timeline differs, not the final
   pixels.* Benefit: spec compliance (R-26, §3). Risk: more runs skip the intro on slow networks, which
   is the outcome R-27 called acceptable.
2. **Extract the intro script to `intro-script.ts`** (no directive). Build the selector list from
   `INERT_TARGET_SELECTORS`, and the duration from a single `INTRO_DURATION_MS` written to
   `--intro-duration` (CSS: `animation: … var(--intro-duration)`). Delete `overlayRef`/`skipButtonRef`.
   Replace the substring tests with vm/jsdom execution across `readyState` values. Verify: pixel diff
   0; the inline script text in `<head>` differs only in the interpolated values. Risk: low.
3. **Dead-code sweep (C-12).** Remove the 8 page classes, the 3 grid classes, `@custom-media` and the
   `--bp-*` properties, and the duplicate dictionary keys (update `ar.ts`/`en.ts` and the
   `UiDictionary` type). Footer-only styleguide props stay if the styleguide still shows them; otherwise
   delete them from both. Verify: pixel diff 0, ariaSnapshot identical, `pnpm typecheck`. Risk: very
   low.
4. **`useReducedMotion()` + `PlayPauseIcon`** (C-11), used by ServicesCarousel, TeamCard,
   HomeScrollHintButton, LogoMarquee and TeamMarquee. Verify: pixel diff 0, ariaSnapshot identical,
   and a unit test of the hook against a `matchMedia` mock. Risk: low.
5. **Generic `<Marquee>`** with `renderItem`, `speedS`, `gap` and `regionLabel` props.
   LogoMarquee/TeamMarquee become ~20-line wrappers; the CSS merges into one file with per-instance
   custom properties (`--marquee-gap`, `--marquee-duration-1/2`, `--marquee-offset-*`). Keep the
   `data-component` values so tests and selectors don't break. Verify: pixel diff 0 at t=0 (motion-on
   spot check), plus the duration read through `getAnimations()[i].effect.getTiming().duration`
   (38/42 s for logos, 44/48 s for team) before and after. Risk: low–medium. Do **not** change the
   LogoMarquee pause visibility (C-17) in this step; it needs a CTO and design decision.
6. **`useReveal()` progressive enhancement (C-02)** in TeamCard. Verify: pixel diff 0 with JS on (after
   reveal). New e2e: with JS disabled, `/styleguide` team cards have computed `opacity: 1`. Risk: low.
7. **Data layer (C-07, C-08, C-16).** Add `cachedQuery(name, keyParts, tags, fn)` and React
   `cache()`-wrapped `getDraftContext()`; pass the draft context into `cmsFind*`; add a single
   `getSiteOrigin()` from `env`; remove the string-match fallback (tests inject a no-op cache). Verify:
   normalised HTML of `/en` and `/ar` byte-identical; counted `payload.auth` per draft render drops from
   about 27 to 1; `findGlobal` per public render 1 per slug (from the vitest spy). Risk: low; this is
   where cache-tag regressions would show, so re-run the revalidation tests and one manual
   edit → publish → visible check.
8. **Shell loads once.** The layout calls `loadShellGlobals` once and passes results to header and
   footer as props; fix the stale comment `layout.tsx:372-373`. Verify: HTML byte-identical; one shell
   fetch per request. Risk: low.
9. **Move helpers out of route files (C-15):** `lib/home/{lexical,stats,accent}.ts`,
   `lib/i18n/arabic-gate.ts` (merge the two gate functions into one `resolveArabicAccess()` returning
   `'serve' | 'redirect'`), `lib/seo/buildPageMetadata.ts` (layout and page metadata). Tests import from
   `lib/`. Verify: HTML and `<head>` metadata byte-identical for `/en`, `/ar`, `/en/does-not-exist`,
   and `/ar` with Arabic disabled (307 to `/en`). Risk: low.
10. **Section building blocks.** Extract `SectionHead`, `CtaBand`, `StatsBand`, `HeroSection` and
    `WhoSection` from `page.tsx`. They take already-resolved props and keep **the same CSS module**: move
    the rules into `components/home/*.module.css` *verbatim*, in the same cascade order. Verify: pixel
    diff 0 at all 7 widths × 2 locales; DOM dump identical after hash normalisation; ariaSnapshot
    identical. Risk: medium. Moving CSS between modules can reorder the cascade where two rules have
    equal specificity, so diff the computed style of each section root (`getComputedStyle` JSON) as well
    as the pixels.
11. **Server-first Navbar (C-20).** A server `Navbar` with `<NavbarScrollState/>` (sets `data-scrolled`
    on `<header>`) and `<MobileDrawer/>` client islands; client components receive resolved strings
    instead of `locale`. Verify: pixel diff 0 in both scroll states (scrollY 0 and 400) and with the
    drawer open at 390; ariaSnapshot identical; keyboard e2e (Tab trap, Esc restores focus to the menu
    button); "First Load JS" for `/[locale]` lower than in Step 0 (record the delta). Risk: medium.
12. **HomeScrollHint as an anchor.** Verify: pixel diff 0. Clicking it lands `#who-we-are` at the same
    `scrollY` (± 1 px) as today. The accessible name is unchanged. Risk: low.
13. **Breakpoint normalisation (C-14).** Change `1023px`→`1023.98px`, `767px`→`767.98px`, and the
    `min-width: 1024px` pair. Make the 639 px Footer/Accordion queries a CTO/design question (moving
    them **would** change pixels at 640–767). Add the lint rule. Verify: pixel diff 0 at the 7 harness
    widths; at 1023.5 (zoom) the previous gap is gone (an expected, intended difference, documented).
    Risk: low.
14. **ServicesCarousel drag (C-21).** Keep the drag delta in a ref and read the step from CSS. Verify:
    pixel diff 0 at rest; scripted drag of −120 px gives the same final `--index` as today; React
    Profiler shows 0 renders during `pointermove`. Risk: low.

Items that need a CTO decision and are **not** in the zero-visual-change plan: C-04 (gold contrast),
C-06 (dynamic vs ISR), C-09 (accent fields → content model), C-10 (video pause UI), C-17 (marquee
control visibility), and the 639 px footer breakpoint.
