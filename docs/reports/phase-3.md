# Phase 3 — Front-end (pages, i18n, CSP, SEO, accessibility)

## Phase 3 — Front-end

> **Who wrote this and what it is worth.** The owner told the CTO on 2026-11-10 to carry out the
> remaining work itself ("نفذهم انت"). The CTO therefore acted as the executor for P3-T10 and wrote
> this report. Under the evidence-integrity rules in `AGENTS.md`, this is an **executor report**.
> It holds claims, not numbers of record. Every raw file it points to is **non-authoritative**. The
> results of record come only from an independent verifier run on a clean clone at the submitted
> SHA (a separate session or CI). That run has not happened yet.
>
> **Phase 3 cannot close yet.** P3-T5 (the live 3D tower) is still `IN_REVIEW`. P3-T10 is stacked
> on R-1, which the CTO recommends accepting but the owner has not approved yet.

### Done

**Accepted earlier, by review** (`handoff/reviews/`, final rounds):

| Task | What | Final review |
|---|---|---|
| P3-T1 | Frontend foundations, i18n (`src/i18n/`), CSP with nonce | Round 3, ACCEPTED |
| P3-T2 | Shell (navbar, footer) and primitives, `/styleguide` | Round 4, ACCEPTED |
| P3-T3 | Cards and motion components | Round 3, ACCEPTED |
| P3-T4 | Home page and intro | Round 5, ACCEPTED |
| P3-T6 | Services page and service detail | Round 3, ACCEPTED |
| P3-T7 | About page | Round 3, ACCEPTED |
| P3-T8 | Projects list and project detail | Round 3, ACCEPTED |
| P3-T9 | Contact page and quote form UI | Round 2, ACCEPTED |
| P3-T12 | English default and the admin Arabic switch | Round 2, ACCEPTED |
| P3-T13 | Intro splash first frame | Round 2, ACCEPTED (owner-approved) |
| P3-T14 | Site-wide motion and interaction pass | Round 3, ACCEPTED |
| P3-T5 | Live 3D tower in the card | **IN_REVIEW**, not part of this report's claims |

**P3-T10** (branch `p3-t10-seo-a11y`, worktree `D:\jazira-p3t10`):

- **SEO:**
  - Open Graph is now on the project and service pages, both list and detail
    (`src/components/open-graph.ts`, `src/app/(frontend)/[locale]/projects/**`, `.../services/**`).
  - The OG image uses the `og` size, picked in this order: the page's SEO image, then the page's
    own image, then the default SEO image from `site-settings`.
- **Sitemap and robots** (H7):
  - `src/app/sitemap.ts` lists the static pages, every published service and project, and
    `/privacy` only when its published body has content.
  - English entries are always present. Arabic entries appear only while Arabic is switched on.
  - Every entry carries absolute `hreflang` alternates, including `x-default`.
  - `src/app/robots.ts` now has the `Sitemap:` line (R-22).
- **JSON-LD** (I2):
  - Added `buildLocalBusinessJsonLd` next to the existing `Organization` block in
    `src/app/(frontend)/[locale]/layout.tsx`.
  - Its fields come only from `site-settings`. Empty fields are left out, and only `https` links
    are kept in `sameAs` and `hasMap`.
  - It is serialized with R-1's `<`-escaping `serializeJsonLd` and rendered in a nonce'd
    `<script type="application/ld+json">`.
  - Tests: `src/lib/localBusinessJsonLd.test.ts`.
- **404 and 500 pages:**
  - The localized 500 page is `src/app/(frontend)/[locale]/error.tsx`. It has a "try again"
    button and a link home.
  - The last-resort `src/app/global-error.tsx` renders its own document in English and Arabic.
  - Neither page renders the error message, digest or stack.
  - The 404 page existed already and is now audited too.
  - Tests: `src/p3-t10-error-pages.test.ts`.
- **WCAG 2.5.8:** the footer language switcher and the footer bottom links are at least 24 × 24
  (`src/components/Footer.module.css`). This is carried from the P3-T2 review.
