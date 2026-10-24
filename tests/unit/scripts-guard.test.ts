import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  parseCitationsLog,
  parseReportCitations,
  validateCitationIdentifier,
  verifyCitations,
} from '../../scripts/check-citations.mjs'
import {
  FORBIDDEN_CLIENT_BUNDLE_SENTINELS,
  FORBIDDEN_FRONTEND_PAYLOAD_RUNTIME_MARKERS,
  FORBIDDEN_SERVER_LIBRARY_MARKERS,
  resolveFrontendClientChunkFiles,
  scanDirectoryForSentinels,
} from '../../scripts/check-client-bundle-sentinels.mjs'
import {
  checkAllPublicCssLogicalProperties,
  scanCssForPhysicalProperties,
} from '../../scripts/check-css-logical-properties.mjs'
import { redactSecretValues } from '../../scripts/evidence/p3-t1-evidence.mjs'
import { generateTokensFile, TYPOGRAPHY_STYLE_MAP } from '../../scripts/generate-tokens.mjs'
import { CMS_CLIENT_SERVER_ONLY_SENTINEL } from '../../src/lib/cms/client'

describe('scripts/check-citations.mjs mechanical citation checker (P2-T8 R-13)', () => {
  it('accepts valid identifiers (>= 3 chars, [A-Za-z0-9_$.-]) and rejects empty, punctuation-only, or common-word patterns', () => {
    expect(validateCitationIdentifier('buildSafeCmsQueryArgs')).toEqual({ valid: true })
    expect(validateCitationIdentifier('SAFE_CMS_QUERY_WHITELIST_KEYS')).toEqual({ valid: true })

    for (const [bad, expectedReason] of [
      ['@payloadcms/plugin-seo', 'disallowed characters'],
      ['', 'at least 3 characters'],
      ['}', 'at least 3 characters'],
      ['try {', 'disallowed characters'],
      ['name', 'forbidden common word'],
      ['req,', 'disallowed characters'],
      ['result', 'forbidden common word'],
      ['user', 'forbidden common word'],
    ] as const) {
      const res = validateCitationIdentifier(bad)
      expect(res.valid).toBe(false)
      expect(res.reason).toContain(expectedReason)
    }
  })

  it('parses paired `identifier` (`path:line`) citations and flags un-paired path:line references outside code fences', () => {
    const md = [
      'Good: `buildSafeCmsQueryArgs` (`src/lib/cms/client.ts:183`).',
      'Bad bare ref: see `src/lib/cms/client.ts:183` for details.',
      '```text',
      'Inside fenced block: src/lib/cms/client.ts:999 is ignored.',
      '```',
    ].join('\n')

    const parsed = parseReportCitations(md, 'sample.md')
    expect(parsed.paired).toEqual([
      {
        identifier: 'buildSafeCmsQueryArgs',
        filePath: 'src/lib/cms/client.ts',
        lineNumber: 183,
        reportLine: 1,
        reportLabel: 'sample.md',
      },
    ])
    expect(parsed.unpaired).toEqual([
      {
        rawRef: 'src/lib/cms/client.ts:183',
        reportLine: 2,
        reportLabel: 'sample.md',
      },
    ])
  })

  it('verifies paired citations against citations.log and reports mismatches on identifier, line number, or missing file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'citation-verify-test-'))
    try {
      const sampleFile = path.join(tmpDir, 'src', 'lib', 'cms', 'client.ts')
      fs.mkdirSync(path.dirname(sampleFile), { recursive: true })
      fs.writeFileSync(
        sampleFile,
        [
          'export function buildSafeCmsQueryArgs(',
          '  rawOptions: Record<string, unknown>,',
          ') {}',
        ].join('\n'),
        'utf8',
      )

      const citationsLogText = [
        "$ git grep -n -e 'buildSafeCmsQueryArgs' -- src/lib/cms/client.ts",
        'src/lib/cms/client.ts:1:export function buildSafeCmsQueryArgs(',
      ].join('\n')

      const parsedLog = parseCitationsLog(citationsLogText)
      expect(parsedLog.errors).toEqual([])
      expect(parsedLog.totalBlocks).toBe(1)

      const validRes = verifyCitations({
        repoRoot: tmpDir,
        reports: [
          {
            reportPath: 'ok.md',
            markdown: 'Verified `buildSafeCmsQueryArgs` (`src/lib/cms/client.ts:1`).',
          },
        ],
        citationsLogText,
      })
      expect(validRes.ok).toBe(true)
      expect(validRes.totalPairedCitations).toBe(1)
      expect(validRes.errors).toEqual([])

      const wrongLineRes = verifyCitations({
        repoRoot: tmpDir,
        reports: [
          {
            reportPath: 'bad.md',
            markdown: 'Shifted line `buildSafeCmsQueryArgs` (`src/lib/cms/client.ts:2`).',
          },
        ],
        citationsLogText,
      })
      expect(wrongLineRes.ok).toBe(false)
      expect(wrongLineRes.errors).toHaveLength(1)
      expect(wrongLineRes.errors[0]).toContain(
        'identifier `buildSafeCmsQueryArgs` not found on src/lib/cms/client.ts:2',
      )

      const missingFileRefRes = verifyCitations({
        repoRoot: tmpDir,
        reports: [
          {
            reportPath: 'missing-evidence.md',
            markdown: [
              'Verified `buildSafeCmsQueryArgs` (`src/lib/cms/client.ts:1`).',
              'Screenshot: `docs/reports/evidence/P3-T4/r1/home-1440-ar.png`.',
            ].join('\n'),
          },
        ],
        citationsLogText,
      })
      expect(missingFileRefRes.ok).toBe(false)
      expect(missingFileRefRes.errors).toHaveLength(1)
      expect(missingFileRefRes.errors[0]).toContain(
        'referenced file "docs/reports/evidence/P3-T4/r1/home-1440-ar.png" does not exist on disk',
      )
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('checks bracketed [locale] paths and verifies against committed HEAD rather than uncommitted working-tree files (R-17)', () => {
    const parsed = parseReportCitations(
      [
        'Paired: `LocaleHomePage` (`src/app/(frontend)/[locale]/page.tsx:114`).',
        'Bare: `src/app/(frontend)/[locale]/page.tsx:9999`.',
        'Standalone: `src/app/(frontend)/[locale]/missing.tsx`.',
      ].join('\n'),
      'r17.md',
    )
    expect(parsed.paired).toEqual([
      {
        identifier: 'LocaleHomePage',
        filePath: 'src/app/(frontend)/[locale]/page.tsx',
        lineNumber: 114,
        reportLine: 1,
        reportLabel: 'r17.md',
      },
    ])
    expect(parsed.unpaired).toEqual([
      {
        rawRef: 'src/app/(frontend)/[locale]/page.tsx:9999',
        reportLine: 2,
        reportLabel: 'r17.md',
      },
    ])
    expect(parsed.referencedFiles).toEqual([
      {
        filePath: 'src/app/(frontend)/[locale]/missing.tsx',
        reportLine: 3,
        reportLabel: 'r17.md',
      },
    ])

    const citationsLogText = [
      "$ git grep -n -e 'LocaleHomePage' -- src/app/(frontend)/[locale]/page.tsx",
      'src/app/(frontend)/[locale]/page.tsx:9999:export default async function LocaleHomePage(',
    ].join('\n')

    // 1. Out-of-range line on src/app/(frontend)/[locale]/page.tsx:9999 MUST fail
    const outOfRangeRes = verifyCitations({
      repoRoot: process.cwd(),
      reports: [
        {
          reportPath: 'r17-out-of-range.md',
          markdown: 'Bad line `LocaleHomePage` (`src/app/(frontend)/[locale]/page.tsx:9999`).',
        },
      ],
      citationsLogText,
    })
    expect(outOfRangeRes.ok).toBe(false)
    expect(outOfRangeRes.errors.join('\n')).toContain(
      'cited line src/app/(frontend)/[locale]/page.tsx:9999 is out of range',
    )

    // 2. Nonexistent [locale] file MUST fail
    const missingLocaleFileRes = verifyCitations({
      repoRoot: process.cwd(),
      reports: [
        {
          reportPath: 'r17-missing-locale.md',
          markdown: 'Missing file `src/app/(frontend)/[locale]/nonexistent.tsx`.',
        },
      ],
      citationsLogText,
    })
    expect(missingLocaleFileRes.ok).toBe(false)
    expect(missingLocaleFileRes.errors.join('\n')).toContain(
      'referenced file "src/app/(frontend)/[locale]/nonexistent.tsx" does not exist in commit HEAD',
    )

    // 3. Uncommitted working-tree file in src/app/(frontend)/[locale]/ MUST fail against HEAD
    const untrackedRelPath = 'src/app/(frontend)/[locale]/__r17_uncommitted_probe__.tsx'
    const untrackedAbsPath = path.resolve(process.cwd(), untrackedRelPath)
    fs.writeFileSync(untrackedAbsPath, 'export const R17_UNCOMMITTED_PROBE = true\n', 'utf8')
    try {
      const uncommittedRes = verifyCitations({
        repoRoot: process.cwd(),
        reports: [
          {
            reportPath: 'r17-uncommitted.md',
            markdown: `Uncommitted \`R17_UNCOMMITTED_PROBE\` (\`${untrackedRelPath}:1\`).`,
          },
        ],
        citationsLogText: [
          `$ git grep -n -e 'R17_UNCOMMITTED_PROBE' -- ${untrackedRelPath}`,
          `${untrackedRelPath}:1:export const R17_UNCOMMITTED_PROBE = true`,
        ].join('\n'),
      })
      expect(uncommittedRes.ok).toBe(false)
      expect(uncommittedRes.errors.join('\n')).toContain(
        `cited file "${untrackedRelPath}" does not exist in commit HEAD`,
      )
    } finally {
      fs.rmSync(untrackedAbsPath, { force: true })
    }
  })
})

describe('scripts/check-client-bundle-sentinels.mjs, scripts/generate-tokens.mjs, & scripts/evidence/p3-t1-evidence.mjs (P3-T1 §9, R-4, R-14)', () => {
  it('scanDirectoryForSentinels detects server sentinels, library markers, and Payload runtime markers in .next/static chunks (P3-T1 §9, R-4)', () => {
    expect(FORBIDDEN_CLIENT_BUNDLE_SENTINELS).toContain(CMS_CLIENT_SERVER_ONLY_SENTINEL)

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'client-sentinel-test-'))
    try {
      const chunksDir = path.join(tmpDir, 'chunks')
      fs.mkdirSync(chunksDir, { recursive: true })
      fs.writeFileSync(
        path.join(chunksDir, 'clean.js'),
        'console.log("safe client chunk");\n',
        'utf8',
      )
      expect(scanDirectoryForSentinels(tmpDir)).toEqual([])

      fs.writeFileSync(
        path.join(chunksDir, 'leaked.js'),
        `const a = "${FORBIDDEN_CLIENT_BUNDLE_SENTINELS[3]}"; const b = "${FORBIDDEN_SERVER_LIBRARY_MARKERS[2]}"; const c = { f() { ${FORBIDDEN_FRONTEND_PAYLOAD_RUNTIME_MARKERS[0]}=!0 } };\n`,
        'utf8',
      )
      const hits = scanDirectoryForSentinels(tmpDir)
      expect(hits).toEqual([
        {
          file: 'chunks/leaked.js',
          sentinel: '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_API_ERROR__',
        },
        {
          file: 'chunks/leaked.js',
          sentinel: 'drizzle-orm/node-postgres',
        },
        {
          file: 'chunks/leaked.js',
          sentinel: 'this.isOperational',
        },
      ])
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('resolveFrontendClientChunkFiles extracts frontend chunks from both build-manifest.json and page_client-reference-manifest.js', () => {
    const tmpNextDir = fs.mkdtempSync(path.join(os.tmpdir(), 'client-manifest-test-'))
    try {
      const staticDir = path.join(tmpNextDir, 'static')
      const frontendRouteDir = path.join(tmpNextDir, 'server', 'app', '(frontend)', '[locale]')
      fs.mkdirSync(path.join(staticDir, 'chunks'), { recursive: true })
      fs.mkdirSync(frontendRouteDir, { recursive: true })

      fs.writeFileSync(
        path.join(frontendRouteDir, 'build-manifest.json'),
        JSON.stringify({
          rootMainFiles: ['static/chunks/root-main.js'],
          polyfillFiles: ['static/chunks/polyfills.js'],
          pages: {},
        }),
        'utf8',
      )
      fs.writeFileSync(
        path.join(frontendRouteDir, 'page_client-reference-manifest.js'),
        'globalThis.__RSC_MANIFEST["/(frontend)/[locale]/page"] = {"clientModules":{"[project]/src/components/CmsLink.tsx":{"chunks":["/_next/static/chunks/cms-link-chunk.js"]}},"entryJSFiles":{"[project]/src/app/(frontend)/[locale]/page":["static/chunks/entry-chunk.js"]}};\n',
        'utf8',
      )

      const files = resolveFrontendClientChunkFiles(staticDir)
      expect(files).not.toBeNull()
      expect(Array.from(files ?? []).sort()).toEqual([
        'chunks/cms-link-chunk.js',
        'chunks/entry-chunk.js',
        'chunks/polyfills.js',
        'chunks/root-main.js',
      ])
    } finally {
      fs.rmSync(tmpNextDir, { recursive: true, force: true })
    }
  })

  it('verifies generateTokensFile({ checkOnly: true }) reports src/styles/tokens.css is in sync with design/tokens.json', () => {
    const res = generateTokensFile({ checkOnly: true })
    expect(res.updated).toBe(false)
    expect(Object.keys(TYPOGRAPHY_STYLE_MAP)).toHaveLength(23)
  })

  it('redacts preview secrets in p3-t1-evidence.mjs URLs and headers while keeping non-secret wrong-secret-00000000 visible (R-14)', () => {
    const liveSecret = 'deadbeefcafebabe0123456789abcdef0123456789abcdef0123456789abcdef'
    expect(
      redactSecretValues(`/api/preview?secret=${liveSecret}&locale=ar&path=/ar`, [liveSecret]),
    ).toBe('/api/preview?secret=<REDACTED_PREVIEW_SECRET>&locale=ar&path=/ar')
    expect(
      redactSecretValues('/api/preview?secret=wrong-secret-00000000&locale=ar&path=/ar', [
        liveSecret,
      ]),
    ).toBe('/api/preview?secret=wrong-secret-00000000&locale=ar&path=/ar')
  })

  it('scanCssForPhysicalProperties flags physical directional properties unless /* logical-ignore: ... */ is present, and all public CSS files pass (P3-T2 R-8)', () => {
    const badCss = [
      '.box {',
      '  margin-left: 16px;',
      '  padding-right: 24px;',
      '  left: 0;',
      '  text-align: left;',
      '  border-top-left-radius: 8px;',
      '}',
    ].join('\n')
    const violations = scanCssForPhysicalProperties(badCss, 'src/components/Sample.module.css')
    expect(violations).toHaveLength(5)
    expect(violations.map((v) => v.property)).toEqual([
      'margin-left',
      'padding-right',
      'left',
      'text-align',
      'border-top-left-radius',
    ])

    const justifiedCss = [
      '.box {',
      '  /* logical-ignore: physical canvas coordinate required */',
      '  left: 0;',
      '  margin-inline-start: 16px;',
      '  text-align: start;',
      '}',
    ].join('\n')
    expect(scanCssForPhysicalProperties(justifiedCss, 'src/components/Sample.module.css')).toEqual(
      [],
    )

    const repoCheck = checkAllPublicCssLogicalProperties()
    expect(repoCheck.scannedFileCount).toBeGreaterThanOrEqual(20)
    expect(repoCheck.violations).toEqual([])
  })
})
