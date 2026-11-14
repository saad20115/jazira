# Phase 5 — Quote form → dashboard + email

## Phase 5 — Quote form → dashboard + email

> **Who wrote this and what it is worth.** The owner told the CTO on 2026-11-10 to carry out the
> remaining work itself ("نفذهم انت"). The CTO therefore acted as the executor for P5-T1 and P5-T2
> and wrote this report. Under the evidence-integrity rules in `AGENTS.md`, this is an **executor
> report**. It holds claims, not numbers of record. Every raw file it points to is
> **non-authoritative**. The results of record come only from an independent verifier run on a clean
> clone at the submitted SHA (a separate session or CI). That run has not happened yet.
>
> **Stacking.** `phase-5-quotes` is built on `p3-t10-seo-a11y` at `21a30ac` (P3-T10, `IN_REVIEW`),
> which is built on R-1 (`IN_REVIEW`, recommended for acceptance, waiting for the owner).

- **Branch:** `phase-5-quotes`, worktree `D:\jazira-p5t1`, Docker project `aljazira-p5t1`.
- **Code SHA submitted:** `81c9a46`.
- **P5-T1 commits:** `acfebee` … `4371961`.
- **P5-T2 commits:** `3a8fb61` … `81c9a46`.

### Done

**P5-T1 — quote server handler, anti-abuse, notification template**

- The P3-T9 stub is replaced by a real **server action**:
  - `src/app/(frontend)/[locale]/contact/actions.ts` and `quote-handler.ts`.
  - A server action was chosen because the form is a React form on the same origin. The action
    runs through Next's own origin check, and no public route is added.
- Anti-abuse:
  - the shared zod schema (`src/lib/quote/schema.ts`) strips unknown keys and enforces lengths;
  - the honeypot must be empty, and a filled one looks like success to the bot but saves nothing;
  - a signed start token enforces the minimum fill time;
  - the rate limit per `ipHash` lives in Postgres (`src/collections/QuoteRateLimits.ts`), so it
    survives restarts and multiple instances;
  - consent must be true;
  - the optional Turnstile switch (`turnstile.ts`) is off by default.
- On success:
  - the request is saved through the Local API with `status: new` and `emailStatus: pending`;
  - `serviceTitle` is computed on the server;
  - the phone is stored in E.164;
  - a `notifyQuoteRequest` job is queued.
  - The visitor sees success as soon as the save succeeds. Messages are generic, with no internals.
- A bilingual notification template (`src/email/quoteNotification.ts`) goes to the sales inbox. It
  holds only the needed fields and a link to the request in `/admin`.
- Env (`src/env.ts`): `SALES_INBOX` is required in production; `SMTP_USER`, `SMTP_PASS` and the
  Turnstile switch are added.
- Migration: `20261110_134937_p5_t1_quote_answers_rate_limits`.

**P5-T2 — email job, staff workflow, CSV export, retention**

- **Notification job** (`src/jobs/notifyQuoteRequest.ts`, logic in `quoteNotificationCore.ts`):
  - sends to `SALES_INBOX` only, never to the visitor (Q1);
  - retries with exponential backoff, at most 5 attempts in about an hour
    (`QUOTE_NOTIFICATION_RETRIES`);
  - updates `emailStatus`, `emailAttempts` and `emailLastError`;
  - the error is scrubbed by `src/email/sanitizeEmailError.ts`: one line, at most 500 characters,
    with no credentials, hosts, addresses or IPs (Q2);
  - is idempotent: the e-mail state is read under a row lock (`SELECT … FOR UPDATE`,
    `src/jobs/quoteEmailState.ts`) around the send, so a `sent` request is never sent again, even
    when the job runs twice or concurrently.
  - The SMTP adapter swallows errors by design, so the job sends through a blocking sender
    (`sendEmailAndWait` in `src/security/emailAdapter.ts`) that reports failures. The adapter also
    has connection, greeting and socket timeouts.
