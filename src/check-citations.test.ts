import { describe, expect, it } from 'vitest'

import {
  parseCitationsLog,
  parseReportCitations,
  validateCitationIdentifier,
  verifyCitations,
} from '../scripts/check-citations.mjs'

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

  it('verifies exact line matches against repository files and citations.log blocks and rejects wrong lines or catch-all blocks', () => {
    const validLog = [
      "$ git grep -n -e 'SAFE_CMS_QUERY_WHITELIST_KEYS' -- src/lib/cms/client.ts",
      'src/lib/cms/client.ts:21:export const SAFE_CMS_QUERY_WHITELIST_KEYS = [',
    ].join('\n')

    const okResult = verifyCitations({
      repoRoot: process.cwd(),
      reports: [
        {
          reportPath: 'test-report.md',
          markdown: 'Whitelist: `SAFE_CMS_QUERY_WHITELIST_KEYS` (`src/lib/cms/client.ts:21`).',
        },
      ],
      citationsLogText: validLog,
    })
    expect(okResult.ok).toBe(true)
    expect(okResult.errors).toEqual([])

    const wrongLineResult = verifyCitations({
      repoRoot: process.cwd(),
      reports: [
        {
          reportPath: 'test-report.md',
          markdown: 'Wrong line: `SAFE_CMS_QUERY_WHITELIST_KEYS` (`src/lib/cms/client.ts:1`).',
        },
      ],
      citationsLogText: validLog,
    })
    expect(wrongLineResult.ok).toBe(false)
    expect(wrongLineResult.errors[0]).toContain(
      'identifier `SAFE_CMS_QUERY_WHITELIST_KEYS` not found on src/lib/cms/client.ts:1',
    )

    const catchAllLog = parseCitationsLog(
      ["$ git grep -n -e '' -- src/lib/cms/client.ts", 'src/lib/cms/client.ts:1:import'].join('\n'),
    )
    expect(catchAllLog.errors[0]).toContain('invalid git grep pattern ""')
  })
})
