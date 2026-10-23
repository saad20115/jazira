/**
 * Custom ESLint rule `local/no-server-in-client` (S4, R-3, R-5, R-12).
 *
 * In any module whose first statement is the `'use client'` directive,
 * importing runtime values from server-only modules (`@/env`, `@payload-config`,
 * `@/payload.config`, `payload`, `@/lib/cms/**`, `@/lib/odoo/**`, `@/lib/ipHash`,
 * or any `*.server.ts(x)`) is an error. Type-only imports/exports are erased at
 * compile time and are allowed (R-5).
 */

const FORBIDDEN_EXACT = new Set([
  '@/env',
  '@/env.ts',
  '@payload-config',
  '@/payload.config',
  '@/payload.config.ts',
  'payload',
  '@payloadcms/db-postgres',
  '@payloadcms/email-nodemailer',
  'drizzle-orm',
  'pg',
  'nodemailer',
  'sharp',
  '@/lib/cms',
  '@/lib/cms/client',
  '@/lib/cms/client.ts',
  '@/lib/ipHash',
  '@/lib/ipHash.ts',
  '@/lib/odoo',
  '@/security/apiError',
  '@/security/apiError.ts',
  '@/security/emailAdapter',
  '@/security/emailAdapter.ts',
  '@/security/loginEnumeration',
  '@/security/loginEnumeration.ts',
  '@/security/passwordPolicy',
  '@/security/passwordPolicy.ts',
  '@/security/uploadValidation',
  '@/security/uploadValidation.ts',
])

/**
 * @param {string} source
 * @returns {boolean}
 */
export function isForbiddenServerImport(source) {
  const normalized = source.trim().replace(/\\/g, '/')

  if (FORBIDDEN_EXACT.has(normalized)) {
    return true
  }

  if (
    normalized.startsWith('payload/') ||
    normalized.startsWith('@payloadcms/db-postgres/') ||
    normalized.startsWith('@payloadcms/email-nodemailer/') ||
    normalized.startsWith('drizzle-orm/') ||
    normalized.startsWith('pg/') ||
    normalized.startsWith('nodemailer/') ||
    normalized.startsWith('sharp/') ||
    normalized.startsWith('@/lib/cms/') ||
    normalized.startsWith('@/lib/odoo/') ||
    normalized.startsWith('@/lib/ipHash/')
  ) {
    return true
  }

  // Relative imports to env, payload.config, lib/cms, lib/odoo, lib/ipHash, or server security modules
  if (
    /(?:^|\/)env(?:\.[jt]sx?)?$/.test(normalized) ||
    /(?:^|\/)payload\.config(?:\.[jt]sx?)?$/.test(normalized) ||
    /(?:^|\/)lib\/cms(?:\/|$|\.[jt]sx?$)/.test(normalized) ||
    /(?:^|\/)lib\/odoo(?:\/|$|\.[jt]sx?$)/.test(normalized) ||
    /(?:^|\/)lib\/ipHash(?:\.[jt]sx?)?$/.test(normalized) ||
    /(?:^|\/)security\/(?:apiError|emailAdapter|loginEnumeration|passwordPolicy|uploadValidation)(?:\.[jt]sx?)?$/.test(
      normalized,
    )
  ) {
    return true
  }

  // Any *.server, *.server.ts, *.server.tsx, *.server.js, *.server.mjs
  if (/\.server(?:\.[cm]?[jt]sx?)?$/.test(normalized)) {
    return true
  }

  return false
}

/**
 * @param {import('eslint').Rule.Node} programNode
 * @returns {boolean}
 */
function hasUseClientDirective(programNode) {
  const body = 'body' in programNode && Array.isArray(programNode.body) ? programNode.body : []
  const firstStmt = body[0]
  if (!firstStmt || firstStmt.type !== 'ExpressionStatement') {
    return false
  }
  if ('directive' in firstStmt && firstStmt.directive === 'use client') {
    return true
  }
  const expr = firstStmt.expression
  return expr.type === 'Literal' && typeof expr.value === 'string' && expr.value === 'use client'
}

/**
 * @param {import('eslint').Rule.Node} node
 * @returns {boolean}
 */
function isTypeOnlyImportDeclaration(node) {
  if ('importKind' in node && node.importKind === 'type') {
    return true
  }
  if (
    'specifiers' in node &&
    Array.isArray(node.specifiers) &&
    node.specifiers.length > 0 &&
    node.specifiers.every(
      (s) => s.type === 'ImportSpecifier' && 'importKind' in s && s.importKind === 'type',
    )
  ) {
    return true
  }
  return false
}

/**
 * @param {import('eslint').Rule.Node} node
 * @returns {boolean}
 */
function isTypeOnlyExportNamedDeclaration(node) {
  if ('exportKind' in node && node.exportKind === 'type') {
    return true
  }
  if (
    'specifiers' in node &&
    Array.isArray(node.specifiers) &&
    node.specifiers.length > 0 &&
    node.specifiers.every(
      (s) => s.type === 'ExportSpecifier' && 'exportKind' in s && s.exportKind === 'type',
    )
  ) {
    return true
  }
  return false
}

/** @type {import('eslint').Rule.RuleModule} */
export const noServerInClientRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing server-only modules (@/env, @payload-config, payload, @/lib/cms/**, @/lib/odoo/**, @/lib/ipHash, *.server.ts(x)) inside "use client" modules (S4, R-12).',
    },
    messages: {
      forbiddenServerImport:
        'Server-only module "{{source}}" must not be imported in a "use client" component (S4, R-12).',
    },
    schema: [],
  },
  create(context) {
    let isClientFile = false

    /**
     * @param {import('eslint').Rule.Node} node
     * @param {unknown} sourceValue
     */
    function checkImportSource(node, sourceValue) {
      if (!isClientFile || typeof sourceValue !== 'string') {
        return
      }
      if (isForbiddenServerImport(sourceValue)) {
        context.report({
          node,
          messageId: 'forbiddenServerImport',
          data: { source: sourceValue },
        })
      }
    }

    return {
      Program(node) {
        isClientFile = hasUseClientDirective(node)
      },
      ImportDeclaration(node) {
        if (isTypeOnlyImportDeclaration(node)) {
          return
        }
        checkImportSource(node, node.source.value)
      },
      ExportNamedDeclaration(node) {
        if (node.source && !isTypeOnlyExportNamedDeclaration(node)) {
          checkImportSource(node, node.source.value)
        }
      },
      ExportAllDeclaration(node) {
        if ('exportKind' in node && node.exportKind === 'type') {
          return
        }
        if (node.source) {
          checkImportSource(node, node.source.value)
        }
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal') {
          checkImportSource(node, node.source.value)
        }
      },
    }
  },
}