- **Resend notification**
  (`POST /api/quote-requests/:id/resend-notification`, `src/collections/quoteRequestEndpoints.ts`):
  - admin only;
  - it moves a `failed` request back to `pending` with a single conditional `UPDATE … WHERE
    email_status = 'failed'`, so a second click gets 409 and queues nothing.
  - The button (`src/components/admin/ResendNotificationButton.tsx`) shows only to an admin and
    only when the request failed.
- **Staff workflow:**
  - `status`, `assignedTo` and `internalNotes` are editable in the edit view; the customer fields
    are read-only (P2-T6).
  - The list filter bar adds a **Mine** quick filter (`aria-pressed`).
  - The bar now changes the list through Payload's own list query (`useListQuery`). Before this
    change, a cleared filter came back into the URL; the e2e found this.
- **CSV export**
  (`GET /api/quote-requests/export-csv`, `src/collections/quoteRequestsCsv.ts`):
  - admin only;
  - it exports the list's current filter and search, read with normal access rules;
  - UTF-8 with BOM, CRLF line ends;
  - the columns are the customer fields, the answers, status, assignee and createdAt, never
    `ipHash`, `userAgent`, `internalNotes` or the e-mail fields;
  - formula-safe (Q3);
  - each export is logged with the user ID, time and row count, no PII.
  - The button on the list view (admin only) carries the current filter.
- **Retention job** (`src/jobs/purgeExpiredQuoteRequests.ts`, D3):
  - runs daily at 03:00 and deletes requests older than 24 months.
  - It is a **dry run that only logs the count** until an admin turns on
    `site-settings.quoteRetentionDeleteEnabled` (admin-only field, default off).
- The task `schedule` adds Payload's `payload-jobs-stats` global. `src/access/jobStatsGlobal.ts`
  denies it to every role, and the Z1 enumeration test checks that.
- **CI** (`.github/workflows/ci.yml`): after the build, grep `.next/static` for the value of
  `SALES_INBOX` and for the names `SMTP_`, `SALES_INBOX`, `PAYLOAD_SECRET` and `IP_HASH_SALT`. The
  step fails on any match.
- Migration: `20261111_065443_p5_t2_jobs_retention`. It covers the retention task enum, the
  `payload_jobs_stats` table, `payload_jobs.meta` and the retention switch. Its `down` removes
  queued retention jobs before narrowing the enum.

### Evidence

All of it is executor-side and **non-authoritative**. The verifier regenerates it.

