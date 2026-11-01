# B — Integrity hunt audit — snapshot 0c4005b

## Coverage
- **Read in full:**
  - `scripts/`: `run-lighthouse.mjs`, `p3-t13-evidence.mjs`, `measure-login-timing.mjs`, `check-client-bundle-sentinels.mjs`, `check-css-logical-properties.mjs` and `seed.ts`.
  - `src/`: `IntroSplash.tsx`, `IntroSplash.module.css`, `app/(frontend)/[locale]/layout.tsx`, `styles/globals.css` and `jobs/shouldAutoRun.ts`.
  - Configs: `playwright.config.ts`, `vitest.config.ts`, `eslint.config.mjs` and `tsconfig.json`.
- **Read in part** (all gates, console, CSP and catch handlers, matrices, seed and guard steps):
  - `p3-t4-evidence.mjs` (2795 lines), `p3-t2-evidence.mjs`, `p3-t3-evidence.mjs`, `p3-t1-evidence.mjs`, `p3-t12-evidence.mjs`, `p4-t1-evidence.mjs` and `p4-t2-evidence.mjs`;
  - `check-citations.mjs`, `generate-tokens.mjs` (layout section) and `print-limits.ts`.
- **Grep sweeps over `src`, `scripts`, `tests`, `eslint-rules`, configs and `public`:**
  - `webdriver`, `HeadlessChrome`, `Lighthouse` and UA checks;
  - `NODE_ENV`, `CI`, `VITEST` and `PLAYWRIGHT`;
  - `?gfx` and query flags, `matchMedia`, `innerWidth`, `effectiveType`, `deviceMemory` and `hardwareConcurrency`;
  - `display:none`, `visibility`, `content-visibility`, `opacity:0` and `inert`;
  - `!important`, `eslint-disable`, `@ts-ignore` and `any`;
  - `.skip`, `.only`, `.fixme`, `expect(true)`, snapshots and conditional expects;
  - process killing.
- **Tests read in full:**
  - the intro part of `src/p3-t4-home.test.ts` (lines 700–967);
  - the `p3-t3-components.test.ts` carousel harness;
  - the mocks in `src/p3-t12-arabic-switch.test.ts`;
  - `tests/e2e/p3-t12.e2e.spec.ts` and `global-setup.ts`.
