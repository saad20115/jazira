/**
 * Custom ESLint rule `local/no-server-in-client` (S4, R-3).
 *
 * In any module whose first statement is the `'use client'` directive,
 * importing server-only modules (`@/env`, `@payload-config`, `@/payload.config`,
 * `payload`, `@/lib/odoo/**`, `@/lib/ipHash`, or any `*.server.ts(x)`) is an error.
 */

const FORBIDDEN_EXACT = new Set([
  '@/env',
  '@/env.ts',
  '@payload-config',
  '@/payload.config',
  '@/payload.config.ts',
  'payload',
  '@/lib/ipHash',
  '@/lib/ipHash.ts',
  '@/lib/odoo',
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
    normalized.startsWith('@/lib/odoo/') ||
    normalized.startsWith('@/lib/ipHash/')
  ) {
    return true
  }

  // Relative imports to env, payload.config, lib/odoo, lib/ipHash
  if (
    /(?:^|\/)env(?:\.[jt]sx?)?$/.test(normalized) ||
    /(?:^|\/)payload\.config(?:\.[jt]sx?)?$/.test(normalized) ||
    /(?:^|\/)lib\/odoo(?:\/|$|\.[jt]sx?$)/.test(normalized) ||
    /(?:^|\/)lib\/ipHash(?:\.[jt]sx?)?$/.test(normalized)
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

/** @type {import('eslint').Rule.RuleModule} */
export const noServerInClientRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing server-only modules (@/env, @payload-config, payload, @/lib/odoo/**, @/lib/ipHash, *.server.ts(x)) inside "use client" modules (S4).',
    },
    messages: {
      forbiddenServerImport:
        'Server-only module "{{source}}" must not be imported in a "use client" component (S4).',
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
        checkImportSource(node, node.source.value)
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          checkImportSource(node, node.source.value)
        }
      },
      ExportAllDeclaration(node) {
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
