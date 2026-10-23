import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'

import { noServerInClientRule } from '../eslint-rules/no-server-in-client.mjs'
import {
  FORBIDDEN_CLIENT_BUNDLE_SENTINELS,
  FORBIDDEN_SERVER_LIBRARY_MARKERS,
  scanDirectoryForSentinels,
} from '../scripts/check-client-bundle-sentinels.mjs'

function lintSnippet(code: string): Linter.LintMessage[] {
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
              'no-server-in-client': noServerInClientRule,
            },
          },
        },
        rules: {
          'local/no-server-in-client': 'error',
        },
      },
    ],
    { filename: 'src/components/Fixture.tsx' },
  )
}

describe('local/no-server-in-client ESLint rule (S4, R-3, R-5, R-12)', () => {
  it('flags forbidden server imports (including @/lib/cms/*) inside a "use client" module (R-12)', () => {
    const clientCode = [
      "'use client'",
      "import { env } from '@/env'",
      "import config from '@payload-config'",
      "import payloadConfig from '@/payload.config'",
      "import { getPayload } from 'payload'",
      "import { cmsFind } from '@/lib/cms/client'",
      "import { syncLead } from '@/lib/odoo/client'",
      "import { hashIp } from '@/lib/ipHash'",
      "import { secretHelper } from './helper.server.ts'",
      'export const x = [env, config, payloadConfig, getPayload, cmsFind, syncLead, hashIp, secretHelper]',
    ].join('\n')

    const messages = lintSnippet(clientCode)
    const ruleIds = messages.map((m) => m.ruleId)

    expect(messages).toHaveLength(8)
    expect(ruleIds.every((id) => id === 'local/no-server-in-client')).toBe(true)
    expect(messages.map((m) => m.message)).toEqual([
      'Server-only module "@/env" must not be imported in a "use client" component (S4, R-12).',
      'Server-only module "@payload-config" must not be imported in a "use client" component (S4, R-12).',
      'Server-only module "@/payload.config" must not be imported in a "use client" component (S4, R-12).',
      'Server-only module "payload" must not be imported in a "use client" component (S4, R-12).',
      'Server-only module "@/lib/cms/client" must not be imported in a "use client" component (S4, R-12).',
      'Server-only module "@/lib/odoo/client" must not be imported in a "use client" component (S4, R-12).',
      'Server-only module "@/lib/ipHash" must not be imported in a "use client" component (S4, R-12).',
      'Server-only module "./helper.server.ts" must not be imported in a "use client" component (S4, R-12).',
    ])
  })

  it('allows type-only imports and exports inside a "use client" module (R-5)', () => {
    const typeOnlyClientCode = [
      "'use client'",
      "import type { CollectionConfig } from 'payload'",
      "import { type Env } from '@/env'",
      "import type { CmsFindOptions } from '@/lib/cms/client'",
      "export type { Payload } from 'payload'",
      "export { type Env as ClientEnvType } from '@/env'",
      "export type * from 'payload'",
      'export type MyConfig = CollectionConfig | Env | CmsFindOptions<"projects">',
    ].join('\n')

    expect(lintSnippet(typeOnlyClientCode)).toEqual([])
  })

  it('flags mixed value + type specifiers inside a "use client" module (R-5)', () => {
    const mixedClientCode = [
      "'use client'",
      "import { type CollectionConfig, getPayload } from 'payload'",
      "export { type Env, env } from '@/env'",
      'export type MyConfig = CollectionConfig',
      'export const p = getPayload',
    ].join('\n')

    const messages = lintSnippet(mixedClientCode)
    expect(messages).toHaveLength(2)
    expect(messages.map((m) => m.message)).toEqual([
      'Server-only module "payload" must not be imported in a "use client" component (S4, R-12).',
      'Server-only module "@/env" must not be imported in a "use client" component (S4, R-12).',
    ])
  })

  it('does not fire on a server module (without "use client") importing the same server modules', () => {
    const serverCode = [
      "import { env } from '@/env'",
      "import config from '@payload-config'",
      "import payloadConfig from '@/payload.config'",
      "import { getPayload } from 'payload'",
      "import { cmsFind } from '@/lib/cms/client'",
      "import { syncLead } from '@/lib/odoo/client'",
      "import { hashIp } from '@/lib/ipHash'",
      "import { secretHelper } from './helper.server'",
      'export const x = [env, config, payloadConfig, getPayload, cmsFind, syncLead, hashIp, secretHelper]',
    ].join('\n')

    const messages = lintSnippet(serverCode)
    expect(messages).toEqual([])
  })

  it('flags @/security/apiError and server libraries (drizzle-orm, pg, nodemailer, sharp) inside a "use client" module while allowing @/lib/quote/schema (P3-T1 §9)', () => {
    const badClientCode = [
      "'use client'",
      "import { createPublicAPIError } from '@/security/apiError'",
      "import { eq } from 'drizzle-orm'",
      "import { Pool } from 'pg'",
      "import nodemailer from 'nodemailer'",
      "import sharp from 'sharp'",
      'export const bad = [createPublicAPIError, eq, Pool, nodemailer, sharp]',
    ].join('\n')

    const badMessages = lintSnippet(badClientCode)
    expect(badMessages).toHaveLength(5)
    expect(badMessages.map((m) => m.message)).toEqual([
      'Server-only module "@/security/apiError" must not be imported in a "use client" component (S4, R-12).',
      'Server-only module "drizzle-orm" must not be imported in a "use client" component (S4, R-12).',
      'Server-only module "pg" must not be imported in a "use client" component (S4, R-12).',
      'Server-only module "nodemailer" must not be imported in a "use client" component (S4, R-12).',
      'Server-only module "sharp" must not be imported in a "use client" component (S4, R-12).',
    ])

    const goodClientCode = [
      "'use client'",
      "import { quoteRequestPayloadSchema } from '@/lib/quote/schema'",
      'export const good = quoteRequestPayloadSchema',
    ].join('\n')

    expect(lintSnippet(goodClientCode)).toEqual([])
  })

  it('scanDirectoryForSentinels detects both server sentinels and server library markers in .next/static chunks (P3-T1 §9)', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'client-sentinel-test-'))
    try {
      const chunksDir = path.join(tmpDir, 'chunks')
      fs.mkdirSync(chunksDir, { recursive: true })
      fs.writeFileSync(path.join(chunksDir, 'clean.js'), 'console.log("safe client chunk");\n', 'utf8')
      expect(scanDirectoryForSentinels(tmpDir)).toEqual([])

      fs.writeFileSync(
        path.join(chunksDir, 'leaked.js'),
        `const a = "${FORBIDDEN_CLIENT_BUNDLE_SENTINELS[3]}"; const b = "${FORBIDDEN_SERVER_LIBRARY_MARKERS[2]}";\n`,
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
      ])
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
