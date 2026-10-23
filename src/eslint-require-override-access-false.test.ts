import fs from 'node:fs'
import path from 'node:path'

import { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { requireOverrideAccessFalseRule } from '../eslint-rules/require-override-access-false.mjs'
import { buildSafeCmsQueryArgs } from './lib/cms/client'

function lintSnippet(code: string, filename: string): Linter.LintMessage[] {
  const linter = new Linter({ configType: 'flat' })
  return linter.verify(
    code,
    [
      {
        files: ['**/*.ts', '**/*.tsx'],
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

function collectTsFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return []
  }
  const results: string[] = []
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(fullPath))
    } else if (entry.isFile() && /\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      results.push(fullPath)
    }
  }
  return results
}

describe('local/require-override-access-false ESLint rule & Z6 typed wrapper (P2-T8 Scope 3, R-6)', () => {
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

  it('bans importing payload, @payload-config, or getPayload in src/app/(frontend)/**, src/components/**, and src/lib/cms/** outside src/lib/cms/client.ts (R-6)', () => {
    const importPayloadCode = [
      "import { getPayload } from 'payload'",
      "import config from '@payload-config'",
      'export const x = [getPayload, config]',
    ].join('\n')

    const frontendImportMsgs = lintSnippet(importPayloadCode, 'src/app/(frontend)/ar/page.tsx')
    expect(frontendImportMsgs).toHaveLength(2)
    expect(frontendImportMsgs.every((m) => m.message.includes('is forbidden'))).toBe(true)

    const componentImportMsgs = lintSnippet(importPayloadCode, 'src/components/ProjectCard.tsx')
    expect(componentImportMsgs).toHaveLength(2)

    const nonWrapperCmsMsgs = lintSnippet(importPayloadCode, 'src/lib/cms/collections.ts')
    expect(nonWrapperCmsMsgs).toHaveLength(2)

    // Allowed inside the single typed wrapper `src/lib/cms/client.ts`
    expect(lintSnippet(importPayloadCode, 'src/lib/cms/client.ts')).toEqual([])
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

  it('enforces overrideAccess: false and draft from draftMode() in buildSafeCmsQueryArgs even if runtime properties are injected (R-6)', () => {
    const safePublished = buildSafeCmsQueryArgs(
      {
        collection: 'projects',
        locale: 'ar',
        overrideAccess: true,
        draft: true,
      },
      false,
    )
    expect(safePublished).toEqual({
      collection: 'projects',
      locale: 'ar',
      draft: false,
      overrideAccess: false,
    })

    const safeDraft = buildSafeCmsQueryArgs(
      {
        collection: 'projects',
        locale: 'en',
        overrideAccess: true,
        draft: false,
      },
      true,
    )
    expect(safeDraft).toEqual({
      collection: 'projects',
      locale: 'en',
      draft: true,
      overrideAccess: false,
    })
  })

  it('does not flag calls in backend collections, hooks, or integration tests outside src/app/(frontend), src/components, and src/lib/cms', () => {
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
      for (const file of collectTsFiles(dir)) {
        const rel = path.relative(repoRoot, file).replace(/\\/g, '/')
        const code = fs.readFileSync(file, 'utf8')
        expect(lintSnippet(code, rel), `Z6 violation in ${rel}`).toEqual([])
      }
    }
  })
})
