# Dependency Overrides (`package.json` → `pnpm.overrides`)

This document records every transitive dependency override configured under `pnpm.overrides` in [`package.json`](../package.json), the security advisory (`GHSA`) it remediates, the parent package that pulls the vulnerable range, why the override is runtime-safe, and the exact condition under which the override should be removed.

## Active overrides

| Override key | Pinned version | Advisory & Severity | Parent dependency chain | Why it is safe | Removal condition |
|---|---|---|---|---|---|
| `chokidar@^3.0.0` | `4.0.3` | `GHSA-vfj7-8cjw-p6xm` (Moderate — ReDoS in `braces@3.0.3`, pulled only by `chokidar@3.6.0`) | `@payloadcms/next@3.91.0 > sass > chokidar@3.6.0 > readdirp > picomatch / braces@3.0.3` | Used only by `sass` file-watching; `chokidar@4.0.3` removes the legacy `braces`/`glob-parent` chain while preserving the `watch` API used by `sass`. Verified via `pnpm build` (compiling `custom.scss`) and `pnpm test:e2e`. | Drop when `sass` (via `@payloadcms/next`) upgrades its `chokidar` dependency to `>= 4.0.0`. |
| `dompurify` | `3.4.16` | `GHSA-p98j-92pf-mc4p`, `GHSA-6688-9rhm-gjv2` (High / Moderate — mXSS bypass in `dompurify <= 3.4.15`) | `@payloadcms/ui@3.91.0 > @monaco-editor/react > monaco-editor > dompurify@3.4.15` | Same `3.4.x` line (`3.4.15` → `3.4.16`), patch security release with identical API surface. | Drop when `monaco-editor` (via `@payloadcms/ui`) ships with `dompurify >= 3.4.16`. |
| `esbuild@<=0.24.2` | `0.28.2` | `GHSA-67mh-4wv8-2f99` (Moderate — dev server CORS) | `@payloadcms/drizzle@3.91.0 > drizzle-kit@0.30.4 > @esbuild-kit/cjs-loader > @esbuild-kit/core-utils > esbuild@0.18.20` | Used only by `drizzle-kit` schema/migration loader. Verified compatible with `pnpm payload migrate:create`, `migrate`, `migrate:status`, and `migrate:down`. | Drop when `drizzle-kit` (via `@payloadcms/drizzle`) ships `esbuild >= 0.25.0` and drops `@esbuild-kit/*`. |

## Known dev-only advisories (not present in `pnpm audit --prod`)

| Package | Advisory & Severity | Dev dependency chain | Status & Mitigation |
|---|---|---|---|
| `braces@<=3.0.3` | `GHSA-vfj7-8cjw-p6xm` (High — stack-exhaustion DoS through deeply nested brace patterns; patched version `<0.0.0` / none upstream) | `eslint-config-next@15.5.15 > @next/eslint-plugin-next > fast-glob > micromatch > braces@3.0.3` | **Dev-only (`devDependencies`)** — excluded from the production runtime bundle and `pnpm audit --prod` (`No known vulnerabilities found`). Used only during local/CI `pnpm lint` against trusted repository glob patterns. Monitor upstream `micromatch`/`fast-glob`/`eslint-config-next` for a patched release. |

## Verification protocol
Whenever `pnpm.overrides` or `payload` versions are modified:
1. Run `pnpm install --frozen-lockfile`.
2. Run `pnpm audit --prod` (must report `No known vulnerabilities found`).
3. Verify schema migration generation and execution (`pnpm payload migrate:status` and `pnpm payload migrate:create`).
4. Run `pnpm test` and `pnpm test:e2e`.
