import { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'

import { noServerInClientRule } from '../eslint-rules/no-server-in-client.mjs'

function lintSnippet(code: string): Linter.LintMessage[] {
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

describe('local/no-server-in-client ESLint rule (S4, R-3, R-5)', () => {
  it('flags forbidden server imports inside a "use client" module', () => {
    const clientCode = [
      "'use client'",
      "import { env } from '@/env'",
      "import config from '@payload-config'",
      "import payloadConfig from '@/payload.config'",
      "import { getPayload } from 'payload'",
      "import { syncLead } from '@/lib/odoo/client'",
      "import { hashIp } from '@/lib/ipHash'",
      "import { secretHelper } from './helper.server.ts'",
      'export const x = [env, config, payloadConfig, getPayload, syncLead, hashIp, secretHelper]',
    ].join('\n')

    const messages = lintSnippet(clientCode)
    const ruleIds = messages.map((m) => m.ruleId)

    expect(messages).toHaveLength(7)
    expect(ruleIds.every((id) => id === 'local/no-server-in-client')).toBe(true)
    expect(messages.map((m) => m.message)).toEqual([
      'Server-only module "@/env" must not be imported in a "use client" component (S4).',
      'Server-only module "@payload-config" must not be imported in a "use client" component (S4).',
      'Server-only module "@/payload.config" must not be imported in a "use client" component (S4).',
      'Server-only module "payload" must not be imported in a "use client" component (S4).',
      'Server-only module "@/lib/odoo/client" must not be imported in a "use client" component (S4).',
      'Server-only module "@/lib/ipHash" must not be imported in a "use client" component (S4).',
      'Server-only module "./helper.server.ts" must not be imported in a "use client" component (S4).',
    ])
  })

  it('allows type-only imports and exports inside a "use client" module (R-5)', () => {
    const typeOnlyClientCode = [
      "'use client'",
      "import type { CollectionConfig } from 'payload'",
      "import { type Env } from '@/env'",
      "export type { Payload } from 'payload'",
      "export { type Env as ClientEnvType } from '@/env'",
      "export type * from 'payload'",
      'export type MyConfig = CollectionConfig | Env',
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
      'Server-only module "payload" must not be imported in a "use client" component (S4).',
      'Server-only module "@/env" must not be imported in a "use client" component (S4).',
    ])
  })

  it('does not fire on a server module (without "use client") importing the same server modules', () => {
    const serverCode = [
      "import { env } from '@/env'",
      "import config from '@payload-config'",
      "import payloadConfig from '@/payload.config'",
      "import { getPayload } from 'payload'",
      "import { syncLead } from '@/lib/odoo/client'",
      "import { hashIp } from '@/lib/ipHash'",
      "import { secretHelper } from './helper.server'",
      'export const x = [env, config, payloadConfig, getPayload, syncLead, hashIp, secretHelper]',
    ].join('\n')

    const messages = lintSnippet(serverCode)
    expect(messages).toEqual([])
  })
})