- **axe-core e2e** (`tests/e2e/p3-t10-a11y.e2e.spec.ts`):
  - It runs WCAG 2.0/2.1/2.2 A and AA rules on every public page (home, services, about,
    projects, contact, the first project and the first service from the sitemap, and the 404),
    in `en` and in `ar`.
  - It collects CSP and hydration console messages on the same pages.
  - Both findings are checked in one assertion, so a failure shows both.
  - The owner-approved contrast exception (see Deviations) is scoped to exact colour pairs in
    `tests/e2e/a11y-exceptions.ts`, with must-fail unit tests in
    `tests/unit/a11y-exceptions.test.ts`.
- **Visual pack:**
  - `pnpm visual` (`scripts/visual.mjs`) captures 6 pages × 1440/768/390 × `en`/`ar`.
  - It also writes `index.html`, which places each 1440 `en` page next to its Figma export.
  - It refuses to run while Arabic is switched off.
- **Hard-coded text scan:**
  - `scripts/check-hardcoded-strings.mjs` runs inside `pnpm lint`.
  - It fails on Arabic text, and on English sentences of three or more words, in public
    components and pages.
  - Its must-fail cases were checked by hand: an injected Arabic string and an injected English
    sentence both failed the scan.
- **Test upkeep after F-1:**
  - F-1 published every seeded service and project, so P3-T6 and P3-T8 e2e no longer assume
    seeded drafts.
  - P3-T6 now unpublishes through the API without `?draft=true`.
  - P3-T8 finds a real draft, or makes one.
  - No assertion was removed.
- **Contrast pair list** (decision 19):
  - `docs/reports/phase-3/contrast-pairs.md` lists every text/background pair that axe evaluated
    on the public pages, in `en` and in `ar`, with token names.
  - Each ratio is computed twice, by the generator script and by axe.
  - The file is generated, not typed.

### Evidence

All of it is executor-side and **non-authoritative**. The verifier regenerates it.

- `docs/reports/phase-3/visual/` and its `index.html`: the visual pack.
- `docs/reports/phase-3/lighthouse/`:
  - Lighthouse 13.5.0 mobile, HTML and JSON, on `/ar`, `/ar/projects/<slug>` and `/en`.
  - The machine was under load (the desktop compositor held a large share of the GPU), so the
    performance values are not a measurement of the site.
