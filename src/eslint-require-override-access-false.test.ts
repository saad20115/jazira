import fs from 'node:fs'
import path from 'node:path'

import { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  EXPLICIT_RUNTIME_PAYLOAD_FIELD_AND_SECURITY_FILES,
  requireOverrideAccessFalseRule,
} from '../eslint-rules/require-override-access-false.mjs'
import { RESTRICTED_PAYLOAD_IMPORTS_CONFIG } from '../eslint.config.mjs'
import { FORBIDDEN_CLIENT_BUNDLE_SENTINELS } from '../scripts/check-client-bundle-sentinels.mjs'
import {
  buildSafeCmsCountArgs,
  buildSafeCmsQueryArgs,
  buildSafeCmsSmallCollectionArgs,
  clampCmsQueryLimit,
  CMS_CLIENT_SERVER_ONLY_SENTINEL,
  DEFAULT_CMS_QUERY_LIMIT,
  MAX_CMS_QUERY_LIMIT,
  SMALL_UNPAGINATED_COLLECTION_SLUGS,
} from './lib/cms/client'

function lintSnippet(code: string, filename: string): Linter.LintMessage[] {
  const linter = new Linter({ configType: 'flat' })
  return linter.verify(
    code,
    [
      {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs'],
        languageOptions: {
          parser: tseslint.parser,
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
        plugins: {
          local: {
            rules: {
              'require-override-access-false': requireOverrideAccessFalseRule,
            },
          },
        },
        rules: {
          'local/require-override-access-false': 'error',
        },
      },
    ],
    { filename },
  )
}

function collectSourceFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return []
  }
  const results: string[] = []
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(fullPath))
    } else if (entry.isFile() && /\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      results.push(fullPath)
    }
  }
  return results
}

