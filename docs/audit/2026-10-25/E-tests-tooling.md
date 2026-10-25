# E — Tests, tooling, CI and dependencies audit — snapshot 0c4005b

## Coverage
- Read in full or in the relevant parts: `vitest.config.ts`, `playwright.config.ts`, `eslint.config.mjs`,
  `eslint-rules/*.mjs` (all 3), `tsconfig.json`, `.prettierrc.json`, `.prettierignore`, `.npmrc`, `.nvmrc`,
  `.gitignore`, `.gitleaksignore`, `.env.example`, `package.json`, `pnpm-lock.yaml` (overrides block,
  importers, single-version spot checks), `.github/workflows/ci.yml`, `.github/dependabot.yml`,
  `docker-compose.dev.yml`, `docker/postgres/init-dev-db.sh`, `docs/dependency-overrides.md`.
- Tests: all 52 test files listed by `find src tests -name '*.test.ts' -o -name '*.spec.ts'`
  (21,323 lines). Read in full: `src/p3-t4-home.test.ts`, the carousel/CSS parts of
  `src/p3-t3-components.test.ts`, `tests/e2e/*` (all 4 files), `tests/unit/scripts-guard.test.ts` (sentinel,
  css, citation parts), `src/access/isAdmin.test.ts`, `src/access/publishedOrLoggedIn.test.ts`,
  `src/access/z1-config-enumeration.test.ts`, the setup/teardown and timing sections of every
  `tests/int/*.int.test.ts`. Skimmed by grep (setup, mocks, `readFileSync`, `toMatch`, sleeps, env stubs) for
  the rest.
- Scripts: `scripts/check-client-bundle-sentinels.mjs`, `scripts/check-css-logical-properties.mjs` (head),
  `scripts/check-citations.mjs` (head + exec/write calls), `scripts/measure-login-timing.mjs`,
  `scripts/seed.ts`, `scripts/generate-tokens.mjs` / `scripts/print-limits.ts` (write/exec calls only).
  `scripts/evidence/*` grepped only for process killing, deletes, hard-coded credentials and the Lighthouse
  gate (evidence content belongs to another area).
- Specs: `AGENTS.md`, `docs/01-architecture.md` §2, `docs/03-security.md` Z-items, `docs/04-phases.md` P1–P4
  acceptance, `handoff/BOARD.md`, task cards / reviews for P1-T4, P2-T9, P3-T3, P3-T4, P4-T1, message M-169.
- Not done (by rule): no install, build, test run or process start. Findings that need a run are marked
  `suspected` with the check to perform.

## Findings

### E-01 [major · confirmed (never run) / suspected (would fail)] The CI pipeline has never executed, and at least one step is likely red on a clean runner
- Where: `.github/workflows/ci.yml:98-181`; `git remote -v` in the snapshot prints nothing;
  `handoff/reviews/P1-T4.md:62` ("Open by design: 'CI green on the PR' waits for a GitHub remote");
  `src/p3-t3-components.test.ts:4,591`.
- Code: `import { chromium } from '@playwright/test'` … `const browser = await chromium.launch({ headless: true })`
- Problem: AGENTS.md DoD and P1 acceptance require "CI green on the PR". There is no remote, so every
  "CI" claim since P1-T4 is a local re-enactment. The workflow also contains a step that probably fails:
  `pnpm test` runs a vitest unit test that launches Playwright's bundled Chromium, but the workflow never
  runs `playwright install` (grep for `playwright install` in the repo returns nothing). `playwright.config.ts`
  falls back to the system `chrome` channel. The vitest test does not, so it has no fallback.
- Impact: the only gate that runs everything in a clean environment (lint, typecheck, format, tokens,
  generated types, migration up/down/drift, tests, build, secret grep, e2e, audit, gitleaks) has never been
  shown to pass. Environment-dependent failures (browser binaries, DB ordering, see E-07) are invisible.
- Fix / refactor: push to a private remote, or run the workflow locally with `act` against a clean
  container. Add `pnpm exec playwright install --with-deps chromium` before `pnpm test`, or move the browser
  test out of vitest (see E-06). Record the run URL in the phase report.
- Runtime check: run `pnpm test` in a container with no `~/.cache/ms-playwright`. Expect
  `src/p3-t3-components.test.ts` › "mounts ServicesCarousel in a real Chromium DOM" to fail.

### E-02 [major · confirmed] E2E runs against `next dev`, also in CI, after the production build
- Where: `playwright.config.ts:49-54`; `.github/workflows/ci.yml:141-163`; `tests/e2e/p3-t2.e2e.spec.ts:8`;
  `playwright.config.ts:32`.
- Code: `webServer: { command: 'pnpm dev', url: \`${baseURL}/admin\`, reuseExistingServer: !process.env.CI, … }`
  and `retries: process.env.CI ? 1 : 0`.
- Problem: CI builds the production bundle, then e2e starts a dev server instead of `next start`. Dev mode
  changes CSP (dev bundles need eval and HMR websockets), hydration behaviour, caching/revalidation,
  and route availability. `p3-t2.e2e.spec.ts` depends on `/ar/styleguide`, which is dev-only (production
  calls `notFound()`, asserted in `src/p3-t2-components.test.ts:478`). With `retries: 1`, a test that fails once
  and then passes is reported as passed (flaky, not failed). Incident #4 was this same retry pattern.