- `docs/reports/phase-3/contrast-pairs.md`: the generated colour pair list.
- `docs/reports/phase-3/README-evidence.md`: how the above was produced.
- Executor logs, outside the repository: `D:\jazira-cto-logs\p3t10-dod\`. They cover migrate
  up/down/up, lint, typecheck, format, tokens, test, build, audit, the e2e runs, the visual run,
  Lighthouse and the colour pair run.
- Claims from those runs:
  - `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` passed.
  - `pnpm audit --prod` showed no high or critical advisories. The low advisory accepted earlier
    (AR-1) remains.
  - The P3-T10 a11y e2e passed in `en` and `ar` after the owner's contrast decision.
  - No CSP or hydration message appeared on any audited page.
  - The full e2e suite ran without a filter. Every failure was explained and either fixed (P3-T6,
    P3-T8) or is a known inherited one (R-9).

### Acceptance criteria (`docs/04-phases.md`, Phase 3)

- [x] **Visual review against Figma** at 1440, 768 and 390, in `ar` and `en`:
  - the pack and the side-by-side index are committed;
  - the per-page differences were judged in the P3-T6..T9 and P3-T14 reviews.
- [ ] **Lighthouse (mobile) on Home and Project detail:**
  - Accessibility, Best Practices and SEO met their bars in the executor's runs.
  - **Performance is not proven.** Those runs were made on a loaded machine, so they say nothing
    about the site.
  - The owner postponed the re-measurement (2026-11-10, "اجل القرارين"). It needs a quiet machine
    or a clean CI runner.
- [x] **WCAG 2.2 AA** (keyboard, focus visible, alt text, contrast, `lang`/`dir`), with the
  owner-approved contrast exception:
  - the axe e2e covers `lang`/`dir`, alt text, names and contrast on every page in both locales;
  - keyboard and focus are covered by `tests/e2e/p3-t2.e2e.spec.ts`,
    `tests/e2e/p3-t6.e2e.spec.ts` (tablist), `tests/e2e/p3-t8.e2e.spec.ts` (lightbox focus) and
    `tests/e2e/p3-t14-motion.e2e.spec.ts`;
  - `media.alt` is required (`src/collections/Media.ts`).
- [x] **Zero CSP violations and zero hydration warnings:** the axe e2e asserts an empty console
  list for both, on every audited page, in `en` and `ar`.
- [x] **Content changes in admin appear after publish without a redeploy:** on a running
  `next start` build, `tests/e2e/p3-t6.e2e.spec.ts` unpublishes a service through the API and its
  page answers 404 at once. `tests/e2e/p3-t12.e2e.spec.ts` does the same for the Arabic switch.
- [x] **No hard-coded business content in components:** `scripts/check-hardcoded-strings.mjs`
  runs in `pnpm lint`.
- P3-T10 card:
  - [x] the console findings are part of the e2e assertion;
  - [x] `pnpm visual` output is committed and complete.

### Dependencies added/changed

- `@axe-core/playwright@4.14.0` (dev):
  - why: the axe-core e2e required by the P3-T10 card;
  - published 2026-10-15, about 23 million weekly downloads;
  - considered instead: wiring `axe-core` by hand into Playwright (more code, same engine).

### Security notes

- **I2:** JSON-LD (`Organization` and `LocalBusiness`) uses R-1's `serializeJsonLd`, which
  escapes `<`, `>` and `&`. A test proves that a `</script>` payload from the CMS cannot break out.
- **H3:** the JSON-LD scripts carry the request nonce. The e2e saw no CSP message.
- **H7:** `robots.txt` disallows `/admin` and points to the sitemap. The sitemap lists only
  published documents, and lists Arabic pages only while Arabic is on.
- **500 pages:** they show no error message, digest, stack or version.
- **Stacked on R-1:** P3-T10 was branched from `phase-3-frontend` plus `r-1-safety` at `0b325e5`.
  If the owner rejects R-1, this branch must be rebased.

### Deviations from spec

- **Contrast, owner-approved 2026-11-10:**
  - What the owner was shown: a side-by-side sample of both options on real pages, and the WCAG
    reason the light colours fail.
  - What the owner chose: to keep the Figma colours on light backgrounds ("اعتمد الفاتح").
  - Colours kept: `#DFA82A` and `#C38F1C` for display text and stat numbers, and `#8A93A3` for
    muted text.
  - Backgrounds: `#FFFFFF`, `#F6F8FB` and `#E3E7EE`.
  - Where it is recorded: decision 19 in `docs/05-design.md`, and as an exception in
    `docs/04-phases.md`.
  - What the test still catches: it exempts only these exact pairs. Any other contrast failure
    still fails it.
- **Protected path touched:** `scripts/check-hardcoded-strings.mjs` is new, and `scripts/check-*`
  is CTO-owned. The CTO wrote it while acting as executor. The independent verifier should review
  it line by line.
- **Spec documents edited:** `docs/04-phases.md` and `docs/05-design.md` were edited by the CTO to
  record the owner's decision above. Nothing else in them changed.

### Known gaps

- Text over images, gradients or overlapping layers cannot be checked for contrast by axe. The pair
  list counts these elements. They need a manual visual check, done here through the visual pack.
- The Lighthouse performance bar is not proven (see above).
- P3-T5 is in review. Phase 3 does not close until it is accepted.
- No independent verifier run has been made at this SHA yet.

### Questions for the owner

- Accept R-1? P3-T10 depends on it. The CTO recommends accepting it (`handoff/reviews/R-1.md`).
