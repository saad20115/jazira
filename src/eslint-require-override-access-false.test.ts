import fs from 'node:fs'
import path from 'node:path'

import { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { requireOverrideAccessFalseRule } from '../eslint-rules/require-override-access-false.mjs'
import { FORBIDDEN_CLIENT_BUNDLE_SENTINELS } from '../scripts/check-client-bundle-sentinels.mjs'
import {
  buildSafeCmsCountArgs,
  buildSafeCmsQueryArgs,
  CMS_CLIENT_SERVER_ONLY_SENTINEL,
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

describe('local/require-override-access-false ESLint rule & Z6 typed wrapper (P2-T8 Scope 3, R-6, R-11, R-12)', () => {
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

    // Allowed inside the explicit server allow-list (`src/lib/cms/client.ts`, `src/collections/*`, `src/payload.config.ts`)
    expect(lintSnippet(importPayloadCode, 'src/lib/cms/client.ts')).toEqual([])
    expect(lintSnippet(importPayloadCode, 'src/collections/Projects.ts')).toEqual([])
    expect(lintSnippet(importPayloadCode, 'src/payload.config.ts')).toEqual([])
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

  it('constructs Payload args strictly from the explicit property whitelist in buildSafeCmsQueryArgs and buildSafeCmsCountArgs, dropping injected user, req, showHiddenFields, overrideAccess, and draft (R-6, R-11)', () => {
    const smuggledInput: Record<string, unknown> = {
      collection: 'users',
      locale: 'ar',
      fallbackLocale: 'ar',
      where: { role: { equals: 'admin' } },
      limit: 10,
      page: 1,
      sort: '-createdAt',
      depth: 1,
      pagination: true,
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
      limit: 10,
      page: 1,
      sort: '-createdAt',
      depth: 1,
      pagination: true,
      select: { name: true },
      draft: false,
      overrideAccess: false,
    })
    expect('user' in safePublished).toBe(false)
    expect('req' in safePublished).toBe(false)
    expect('showHiddenFields' in safePublished).toBe(false)

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