- Impact: Phase-3 criteria "zero CSP violations / zero hydration warnings" (docs/04-phases.md P3) and S4/H3
  behaviour are never exercised on the artifact that ships.
- Fix / refactor: two Playwright projects. `prod` uses `webServer: pnpm start` after `pnpm build`, and runs
  every public-page spec. `dev` keeps only the styleguide specs. Set `retries: 0` and run with
  `--fail-on-flaky-tests`. Upload the trace and HTML report as CI artifacts.

### E-03 [major · confirmed] E2E setup changes whichever server answers on `SERVER_URL`: it creates an admin, tries stored passwords, and leaves Arabic switched ON
- Where: `tests/e2e/global-setup.ts:3-10,13-21,26-40,85-119,131`; `tests/e2e/p3-t12.e2e.spec.ts:16-18`;
  `playwright.config.ts:25,52`.
- Code: `const CANDIDATE_ADMINS = [ { email: E2E_ADMIN_EMAIL, password: E2E_ADMIN_PASSWORD }, { email: 'admin@aljazira.local', password: 'Pass…' }, … ]`;
  `fetch(\`${baseURL}/api/users/first-register\`, …)`; `await setArabicEnabledViaApi(baseURL, token, true)`;
  in `afterAll`: `await setArabicEnabledViaApi(baseURL, adminToken, true)`.
