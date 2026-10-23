/**
 * Custom ESLint rule `local/no-jsx-string-literals` (`handoff/PLAN.md` §"Phase 3 rules", `R-6`).
 *
 * Enforces that every visible text, number, or user-facing label in `src/app/(frontend)` and
 * `src/components` (excluding `src/components/admin`, `src/i18n`, dev-only `_specimen` / `styleguide`
 * routes, and test files) comes from the CMS (`src/lib/cms/*`) or the typed UI chrome dictionaries
 * (`src/i18n/{ar,en}.ts`).
 *
 * Catches (`R-6`):
 * - Direct `JSXText`
 * - `JSXExpressionContainer` & user-facing `JSXAttribute` values containing:
 *   - String / number `Literal`s
 *   - `TemplateLiteral`s (checking both quasis even when `expressions.length > 0`, and template expressions)
 *   - `ConditionalExpression` (`cond ? 'Yes' : 'No'`)
 *   - `LogicalExpression` (`x || 'Fallback'`, `x ?? 'Fallback'`, `x && 'Text'`)
 *   - `BinaryExpression` (`'a' + 'b'`)
 *   - `ArrayExpression` and `.join()` / `.concat()` / `String()` calls (`['Hardcoded'].join('')`)
 *   - `Identifier` references to local or module-level variables initialized with hardcoded literals (`const T = 'Hardcoded'; <p>{T}</p>`)
 *   - `SequenceExpression`, `ParenthesizedExpression`, `TSAsExpression`, `TSSatisfiesExpression`
 */

const LETTER_OR_DIGIT_REGEX = /[\p{L}\p{N}]/u

export const USER_FACING_JSX_ATTRIBUTES = new Set([
  'alt',
  'aria-description',
  'aria-label',
  'aria-placeholder',
  'aria-roledescription',
  'aria-valuetext',
  'ariaLabel',
  'caption',
  'content',
  'copyright',
  'ctaBody',
  'ctaButtonLabel',
  'ctaEyebrow',
  'ctaLabel',
  'ctaTitle',
  'defaultValue',
  'description',
  'eyebrow',
  'heading',
  'hideLabel',
  'label',
  'placeholder',
  'showLabel',
  'siteName',
  'subtitle',
  'text',
  'title',
  'tooltipLabel',
  'value',
])

/**
 * Checks whether a file path is inside `src/app/(frontend)` or public `src/components`
 * (excluding `src/components/admin`, `src/components/icons`, `src/i18n`, dev-only `_specimen`
 * and `styleguide` routes, and tests).
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isGuardedPublicJsxFile(filename) {
  if (!filename) return false
  const normalized = filename.replace(/\\/g, '/')

  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(normalized)) {
    return false
  }
  if (
    normalized.includes('/src/i18n/') ||
    normalized.includes('/src/components/admin/') ||
    normalized.includes('/src/components/icons/') ||
    normalized.includes('/_specimen/') ||
    normalized.includes('/%5Fspecimen/') ||
    normalized.includes('/styleguide/')
  ) {
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

/**
 * Checks if a JSXOpeningElement is `<option>` or `<input type="hidden">`.
 * @param {import('eslint').Rule.Node | null | undefined} jsxAttributeNode
 * @param {string} attrName
 * @returns {boolean}
 */
