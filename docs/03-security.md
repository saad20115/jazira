# 03 — Security baseline

Every item has an ID. Phase reports reference the IDs they implemented or touched, and the
CTO review checks them one by one. "N/A" must be justified.

## 1. Secrets & configuration
- **S1** All secrets via environment variables, validated at boot with zod (`src/env.ts`); the app
  refuses to start if any is missing or weak. Required: `DATABASE_URL`, `PAYLOAD_SECRET`,
  `SERVER_URL`, `IP_HASH_SALT`; Phase 5: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY`, `ODOO_LOGIN`, SMTP vars.
- **S2** `PAYLOAD_SECRET` and `IP_HASH_SALT`: ≥ 48 random bytes (`openssl rand -base64 48`),
  different per environment. Never reused, never logged.
- **S3** `.env*` git-ignored (except `.env.example` with placeholders). CI runs **gitleaks** on
  every push. A leaked secret is rotated, not just removed from history.
- **S4** Modules that read secrets start with `import 'server-only'`. Build fails if imported
  client-side.

## 2. Authentication (Payload `users`)
- **A1** `auth.maxLoginAttempts: 5`, `auth.lockTime: 15 min`.
- **A2** `auth.tokenExpiration: 2h`; keep Payload server-side sessions enabled so logout and
  admin-forced logout actually revoke access (verify behaviour in 3.91 and document it).
- **A3** Cookies: `secure: true` in production, `sameSite: 'Strict'`, `httpOnly` (default).
  `auth.useAPIKey: false` (no API keys for users).
- **A4** Password policy: min 12 characters, enforced server-side in a hook, with a test. Reject the
  top common passwords list (small bundled list, no network call).
- **A5** Forgot-password flow works via SMTP; reset token expiry ≤ 1 h; response is identical
  whether the email exists or not (no user enumeration).
- **A6** No public self-registration. Only admins create users.
- **A7** 2FA: Payload has no built-in 2FA. Compensating control (decided in Phase 6): `/admin` and
  `/api/users/*` restricted at Nginx to an IP allowlist **or** protected by Cloudflare Access.
  Document whichever is chosen.

## 3. Authorization
- **Z1** Every collection and global has explicit `access` for read/create/update/delete.
- **Z2** Public reads of publishable content return **published** docs only; drafts require login.
- **Z3** `users.role` updatable by admin only (field-level), editors cannot escalate.
- **Z4** `quote-requests` not creatable through REST (`create: () => false`); only the server
  handler writes it via Local API after validation.
- **Z5** Integration tests prove Z1–Z4 with anonymous, editor and admin sessions against the REST
  API (e.g., anonymous `GET /api/quote-requests` → 403; anonymous `GET /api/projects?draft=true`
  → no drafts; editor `PATCH /api/users/:id {role:'admin'}` → role unchanged/forbidden).
- **Z6** Local API calls in frontend code that run on behalf of the public use
  `overrideAccess: false` (default true is dangerous) unless the reason is commented.

## 4. Input, output & content
- **I1** All external input (forms, route params, search params, webhook bodies) parsed with zod;
  unknown keys stripped; length limits on every string.
- **I2** Rich text rendered with the official Lexical → JSX converter. **No
  `dangerouslySetInnerHTML`** anywhere except the JSON-LD `<script type="application/ld+json">`
  built from a serializer that escapes `<`.
- **I3** Links from CMS: allow `http(s):`, `mailto:`, `tel:` only; external links get
  `rel="noopener noreferrer"`.
- **I4** `videoUrl` restricted to `youtube.com`, `youtu.be`, `vimeo.com`; embeds use
  `youtube-nocookie.com`; iframe `sandbox` + `allow` list minimal.
- **I5** Uploads: MIME allowlists per `docs/02-content-model.md`, **no SVG/HTML**, size limits,
  file type verified from content (magic bytes), not extension. Test: an HTML file renamed `.jpg`
  is rejected. Filenames sanitized.
- **I6** Quote form anti-abuse: honeypot field, minimum fill time (≥ 3 s), server-side
  rate limit per IP hash, optional Cloudflare Turnstile (enable if client approves). Generic
  success/error messages; no internal details leaked.

## 5. HTTP & transport
- **H1** Payload config: `serverURL` = `SERVER_URL`, `cors: [SERVER_URL]`, `csrf: [SERVER_URL]`.
- **H2** Security headers (Next `headers()` and duplicated at Nginx):
  `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (Nginx only),
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Frame-Options: SAMEORIGIN` (+ CSP `frame-ancestors 'self'`),
  `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`,
  `Cross-Origin-Opener-Policy: same-origin`.
- **H3** CSP for the public site with per-request nonce (via `proxy.ts`): `default-src 'self'`;
  scripts `'self' 'nonce-…' 'strict-dynamic'`; images `'self' data: blob:`; frames only the video
  hosts in I4; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`. Admin routes may need a
  relaxed policy — scope it to `/admin` only and document every relaxation.
  - **H3a (CTO decision 2026-10-22, 3D viewer)** The live 3D tower (P3-T5) decodes KTX2 textures and
    meshopt geometry with WebAssembly in blob-URL workers. Only on the pages that render that section
    (`/ar`, `/en` home), the policy adds `'wasm-unsafe-eval'` to `script-src` and `worker-src 'self' blob:`
    — nothing else (never `'unsafe-eval'`, never `'unsafe-inline'`). The transcoder (`basis_transcoder.js`
    / `.wasm`) and decoders are self-hosted under `public/`, same version as `three`; no CDN.
- **H4** `poweredByHeader: false`; production error pages show no stack traces or versions.
- **H5** HTTPS only (HTTP → 301), TLS 1.2+ (prefer 1.3), Let's Encrypt auto-renew tested.
- **H6** Nginx rate limits: `/api/users/login`, `/api/users/forgot-password` 5 req/min/IP;
  quote endpoint 3 req/min/IP; `/api/*` 30 req/s burst 60. `client_max_body_size` 10m globally,
  100m only on the videos upload route.
- **H7** `GraphQL` disabled. `robots.txt` disallows `/admin` and `/api`; `/admin` sends
  `X-Robots-Tag: noindex`.

## 6. Data & privacy
- **D1** Website DB user owns only the website DB; app connects as that user (not `postgres`).
- **D2** No raw IPs stored (hash with salt). No PII in logs (log IDs, not emails/phones).
- **D3** Quote-request retention 24 months (job), backups encrypted at rest when copied off-server.
- **D4** Privacy notice page + consent checkbox on the form (KSA PDPL alignment — content from client).

## 7. Supply chain & build
- **B1** Exact versions, committed `pnpm-lock.yaml`, `--frozen-lockfile` everywhere.
- **B2** pnpm `onlyBuiltDependencies` allowlist (sharp, esbuild, …listed and justified).
- **B3** `pnpm audit --prod` in CI: fail on high/critical. Dependabot/Renovate weekly, grouped
  `@payloadcms/*` updates (always moved together).
- **B4** CI (GitHub Actions): lint, typecheck, tests, build, audit, gitleaks; actions pinned by SHA.

## 8. Runtime & server (Phase 6)
- **R1** Docker: multi-stage build, Next `standalone` output, final image `node:24-*-slim` pinned by
  digest, runs as non-root UID, `read_only: true` root FS with writable `/tmp` + media volume,
  `no-new-privileges`, `cap_drop: [ALL]`, memory/CPU limits, healthcheck.
- **R2** Postgres container: not published to host, strong password, `scram-sha-256`, data volume,
  memory limit sized so Odoo is never starved.
- **R3** App listens on `127.0.0.1:3000` only; Nginx is the only public entry.
- **R4** Host: SSH keys only, root login disabled, UFW (22/80/443 + whatever Odoo already needs —
  verify before enabling), fail2ban on SSH and Nginx auth/login 4xx, unattended security updates.
  **Any host change is agreed with the client first and done after a full backup.**
- **R5** Backups (website DB + media) nightly, off-server copy, **restore tested** and documented.
- **R6** Uptime/health monitoring and log rotation.

## 9. Odoo integration (Phase 5)
- **O1** Dedicated Odoo integration user, least privilege (create `crm.lead` only), API key, never
  an admin account; key rotatable without code change.
- **O2** Calls server-side only, HTTPS, timeout 10 s, retries with backoff in a Jobs queue task,
  idempotency (store `odooLeadId`; never create a duplicate lead on retry).
- **O3** Odoo error bodies are sanitized before storing in `odooLastError` (no credentials, max 500 chars).
- **O4** Field mapping documented and tested against a mock Odoo server; no customer-entered
  string is ever used to build a domain/filter expression.