- Executor run on a fresh worktree of `81c9a46`, with new empty databases, outside the repository:
  `D:\jazira-cto-logs\p5-dod\`. It holds `commit.log`, install, lint, typecheck, format-check,
  test (verbose), migrate up/down/up from empty, migrate:create no-op, build, bundle grep, audit and
  e2e.
- Screenshots in `docs/reports/phase-5/P5-T2/`. Each one proves one thing:
  - `mailpit-en.png`: the notification for a request sent from `/en/contact` reached only the
    sales inbox.
  - `mailpit-ar.png`: the same for a request sent from `/ar/contact`; the Arabic block renders
    right to left.
  - `admin-list-en.png` and `admin-list-ar.png`: the list with status and e-mail pills, the filter
    bar with "Mine" and the CSV export button.
  - `admin-edit-en.png` and `admin-edit-ar.png`: the edit view with the workflow fields in the
    sidebar and the customer fields read-only.
  - `quote-requests-ar.csv` and `quote-requests-en.csv`: the files the export button downloads.
- Claims from those runs:
  - The DoD steps passed: install with the frozen lockfile, format check, lint, typecheck, the
    whole vitest suite with the Postgres integration suites, migrate up/down/up from an empty
    database, migrate:create (no schema changes), build, the bundle grep, and the P5-T1, P5-T2,
    P3-T9 and admin smoke e2e specs on the production build.
  - `pnpm audit --prod` shows no high or critical advisory. The one low advisory (`deepmerge` via
    `payload`) is the one accepted earlier (AR-1).
  - An earlier run at `92b5e18` failed the format check: the generated migration snapshot was not
    formatted. `81c9a46` formats it, with no other change. Logs of both runs are kept
    (`p5-dod-92b5e18\` and `p5-dod\`).

### Acceptance criteria (`docs/04-phases.md`, Phase 5)

- [x] **Tests: email sent once; SMTP down → retries then `failed`, request kept; resend does not
  duplicate; no email ever goes to the visitor's address.**
  - Unit: `src/jobs/quoteNotificationCore.test.ts`.
  - Postgres: `tests/int/p5-t2.int.test.ts`, which covers exactly once to SALES_INBOX only, the
    job twice, SMTP down to failed with the request kept, and resend 403/202/409 with one send.
- [x] **Rate limit + honeypot + min-time verified by tests.**
  - `quote-handler.test.ts` and `tests/int/p5-t1.int.test.ts`;
  - in the browser: `tests/e2e/p5-t1-quote.e2e.spec.ts`.
- [x] **Staff can move a request through the workflow; CSV export is formula-safe (test).**
  - `tests/e2e/p5-t2-staff.e2e.spec.ts`: an admin moves a request from new to contacted with a note
    in the edit view; uses "Mine"; downloads the CSV by clicking the button.
  - Formula safety: `src/collections/quoteRequestsCsv.test.ts` and the CSV integration test.
- [x] **No SMTP credential or secret reachable from client bundles.**
  - The CI step above and the existing `check-client-bundle-sentinels` step.
  - The executor run's `bundle-grep.log` found no match.
- [ ] **"Staff can work a request end to end in Arabic without technical help" (P5-T2 card).**
  - Shown in Arabic in the screenshots. It is not yet tried by a real staff member, which is for
    the owner.

### Dependencies added/changed

- None.

### Security notes

- **Q1:** the recipient is `SALES_INBOX` only; the job never reads the visitor's address as a
  recipient (test).
- **Q2:** `emailLastError` is scrubbed and capped; the scrubber has its own tests.
- **Q3:** the CSV is formula-safe.
- **Q4:** `internalNotes` never leaves the dashboard (not in the CSV, not public).
- **D2:** no PII in logs. The export log has only the user ID, time and row count.
- **D3:** retention, off until an admin enables deletion.
- **S1, S4:** secrets are server-only. A client-bundle grep runs in CI.
- **Z1:** `payload-jobs-stats` is denied to every role.
- **Cookie-authenticated API calls need a same-origin request** (the existing project rule). The
  export button is a same-origin link, so it works; a cross-site page cannot trigger an export.

### Deviations from spec

- **Task slug.** The card names the job `notifySalesOfQuote`. The slug stays `notifyQuoteRequest`,
  the name P5-T1 already queued and migrated into the job enum. Renaming it would only add a
  migration. *Needs CTO acceptance.*
- **Excel screenshot.** Not produced. Excel automation on this machine fails to load its type
  library (`TYPE_E_CANTLOADLIBRARY`), in both 32-bit and 64-bit PowerShell. Repairing Office is a
  system change, so it was not done.
  - The CSV files are committed instead. They start with the UTF-8 BOM, which is what makes Excel
    read Arabic.
  - The owner or verifier can open `quote-requests-ar.csv` in Excel to confirm.
- **One evidence run for the phase.** P5-T1 has no separate run at `4371961`. The run at `81c9a46`
  includes all P5-T1 code and tests.

### Protected paths touched

- `.github/workflows/ci.yml` (`56c77dc`): the client-bundle grep step and a placeholder
  `SALES_INBOX` for CI. For line-by-line review.
- No other protected path.

### Known gaps

- No independent verifier run yet.
- The Excel screenshot (above).
- `pnpm test` empties the shared `_test` database. Run a fresh migrate before an e2e run on it.
- In the CSV, phone numbers start with `'` (for example `'+966…`). Q3 requires this for any cell
  that starts with `+`, so Excel shows the apostrophe in the phone column.

### Questions for CTO

- Accept the slug `notifyQuoteRequest` instead of `notifySalesOfQuote`?
- Is a CSV opened by the owner in Excel enough for the "Excel showing correct Arabic" evidence?