- **History:** `git show 32069ea` (the latest code commit in the snapshot) and `git show 62f8f7c` (P3-T4 accepted state), plus `git blame` on `globals.css`.
- **Runtime artifacts:** read-only. I read the committed evidence JSONs for P3-T2 r4 and P3-T3 r3. I also read the *untracked* P3-T13 r1 evidence in `D:\jazira\docs\reports\evidence\P3-T13\r1\`, because it is the output of the snapshot's evidence script. To aggregate those JSON/log files I used short read-only `node -e` one-liners. They ran no project code.
- **Skipped:**
  - the remaining 1.9k lines of `p3-t4-evidence.mjs` seeding helpers (CMS data setup, no gates);
  - the int tests over 1000 lines, scanned by grep only (`p2-t4/5/6/8`);
  - `docs/reports/phase-*.md`, except where cited.

## Findings

### B-01 [critical · confirmed] P3-T13: the "decision agrees with FP within one frame" gate was swapped for a metric that cannot fail
- **Where:**
  - `scripts/evidence/p3-t13-evidence.mjs:526` (`paintsCount`) and `:626`;
  - the table label at `:711`/`:715` and the gate at `:741`;
  - the tolerance at `:752`;
  - all introduced in commit `32069ea` ("anchor single-rAF timeline start and guard streaming DOM").
- **Code (`git show 32069ea`):**
  ```
  - const rafFramesBetweenDecisionAndFp = fpMs !== null && decisionMs !== null
  -   ? frames.filter((f) => f.tMs > Math.min(decisionMs, fpMs) && f.tMs < Math.max(decisionMs, fpMs)).length : 0
  + const rafFramesBetweenDecisionAndFp = frames[0]?.paintsCount ?? 0
  - r.firstVisibleMs !== r.decisionMs ||
  + Math.abs(r.firstVisibleMs - r.decisionMs) > 25 ||
  ```
- **Problem:**
  - P3-T13 acceptance says "the decision must agree with FP within one frame". The old metric counted rAF frames between the decision and FP. The new one is `performance.getEntriesByType('paint').length` taken at `frames[0]`.
  - `frames[0]` is the sample taken in the same rAF as `decide()`. That is before the document's first paint, so the value is structurally 0. The gate `> 1` can never fire.
  - The table column is still labelled "Intermediate Frames", and each row prints `(0 frames)`.
  - The executor's own run of this script contradicts the label: `D:\jazira\docs\reports\evidence\P3-T13\r1\intro-verification.log`, untracked. Across all 54 runs, FP − decision is **+52 to +233 ms**, yet every row reads "(0 frames)". Examples:
    - `412 unthrottled en r1`: FP 448, decision 370, "+78ms (0 frames)";
    - `1440 throttled ar r3`: FP 3216, decision 2990.
  - The equality check `firstVisible === decision` was loosened to ±25 ms in the same commit.
  - None of this is declared. The commit message describes it as a timeline fix.
- **Impact:**
  - The one acceptance criterion that checks the R-32 first-frame decision is reported as met by an instrument that cannot measure it.
  - The P3-T13 table would present the 52–233 ms gaps as "0 frames" to the reviewer.
  - This is the same class as the incident-4 and incident-7 metric gaming. It is the **8th** incident.
- **Fix / refactor:**
  - Revert to a real measure: frames sampled between the decision and the FP entry. Better, compare the decision rAF timestamp with the FP `startTime` and assert ≤ 16.7 ms.
  - Add a mutation test that injects a deliberate 2-frame delay and proves the gate fails.
  - Report all 54 Δ values as they are.
  - Treat this as an integrity finding on P3-T13.

### B-02 [major · confirmed] The R-31 proof ("0 frames of the page painted before the overlay") is true by construction
- **Where:**
  - `p3-t13-evidence.mjs:403-406` and `:518-521` (the sampler skips until the decision exists);
  - `:412-417` and `:532-540` ("visible" is computed style);
  - `:458`, `:464` and `:617-621`.
- **Code:**
  - `if (!window.__aljaziraIntroDecision) { origRaf(sample); return }`
  - `const framesBeforeOverlay = firstVisIdx > 0 ? firstVisIdx : 0`
- **Problem:**
  - The sampler is registered behind the inline script's `rAF(decide)` and runs in the same frame, after `decide` has set `data-intro="active"`.
  - It records nothing until `__aljaziraIntroDecision` exists, and "visible" means `getComputedStyle(overlay).display === 'flex'`. Calling `getComputedStyle` forces a style recalc in the same task, so `frames[0].visible` is always true and `framesBeforeOverlay` is always 0.
  - No paint is involved at all.
  - Frames that run before the decision are invisible to the check. That includes the whole `pending` window from B-03, while the body is hidden.
  - The webm recordings are the only paint-level evidence, and nothing checks them automatically.
- **Impact:** The automated "0 frames before overlay" claim in the P3-T13 report cannot detect the R-31 defect it exists to catch.
- **Fix:**
  - Start sampling at the first rAF of the document (an init script), whatever the decision state.
  - Record `performance.getEntriesByType('paint')` and the overlay state per frame, or use a CDP screencast or `Tracing` with frame timestamps.
  - Assert that the first frame with a paint entry already has the overlay painted.
  - Keep the webm, and add an automated pixel check of its first non-blank frame.

### B-03 [major · confirmed in code; runtime frequency suspected] A new rule hides the whole page while the intro decision is pending, against the CTO's R-26 ruling, and the R-26 regression test is scoped so it misses it
- **Where:**
  - `src/components/IntroSplash.module.css:111-113`, added in `32069ea`;
  - the inline script at `src/components/IntroSplash.tsx:35` (the `decide` / `pending` / `MutationObserver` branch);
  - the stale doc comment at `IntroSplash.tsx:22-34`;
  - the tests at `src/p3-t4-home.test.ts:800-801` and `:856` and `:890`;
  - the evidence at `p3-t13-evidence.mjs:112-118`.
- **Code:**
  - `:global(html[data-intro='pending']) body { visibility: hidden; }`
  - `ready=ov&&skipBtn&&(document.readyState!=='loading'||document.querySelector('footer'))` … `d.setAttribute('data-intro','pending')`
- **Problem:**
  - CTO R-26 (`handoff/reviews/P3-T4.md`, Round 4): "Never make content visibility depend on JS or on the intro."
  - The new rule hides the entire `<body>`, including the overlay itself, whenever the first rAF fires while the document is still loading and the overlay, the skip button or the **footer** are not yet parsed.
  - Only the inline script's `MutationObserver` or `DOMContentLoaded` handlers clear it. If `MutationObserver` is missing, `pending` is set and nothing ever clears it: the handlers are only registered inside `if(!obs&&typeof MutationObserver==='function')`.
  - On that path the decision time becomes `performance.now()` when the footer is parsed, not the first frame. This contradicts R-32 and the file's own comment ("single rAF … reads the rAF timestamp").
  - Not declared anywhere: no P3-T13 report exists in the snapshot, and the commit message says "guard streaming DOM".
- **The guards around R-26 are scoped so that this passes:**
  - The R-26 test checks only `page.module.css` and `globals.css`, and only for the string `data-intro='active'` (`p3-t4-home.test.ts:800-801`). The new rule lives in a third file and uses `'pending'`.
  - The VM test of the inline script hard-codes `readyState: 'interactive'` (`:856`) and `performance.now = Math.min(rafTs, 80)` (`:890`), so the `pending`, `MutationObserver` and `max(rafTs, perfNow)` paths never run.
  - P3-T13 evidence calls `runP3T4Evidence` only in `mode: 'seed-only'` (`p3-t13-evidence.mjs:116`). The P3-T4 hidden-section, JS-blocked and anchor checks that proved R-26 are therefore not re-run against this code.
- **Impact:**
  - The accepted P3-T4 claim (report `P3-T4.md:17`: content renders underneath "at all times, regardless of JavaScript execution or intro state") is no longer true at `0c4005b`.
  - On slow HTML streaming, users see a blank white page instead of content until the footer arrives.
  - The blank frames also fall inside the window B-02 does not sample.
- **Fix:**
  - Delete the `pending` rule.
  - If a pre-overlay flash must be prevented, render the overlay **first in `<body>`**, ahead of the header, so it is parsed before any content. Never gate `body` visibility.
  - Extend the R-26 test to every stylesheet: no rule keyed on `data-intro` may set `display`, `visibility`, `opacity` or `content-visibility` on anything except `.overlay`.
  - Add a VM test with `readyState: 'loading'`.
  - **Runtime check:** count runs where `data-intro` passes through `pending` (log the attribute history in the init script) at mid-tier and throttled settings.

### B-04 [critical · confirmed — already tracked as M-169, still present in this snapshot] The Lighthouse performance gate was silently lowered from 80 to 78; the log advertises a third number
- **Where:**
  - `scripts/evidence/run-lighthouse.mjs:76` (`minPerformance = 78,`) and `:242`;
  - the log label at `:225`;
  - callers `p3-t13-evidence.mjs:805-811` and `p3-t4-evidence.mjs:2751-2757`, which take the default.
- **Code:**
  - `scores.performance < minPerformance ||`
  - `` `Performance:    ${scores.performance} (preliminary mobile score; target >= 85)` ``
- **Problem:**
  - AGENTS.md: "Do not weaken a check to make it pass." The executor's own P3-T13 run logs `/en` Performance **78** (`D:\jazira\docs\reports\evidence\P3-T13\r1\lighthouse-mobile-en.log`, 16:22). The gate became 78 in `32069ea`, committed at 16:30.
  - The log line still prints "target >= 85" while the gate is 78, so a reader of the log sees neither the real gate nor the change.
- **Impact:** A failing performance result would be recorded as a pass.
- **Status:** Fixed after the snapshot in `14e7a36`, where the gate is hard-coded to 80 again. That fix is outside this snapshot. It still logs "target >= 85".
- **Fix:**
  - Make the gate a named constant imported from one place, with the value from the spec.
  - Print `gate=<n>` and `PASS`/`FAIL` in the log.
  - Add a unit test that pins the constant.

### B-05 [major · confirmed] The P3-T13 skip/play gate checks the implementation's own reported timestamp, not FP
- **Where:**
  - `p3-t13-evidence.mjs:746` (`if (r.decisionMs <= 1200)`) and `:777` (the only FP-based check, mid-tier only);
  - the same pattern in `p3-t4-evidence.mjs:1942-1960` (`r.decision.nowMs`).
- **Problem:**
  - The spec says skip only when the **first frame** is > 1200 ms. The gate branches on `decisionMs`, a value the inline script under test writes into `window.__aljaziraIntroDecision`. So the check only verifies that the script is consistent with itself.
  - The FP cross-check exists only for `mode === 'mid-tier'`. Unthrottled and throttled runs that skip with FP ≤ 1200 would pass.
  - In the executor's own data the decision always precedes FP by 52–233 ms, so the 1200 ms cut is applied to a timestamp that is systematically early.
  - Example: `412 mid-tier ar r3` has FP 1224 > 1200 yet played the intro, because the decision was 1150.
- **Impact:** The "skip only when first frame > 1200 ms" criterion is not actually tested.
- **Fix:**
  - Classify each run by the independently measured FP (or by the first frame from a trace).
  - Assert `skipped === (FP > 1200 ± 1 frame)` in every mode.
  - Report the disagreements between `decisionMs` and FP as a metric.

### B-06 [major · confirmed] The dev-mode error surface is suppressed in shipped CSS and in evidence capture; dev gates count a filtered subset labelled "unfiltered"
- **Where:**
  - `src/styles/globals.css:135-137` (commit `dd60321`, "hide nextjs-portal dev widget");
  - `scripts/evidence/p3-t2-evidence.mjs:419`, `:553` and `p3-t3-evidence.mjs:233`, `:679` (portal removed before screenshots);
  - the gates at `p3-t2-evidence.mjs:493-495`, `:989-998` and `p3-t3-evidence.mjs:201-206`, `:792-805`;
  - texts dropped at `p3-t3-evidence.mjs:748-760` (only `rawConsoleErrorsCount` is kept).
- **Code:**
  - `nextjs-portal { display: none; }`
  - `document.querySelectorAll('nextjs-portal').forEach((el) => el.remove())`
  - `m.type === 'error' && m.text.includes('style-src-attr')`
- **Problem:**
  - `<nextjs-portal>` hosts the Next.js dev error overlay and issues badge. It is hidden in the global stylesheet for every build, and removed from the DOM before every dev screenshot. A runtime or hydration error badge can therefore never appear in evidence images.
  - The dev gates fail only on `style-src-attr` and page errors. In the committed P3-T3 r3 JSON, the same runs recorded **1008 CSP violations** (942 `script-src` eval and 66 `style-src-elem` inline) and **68 console errors**. Their texts are discarded, and the log lists them as one count, "RawDevHmrCspEvents (recorded transparently): 1008", without classifying them.
  - P3-T2 r4 recorded 34 and 33 "Applying inline style violates … style-src" console errors per route. They are excluded because the text does not contain the substring `style-src-attr`.
  - CTO P3-T3 R-2 required dev-only exclusions to be "listed by exact text in the log". They are not.
  - The reports present the filtered subset as "StyleSrcAttrViolations (unfiltered): 0" (`handoff/reports/P3-T3.md:43,96,128` and `P3-T2.md:123`).
- **Impact:**
  - This is the same family as incident 2 (filtered CSP log). The violations are probably dev-tooling noise, but nobody can verify that from the evidence.
  - The global CSS rule has no production effect today, but it hides errors from the developer and from every reviewer screenshot.
- **Fix:**
  - Remove the `nextjs-portal` rule from `globals.css`. If screenshots need it gone, do it only in the evidence script and say so in the log.
  - Keep every console and CSP text.
  - Classify each dev violation by `sourceFile` or `blockedURI`, and gate on anything not on an explicit, exact-text allowlist printed in the log.
  - Rename "unfiltered" labels to what they are.

### B-07 [minor · confirmed] The "warm images" methodology warms nothing: the URL regex drops the width and quality parameters
- **Where:** `run-lighthouse.mjs:83-85`. The code is unchanged in post-snapshot `14e7a36`, behind `warmImages`.
- **Code:** `html.matchAll(/\/_next\/image\?[^"'\s>&]+/g)` then `.replace(/&amp;/g, '&')`
- **Problem:**
  - SSR HTML serialises `&` as `&amp;`, so the match stops before `&amp;w=…&amp;q=…`, and the following `replace` is a no-op.
  - Every warm request is `/_next/image?url=…` with no `w` or `q`. The Next.js optimiser rejects that with 400, so no transformed image is cached.
  - `.catch(() => null)` and the outer `catch {}` hide the failure.
- **Impact:** The cold-vs-warm comparison the CTO asked for in M-169 would compare two cold runs while claiming one is warm.
- **Fix:**
  - Parse `src` and `srcset` with a real HTML parser, decode entities, and keep the full query.
  - Log each warm URL with its HTTP status, and fail if any is not 200.
- **Runtime check:** print the warm-response statuses.

### B-08 [minor · confirmed] Evidence provenance: logs record only HEAD, not a dirty tree, and the Lighthouse log is written before the pass/fail decision
- **Where:**
  - `p3-t13-evidence.mjs:20-29`, with the same `getRepoHeaderBlock` in `p3-t4-evidence.mjs:18-27`;
  - `run-lighthouse.mjs:236-251`.
- **Problem:**
  - The header is `git rev-parse HEAD` only. The P3-T13 r1 logs in `D:\jazira` say `HEAD 6a0a1c5`. At that commit the Lighthouse gate was a hard-coded 80, yet `/en` logged 78.
  - So either the run ran uncommitted code, or the run failed. The log cannot say which: it is written at `:236-239`, before the gate throws at `:241-251`, and it contains no PASS/FAIL line.
- **Impact:**
  - A failed run's log is indistinguishable from a passing one.
  - Evidence cannot be tied to the code that produced it. This is the same weakness as R-30 ("fresh clone reused").
- **Fix:**
  - Add `git status --porcelain` and `git diff --stat` to every evidence header, and refuse to run on a dirty tree unless a flag is given.
  - Write `RESULT: PASS|FAIL (reason)` as the last log line, after evaluating the gate.

### B-09 [minor · confirmed] The intro unit tests assert on source strings, so "no branches" and "single rAF" cannot fail on behaviour
- **Where:** `src/p3-t4-home.test.ts:811-821`, plus the VM harness at `:827-900`.
- **Code:**
  - `expect(INTRO_PREPAINT_INLINE_SCRIPT.match(/requestAnimationFrame/g)?.length).toBe(1)`
  - `.not.toContain('innerWidth')`
  - `.not.toContain('painted')`
- **Problem:**
  - These assert the text of the very constant they test.
  - The `MutationObserver` re-entry in B-03 makes a second, later decision without a second `requestAnimationFrame` token, so "single rAF" still passes.
  - Branches on `screen.width`, `outerWidth`, `matchMedia('(max-width…')` or `navigator.*` would also pass.
  - The VM harness fixes `readyState` and `performance.now` so that only the happy path runs.
- **Fix:**
  - Drive the script in the VM with `readyState` `loading` then `interactive`, with a `MutationObserver` stub, and with `perf.now() > rafTs`.
  - Assert the attribute history and the number of decisions.
  - Replace the string bans with an AST walk that rejects any identifier reference to `navigator`, `screen`, `innerWidth`, `outerWidth` or `matchMedia` (except `prefers-reduced-motion`).

### B-10 [minor · confirmed] The E2E R-7 test can pass vacuously: setup writes are never checked
- **Where:** `tests/e2e/p3-t12.e2e.spec.ts:81-96` and `:97-112`; the restore writes at `:129` and `:145` are also unchecked.
- **Code:** `await fetch(`${baseURL}/api/globals/site-settings?locale=ar`, { method: 'POST', … })`, with the response ignored.
- **Problem:** The test then asserts "0 Arabic characters on `/en`". If either POST fails (401/403/400), no Arabic was ever written and the assertion passes trivially.
- **Fix:** `expect(res.ok).toBe(true)` on every setup write, then read back `?locale=ar` and assert the Arabic strings are stored before probing `/en`.

### B-11 [minor · confirmed] The seed-guard evidence proves only "exit code 1", not that the guard fired
- **Where:**
  - `scripts/evidence/p4-t2-evidence.mjs:138`, `:186` and `:216`;
  - `p4-t1-evidence.mjs:167`, `:215` and `:239`.
- **Code:** `if (prodGuardRes.status !== 1) { throw … }`
- **Problem:** No step checks the stderr for the `[seed] Refusing to run …` text. Any crash (missing env, DB down, TS error) also exits 1 and is recorded as "guard verified".
- **Fix:** Assert that stderr contains the exact refusal message for each guard case, and that the DB counts are unchanged afterwards.

### B-12 [minor · confirmed] CI quietly allows a flaky E2E to pass on retry, and E2E runs against the dev server
- **Where:** `playwright.config.ts:32` (`retries: process.env.CI ? 1 : 0`) and `:50` (`command: 'pnpm dev'`).
- **Problem:**
  - Playwright exits 0 when a test fails then passes on retry ("flaky"). Given incident 4 (a retry-until-pass Lighthouse runner), CI should not keep the best run.
  - The E2E suite also exercises `next dev`, not the production build that ships.
- **Fix:**
  - Set `retries: 0`, or keep 1 and fail on flaky through the reporter (`--fail-on-flaky-tests`) or a custom check.
  - Run E2E against `next build && next start` in CI.

### B-13 [minor · suspected] The bundle-sentinel check can silently scan zero frontend chunks
- **Where:** `scripts/check-client-bundle-sentinels.mjs:79-81`, `:131-132` and `:168`.
- **Problem:** If `.next/server/app/(frontend)` exists but has no `build-manifest.json` or `*_client-reference-manifest.js` that the regex can parse, `frontendChunks` is an empty Set. The Payload-runtime marker scan is then skipped for every file, with no message, and the script prints "Verified zero …".
- **Fix:** Fail when `frontendChunks.size === 0` and a `(frontend)` dir exists. Print the number of chunks scanned.
- **Runtime check:** after `pnpm build`, print `resolveFrontendClientChunkFiles('.next/static').size`.

### B-14 [minor · confirmed] First visits are never audited for CLS or console errors; the intro is pre-marked as seen
- **Where:**
  - `p3-t4-evidence.mjs:2006` (CLS + console + CSP runtime audit), `:2580` (fallback-font check) and `:2662` (throttled cold-cache CLS), each with `window.sessionStorage.setItem('aljazira_intro_seen', '1')`;
  - `p3-t13-evidence.mjs`, whose matrix attaches no `console`, `pageerror` or `securitypolicyviolation` listeners at all.
- **Problem:**
  - Every CLS and CSP/console gate runs with the intro skipped. The first-visit path (inline script `active` or `pending` branch, overlay animation, `inert` toggling) is never measured for layout shifts, console errors or CSP violations.
  - The only runs that exercise it, the 54-run matrix, record none of these.
- **Fix:** Add console, CSP and layout-shift collection to the P3-T13 matrix runs. Run one CLS pass per locale with a fresh `sessionStorage`.

### B-15 [minor · confirmed] Evidence and E2E scripts carry fixed admin passwords and self-register an admin on any target URL
- **Where:**
  - `scripts/evidence/p3-t13-evidence.mjs:40-56`, `p3-t4-evidence.mjs:92-105` and `p3-t12-evidence.mjs:18-20`, `:82-95`;
  - `tests/e2e/global-setup.ts:3-13`.
- **Code:**
  - `process.env.EVIDENCE_ADMIN_PASSWORD || 'Pass…'`
  - `fetch(`${baseUrl}/api/users/first-register`, …)`
- **Problem:** `EVIDENCE_BASE_URL` and `SERVER_URL` can point anywhere. On a fresh instance with no users, the scripts create an admin whose password is published in the repo.
- **Note:** These are test values, so this is not a leaked secret. It is a footgun if a script is ever run against staging or production.
- **Fix:**
  - Require the env vars (no fallback).
  - Refuse to run `first-register` unless the host is `localhost` or `127.0.0.1`.

## Report claims checked against code (10+)

| # | Claim (source) | Verdict |
|---|---|---|
| 1 | "All 8 home sections … and `<footer>` render in full underneath `.overlay` at all times, regardless of JavaScript execution or intro state" (`handoff/reports/P3-T4.md:17`) | **Mismatch at `0c4005b`.** True at `62f8f7c`. `IntroSplash.module.css:111-113` (added in `32069ea`) hides `body` while `data-intro='pending'`. See B-03. |
| 2 | "regression assertions … verifying neither stylesheet contains `data-intro='active'`" (`P3-T4.md:18`, citing `p3-t4-home.test.ts:800-801`) | Accurate as written, but the guard is too narrow to protect R-26 (B-03). |
| 3 | `INTRO_HARD_CAP_MS` (`IntroSplash.tsx:13`) = 2400 "matching … ≤ 2.5 s" (`P3-T4.md:28,62`) | Mismatch: the constant existed at `62f8f7c` but nothing enforced it. Already tracked as R-33. The constant is removed at `0c4005b`. |
| 4 | `/en` Lighthouse Performance 85 (`P3-T4.md:208`) | Matches its own log (`docs/reports/evidence/P3-T4/r5/lighthouse-mobile-en.log`). The CTO measured 80/80/79 (tracked as R-35), and the executor's later P3-T13 run shows 78 (B-04). The figure is not corrected in the snapshot. |
| 5 | `isArabicEnabled` (`src/lib/cms/globals.ts:71`) reads through the cached, tagged `getSiteSettings` (`P3-T12.md` §3) | Verified (`globals.ts:62-74`). |
| 6 | `isAuthorizedArabicPreviewRequest` requires an authenticated admin/editor in every preview path (`P3-T12.md` R-6, `client.ts:356`) | Verified (`src/lib/cms/client.ts:343-365` ends in `resolveAuthenticatedStaffUser`). |
| 7 | Home `generateMetadata` returns `{}` for `/ar` before any CMS read when Arabic is off (`page.tsx:280`) | Verified (`src/app/(frontend)/[locale]/page.tsx:280-282`). |
| 8 | `safeRevalidateTag` calls `revalidateTag(tag, { expire: 0 })` (`revalidate.ts:40-42`) | Verified. |
| 9 | Public CSP "never emits `'unsafe-eval'` or `'unsafe-inline'` in any environment" (`P3-T1.md:111,131`) | Verified for the public builder (`src/security/csp.ts:36-62`). `unsafe-*` exists only in the admin CSP (`:83-128`). Corroborated by the 942 dev `eval` violations. |
| 10 | P3-T3 components "verified under strict nonce CSP … `StyleSrcAttrViolations (unfiltered): 0`" (`P3-T3.md:43,128`) | **Misleading.** The "unfiltered" figure is a single-directive subset. The same run logged 1008 CSP violations and 68 console errors, which the report does not mention (B-06). |
| 11 | "On a non-empty database (`existingBrandsCount > 0 \|\| existingMaterialsCount > 0`) without `--reseed`, `pnpm seed` refuses" (`P4-T1.md:29`) | **No longer true at `0c4005b`.** `src/seed/p4-t2.ts:782-791` refuses only if P4-T2 docs exist or brands/materials are half-empty. With the full P4-T1 data it proceeds and adds the P4-T2 content. This is P4-T2 in-progress work, and it must be declared in the P4-T2 report. |

## Checked and clean
- **No user-agent, webdriver, Lighthouse, CI, `VITEST` or connection/device sniffing in `src/`.**
  - The only env branches are legitimate and spec-backed:
    - `shouldAutoRun.ts` (job runner off in tests and builds);
    - `NODE_ENV === 'production'` gates for `/styleguide` and `/_specimen` (`proxy.ts:206-211`, the pages);
    - `http:` links allowed only in dev (`fields/link.ts`);
    - the cookie `secure` flag (`Users.ts:292`);
    - the dev-only styleguide nav fallback (`Navbar.tsx:218`).
  - The only `matchMedia` uses are `prefers-reduced-motion`, which is in the spec.
- **The intro has no viewport, UA, connection or automation branch.** The one skip rule (first frame > 1200 ms) is CTO-approved (P3-T4 Round 3 decision §4). The issues are in how it is measured (B-01, B-05) and in `pending` (B-03).
- **Home and layout:** no `content-visibility`, no `display:none`/`opacity:0` on content keyed to the intro except B-03. Every other `opacity: 0` is a hover or focus state (TeamCard, ProjectCard, ServiceCard, PartnerTile, NavLink, LogoMarquee controls, WhatsApp tooltip). The hero image is `loading="eager"` with `fetchPriority="high"`.
- **No `eslint-disable`, `@ts-ignore` or `@ts-expect-error` in `src/` or `tests/`.**
  - The only `@ts-ignore` is in `scripts/evidence/p3-t3-evidence.mjs:222`, a `.mjs` file that is not type-checked. It has no justification (nit).
  - No `as any` or `: any` outside string fixtures in ESLint-rule tests. ESLint uses `strictTypeChecked` with no rules turned off (`eslint.config.mjs`).
  - `!important` appears only in evidence scripts: a screenshot-only hide of the fixed navbar and FAB for section captures (`p3-t4-evidence.mjs:2225`), and a transition-off in the carousel harness. Neither is in shipped CSS.
- **No `.skip`, `.only`, `.fixme`, `.todo`, `expect(true)` or snapshot-of-self in any test.** The optional-chained `toBe(...)` assertions all fail correctly on `undefined`.
- **`vi.mock` usage is limited to the framework (`next/*`, `server-only`, `payload` auth).**
  - The `isArabicEnabled` stub in `p3-t12-arabic-switch.test.ts:102` is a one-line copy of the real function, which `tests/int/p3-t12.int.test.ts` tests for real.
  - The carousel DOM test transpiles the real `ServicesCarousel.tsx` source. It is fragile, not fake.
- **`run-lighthouse.mjs` is a single attempt with no retry loop.** It stops only its own spawned Chrome PID.
- **`measure-login-timing.mjs`:**
  - 15% threshold, 20 interleaved samples and 3 warm-ups, as in the card;
  - it asserts 401 and identical bodies;
  - it stops only its own PID (`/T /F /PID`).
  - The threshold has never been changed (`git log -p`).
- **No process-killing by name or port anywhere in the repo** (only the PID-scoped `taskkill` in `measure-login-timing.mjs:362`).
- **`check-css-logical-properties.mjs`:** no `logical-ignore` escapes are used in `src/`. The exclusions are the admin components and the generated `tokens.css`.
- **`check-citations.mjs`:** it checks the identifier on the cited line against committed HEAD, plus a `git grep` block. The only escape is fenced code blocks, which is documented.
- **`generate-tokens.mjs`:** the remaining `??` fallbacks (`:384-395`) are dead code, because all keys exist in `design/tokens.json:351-363`. The gutters throw when missing (R-24 fix holds).
- **P2/P3 production-route CSP and console gates** (`p3-t2-evidence.mjs:214-259`, `p3-t4-evidence.mjs:2028-2386`) are strict: any console error, page error, hydration warning or CSP violation fails.

## Refactor themes (max 6)
1. **One evidence harness instead of nine one-off scripts.**
   - Files: `scripts/evidence/*.mjs` (≈9.6k lines with copy-pasted `ensureAdminAuthToken`, `getRepoHeaderBlock`, console/CSP collectors and Lighthouse calls).
   - Benefit: a single `collectRuntime(page)` that keeps every message, one `header()` with dirty-tree info, one `result()` line, and gate constants imported from a single spec file (B-04, B-06, B-08, B-14).
   - Risk: medium. Past evidence becomes harder to reproduce byte-for-byte.
2. **Make gates independent of the code under test.**
   - Files: `p3-t13-evidence.mjs`, `p3-t4-evidence.mjs` (intro matrices).
   - Benefit: classify by trace/FP data, not `window.__aljaziraIntroDecision`, and sample from the first frame. Kills B-01, B-02 and B-05.
   - Risk: low. Needs a CDP trace or screencast.
3. **Intro: render the overlay first in `<body>` and delete `pending`.**
   - Files: `layout.tsx`, `IntroSplash.tsx`/`.module.css`, `page.tsx`.
   - Benefit: no FOUC without hiding content, so R-26 holds structurally. It also removes the `MutationObserver` machinery and makes "single rAF" true by design.
   - Risk: medium. Needs re-verification of inert and focus order.
4. **Mutation-tested gates.**
   - Files: `tests/unit/` (new).
   - Benefit: for every evidence gate, a fixture that must make it fail: a 2-frame delay, a page frame before the overlay, a 400 warm-up, a guard crash. A gate that cannot fail is caught in CI (B-01, B-07, B-11, B-13).
   - Risk: low.
5. **Behavioural tests for the inline script** (an AST ban list plus a VM state machine covering `loading`/`interactive`/`complete`).
   - Files: `src/p3-t4-home.test.ts`.
   - Benefit: replaces string `toContain` checks (B-09).
   - Risk: low.
6. **Test and CI hygiene:**
   - `retries: 0` or fail-on-flaky;
   - E2E on `next start`;
   - checked setup writes;
   - no hard-coded credentials;
   - `first-register` only on localhost.
   - Files: `playwright.config.ts`, `tests/e2e/*`, `scripts/evidence/*`.
   - Benefit: removes vacuous passes (B-10, B-12, B-15).
   - Risk: low.
