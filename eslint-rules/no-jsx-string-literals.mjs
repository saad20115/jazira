/**
 * Custom ESLint rule `local/no-jsx-string-literals` (`handoff/PLAN.md` §"Phase 3 rules").
 *
 * Enforces that every visible text, number, or user-facing label in `src/app/(frontend)` and
 * `src/components` (excluding `src/components/admin`, `src/i18n`, and test files) comes from
 * the CMS (`src/lib/cms/*`) or the typed UI chrome dictionaries (`src/i18n/{ar,en}.ts`).
 *
 * Allow-list:
 * - Pure punctuation / whitespace (`•`, `/`, `—`, `–`, `:`, `|`, `·`, `(`, `)`, `,`, `.`, `+`, `-`, etc.)
 * - Files in `src/i18n/`, `src/components/admin/` (Payload Admin UI), and `*.test.*` / `*.spec.*`
 */

const LETTER_OR_DIGIT_REGEX = /[\p{L}\p{N}]/u

const USER_FACING_JSX_ATTRIBUTES = new Set([
  'alt',
  'aria-description',
  'aria-label',
  'aria-placeholder',
  'aria-roledescription',
  'aria-valuetext',
  'label',
  'placeholder',
  'title',
])

/**
 * Checks whether a file path is inside `src/app/(frontend)` or public `src/components`
 * (excluding `src/components/admin`, `src/i18n`, and tests).
 * @param {string} filename
 * @returns {boolean}
 */
export function isGuardedPublicJsxFile(filename) {
  if (!filename) return false
  const normalized = filename.replace(/\\/g, '/')

  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(normalized)) {
    return false
  }
  if (normalized.includes('/src/i18n/') || normalized.includes('/src/components/admin/')) {
    return false
  }

  return (
    normalized.includes('/src/app/(frontend)/') || normalized.includes('/src/components/')
  )
}

/**
 * Returns true if the text contains at least one letter or digit (i.e. is not pure whitespace/punctuation).
 * @param {string} text
 * @returns {boolean}
 */
export function hasDisallowedLiteralContent(text) {
  const trimmed = text.trim()
  if (!trimmed) return false
  return LETTER_OR_DIGIT_REGEX.test(trimmed)
}

/** @type {import('eslint').Rule.RuleModule} */
export const noJsxStringLiteralsRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded string/number literals in JSX under src/app/(frontend) and src/components; use CMS data (src/lib/cms/*) or UI chrome dictionaries (src/i18n/{ar,en}.ts).',
    },
    schema: [],
    messages: {
      noJsxTextLiteral:
        'Hardcoded JSX text "{{text}}" is forbidden in public frontend/components. Source business content from src/lib/cms/* and UI chrome from src/i18n/{ar,en}.ts.',
      noJsxExpressionLiteral:
        'Hardcoded JSX expression literal "{{text}}" is forbidden in public frontend/components. Source business content from src/lib/cms/* and UI chrome from src/i18n/{ar,en}.ts.',
      noJsxAttributeLiteral:
        'Hardcoded user-facing JSX attribute {{attr}}="{{text}}" is forbidden. Source accessible labels/placeholders from src/i18n/{ar,en}.ts or CMS data.',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? ''
    if (!isGuardedPublicJsxFile(filename)) {
      return {}
    }

    return {
      JSXText(node) {
        const raw = typeof node.value === 'string' ? node.value : ''
        if (hasDisallowedLiteralContent(raw)) {
          context.report({
            node,
            messageId: 'noJsxTextLiteral',
            data: {
              text: raw.trim().slice(0, 48),
            },
          })
        }
      },

      JSXExpressionContainer(node) {
        if (node.parent && node.parent.type === 'JSXAttribute') {
          return
        }
        const expr = node.expression
        if (!expr) return

        if (expr.type === 'Literal' && (typeof expr.value === 'string' || typeof expr.value === 'number')) {
          const text = String(expr.value)
          if (hasDisallowedLiteralContent(text)) {
            context.report({
              node: expr,
              messageId: 'noJsxExpressionLiteral',
              data: {
                text: text.trim().slice(0, 48),
              },
            })
          }
        } else if (expr.type === 'TemplateLiteral' && expr.expressions.length === 0) {
          const text = expr.quasis.map((q) => q.value.cooked ?? q.value.raw).join('')
          if (hasDisallowedLiteralContent(text)) {
            context.report({
              node: expr,
              messageId: 'noJsxExpressionLiteral',
              data: {
                text: text.trim().slice(0, 48),
              },
            })
          }
        }
      },

      JSXAttribute(node) {
        const attrName =
          node.name?.type === 'JSXIdentifier'
            ? node.name.name
            : node.name?.type === 'JSXNamespacedName'
              ? `${node.name.namespace.name}:${node.name.name.name}`
              : ''
        if (!USER_FACING_JSX_ATTRIBUTES.has(attrName) || !node.value) {
          return
        }

        if (node.value.type === 'Literal' && typeof node.value.value === 'string') {
          if (hasDisallowedLiteralContent(node.value.value)) {
            context.report({
              node: node.value,
              messageId: 'noJsxAttributeLiteral',
              data: {
                attr: attrName,
                text: node.value.value.trim().slice(0, 48),
              },
            })
          }
        } else if (node.value.type === 'JSXExpressionContainer') {
          const expr = node.value.expression
          if (expr.type === 'Literal' && typeof expr.value === 'string') {
            if (hasDisallowedLiteralContent(expr.value)) {
              context.report({
                node: expr,
                messageId: 'noJsxAttributeLiteral',
                data: {
                  attr: attrName,
                  text: expr.value.trim().slice(0, 48),
                },
              })
            }
          }
        }
      },
    }
  },
}