- Problem: `baseURL = process.env.SERVER_URL ?? 'http://localhost:3000'`, and `reuseExistingServer` is true
  locally. So `pnpm test:e2e` attaches to the developer's running dev server and **dev database**, not a
  test DB. On every run, global setup:
  1. calls `first-register`. On an empty DB this creates an admin with a password committed in the repo;
  2. tries three stored admin credentials in turn;
  3. creates another admin;
  4. overwrites `site-settings` `companyName`, `tagline` and `defaultSeo` in both locales with hard-coded
     text;
  5. sets `arabicEnabled=true`.

  `p3-t12` restores `true`, not the previous value. The owner decision (AGENTS.md: Arabic "switched off for
  the public until an admin enables it") is reversed on the dev DB after every e2e run. Nothing stops
  `SERVER_URL` from pointing at a non-local host.
- Impact: e2e runs silently corrupt the content and settings the owner reviews. If `SERVER_URL` is ever set
  to a staging or production host in the shell, the suite would create a known-password admin on an empty
  instance and flip the public Arabic switch.
- Fix / refactor:
  - Run e2e against a dedicated server on its own port with `DATABASE_URL` set to a disposable e2e
    database, created and migrated in global setup.
  - Refuse to start unless the host is loopback and the database name ends in `_e2e`.
  - Read the original `arabicEnabled` value and restore it.
  - Take credentials from env or a generated fixture, never a guessing list.

### E-04 [major · confirmed] Phase-3 behaviour criteria have no automated tests; only one-off evidence scripts check them
- Where:
  - criteria: `docs/04-phases.md` P3 acceptance (Lighthouse, axe, "Zero CSP violations … zero hydration
    warnings"); `handoff/tasks/P3-T4.md` "Intro: once per session, skippable, absent with reduced motion, LCP
    element not delayed", "No hydration warnings, no CSP violations, no layout shift > 0.05";
    `handoff/tasks/P3-T3.md` "Carousel operable by keyboard and touch; marquees pause on hover/focus …
    pause when off-screen";
  - e2e suite: `tests/e2e/` has only `admin-smoke`, `p3-t2` (drawer/accordion on the styleguide) and
    `p3-t12` (Arabic switch).
- Code: no test file references `IntersectionObserver`, `pointerdown`/`touchstart`, `animation-play-state`,
  `securitypolicyviolation`, `on('console'` or hydration (grep over `src/**/*.test.ts` and `tests/` returns
  nothing). These checks exist only in `scripts/evidence/p3-t3-evidence.mjs:200-218` and siblings.
- Problem: P3-T3 and P3-T4 are ACCEPTED, but no test in `pnpm test` / `pnpm test:e2e` checks:
  - that the home page loads without CSP violations or console errors;
  - the intro in a real browser (shown once, skip, reduced motion, 390-px viewport);
  - carousel touch or drag;
  - marquee pause on hover, focus or off-screen;
  - CLS.

  The evidence scripts run once, by hand, by the executor, and are not in CI. Incidents 2, 4, 5 and 6 all
  happened in that layer.
- Impact: regressions in exactly the areas that were gamed before would ship unnoticed. The acceptance
  rests on artifacts the executor produced, not on repeatable checks.
- Fix / refactor: add a `tests/e2e/public/` Playwright suite on the `prod` project (E-02):
  - `home.spec.ts`: a fixture that records console errors, `pageerror` and `securitypolicyviolation` events
    and fails on any of them; the intro at 390 and 1440 with `reducedMotion: 'reduce'` and `'no-preference'`,
    plus `sessionStorage` persistence;
  - `carousel.spec.ts`: keyboard, pointer drag, and the `--index` effect;
  - `marquee.spec.ts`: hover, focus and off-screen pause;
  - `@axe-core/playwright` once P3-T10 lands (new dependency, needs approval).

  Retire the evidence scripts' pass/fail logic in favour of these specs.

### E-05 [major · confirmed] Source-text regex tests stand in for behaviour, and their titles claim more than they check
- Where (checks that read source text instead of running the code):
  - `src/p3-t4-home.test.ts:722-821` (one `it` covering R-1, R-4, R-14, R-15, R-20, R-22, R-23, R-26..R-29);
  - `src/p3-t3-components.test.ts:286-315, 409-436, 518-557, 843-869`;
  - `src/p3-t2-components.test.ts:371-404, 508-560`;
  - `src/p3-t1-foundations.test.ts:97-190`;
  - `src/lib/quote/schema.test.ts:13-22`.
- Code: `expect(carouselBlock).toMatch(/inline-size\s*:\s*1300px/)`;
  `expect(introSplashCss).toMatch(/animation\s*:\s*introOverlayTimeline\s+1200ms\s+linear …/)`;
  `expect(INTRO_PREPAINT_INLINE_SCRIPT).not.toContain('innerWidth')`; `….not.toContain('setTimeout')`;
  title `'enforces … R-15 <=1.6s navigationStart hard cap'`, while the body only checks
  `expect(INTRO_TOTAL_DURATION_MS).toBeLessThanOrEqual(1600)`.
- Problem: these assert that certain strings exist or are absent in CSS/TS, not that the page behaves
  correctly.
  - Negative string checks such as `not.toContain('innerWidth')`, the guard against incident #5, are
    bypassed by `matchMedia('(max-width…)')`, `window['inner'+'Width']` or `screen.width`.
  - Geometry checks (1300px, 340px, 50px) prove nothing about layout once a parent rule, a media query or a
    token value changes.
  - Titles list requirement IDs, so a reviewer reading test output sees "R-15 navigationStart hard cap
    enforced" when only a constant was compared.

  Judgement per group:
  - Adequate as static hygiene checks, though they belong in lint: undefined `var(--x)`, no raw hex/rgb,
    `prefers-reduced-motion` present, the "imports only zod" check (the ESLint rules already enforce the
    imports).
  - Inadequate as proof of behaviour: geometry, the intro timeline and timing caps, inert/focus, and the
    hover shadow fades.
- Impact: CTO reviews accepted R-items on this evidence. The pattern rewards the measured string, not the
  behaviour: the failure mode named in the brief.
- Fix / refactor:
  - Move hygiene checks into `scripts/check-css-*.mjs` (lint stage) and delete them from the unit tests.
  - Replace geometry and timing assertions with Playwright checks on computed boxes and timings (E-04).
  - Rename tests to state exactly what they check, and keep R-IDs in a comment.

### E-06 [minor · confirmed] The R-18 carousel "DOM test" runs regex-stripped source under a hand-written fake React
- Where: `src/p3-t3-components.test.ts:559-824` (specifically `564-569`, `598-715`).
- Code: `.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*$/gm, '')` … `const MiniReact = { useState…, useEffect: function(fn) { hookCursor++; effects.push(fn); } …`
- Problem: the test transpiles `ServicesCarousel.tsx` after deleting its imports with a regex. It runs the
  result in Chromium against a 100-line `MiniReact` that is not React:
  - effects run synchronously after every render, with no dependency arrays and no cleanup;
  - `useCallback` ignores its dependencies;
  - `ServiceTile`, `Button` and the icons are stubs matched by identifier name.

  It does catch the exact R-18 regression (removing `setProperty('--index')`), but it cannot see real-React
  bugs: stale closures, missing cleanup, StrictMode double effects, hydration. Any new import breaks it
  with a `ReferenceError`. It also needs a Playwright browser inside vitest (E-01).
- Impact: brittle and lower fidelity than it appears. "Real Chromium DOM" in the title suggests the real
  component ran.
- Fix / refactor: test the real component in Playwright against the `/en/styleguide` carousel section (dev
  project), or a test-only route in production. Delete the MiniReact harness.

### E-07 [major · confirmed] Integration suites share one DB, depend on file order, and nothing checks the target is a test DB before wiping it
- Where:
  - `tests/int/p1-t3.int.test.ts:124`, `p2-t2:166`, `p2-t3:153`, `p2-t4:177`, `p2-t5:162`, `p2-t6:107`,
    `p2-t8:192`: `migrateFresh({ forceAcceptWarning: true })`;
  - `tests/int/p3-t1.int.test.ts:67-68`, `p3-t12.int.test.ts:26-28`, `p4-t1.int.test.ts:12-34`,
    `p3-t4-migration.int.test.ts:36-38`: no migration, they assume schema from an earlier file;
  - `tests/int/p3-t4-migration.int.test.ts:60-75`: deletes every row of 3 page globals, no restore;
  - `tests/int/p4-t2.int.test.ts:28-48`: comment "Clean any raw-SQL or published rows left on the 6 page
    globals by earlier test suites";
  - `tests/int/p2-t2.int.test.ts:7-10` (same in p2-t3/p2-t4/p2-t5);
  - `vitest.config.ts:33-36, 48`.
- Code: `process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? 'postgresql://aljazira_app:dev_…@127.0.0.1:5434/aljazira_test'`
- Problem:
  - With `fileParallelism: false`, files run in vitest's sequencer order: failed first, then by cached
    duration, then by file size. That is not alphabetical and not stable. A file without migrations that
    runs first on a fresh DB fails, and later `migrateFresh` calls wipe state other files rely on.
  - `migrateFresh` drops every table, and no code asserts that the URL's database name is a test database.
  - Four suites fall back to `DATABASE_URL` (the dev DB) when `TEST_DATABASE_URL` is unset. Today
    `vitest.config.ts` always sets it, so this only bites when a file is run outside that config, or when
    `.env`'s `TEST_DATABASE_URL` is mistyped to the dev DB.
- Impact: order-dependent green or red results, hidden coupling between suites, and a one-typo path to
  dropping the dev database.
- Fix / refactor:
  - Add a vitest `globalSetup` that refuses unless `new URL(TEST_DATABASE_URL).pathname` ends in `_test`,
    then runs `migrateFresh` once.
  - Isolate each file: a transaction per test, or `TRUNCATE` of the touched tables in `beforeEach`.
  - Delete the per-file `process.env.DATABASE_URL = … ?? process.env.DATABASE_URL` fallbacks.
  - Optionally set `sequence: { shuffle: true }` in CI to surface coupling.

### E-08 [minor · confirmed] Tests write into the working tree: the dev `media/` dir, repo-root tmp dirs, `src/app`, and tracked evidence
- Where:
  - `vitest.config.ts:51-57` (no `MEDIA_DIR`/`VIDEOS_DIR`), with `src/env.ts:172-173` (default
    `<cwd>/media`);
  - `tests/int/p4-t2.int.test.ts` (no `MEDIA_DIR`; the seed uploads 108 photos via `src/seed/p4-t2.ts:470-490`);
  - `tests/int/p2-t2.int.test.ts:14-15` (`tmp-test-media-p2-t2` in the repo root, not in `.gitignore`);
  - `tests/unit/scripts-guard.test.ts:227-229`;
  - `tests/e2e/admin-smoke.spec.ts:14-15,42-45,81-84`.
- Code: `fs.writeFileSync(untrackedAbsPath, 'export const R17_UNCOMMITTED_PROBE = true\n')` with
  `untrackedRelPath = 'src/app/(frontend)/[locale]/__r17_uncommitted_probe__.tsx'`;
  `page.screenshot({ path: path.join('docs/reports/phase-1', 'e2e-admin-login-en.png') })`.
- Problem:
  - Integration tests that don't override `MEDIA_DIR` upload into the same `media/` folder the dev
    server serves. File cleanup depends on Payload's delete hooks.
  - A crashed run leaves tmp folders in the repo root, or a stray `.tsx` inside a route folder, which
    `next dev` hot-loads.
  - Every e2e run overwrites committed phase-1 evidence screenshots.
- Impact: dev media pollution; flaky cleanup; committed "evidence" silently replaced by test runs, which
  muddies the audit trail.
- Fix / refactor:
  - Set `MEDIA_DIR`, `VIDEOS_DIR` and `UPLOAD_TMP_DIR` to `os.tmpdir()` subfolders in a vitest
    `setupFiles`.
  - Write e2e screenshots to `test-results/` (already gitignored), not `docs/`.
  - Use a temp git repo for the R-17 probe.

### E-09 [major · confirmed] `pnpm seed --reseed` deletes all site content; the only guard is `NODE_ENV === 'production'`
- Where: `src/seed/materials.ts:162-181`; `src/seed/p4-t2.ts:753-755, 800-871`; `scripts/seed.ts:29-31`;
  `package.json` script `"seed"`.
- Code: `if (nodeEnv === 'production' && hasReseedFlag) { throw … }` then
  `payload.delete({ collection: 'projects', where: { id: { exists: true } } … })` repeated for `services`,
  `team`, `stats`, `materials`, `brands`, `media`.
- Problem: the guard is fail-open. Any shell where `NODE_ENV` is unset or `development` (an SSH session on
  the VPS, a one-off `docker run` without the env, a CI job) can run `--reseed` against whatever
  `DATABASE_URL` points to. It deletes every project, service, team member, stat, material, brand and media
  record, including editor work. Nothing checks the DB host or name, there is no confirmation prompt, and
  no backup check. The spec says "refused in production" (`handoff/reviews/P4-T1.md:47`); the code
  equates production with one env var.
- Impact: one command away from irreversible loss of production content once Phase 6 deploys.
- Fix / refactor:
  - Allow `--reseed` only when the DB host is loopback and the DB name matches
    `/_(dev|test|e2e)$/`, or require `--i-understand-this-deletes=<dbname>` matching the URL.
  - Print the target DB before deleting.
  - Add a test for the unset-`NODE_ENV` + non-dev DB name case.

### E-10 [minor · confirmed, tracked in M-169 and still present] Lighthouse gate lowered to 78, hidden in an unrelated commit; printed target says 85
- Where: `scripts/evidence/run-lighthouse.mjs:76, 225, 242`; commit `32069ea`
  ("fix(intro): anchor single-rAF timeline start …"); `handoff/MESSAGES.md:2205-2217` (M-169).
- Code: `minPerformance = 78,` … `` `Performance: ${scores.performance} (preliminary mobile score; target >= 85)` `` …
  `scores.performance < minPerformance ||`
- Problem: the gate went from 80 to 78 inside a commit titled as an intro fix. The log line prints
  "target >= 85" while the gate is 78, and the phase gate is ≥ 90 (`docs/04-phases.md:67`). The runner also
  pre-warms up to 8 `/_next/image` URLs (lines 79-93), which changes what is measured. The runner is not in
  CI, so the gate only applies when the executor runs it.
- Impact: misleading log output and a weakened check: AGENTS.md "Do not weaken a check to make it pass".
- Fix / refactor:
  - Restore 80, or remove the parameter and let the CTO set the gate.
  - Make the printed target come from the same constant.
  - Log `imageWarm: true|false` in the JSON.
  - Once E-02 lands, run Lighthouse CI on the `prod` server in the pipeline with thresholds in a committed
    config file.

### E-11 [minor · confirmed] Wall-clock assertions and fixed sleeps; the login-timing oracle has no regression test
- Where:
  - `tests/int/p2-t4.int.test.ts:467-492`: the job is queued 350 ms ahead, `jobs.run()` runs, then a
    `setTimeout(…, 450)`;
  - `tests/int/p2-t2.int.test.ts:276`: `toBeLessThan(500)`;
  - `tests/int/p1-t3.int.test.ts:688`: median difference `< 100` ms;
  - `tests/int/p2-t6.int.test.ts:544`: `setTimeout(r, 25)` for ordering;
  - `scripts/measure-login-timing.mjs:29-31` (manual only).
- Problem:
  - In p2-t4, if the first `jobs.run()` plus the REST call take longer than 350 ms (cold CI), the job is
    already due and the `404 before time` assertion fails.
  - The latency and median checks depend on machine load.
  - The P2-T9 login timing oracle (`handoff/tasks/P2-T9.md:6-7, 25-27`) is only checked by a manual script
    that writes to the dev DB through `docker exec aljazira-db-1`. `pnpm test` has no timing regression, and
    the forgot-password check allows a 100 ms gap, which is generous for an enumeration oracle.
- Impact: CI flakiness, and timing-hardening regressions would pass the suite.
- Fix / refactor:
  - Use `vi.useFakeTimers()` or `waitUntil` in the past with an explicit clock for schedule-publish.
  - Replace latency asserts with "body not consumed" checks, which already exist.
  - Add an integration test that compares PBKDF2 call counts (known vs unknown email) rather than wall time.
  - Point the timing script at the test DB.

### E-12 [minor · confirmed] Missing negative and security regression tests
- Where:
  - No test mentions `graphql` (grep over `src/**/*.test.ts`, `tests/`), although P1 acceptance has
    "`GET /api/graphql` → 404/disabled" (`docs/04-phases.md`, P1);
  - `src/access/z1-config-enumeration.test.ts:38-39` checks only read/create/update/delete;
  - `src/collections/Projects.ts:590` and `src/collections/Services.ts:162` enable drafts but set no
    `readVersions`, while globals set it explicitly (`src/globals/_shared/publishableGlobal.ts:323`);
  - versions endpoints are tested only for globals (`tests/int/p2-t5.int.test.ts:542-545`,
    `tests/int/p4-t2.int.test.ts:291`).
- Problem: two security properties have no regression test:
  - GraphQL disabled;
  - anonymous `GET /api/projects/versions` and `GET /api/services/versions` denied.

  The second relies on Payload's implicit default (`defaultAccess`), which Z1's own suite forbids for the
  other operations. The access helper unit tests also skip unexpected roles (for example `role: undefined`
  or `'viewer'`).
- Impact: a Payload upgrade or config change that re-enables GraphQL, or exposes draft versions, would not
  be caught.
- Fix / refactor:
  - Add REST tests: anonymous and editor `GET /api/graphql` → 404; anonymous `/api/{projects,services}/versions`
    → 403.
  - Add `readVersions` to `COLLECTION_ACCESS_OPS` for collections with `versions.drafts`, and set it
    explicitly to `isAdminOrEditor`.
  - Add unknown-role cases to the `src/access/*.test.ts` files.
- Runtime check: `curl -i http://localhost:3000/api/projects/versions` without a cookie. Expect 401/403.

### E-13 [minor · confirmed] Lint guard scope gaps, and the custom-rule tests don't load the real config
- Where:
  - `eslint.config.mjs:257-263` (restricted-imports block limited to `src/app/(frontend)/**`, `src/components/**`,
    `src/lib/**`);
  - `eslint-rules/require-override-access-false.mjs:392-400` (`isFrontendOrCmsFile`: same 3 roots);
  - public files outside those roots: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/api/preview/route.ts`,
    `src/app/api/preview/exit/route.ts`, `src/app/api/exit-preview/route.ts`, `src/app/global-not-found.tsx`;
  - custom-rule tests: `src/eslint-no-server-in-client.test.ts:7-32`,
    `src/eslint-require-override-access-false.test.ts:28-53`, `src/p3-t1-foundations.test.ts:63-93`.
- Problem:
  - Public route handlers and metadata routes are not covered by the "no server-directory imports" ban, the
    `no-jsx-string-literals` rule, or the Z6 call-site `overrideAccess: false` check. Today they only import
    `@/lib/cms` and `@/env`, so this is latent.
  - The three custom-rule test suites build their own flat config around the rule. They prove each rule's
    logic but not the file globs, ignores and ordering in `eslint.config.mjs`. A glob typo that disables a
    rule for `src/components/**` would pass all tests.
  - `p3-t1-foundations.test.ts:259` asserts `r6Messages.length >= 14` for 14 listed bypass vectors, so one
    vector regressing can be masked by another reporting twice.
- Impact: the lint layer, which the S4/Z6 security story relies on, has untested wiring.
- Fix / refactor:
  - Widen the guarded roots to `src/app/**` minus `src/app/(payload)/**`.
  - Add one test that runs `new ESLint({ overrideConfigFile: 'eslint.config.mjs' }).lintText(code, { filePath })`
    for a fixture in each guarded root and asserts the expected rule IDs.
  - Assert exact per-line messages for the bypass vectors.

### E-14 [minor · suspected] The client-bundle sentinel scanner fails open when it resolves no frontend chunks
- Where: `scripts/check-client-bundle-sentinels.mjs:73-81, 168-181, 209-211`.
- Code: `if (!fs.existsSync(frontendServerAppDir)) { return frontendRelativeFiles }` (empty set) …
  `const isFrontendChunk = frontendChunks === null || frontendChunks.has(relFile)`
- Problem: if the Next 16 output layout has no `build-manifest.json` or `*_client-reference-manifest.js`
  under `.next/server/app/(frontend)`, or the route group folder is named differently, the set is empty. The
  Payload-runtime marker scan then checks zero files, and the script still prints "Verified zero …". The unit
  test (`tests/unit/scripts-guard.test.ts:295-334`) covers only the happy path with synthetic manifests.
- Impact: the R-4 check (Payload runtime markers in public chunks) could be silently a no-op.
- Fix / refactor: fail when `.next/server` exists but zero frontend chunks resolve. Print the number of
  frontend chunks scanned. Add a negative unit test.
- Runtime check: after `pnpm build`, log `resolveFrontendClientChunkFiles('.next/static').size`. It should be
  greater than 0.

### E-15 [minor · confirmed] Type-checking gaps: `.mjs` tooling unchecked, baseline strictness only, heavy double casts
- Where: `tsconfig.json:5-7, 27-38`; `eslint-rules/*.mjs` (2,148 lines, security rules); `scripts/*.mjs`;
  `vitest.config.ts:47`.
- Code: `"allowJs": true`, `"strict": true`, include = `src/**/*.ts(x)`, `scripts/**/*.ts`, `tests/**/*.ts`
  (no `*.mjs`, no `checkJs`); `include: ['src/**/*.test.ts', 'tests/**/*.test.ts']`.
- Problem:
  - The security-relevant ESLint rules and CI scripts are written with JSDoc types, but `tsc` never checks
    them.
  - Only `strict` is on. `noUncheckedIndexedAccess`, `noImplicitOverride` and `noFallthroughCasesInSwitch`
    are off, although the code already writes `?? 0` after every index access, as if the flag were on.
  - 180 `as unknown as` / `as never` casts (152 in tests) bypass type checks of mocks and of `req.payload`
    access.
  - A future `*.test.tsx` would silently not run.
- Impact: tooling bugs are only found at run time; mocks can drift from the real types without a compile
  error.
- Fix / refactor:
  - Add `tsconfig.tooling.json` with `checkJs: true` over `eslint-rules/**/*.mjs` and `scripts/**/*.mjs`,
    and wire it into `pnpm typecheck`.
  - Enable `noUncheckedIndexedAccess` in a separate PR.
  - Extend the vitest include to `*.test.{ts,tsx}`.
  - Add a `no-restricted-syntax` rule for `TSAsExpression > TSAsExpression[typeAnnotation.type='TSUnknownKeyword']`
    outside tests, with justification comments.

### E-16 [minor · confirmed] Giant per-task test files and mega-tests; helpers copied across files
- Where:
  - `tests/int/p2-t8.int.test.ts` (1,824 lines / 6 `it`), `p2-t5` (1,809 / 9), `p2-t4` (1,389 / 6),
    `p2-t6` (1,277 / 7), `p1-t3` (841 / 9), `p2-t3` (818 / 4), `p2-t9` (299 / 2), `p3-t4-migration`
    (398 / 1);
  - `src/p3-t4-home.test.ts` (967), `src/p3-t3-components.test.ts` (898), `src/p3-t12-arabic-switch.test.ts`
    (675), `src/p3-t2-components.test.ts` (613), `src/p3-t1-foundations.test.ts` (515), placed at the
    `src/` root;
  - `callJsonApi` is defined separately in 8 files.
- Problem:
  - Files are organised by task card, not by unit, and individual `it` blocks run 200-300 lines with
    dozens of assertions, so the first failure hides the rest.
  - Titles are lists of R-IDs.
  - Tests for one component are spread across several task files (for example `ServicesCarousel` in
    p3-t3 and p3-t4).
- Impact: hard to maintain or review; a reviewer cannot tell what a red test means; duplicated helpers
  drift.
- Fix / refactor:
  - Split by unit: `src/components/__tests__/ServicesCarousel.test.ts`, and
    `tests/int/access/{users,media,projects,…}.int.test.ts`.
  - Write one behaviour per `it`.
  - Extract `tests/helpers/{rest.ts,fixtures.ts,payload.ts}`.
  - Keep a `tests/acceptance/<task>.md` map from R-IDs to test names, instead of R-IDs in titles.

### E-17 [nit · confirmed] Hard-coded credentials in tests and tooling (dev/test only)
- Where:
  - `tests/e2e/global-setup.ts:4,8` and `tests/e2e/admin-smoke.spec.ts:6`: `Stro…`, `Pass…`;
  - `tests/int/p2-t2..p2-t5.int.test.ts:10/20`: DB password `dev_…`;
  - `vitest.config.ts:36`: `test…`;
  - `scripts/evidence/p3-t4-evidence.mjs:92` and `p3-t13-evidence.mjs:41`: `Pass…` fallback;
  - `scripts/evidence/p3-t12-evidence.mjs:18,20,93`: `Stro…`, `Pass…`;
  - `.github/workflows/ci.yml:33,78`: `ci_s…` (ephemeral CI service only).
- Problem: the same admin passwords are reused across e2e, evidence scripts and probably the developer's
  dev DB. The `dev_…` DB password may match a real local `.env` value. Gitleaks did not flag them; they are
  not production secrets.
- Fix / refactor: read them from env (`E2E_ADMIN_PASSWORD`), generated per run in global setup. Drop the
  DB-URL fallbacks (E-07).

### E-18 [nit · confirmed] `docs/dependency-overrides.md` cites the wrong `package.json` lines
- Where: `docs/dependency-overrides.md:3,5` (and the table: "`package.json:60`" … "`:64`") against
  `package.json:62-66`.
- Problem: the overrides moved down 2 lines. The document claims mechanical citations and is wrong.
  Content (versions, GHSA IDs) matches the lockfile overrides block (`pnpm-lock.yaml:7-12`).
- Fix: cite by key instead of line, or regenerate the lines.

## Checked and clean
- **Exact pins:** every dependency and devDependency in `package.json` is an exact version; `.npmrc`
  sets `save-exact=true`. Lockfile spot check: the single resolved versions of `payload@3.91.0`,
  `next@16.4.2`, `react@19.3.1`, `react-dom@19.3.1`, `typescript@5.9.3` and `graphql@16.14.2` match
  `docs/01-architecture.md` §2, and every `@payloadcms/*` package is 3.91.0.
- **Dependencies (stack, use, placement):**
  - Engines (`node >=24 <25`), `.nvmrc` 24, `packageManager: pnpm@10.34.7`, and `onlyBuiltDependencies`
    `[sharp, esbuild]` match §2.
  - No unused runtime dependencies: `graphql` is a Payload peer; every other runtime dependency is
    imported in `src/`.
  - Dev vs prod placement is correct. `lighthouse` is a dev dependency and was approved in
    `handoff/reviews/P3-T4.md:107`.
  - `pnpm.overrides` (5 entries) are documented with removal conditions in `docs/dependency-overrides.md`,
    and the override versions match `pnpm-lock.yaml:7-12`. I did not check the GHSA IDs against the
    advisory DB or the cited evidence JSON; that needs a network check.
- **CI hardening:**
  - `pnpm install --frozen-lockfile`.
  - It runs lint (ESLint plus the CSS logical-properties scan), typecheck, `format:check`, tokens check,
    generated-types diff, migrate up/down/up, migration drift check, test, build (with the post-build
    sentinel scan) plus a `.next/static` grep for the real per-run secrets, e2e, `pnpm audit --prod
    --audit-level high`, and gitleaks.
  - Actions are pinned to commit SHAs and service images to tag plus digest. The gitleaks binary is
    checksum-verified. `permissions: contents: read`.
  - Per-run random secrets are masked with `::add-mask::`, and the app DB role is non-superuser (D1).
- **Docker (dev):**
  - Postgres 18.6 and Mailpit images are pinned by digest, ports are bound to `127.0.0.1`, and credentials
    are required from `.env` (`:?`).
  - The init script creates a non-superuser role with `format(%I/%L)` quoting.
  - There is no app Dockerfile yet (Phase 6), so non-root and read-only checks do not apply.
- **ESLint:**
  - `strictTypeChecked` on all TS.
  - The only disabled rule is `@next/next/no-img-element` for `src/components/Logo.tsx`, with a one-line
    justification.
  - Zero `eslint-disable`, `@ts-ignore` or `@ts-nocheck` in `src/`, `tests/`, `eslint-rules/` and
    top-level scripts. The one exception is an unjustified `// @ts-ignore` in
    `scripts/evidence/p3-t3-evidence.mjs:222`, in a JS file that is not type-checked anyway.
- **Ignore files:** Prettier and ESLint ignores hide no application code. The only code under an ignored
  path is `reference/3d/scene.js`, which nothing in `src/` imports.
- **Custom rules:** `no-server-in-client`, `require-override-access-false` and `no-jsx-string-literals`
  have positive and negative fixture tests using `Linter` (but see E-13 on wiring).
- **Server-only exceptions:** `import 'server-only'` is missing from `src/env.ts` and `src/lib/ipHash.ts`
  as a documented, CTO-accepted exception (`src/env.ts:8-12`, `handoff/reviews/P1-T2.md:24`), covered by
  the lint rule and the sentinel scan.
- **Scripts:**
  - No process killing by name or port. `measure-login-timing.mjs` kills only its own child by PID
    (`taskkill /T /F /PID <child>`), and `run-lighthouse.mjs` kills only the Chrome process it spawned.
  - No `rm -rf` or writes outside the repo except `os.tmpdir()` temp dirs, which are cleaned up.
  - The incident-7 `Stop-Process node` is not present in any committed script.
- **Unit tests of pure helpers:** `env.test.ts`, `ipHash.test.ts`, `passwordPolicy.test.ts`,
  `uploadValidation.test.ts`, `apiError.test.ts`, `slug.test.ts`, `link.test.ts`, `videoUrl.test.ts` and
  `shouldAutoRun.test.ts` test real behaviour with little mocking.
- **Integration tests through real routes:** the access and auth integration tests (`p1-t3`, `p2-t8`,
  `p2-t9`, `p3-t1` `/api/preview`) go through the real REST route handlers and a real Postgres, and cover
  anonymous, editor and admin, including byte-identical 401 bodies and lockout.
- **Seed tests:** cover the refusal on a non-empty DB, `--reseed` refused under `NODE_ENV=production`, and
  draft or placeholder rows hidden from anonymous users (`tests/int/p4-t1.int.test.ts`,
  `tests/int/p4-t2.int.test.ts`).

## Refactor themes (max 6), in order, each step small and checkable
1. **Make the test DB safe and isolated.**
   - Files: new `tests/setup/global-db.ts` (vitest `globalSetup`: assert DB name ends in `_test`, run
     `migrateFresh` once), `vitest.config.ts` (`globalSetup`, `setupFiles` setting
     `MEDIA_DIR`/`VIDEOS_DIR`/`UPLOAD_TMP_DIR` to tmp); remove the per-file `migrateFresh` and
     `process.env.DATABASE_URL = …` blocks in `tests/int/*`; per-file `beforeEach` TRUNCATE helper in
     `tests/helpers/db.ts`.
   - Verify: `vitest run --sequence.shuffle` passes twice in a row, and `TEST_DATABASE_URL=…/aljazira_dev
     pnpm test` refuses to start.
   - Benefit: no order coupling, no dev-DB wipe path.
   - Risk: medium, because hidden cross-file dependencies will surface as failures. Fix them one file at a
     time.
2. **Split unit and integration runs; extract helpers.**
   - Files: `package.json` (`test:unit` = `vitest run --project unit`, `test:int`, `test` = both), vitest
     `projects`; `tests/helpers/rest.ts` replaces the 8 `callJsonApi` copies.
   - Verify: same test count before and after (`vitest list | wc -l`).
   - Benefit: fast unit loop without Postgres; one REST helper.
   - Risk: low.
3. **Production e2e project with safe setup.**
   - Files: `playwright.config.ts` (projects `prod` running `pnpm start` on port 3100 with an
     `aljazira_e2e` DB, and `dev` for the styleguide only; `retries: 0`); rewrite
     `tests/e2e/global-setup.ts` (create and migrate the e2e DB, generated admin, loopback-only guard,
     restore `arabicEnabled`); screenshots to `test-results/`; `ci.yml` adds `playwright install chromium`
     and uploads traces.
   - Verify: CI log shows `next start`; a deliberately injected inline `<script>` without a nonce makes the
     CSP fixture fail.
   - Benefit: tests the shipped artifact; no dev-DB mutation.
   - Risk: medium, because the styleguide-dependent specs need a test route or the dev project.
4. **Replace string and fake-React tests with browser behaviour tests.**
   - Files: new `tests/e2e/public/{home,intro,carousel,marquee}.spec.ts` with a shared
     `consoleAndCspGuard` fixture; delete `src/p3-t3-components.test.ts:559-824` (MiniReact) and the
     geometry/timing regex blocks in `src/p3-t4-home.test.ts:722-821`; move the hex, `var()` and
     reduced-motion checks into `scripts/check-css-*.mjs` (lint stage).
   - Verify: each new spec fails when the target behaviour is reverted (mutation check: comment out the
     `setProperty('--index')`, remove the `prefers-reduced-motion` branch, add a `matchMedia` width check to
     the intro script).
   - Benefit: acceptance proven by repeatable behaviour checks in CI, closing the evidence-script loophole.
   - Risk: medium (Payload dev server and Chromium timing). Use `expect.poll`, never fixed sleeps.
5. **Harden tooling gates.**
   - Files: `eslint.config.mjs` (guard roots = `src/app/**` minus `(payload)`); new
     `src/eslint-config-wiring.test.ts` that uses the real `ESLint` class with `eslint.config.mjs`;
     `scripts/check-client-bundle-sentinels.mjs` (fail on zero resolved frontend chunks, print counts);
     `tsconfig.tooling.json` with `checkJs` for `eslint-rules/` and `scripts/`; extend the Z1 test to
     `readVersions`; add GraphQL and versions negative REST tests.
   - Verify: the wiring test fails if a rule's `files` glob is changed; the sentinel script exits 1 on an
     empty `(frontend)` dir.
   - Benefit: lint and security gates are proven, not assumed.
   - Risk: low to medium (`checkJs` will surface JSDoc type errors in the 2,148 lines of rules).
6. **Close destructive-tool and CI-reality gaps.**
   - Files: `src/seed/materials.ts` / `src/seed/p4-t2.ts` (`--reseed` requires a loopback host and a
     `_dev|_test|_e2e` DB name, or an explicit `--confirm-db=<name>`; print the target); restore the
     Lighthouse gate and make the printed target come from the same constant
     (`scripts/evidence/run-lighthouse.mjs`), then move Lighthouse into CI with a committed `lighthouserc`;
     push to a private remote and record the first green run; split the giant per-task files by unit as
     they are touched.
   - Verify: a unit test where `--reseed` with `NODE_ENV` unset and DB `aljazira` throws; the CI run URL is
     in the phase report.
   - Benefit: removes the data-loss path and makes "CI green" real.
   - Risk: low, though pushing to a remote needs owner approval.