describe('local/require-override-access-false ESLint rule & Z6 typed wrapper (P2-T8 & P3-T1 §0, R-6, R-11, R-12, R-21..R-23)', () => {
  it('flags payload.find, payload.findByID, and payload.findGlobal calls in src/app/(frontend) and src/lib/cms when overrideAccess: false is missing or true', () => {
    const badFrontendCode = [
      'export async function loadHome(payload: any) {',
      "  const a = await payload.find({ collection: 'projects' })",
      "  const b = await payload.findByID({ collection: 'projects', id: 1, overrideAccess: true })",
      "  const c = await payload.findGlobal({ slug: 'home-page' })",
      '  return [a, b, c]',
      '}',
    ].join('\n')

    const frontendMsgs = lintSnippet(badFrontendCode, 'src/app/(frontend)/ar/page.tsx')
    expect(frontendMsgs).toHaveLength(3)
    expect(frontendMsgs.every((m) => m.ruleId === 'local/require-override-access-false')).toBe(true)
    expect(frontendMsgs.map((m) => m.message)).toEqual([
      'Payload Local API call "find()" in frontend/CMS code must pass an un-overridden "{ overrideAccess: false }" (or include a "// z6-allow-override-access: <reason>" comment) (Z6).',
      'Payload Local API call "findByID()" in frontend/CMS code must pass an un-overridden "{ overrideAccess: false }" (or include a "// z6-allow-override-access: <reason>" comment) (Z6).',
      'Payload Local API call "findGlobal()" in frontend/CMS code must pass an un-overridden "{ overrideAccess: false }" (or include a "// z6-allow-override-access: <reason>" comment) (Z6).',
    ])

    const cmsMsgs = lintSnippet(badFrontendCode, 'src/lib/cms/queries.ts')
    expect(cmsMsgs).toHaveLength(3)
  })

  it('passes when overrideAccess: false is explicitly provided or when the single documented z6-allow-override-access justification comment is present, and rejects the undocumented second comment form (R-6)', () => {
    const goodCode = [
      'export async function loadData(payload: any) {',
      "  const a = await payload.find({ collection: 'projects', overrideAccess: false })",
      "  const b = await payload.findByID({ collection: 'services', id: 2, overrideAccess: false })",
      "  const c = await payload.findGlobal({ slug: 'site-settings', overrideAccess: false })",
      '  // z6-allow-override-access: server-only quote submission writes via Local API after validation (Z4)',
      "  const d = await payload.create({ collection: 'quote-requests', data: {}, overrideAccess: true })",
      '  return [a, b, c, d]',
      '}',
    ].join('\n')

    expect(lintSnippet(goodCode, 'src/app/(frontend)/ar/page.tsx')).toEqual([])
    expect(lintSnippet(goodCode, 'src/lib/cms/queries.ts')).toEqual([])

    const undocumentedCommentCode = [
      'export async function badComment(payload: any) {',
      '  // overrideAccess: true — undocumented comment form must not bypass Z6',
      "  return payload.find({ collection: 'projects', overrideAccess: true })",
      '}',
    ].join('\n')
    expect(lintSnippet(undocumentedCommentCode, 'src/lib/cms/client.ts')).toHaveLength(1)
  })

  it('bans importing AND re-exporting payload, @payload-config, or getPayload repo-wide outside the explicit server allow-list, including in .js/.mjs files (R-6, R-12)', () => {
    const importPayloadCode = [
      "import { getPayload } from 'payload'",
      "import config from '@payload-config'",
      'export const x = [getPayload, config]',
    ].join('\n')

    const reexportPayloadCode = [
      "export { getPayload } from 'payload'",
      "export { default as config } from '@payload-config'",
      "export * from 'payload'",
      "export { getPayload as aliasGetPayload } from './anything'",
    ].join('\n')

    for (const forbiddenFile of [
      'src/app/(frontend)/ar/page.tsx',
      'src/components/ProjectCard.tsx',
      'src/lib/cms/reexport.ts',
      'src/lib/cms/reexport.js',
      'src/lib/cms/reexport.mjs',
      'src/lib/barrel.ts',
    ]) {
      const importMsgs = lintSnippet(importPayloadCode, forbiddenFile)
      expect(importMsgs, `Expected import error in ${forbiddenFile}`).toHaveLength(2)
      expect(importMsgs.every((m) => m.message.includes('is forbidden'))).toBe(true)

      const reexportMsgs = lintSnippet(reexportPayloadCode, forbiddenFile)
      expect(reexportMsgs, `Expected re-export error in ${forbiddenFile}`).toHaveLength(4)
      expect(reexportMsgs.every((m) => m.message.includes('is forbidden'))).toBe(true)
    }

    // Allowed inside the explicit server entry allow-list (`src/lib/cms/client.ts`, `src/payload.config.ts`)
    expect(lintSnippet(importPayloadCode, 'src/lib/cms/client.ts')).toEqual([])
    expect(lintSnippet(importPayloadCode, 'src/payload.config.ts')).toEqual([])
  })

  it('enforces R-21: bans barrel re-exports in src/security/** and src/collections/**, restricts src/fields/** and src/security/** to the 8 explicit runtime files, and does NOT exempt *.test.* inside src/app/** or src/components/**', () => {
    // 1. Barrel bypass inside src/security/ or even inside an allowlisted file (src/security/apiError.ts, src/collections/Users.ts)
    const barrelDirectReExport = [
      "export { getPayload } from 'payload'",
      "export { default as config } from '@payload-config'",
    ].join('\n')

    const barrelImportThenExport = [
      "import { APIError } from 'payload'",
      'export { APIError }',
      'export const ReExportedError = APIError',
    ].join('\n')

    for (const file of [
      'src/security/barrel.ts',
      'src/security/apiError.ts',
      'src/fields/link.ts',
      'src/collections/Projects.ts',
      'tests/int/barrel.ts',
    ]) {
      const directMsgs = lintSnippet(barrelDirectReExport, file)
      expect(directMsgs.length, `Expected direct re-export failure in ${file}`).toBeGreaterThanOrEqual(2)
      expect(directMsgs.every((m) => m.message.includes('Re-exporting'))).toBe(true)

      const indirectMsgs = lintSnippet(barrelImportThenExport, file)
      expect(
        indirectMsgs.length,
        `Expected local-binding re-export failure in ${file}`,
      ).toBeGreaterThanOrEqual(2)
    }

    // Only src/payload.config.ts and src/lib/cms/client.ts may re-export
    expect(lintSnippet("export { getPayload } from 'payload'", 'src/lib/cms/client.ts')).toEqual([])
    expect(lintSnippet("export { getPayload } from 'payload'", 'src/payload.config.ts')).toEqual([])

    // 2. Non-listed files in src/fields/** and src/security/** cannot import runtime `payload`
    expect(EXPLICIT_RUNTIME_PAYLOAD_FIELD_AND_SECURITY_FILES).toEqual([
      'src/fields/link.ts',
      'src/fields/richText.ts',
      'src/fields/seo.ts',
      'src/fields/slug.ts',
      'src/security/apiError.ts',
      'src/security/loginEnumeration.ts',
      'src/security/passwordPolicy.ts',
      'src/security/uploadValidation.ts',
    ])

    const runtimeValidationImport =
      "import { ValidationError } from 'payload'\nexport function throwErr() { throw new ValidationError({ errors: [] }) }"
    for (const allowedFile of EXPLICIT_RUNTIME_PAYLOAD_FIELD_AND_SECURITY_FILES) {
      expect(lintSnippet(runtimeValidationImport, allowedFile)).toEqual([])
    }
    for (const nonListedFile of [
      'src/fields/order.ts',
      'src/fields/videoUrl.ts',
      'src/fields/groups/button.ts',
      'src/security/csp.ts',
      'src/security/emailAdapter.ts',
      'src/security/barrel.ts',
    ]) {
      const msgs = lintSnippet(runtimeValidationImport, nonListedFile)
      expect(msgs, `Expected runtime payload import error in ${nonListedFile}`).toHaveLength(1)
    }

    // Even the 8 explicit files cannot import `getPayload` or `@payload-config`
    for (const allowedFile of [
      ...EXPLICIT_RUNTIME_PAYLOAD_FIELD_AND_SECURITY_FILES,
      'src/collections/Projects.ts',
      'src/globals/HomePage.ts',
    ]) {
      expect(
        lintSnippet("import { getPayload } from 'payload'\nexport function f() { return getPayload }", allowedFile),
      ).toHaveLength(1)
      expect(
        lintSnippet("import cfg from '@payload-config'\nexport function f() { return cfg }", allowedFile),
      ).toHaveLength(1)
    }

    // 3. `*.test.*` inside `src/app/**` or `src/components/**` is NOT exempt from the Payload runtime import ban
    expect(lintSnippet(runtimeValidationImport, 'src/app/(frontend)/page.test.tsx')).toHaveLength(1)
    expect(lintSnippet(runtimeValidationImport, 'src/components/ProjectCard.test.tsx')).toHaveLength(1)
    // Outside `src/app/**` and `src/components/**`, `*.test.*` remains exempt for unit testing field validators/errors
    expect(lintSnippet(runtimeValidationImport, 'src/fields/link.test.ts')).toEqual([])
  })

  it('enforces R-22: allows `import type` from payload in frontend/CMS code, and bans non-literal dynamic `import()` in src/app/** and src/components/**', () => {
    expect(RESTRICTED_PAYLOAD_IMPORTS_CONFIG.paths[0]).toMatchObject({
      name: 'payload',
      allowTypeImports: true,
    })

    const typeOnlyImports = [
      "import type { Where, CollectionSlug } from 'payload'",
      "import { type Field, type GroupField } from 'payload'",
      'export type MyWhere = Where',
    ].join('\n')

    for (const file of [
      'src/app/(frontend)/[locale]/page.tsx',
      'src/components/CmsLink.tsx',
      'src/lib/cms/collections.ts',
      'src/fields/order.ts',
      'src/security/emailAdapter.ts',
    ]) {
      expect(lintSnippet(typeOnlyImports, file), `Type-only import should pass in ${file}`).toEqual([])
    }

    // Mixed value + type import from 'payload' must still fail in forbidden files
    const mixedImport = "import { type Where, getPayload } from 'payload'\nexport const g = getPayload"
    expect(lintSnippet(mixedImport, 'src/app/(frontend)/[locale]/page.tsx').length).toBeGreaterThanOrEqual(1)

    // Non-literal dynamic import() in src/app/** and src/components/** must fail
    const nonLiteralDynamicImports = [
      'export async function badDynamic(modName: string) {',
      '  const a = await import(`payload`)',
      '  const b = await import(modName)',
      "  const c = await import('pay' + 'load')",
      '  return [a, b, c]',
      '}',
    ].join('\n')

    for (const appOrCompFile of [
      'src/app/(frontend)/[locale]/page.tsx',
      'src/app/api/preview/route.ts',
      'src/components/ProjectCard.tsx',
    ]) {
      const msgs = lintSnippet(nonLiteralDynamicImports, appOrCompFile)
      expect(msgs, `Expected 3 non-literal import() errors in ${appOrCompFile}`).toHaveLength(3)
      expect(msgs.every((m) => m.message.includes('Non-literal dynamic `import()` is forbidden'))).toBe(
        true,
      )
    }

    // Static literal import of a safe frontend module is allowed
    const staticLiteralDynamicImport =
      "export async function loadThree() { return import('./lazyViewer') }"
    expect(lintSnippet(staticLiteralDynamicImport, 'src/components/Viewer.tsx')).toEqual([])
  })

  it('catches all R-6 evasion vectors: aliased/client receivers, destructured find, computed access, .call/.apply/.bind, trailing spread override, and findVersionByID/countVersions', () => {
    const evasionCode = [
      'export async function testEvasions(payload: any, extra: any) {',
      '  const p = payload',
      "  await p.find({ collection: 'projects' })",
      '  const client = payload',
      "  await client.find({ collection: 'projects' })",
      '  const { find, findByID: fById } = payload',
      "  await find({ collection: 'projects' })",
      "  await fById({ collection: 'projects', id: 1 })",
      "  await payload['find']({ collection: 'projects' })",
      "  await payload.find.call(payload, { collection: 'projects' })",
      "  await payload['find'].apply(payload, [{ collection: 'projects' }])",
      "  await payload.find.bind(payload, { collection: 'projects' })",
      "  await payload.find({ collection: 'projects', overrideAccess: false, ...{ overrideAccess: true } })",
      "  await payload.find({ collection: 'projects', overrideAccess: false, ...extra })",
      "  await payload.findVersionByID({ collection: 'projects', id: 'v1' })",
      "  await payload.countVersions({ collection: 'projects' })",
      '}',
    ].join('\n')

    const msgs = lintSnippet(evasionCode, 'src/lib/cms/client.ts')
    expect(msgs).toHaveLength(12)
  })

  it('constructs Payload args strictly from the explicit property whitelist in buildSafeCmsQueryArgs, caps limit <= 100, strips pagination, and allows pagination: false only via buildSafeCmsSmallCollectionArgs for small collections (R-6, R-11, R-23)', () => {
    const smuggledInput: Record<string, unknown> = {
      collection: 'users',
      locale: 'ar',
      fallbackLocale: 'ar',
      where: { role: { equals: 'admin' } },
      limit: 5000,
      page: 1,
      sort: '-createdAt',
      depth: 1,
      pagination: false,
      select: { name: true },
      user: { id: 1, role: 'admin', email: 'admin@aljazira.co' },
      req: { user: { id: 1, role: 'admin' } },
      showHiddenFields: true,
      overrideAccess: true,
      draft: true,
    }

    const safePublished = buildSafeCmsQueryArgs(smuggledInput, false)
    expect(safePublished).toEqual({
      collection: 'users',
      locale: 'ar',
      fallbackLocale: 'ar',
      where: { role: { equals: 'admin' } },
      limit: MAX_CMS_QUERY_LIMIT,
      page: 1,
      sort: '-createdAt',
      depth: 1,
      select: { name: true },
      draft: false,
      overrideAccess: false,
    })
    expect(safePublished.limit).toBe(100)
    expect('pagination' in safePublished).toBe(false)
    expect('user' in safePublished).toBe(false)
    expect('req' in safePublished).toBe(false)
    expect('showHiddenFields' in safePublished).toBe(false)

    // Limit clamping edge cases (R-23)
    expect(clampCmsQueryLimit(undefined)).toBe(DEFAULT_CMS_QUERY_LIMIT)
    expect(clampCmsQueryLimit(0)).toBe(1)
    expect(clampCmsQueryLimit(-25)).toBe(1)
    expect(clampCmsQueryLimit(50)).toBe(50)
    expect(clampCmsQueryLimit(100)).toBe(100)
    expect(clampCmsQueryLimit(101)).toBe(100)
    expect(clampCmsQueryLimit(999999)).toBe(100)
    expect(clampCmsQueryLimit(Number.POSITIVE_INFINITY)).toBe(DEFAULT_CMS_QUERY_LIMIT)
    expect(clampCmsQueryLimit(Number.NaN)).toBe(DEFAULT_CMS_QUERY_LIMIT)

    // Omitted limit on collection find defaults to DEFAULT_CMS_QUERY_LIMIT (10)
    const defaultLimitFind = buildSafeCmsQueryArgs({ collection: 'projects', locale: 'ar' }, false)
    expect(defaultLimitFind.limit).toBe(DEFAULT_CMS_QUERY_LIMIT)

    // Small unpaginated collection helper (R-23): allowed for brands, stats, materials, services, team
    for (const smallSlug of SMALL_UNPAGINATED_COLLECTION_SLUGS) {
      const smallArgs = buildSafeCmsSmallCollectionArgs(
        {
          collection: smallSlug,
          locale: 'ar',
          sort: 'order',
          limit: 9999,
          user: { id: 1, role: 'admin' },
          overrideAccess: true,
        },
        false,
      )
      expect(smallArgs).toEqual({
        collection: smallSlug,
        locale: 'ar',
        sort: 'order',
        limit: MAX_CMS_QUERY_LIMIT,
        pagination: false,
        draft: false,
        overrideAccess: false,
      })
      expect('user' in smallArgs).toBe(false)
    }

    // Rejects non-small collections (projects, media, videos, users, quote-requests)
    for (const forbiddenUnpaginatedSlug of [
      'projects',
      'media',
      'videos',
      'users',
      'quote-requests',
    ]) {
      expect(() =>
        buildSafeCmsSmallCollectionArgs({ collection: forbiddenUnpaginatedSlug }, false),
      ).toThrow(/not an allowed small unpaginated collection/)
    }

    const safeDraft = buildSafeCmsQueryArgs(
      {
        slug: 'home-page',
        locale: 'en',
        user: { id: 1, role: 'admin' },
        req: { user: { id: 1, role: 'admin' } },
        showHiddenFields: true,
        overrideAccess: true,
        draft: false,
      },
      true,
    )
    expect(safeDraft).toEqual({
      slug: 'home-page',
      locale: 'en',
      draft: true,
      overrideAccess: false,
    })

    const safeCount = buildSafeCmsCountArgs(smuggledInput)
    expect(safeCount).toEqual({
      collection: 'users',
      locale: 'ar',
      where: { role: { equals: 'admin' } },
      overrideAccess: false,
    })
    expect('user' in safeCount).toBe(false)
    expect('req' in safeCount).toBe(false)
    expect('showHiddenFields' in safeCount).toBe(false)
    expect('draft' in safeCount).toBe(false)

    expect(FORBIDDEN_CLIENT_BUNDLE_SENTINELS).toContain(CMS_CLIENT_SERVER_ONLY_SENTINEL)
  })

  it('does not flag calls in backend collections, hooks, or integration tests in the server allow-list', () => {
    const backendCode = [
      'export async function hookCheck(payload: any) {',
      "  return payload.find({ collection: 'projects' })",
      '}',
    ].join('\n')

    expect(lintSnippet(backendCode, 'src/collections/Projects.ts')).toEqual([])
    expect(lintSnippet(backendCode, 'tests/int/p2-t8.int.test.ts')).toEqual([])
  })

  it('verifies all existing files in src/app/(frontend), src/components, and src/lib/cms pass Z6', () => {
    const repoRoot = process.cwd()
    const targetDirs = [
      path.join(repoRoot, 'src', 'app', '(frontend)'),
      path.join(repoRoot, 'src', 'components'),
      path.join(repoRoot, 'src', 'lib', 'cms'),
    ]

    for (const dir of targetDirs) {
      for (const file of collectSourceFiles(dir)) {
        const rel = path.relative(repoRoot, file).replace(/\\/g, '/')
        const code = fs.readFileSync(file, 'utf8')
        expect(lintSnippet(code, rel), `Z6 violation in ${rel}`).toEqual([])
      }
    }
  })
})
