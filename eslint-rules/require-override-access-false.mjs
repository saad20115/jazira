/**
 * Custom ESLint rule `local/require-override-access-false` (Z6, P2-T8 Scope 3).
 *
 * In `src/app/(frontend)/**` and `src/lib/cms/**`, Payload Local API calls
 * (`find`, `findByID`, `findGlobal`, `count`, `findDistinct`, `findVersions`,
 * `findGlobalVersions`, `create`, `update`, `delete`, `updateGlobal`) default to
 * `overrideAccess: true` unless `overrideAccess: false` is explicitly passed.
 *
 * Every such call must either:
 * 1. Pass `overrideAccess: false` in its first options object argument, OR
 * 2. Have an explicit justification comment (`// z6-allow-override-access: <reason>`)
 *    on the preceding line, the call line, or the `overrideAccess` property line.
 */

export const GUARDED_PAYLOAD_METHODS = new Set([
  'find',
  'findByID',
  'findGlobal',
  'count',
  'findDistinct',
  'findVersions',
  'findGlobalVersions',
  'create',
  'update',
  'delete',
  'updateGlobal',
])

const JUSTIFICATION_COMMENT_REGEX =
  /(?:z6-allow-override-access\s*:\s*\S+|overrideAccess\s*:\s*true\s*(?:--|—|:|-)\s*\S+)/i

/**
 * @param {string} filename
 * @returns {boolean}
 */
export function isFrontendOrCmsFile(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  const normalized = filename.replace(/\\/g, '/')
  return (
    /(?:^|\/)src\/app\/\(frontend\)\//.test(normalized) ||
    /(?:^|\/)src\/lib\/cms(?:\/|$)/.test(normalized)
  )
}

/**
 * @param {import('eslint').Rule.Node} expr
 * @returns {boolean}
 */
function isPayloadLikeReceiver(expr) {
  if (!expr || typeof expr !== 'object') {
    return false
  }
  if (expr.type === 'Identifier') {
    return expr.name === 'payload' || expr.name.toLowerCase().endsWith('payload')
  }
  if (expr.type === 'MemberExpression' && !expr.computed && expr.property.type === 'Identifier') {
    return expr.property.name === 'payload' || expr.property.name.toLowerCase().endsWith('payload')
  }
  if (expr.type === 'AwaitExpression') {
    return isPayloadLikeReceiver(expr.argument)
  }
  if (expr.type === 'CallExpression') {
    if (expr.callee.type === 'Identifier') {
      return (
        expr.callee.name === 'getPayload' ||
        expr.callee.name === 'getPayloadClient' ||
        expr.callee.name.toLowerCase().includes('payload')
      )
    }
    if (
      expr.callee.type === 'MemberExpression' &&
      !expr.callee.computed &&
      expr.callee.property.type === 'Identifier'
    ) {
      return expr.callee.property.name.toLowerCase().includes('payload')
    }
  }
  return false
}

/**
 * @param {import('eslint').SourceCode} sourceCode
 * @param {import('eslint').Rule.Node} callNode
 * @param {import('eslint').Rule.Node | null} overridePropNode
 * @returns {boolean}
 */
function hasJustificationComment(sourceCode, callNode, overridePropNode) {
  const comments = sourceCode.getAllComments()
  if (!Array.isArray(comments) || comments.length === 0) {
    return false
  }

  const callStartLine = callNode.loc?.start.line ?? -1
  const callEndLine = callNode.loc?.end.line ?? -1
  const propLine = overridePropNode?.loc?.start.line ?? -1

  for (const comment of comments) {
    const commentEndLine = comment.loc?.end.line ?? -1
    const commentStartLine = comment.loc?.start.line ?? -1
    const isNearCall =
      commentEndLine === callStartLine - 1 ||
      (commentStartLine >= callStartLine && commentEndLine <= callEndLine)
    const isNearProp =
      propLine !== -1 && (commentEndLine === propLine - 1 || commentStartLine === propLine)

    if ((isNearCall || isNearProp) && JUSTIFICATION_COMMENT_REGEX.test(comment.value)) {
      return true
    }
  }

  return false
}

/** @type {import('eslint').Rule.RuleModule} */
export const requireOverrideAccessFalseRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require `overrideAccess: false` (or a `// z6-allow-override-access: <reason>` justification comment) on Payload Local API calls inside `src/app/(frontend)` and `src/lib/cms` (Z6).',
    },
    messages: {
      missingOverrideAccessFalse:
        'Payload Local API call "{{method}}()" in frontend/CMS code must pass "{ overrideAccess: false }" (or include a "// z6-allow-override-access: <reason>" comment) (Z6).',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename()
    if (!isFrontendOrCmsFile(filename)) {
      return {}
    }

    const sourceCode = context.sourceCode ?? context.getSourceCode()

    return {
      CallExpression(node) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.computed ||
          node.callee.property.type !== 'Identifier'
        ) {
          return
        }

        const methodName = node.callee.property.name
        if (!GUARDED_PAYLOAD_METHODS.has(methodName)) {
          return
        }

        if (!isPayloadLikeReceiver(node.callee.object)) {
          return
        }

        const firstArg = node.arguments[0]
        /** @type {import('eslint').Rule.Node | null} */
        let overridePropNode = null
        let hasLiteralFalse = false

        if (firstArg && firstArg.type === 'ObjectExpression') {
          for (const prop of firstArg.properties) {
            if (
              prop.type === 'Property' &&
              !prop.computed &&
              ((prop.key.type === 'Identifier' && prop.key.name === 'overrideAccess') ||
                (prop.key.type === 'Literal' && prop.key.value === 'overrideAccess'))
            ) {
              overridePropNode = prop
              if (prop.value.type === 'Literal' && prop.value.value === false) {
                hasLiteralFalse = true
              }
            }
          }
        }

        if (hasLiteralFalse) {
          return
        }

        if (hasJustificationComment(sourceCode, node, overridePropNode)) {
          return
        }

        context.report({
          node: overridePropNode ?? node,
          messageId: 'missingOverrideAccessFalse',
          data: { method: methodName },
        })
      },
    }
  },
}

export default requireOverrideAccessFalseRule
