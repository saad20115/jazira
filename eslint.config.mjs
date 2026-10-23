import { defineConfig } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import tseslint from 'typescript-eslint'

import { noJsxStringLiteralsRule } from './eslint-rules/no-jsx-string-literals.mjs'
import { noServerInClientRule } from './eslint-rules/no-server-in-client.mjs'
import {
  EXPLICIT_RUNTIME_PAYLOAD_FIELD_AND_SECURITY_FILES,
  requireOverrideAccessFalseRule,
} from './eslint-rules/require-override-access-false.mjs'

export const SERVER_PAYLOAD_IMPORT_ALLOWLIST_GLOBS = [
  'src/payload.config.ts',
  'src/instrumentation.ts',
  'src/lib/cms/client.ts',
  'src/collections/**/*.{ts,tsx,js,mjs}',
  'src/globals/**/*.{ts,tsx,js,mjs}',
  ...EXPLICIT_RUNTIME_PAYLOAD_FIELD_AND_SECURITY_FILES,
  'src/hooks/**/*.{ts,tsx,js,mjs}',
  'src/access/**/*.{ts,tsx,js,mjs}',
  'src/migrations/**/*.{ts,tsx,js,mjs}',
  'src/app/(payload)/**/*.{ts,tsx,js,mjs}',
  'scripts/**/*.{ts,tsx,js,mjs}',
  'tests/**/*.{ts,tsx,js,mjs}',
  'next.config.ts',
  'vitest.config.ts',
  'playwright.config.ts',
  'eslint.config.mjs',
]

export const RESTRICTED_PAYLOAD_IMPORTS_CONFIG = {
  paths: [
    {
      name: 'payload',
      allowTypeImports: true,
      message:
        'Importing or re-exporting "payload" at runtime is forbidden outside the server allow-list. Use src/lib/cms/client.ts wrappers instead (Z6, R-12, R-21, R-22).',
    },
    {
      name: '@payload-config',
      allowTypeImports: false,
      message:
        'Importing or re-exporting "@payload-config" is forbidden outside the server allow-list (Z6, R-12, R-21).',
    },
    {
      name: '@/payload.config',
      allowTypeImports: false,
      message:
        'Importing or re-exporting "@/payload.config" is forbidden outside the server allow-list (Z6, R-12, R-21).',
    },
    {
      name: '@/payload.config.ts',
      allowTypeImports: false,
      message:
        'Importing or re-exporting "@/payload.config.ts" is forbidden outside the server allow-list (Z6, R-12, R-21).',
    },
  ],
  patterns: [
    {
      group: ['payload/*'],
      allowTypeImports: true,
      message:
        'Importing or re-exporting Payload runtime submodules is forbidden outside the server allow-list (Z6, R-12, R-21, R-22).',
    },
    {
      group: ['**/payload.config', '**/payload.config.*'],
      allowTypeImports: false,
      message:
        'Importing or re-exporting payload.config is forbidden outside the server allow-list (Z6, R-12, R-21).',
    },
  ],
}

export const RESTRICTED_PAYLOAD_IMPORTS_JS_CONFIG = {
  paths: [
    {
      name: 'payload',
      message:
        'Importing or re-exporting "payload" is forbidden outside the server allow-list (Z6, R-12, R-21).',
    },
    {
      name: '@payload-config',
      message:
        'Importing or re-exporting "@payload-config" is forbidden outside the server allow-list (Z6, R-12, R-21).',
    },
    {
      name: '@/payload.config',
      message:
        'Importing or re-exporting "@/payload.config" is forbidden outside the server allow-list (Z6, R-12, R-21).',
    },
    {
      name: '@/payload.config.ts',
      message:
        'Importing or re-exporting "@/payload.config.ts" is forbidden outside the server allow-list (Z6, R-12, R-21).',
    },
  ],
  patterns: [
    {
      group: ['payload/*', '**/payload.config', '**/payload.config.*'],
      message:
        'Importing or re-exporting Payload modules or payload.config is forbidden outside the server allow-list (Z6, R-12, R-21).',
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
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    rules: {
      'no-restricted-imports': ['error', RESTRICTED_PAYLOAD_IMPORTS_JS_CONFIG],
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
    },
  },
  {
    files: SERVER_PAYLOAD_IMPORT_ALLOWLIST_GLOBS,
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx,js,mjs}'],
    ignores: ['src/app/**', 'src/components/**'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },
])
