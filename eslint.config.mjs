import { defineConfig } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import tseslint from 'typescript-eslint'

import { noJsxStringLiteralsRule } from './eslint-rules/no-jsx-string-literals.mjs'
import { noServerInClientRule } from './eslint-rules/no-server-in-client.mjs'
import { requireOverrideAccessFalseRule } from './eslint-rules/require-override-access-false.mjs'

export const SERVER_PAYLOAD_IMPORT_ALLOWLIST_GLOBS = [
  'src/payload.config.ts',
  'src/instrumentation.ts',
  'src/lib/cms/client.ts',
  'src/collections/**/*.{ts,tsx,js,mjs}',
  'src/globals/**/*.{ts,tsx,js,mjs}',
  'src/fields/**/*.{ts,tsx,js,mjs}',
  'src/hooks/**/*.{ts,tsx,js,mjs}',
  'src/access/**/*.{ts,tsx,js,mjs}',
  'src/security/**/*.{ts,tsx,js,mjs}',
  'src/migrations/**/*.{ts,tsx,js,mjs}',
  'src/app/(payload)/**/*.{ts,tsx,js,mjs}',
  'scripts/**/*.{ts,tsx,js,mjs}',
  'tests/**/*.{ts,tsx,js,mjs}',
  '**/*.test.{ts,tsx,js,mjs}',
  'next.config.ts',
  'vitest.config.ts',
  'playwright.config.ts',
  'eslint.config.mjs',
]

export const RESTRICTED_PAYLOAD_IMPORTS_CONFIG = {
  paths: [
    {
      name: 'payload',
      message:
        'Importing or re-exporting "payload" is forbidden outside the server allow-list. Use src/lib/cms/client.ts wrappers instead (Z6, R-12).',
    },
    {
      name: '@payload-config',
      message:
        'Importing or re-exporting "@payload-config" is forbidden outside the server allow-list (Z6, R-12).',
    },
    {
      name: '@/payload.config',
      message:
        'Importing or re-exporting "@/payload.config" is forbidden outside the server allow-list (Z6, R-12).',
    },
    {
      name: '@/payload.config.ts',
      message:
        'Importing or re-exporting "@/payload.config.ts" is forbidden outside the server allow-list (Z6, R-12).',
    },
  ],
  patterns: [
    {
      group: ['payload/*', '**/payload.config', '**/payload.config.*'],
      message:
        'Importing or re-exporting Payload modules or payload.config is forbidden outside the server allow-list (Z6, R-12).',
    },
  ],
}

export default defineConfig([
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      '_payload-reference/**',
      '_inbox/**',
      'reference/**',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
      'src/app/(payload)/admin/importMap.js',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
  })),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', RESTRICTED_PAYLOAD_IMPORTS_CONFIG],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    plugins: {
      local: {
        rules: {
          'no-jsx-string-literals': noJsxStringLiteralsRule,
          'no-server-in-client': noServerInClientRule,
          'require-override-access-false': requireOverrideAccessFalseRule,
        },
      },
    },
    rules: {
      'local/no-jsx-string-literals': 'error',
      'local/no-server-in-client': 'error',
      'local/require-override-access-false': 'error',
      'no-restricted-imports': ['error', RESTRICTED_PAYLOAD_IMPORTS_CONFIG],
    },
  },
  {
    files: SERVER_PAYLOAD_IMPORT_ALLOWLIST_GLOBS,
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
])
