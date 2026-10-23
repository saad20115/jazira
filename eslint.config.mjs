import { defineConfig } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import tseslint from 'typescript-eslint'

import { noServerInClientRule } from './eslint-rules/no-server-in-client.mjs'
import { requireOverrideAccessFalseRule } from './eslint-rules/require-override-access-false.mjs'

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
    plugins: {
      local: {
        rules: {
          'no-server-in-client': noServerInClientRule,
          'require-override-access-false': requireOverrideAccessFalseRule,
        },
      },
    },
    rules: {
      'local/no-server-in-client': 'error',
      'local/require-override-access-false': 'error',
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
])