function isExemptValueAttributeOnElement(jsxAttributeNode, attrName) {
  if (attrName !== 'value' && attrName !== 'defaultValue') {
    return false
  }
  const openingEl = jsxAttributeNode?.parent
  if (!openingEl || openingEl.type !== 'JSXOpeningElement') {
    return false
  }
  const elName =
    openingEl.name?.type === 'JSXIdentifier' ? openingEl.name.name : ''
  if (elName === 'option') {
    return true
  }
  if (elName === 'input') {
    const hasHiddenType = (openingEl.attributes ?? []).some(
      (attr) =>
        attr.type === 'JSXAttribute' &&
        attr.name?.type === 'JSXIdentifier' &&
        attr.name.name === 'type' &&
        attr.value?.type === 'Literal' &&
        attr.value.value === 'hidden',
    )
    if (hasHiddenType) {
      return true
    }
  }
  return false
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

    /** @type {Map<string, string>} varName -> first hardcoded literal text */
    const taintedLiteralBindings = new Map()

    /**
     * Extracts the first disallowed literal string/number from an arbitrary AST expression,
     * recursing into ternaries, logical/binary expressions, template literals, arrays,
     * `.join()`/`.concat()`/`String()` calls, and tainted variable bindings (`R-6`).
     *
     * @param {import('eslint').Rule.Node | null | undefined} expr
     * @param {Set<string>} [seenVars]
     * @returns {Array<{ node: import('eslint').Rule.Node; text: string }>}
     */
    function collectDisallowedLiteralsInExpression(expr, seenVars = new Set()) {
      /** @type {Array<{ node: import('eslint').Rule.Node; text: string }>} */
      const hits = []

      /**
       * @param {import('eslint').Rule.Node | null | undefined} cur
       */
      function visit(cur) {
        if (!cur || typeof cur !== 'object') {
          return
        }

        switch (cur.type) {
          case 'Literal': {
            if (typeof cur.value === 'string' || typeof cur.value === 'number') {
              const text = String(cur.value)
              if (hasDisallowedLiteralContent(text)) {
                hits.push({ node: cur, text: text.trim().slice(0, 48) })
              }
            }
            return
          }

          case 'TemplateLiteral': {
            for (const quasi of cur.quasis ?? []) {
              const rawQuasi = quasi.value?.cooked ?? quasi.value?.raw ?? ''
              if (hasDisallowedLiteralContent(rawQuasi)) {
                hits.push({ node: quasi, text: rawQuasi.trim().slice(0, 48) })
              }
            }
            for (const subExpr of cur.expressions ?? []) {
              visit(subExpr)
            }
            return
          }

          case 'ConditionalExpression': {
            visit(cur.consequent)
            visit(cur.alternate)
            return
          }

          case 'LogicalExpression': {
            visit(cur.left)
            visit(cur.right)
            return
          }

          case 'BinaryExpression': {
            if (cur.operator === '+') {
              visit(cur.left)
              visit(cur.right)
            }
            return
          }

          case 'ArrayExpression': {
            for (const el of cur.elements ?? []) {
              if (el) {
                visit(el.type === 'SpreadElement' ? el.argument : el)
              }
            }
            return
          }

          case 'ObjectExpression': {
            for (const prop of cur.properties ?? []) {
              if (prop.type === 'Property') {
                visit(prop.value)
              } else if (prop.type === 'SpreadElement') {
                visit(prop.argument)
              }
            }
            return
          }

          case 'ArrowFunctionExpression':
          case 'FunctionExpression': {
            if (cur.body?.type === 'BlockStatement') {
              for (const stmt of cur.body.body ?? []) {
                if (stmt.type === 'ReturnStatement' && stmt.argument) {
                  visit(stmt.argument)
                }
              }
            } else if (cur.body) {
              visit(cur.body)
            }
            return
          }

          case 'MemberExpression': {
            if (cur.object?.type === 'Identifier') {
              visit(cur.object)
            }
            return
          }

          case 'CallExpression': {
            const callee = cur.callee
            if (callee?.type === 'MemberExpression' && !callee.computed && callee.property?.type === 'Identifier') {
              const method = callee.property.name
              if (
                method === 'join' ||
                method === 'concat' ||
                method === 'trim' ||
                method === 'toUpperCase' ||
                method === 'toLowerCase' ||
                method === 'slice' ||
                method === 'replace'
              ) {
                visit(callee.object)
                for (const arg of cur.arguments ?? []) {
                  visit(arg)
                }
              }
            } else if (callee?.type === 'Identifier' && callee.name === 'String') {
              for (const arg of cur.arguments ?? []) {
                visit(arg)
              }
            } else if (callee?.type === 'Identifier') {
              visit(callee)
            } else if (
              callee?.type === 'ArrowFunctionExpression' ||
              callee?.type === 'FunctionExpression' ||
              callee?.type === 'ParenthesizedExpression'
            ) {
              visit(callee)
            }
            return
          }

          case 'Identifier': {
            if (!seenVars.has(cur.name) && taintedLiteralBindings.has(cur.name)) {
              seenVars.add(cur.name)
              const taintedText = taintedLiteralBindings.get(cur.name)
              if (taintedText) {
                hits.push({ node: cur, text: taintedText })
              }
            }
            return
          }

          case 'SequenceExpression': {
            for (const sub of cur.expressions ?? []) {
              visit(sub)
            }
            return
          }

          case 'ParenthesizedExpression':
          case 'TSAsExpression':
          case 'TSSatisfiesExpression':
          case 'TSTypeAssertion':
          case 'TSNonNullExpression':
          case 'ChainExpression': {
            visit(cur.expression)
            return
          }

          default:
            return
        }
      }

      visit(expr)
      return hits
    }

    return {
      VariableDeclarator(node) {
        if (node.id?.type === 'Identifier' && node.init) {
          const initHits = collectDisallowedLiteralsInExpression(node.init)
          if (initHits.length > 0) {
            taintedLiteralBindings.set(node.id.name, initHits[0].text)
          }
        }
      },

      FunctionDeclaration(node) {
        if (node.id?.type === 'Identifier' && node.body?.type === 'BlockStatement') {
          for (const stmt of node.body.body ?? []) {
            if (stmt.type === 'ReturnStatement' && stmt.argument) {
              const retHits = collectDisallowedLiteralsInExpression(stmt.argument)
              if (retHits.length > 0) {
                taintedLiteralBindings.set(node.id.name, retHits[0].text)
                break
              }
            }
          }
        }
      },

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

        const hits = collectDisallowedLiteralsInExpression(expr)
        for (const hit of hits) {
          context.report({
            node: hit.node,
            messageId: 'noJsxExpressionLiteral',
            data: {
              text: hit.text,
            },
          })
        }
      },

      JSXAttribute(node) {
        const attrName =
          node.name?.type === 'JSXIdentifier'
            ? node.name.name
            : node.name?.type === 'JSXNamespacedName'
              ? `${node.name.namespace.name}:${node.name.name.name}`
              : ''
        if (
          !USER_FACING_JSX_ATTRIBUTES.has(attrName) ||
          !node.value ||
          isExemptValueAttributeOnElement(node, attrName)
        ) {
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
          const hits = collectDisallowedLiteralsInExpression(node.value.expression)
          for (const hit of hits) {
            context.report({
              node: hit.node,
              messageId: 'noJsxAttributeLiteral',
              data: {
                attr: attrName,
                text: hit.text,
              },
            })
          }
        }
      },
    }
  },
}
