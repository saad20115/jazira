/**
 * Custom ESLint rule `local/require-override-access-false` (Z6, P2-T8 Scope 3, R-6, & R-12).
 *
 * Enforces three defense-in-depth layers for Z6:
 * 1. Repo-wide import and re-export ban (`ImportDeclaration`, `ExportNamedDeclaration`,
 *    `ExportAllDeclaration`, `ImportExpression`, and `require(...)`): importing or re-exporting
 *    `payload`, `payload/*`, `@payload-config`, `@/payload.config`, or `getPayload` is a lint
 *    error everywhere in the repository except the explicit allow-list of server modules
 *    (`isAllowedPayloadServerFile`).
 * 2. Call-site verification in `src/app/(frontend)/**`, `src/components/**`, and
 *    `src/lib/cms/**`: every Payload Local API call (`find`, `findByID`, `findGlobal`,
 *    `count`, `findDistinct`, `findVersions`, `findVersionByID`, `findGlobalVersions`,
 *    `findGlobalVersionByID`, `countVersions`, `countGlobalVersions`, `create`, `update`,
 *    `delete`, `updateGlobal`, `restoreVersion`, `restoreGlobalVersion`, `duplicate`) —
 *    whether invoked via `payload.<method>(...)`, an aliased receiver (`client.<method>`),
 *    computed member access (`payload['find']`), `.call()`/`.apply()`/`.bind()`, or a
 *    destructured method (`const { find } = payload; find(...)`) — must pass an
 *    un-overridden `{ overrideAccess: false }` in its options object (no trailing spread
 *    or duplicate key that could overwrite it).
 * 3. Only the single documented justification comment form
 *    (`// z6-allow-override-access: <reason>`) is accepted when an intentional
 *    exception is required.
 */

export const GUARDED_PAYLOAD_METHODS = new Set([
  'find',
  'findByID',
  'findGlobal',
  'count',
  'findDistinct',
  'findVersions',
  'findVersionByID',
  'findGlobalVersions',
  'findGlobalVersionByID',
  'countVersions',
  'countGlobalVersions',
  'create',
  'update',
  'delete',
  'updateGlobal',
  'restoreVersion',
  'restoreGlobalVersion',
  'duplicate',
])

const JUSTIFICATION_COMMENT_REGEX = /z6-allow-override-access\s*:\s*\S+/

/**
 * Explicit allow-list of server/config/test/script modules permitted to import or
 * re-export `payload`, `payload/*`, `@payload-config`, or `@/payload.config` (`R-12`).
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isAllowedPayloadServerFile(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  const normalized = filename.replace(/\\/g, '/')
  if (/\.test\.[cm]?[jt]sx?$/.test(normalized)) {
    return true
  }
  return (
    /(?:^|\/)src\/payload\.config\.[cm]?[jt]s$/.test(normalized) ||
    /(?:^|\/)src\/instrumentation\.[cm]?[jt]s$/.test(normalized) ||
    /(?:^|\/)src\/lib\/cms\/client\.[cm]?[jt]s$/.test(normalized) ||
    /(?:^|\/)src\/collections\//.test(normalized) ||
    /(?:^|\/)src\/globals\//.test(normalized) ||
    /(?:^|\/)src\/fields\//.test(normalized) ||
    /(?:^|\/)src\/hooks\//.test(normalized) ||
    /(?:^|\/)src\/access\//.test(normalized) ||
    /(?:^|\/)src\/security\//.test(normalized) ||
    /(?:^|\/)src\/migrations\//.test(normalized) ||
    /(?:^|\/)src\/app\/\(payload\)\//.test(normalized) ||
    /(?:^|\/)scripts\//.test(normalized) ||
    /(?:^|\/)tests\//.test(normalized) ||
    /(?:^|\/)(?:next|vitest|playwright|eslint)\.config\.[cm]?[jt]s$/.test(normalized)
  )
}

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
    /(?:^|\/)src\/components\//.test(normalized) ||
    /(?:^|\/)src\/lib\/cms(?:\/|$)/.test(normalized)
  )
}

/**
 * Returns true when `filename` is NOT in the explicit server allow-list (`R-12`),
 * meaning importing or re-exporting `payload` or `@payload-config` is forbidden.
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isPayloadImportForbiddenFile(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  return !isAllowedPayloadServerFile(filename)
}

/**
 * @param {unknown} sourceValue
 * @returns {boolean}
 */
export function isForbiddenPayloadModuleSource(sourceValue) {
  if (typeof sourceValue !== 'string') {
    return false
  }
  const trimmed = sourceValue.trim().replace(/\\/g, '/')
  return (
    trimmed === 'payload' ||
    trimmed.startsWith('payload/') ||
    trimmed === '@payload-config' ||
    trimmed === '@/payload.config' ||
    trimmed === '@/payload.config.ts' ||
    /(?:^|\/)payload\.config(?:\.[cm]?[jt]s)?$/.test(trimmed)
  )
}

/**
 * @param {import('eslint').Rule.Node | null | undefined} propNode
 * @returns {string | null}
 */
function getPropertyName(propNode) {
  if (!propNode || typeof propNode !== 'object') {
    return null
  }
  if (propNode.type === 'Identifier') {
    return propNode.name
  }
  if (propNode.type === 'Literal' && typeof propNode.value === 'string') {
    return propNode.value
  }
  return null
}

/**
 * @param {import('eslint').Rule.Node | null | undefined} memberNode
 * @returns {string | null}
 */
function getMemberMethodName(memberNode) {
  if (!memberNode || memberNode.type !== 'MemberExpression') {
    return null
  }
  if (!memberNode.computed && memberNode.property.type === 'Identifier') {
    return memberNode.property.name
  }
  if (
    memberNode.computed &&
    memberNode.property.type === 'Literal' &&
    typeof memberNode.property.value === 'string'
  ) {
    return memberNode.property.value
  }
  return null
}

/**
 * @param {import('eslint').Rule.Node | null | undefined} expr
 * @param {Set<string>} trackedPayloadVars
 * @returns {boolean}
 */
function isPayloadLikeExpression(expr, trackedPayloadVars) {
  if (!expr || typeof expr !== 'object') {
    return false
  }
  if (expr.type === 'Identifier') {
    return (
      trackedPayloadVars.has(expr.name) ||
      expr.name === 'payload' ||
      expr.name === 'client' ||
      expr.name.toLowerCase().includes('payload')
    )
  }
  if (expr.type === 'AwaitExpression') {
    return isPayloadLikeExpression(expr.argument, trackedPayloadVars)
  }
  if (expr.type === 'ChainExpression') {
    return isPayloadLikeExpression(expr.expression, trackedPayloadVars)
  }
  if (expr.type === 'MemberExpression') {
    const propName = getMemberMethodName(expr)
    if (propName && (propName === 'payload' || propName.toLowerCase().includes('payload'))) {
      return true
    }
    return false
  }
  if (expr.type === 'CallExpression') {
    if (expr.callee.type === 'Identifier') {
      return (
        expr.callee.name === 'getPayload' ||
        expr.callee.name === 'getPayloadClient' ||
        expr.callee.name.toLowerCase().includes('payload')
      )
    }
    if (expr.callee.type === 'MemberExpression') {
      const propName = getMemberMethodName(expr.callee)
      return Boolean(propName && propName.toLowerCase().includes('payload'))
    }
  }
  return false
}

/**
 * Checks whether an options ObjectExpression safely sets `overrideAccess: false`
 * without being clobbered by a subsequent spread (`...other`) or duplicate key.
 *
 * @param {import('eslint').Rule.Node | undefined} optionsArg
 * @returns {{ hasUnclobberedLiteralFalse: boolean, overridePropNode: import('eslint').Rule.Node | null }}
 */
function inspectOptionsObject(optionsArg) {
  /** @type {import('eslint').Rule.Node | null} */
  let overridePropNode = null
  let hasUnclobberedLiteralFalse = false

  if (!optionsArg || optionsArg.type !== 'ObjectExpression') {
    return { hasUnclobberedLiteralFalse: false, overridePropNode: null }
  }

  for (const prop of optionsArg.properties) {
    if (prop.type === 'SpreadElement') {
      if (hasUnclobberedLiteralFalse) {
        hasUnclobberedLiteralFalse = false
      }
      continue
    }
    if (prop.type === 'Property') {
      const keyName = !prop.computed
        ? getPropertyName(prop.key)
        : prop.key.type === 'Literal' && typeof prop.key.value === 'string'
          ? prop.key.value
          : null

      if (keyName === 'overrideAccess') {
        overridePropNode = prop
        if (prop.value.type === 'Literal' && prop.value.value === false) {
          hasUnclobberedLiteralFalse = true
        } else {
          hasUnclobberedLiteralFalse = false
        }
      } else if (prop.computed && hasUnclobberedLiteralFalse) {
        hasUnclobberedLiteralFalse = false
      }
    }
  }

  return { hasUnclobberedLiteralFalse, overridePropNode }
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
        'Ban direct Payload imports and re-exports outside the server allow-list, and require un-overridden `overrideAccess: false` (or `// z6-allow-override-access: <reason>`) on all Payload Local API calls in frontend/CMS code (Z6, R-6, R-12).',
    },
    messages: {
      forbiddenPayloadImport:
        'Importing or re-exporting "{{source}}" is forbidden outside the server allow-list (`src/lib/cms/client.ts` is the only allowed CMS wrapper). Use `cmsFind`, `cmsFindByID`, `cmsFindGlobal`, or `cmsCount` instead (Z6, R-6, R-12).',
      missingOverrideAccessFalse:
        'Payload Local API call "{{method}}()" in frontend/CMS code must pass an un-overridden "{ overrideAccess: false }" (or include a "// z6-allow-override-access: <reason>" comment) (Z6).',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename()
    const forbidImports = isPayloadImportForbiddenFile(filename)
    const checkCalls = isFrontendOrCmsFile(filename)
    if (!forbidImports && !checkCalls) {
      return {}
    }

    const sourceCode = context.sourceCode ?? context.getSourceCode()

    /** @type {Set<string>} */
    const trackedPayloadVars = new Set(['payload', 'client'])
    /** @type {Map<string, string>} localVarName -> guardedMethodName */
    const destructuredPayloadMethods = new Map()

    /**
     * @param {import('eslint').Rule.Node | null | undefined} pattern
     */
    function trackObjectPatternFromPayload(pattern) {
      if (!pattern || pattern.type !== 'ObjectPattern') {
        return
      }
      for (const prop of pattern.properties) {
        if (prop.type === 'Property') {
          const origName = getPropertyName(prop.key)
          if (origName && GUARDED_PAYLOAD_METHODS.has(origName)) {
            if (prop.value.type === 'Identifier') {
              destructuredPayloadMethods.set(prop.value.name, origName)
            } else if (
              prop.value.type === 'AssignmentPattern' &&
              prop.value.left.type === 'Identifier'
            ) {
              destructuredPayloadMethods.set(prop.value.left.name, origName)
            }
          }
        }
      }
    }

    /**
     * @param {import('eslint').Rule.Node} node
     * @param {unknown} sourceVal
     * @param {Array<import('eslint').Rule.Node>} [specifiers]
     */
    function checkModuleSourceAndSpecifiers(node, sourceVal, specifiers) {
      if (!forbidImports) {
        return
      }
      if (isForbiddenPayloadModuleSource(sourceVal)) {
        context.report({
          node,
          messageId: 'forbiddenPayloadImport',
          data: { source: String(sourceVal) },
        })
        return
      }
      for (const spec of specifiers ?? []) {
        if (
          spec.type === 'ImportSpecifier' &&
          spec.imported.type === 'Identifier' &&
          (spec.imported.name === 'getPayload' || spec.imported.name === 'getPayloadClient')
        ) {
          context.report({
            node: spec,
            messageId: 'forbiddenPayloadImport',
            data: { source: spec.imported.name },
          })
        } else if (spec.type === 'ExportSpecifier') {
          const localName = spec.local.type === 'Identifier' ? spec.local.name : ''
          const exportedName = spec.exported.type === 'Identifier' ? spec.exported.name : ''
          if (
            localName === 'getPayload' ||
            localName === 'getPayloadClient' ||
            exportedName === 'getPayload' ||
            exportedName === 'getPayloadClient'
          ) {
            context.report({
              node: spec,
              messageId: 'forbiddenPayloadImport',
              data: { source: exportedName || localName },
            })
          }
        }
      }
    }

    return {
      ImportDeclaration(node) {
        checkModuleSourceAndSpecifiers(node, node.source?.value, node.specifiers)
      },

      ExportNamedDeclaration(node) {
        checkModuleSourceAndSpecifiers(node, node.source?.value, node.specifiers)
      },

      ExportAllDeclaration(node) {
        checkModuleSourceAndSpecifiers(node, node.source?.value, [])
      },

      ImportExpression(node) {
        if (!forbidImports) {
          return
        }
        if (node.source?.type === 'Literal' && isForbiddenPayloadModuleSource(node.source.value)) {
          context.report({
            node,
            messageId: 'forbiddenPayloadImport',
            data: { source: String(node.source.value) },
          })
        }
      },

      VariableDeclarator(node) {
        if (!checkCalls || !node.init) {
          return
        }
        if (isPayloadLikeExpression(node.init, trackedPayloadVars)) {
          if (node.id.type === 'Identifier') {
            trackedPayloadVars.add(node.id.name)
          } else if (node.id.type === 'ObjectPattern') {
            trackObjectPatternFromPayload(node.id)
          }
          return
        }
        if (node.id.type === 'Identifier' && node.init.type === 'MemberExpression') {
          const methodName = getMemberMethodName(node.init)
          if (
            methodName &&
            GUARDED_PAYLOAD_METHODS.has(methodName) &&
            isPayloadLikeExpression(node.init.object, trackedPayloadVars)
          ) {
            destructuredPayloadMethods.set(node.id.name, methodName)
          }
        }
      },

      AssignmentExpression(node) {
        if (!checkCalls) {
          return
        }
        if (isPayloadLikeExpression(node.right, trackedPayloadVars)) {
          if (node.left.type === 'Identifier') {
            trackedPayloadVars.add(node.left.name)
          } else if (node.left.type === 'ObjectPattern') {
            trackObjectPatternFromPayload(node.left)
          }
        }
      },

      CallExpression(node) {
        const callee = node.callee.type === 'ChainExpression' ? node.callee.expression : node.callee

        // Check `require('payload')` in any non-allowlisted file
        if (
          forbidImports &&
          callee.type === 'Identifier' &&
          callee.name === 'require' &&
          node.arguments[0]?.type === 'Literal' &&
          isForbiddenPayloadModuleSource(node.arguments[0].value)
        ) {
          context.report({
            node,
            messageId: 'forbiddenPayloadImport',
            data: { source: String(node.arguments[0].value) },
          })
          return
        }

        if (!checkCalls) {
          return
        }

        /** @type {string | null} */
        let matchedMethodName = null
        /** @type {import('eslint').Rule.Node | undefined} */
        let optionsArg = undefined
        let requiresAutomaticFalse = true

        // Case 1: Destructured / aliased method identifier `find({ ... })`
        if (callee.type === 'Identifier' && destructuredPayloadMethods.has(callee.name)) {
          matchedMethodName = destructuredPayloadMethods.get(callee.name) ?? callee.name
          optionsArg = node.arguments[0]
        } else if (callee.type === 'MemberExpression') {
          const propName = getMemberMethodName(callee)

          // Case 2: `payload.find.call(payload, { ... })`, `payload['find'].apply(payload, [{ ... }])`, `.bind(payload, { ... })`
          if (
            (propName === 'call' || propName === 'apply' || propName === 'bind') &&
            callee.object.type === 'MemberExpression'
          ) {
            const innerMethod = getMemberMethodName(callee.object)
            if (
              innerMethod &&
              GUARDED_PAYLOAD_METHODS.has(innerMethod) &&
              isPayloadLikeExpression(callee.object.object, trackedPayloadVars)
            ) {
              matchedMethodName = innerMethod
              if (propName === 'apply') {
                const arrArg = node.arguments[1]
                optionsArg =
                  arrArg && arrArg.type === 'ArrayExpression'
                    ? (arrArg.elements[0] ?? undefined)
                    : undefined
              } else {
                optionsArg = node.arguments[1]
              }
            }
          } else if (propName && GUARDED_PAYLOAD_METHODS.has(propName)) {
            // Case 3: `payload.find(...)`, `payload['find'](...)`, `client.find(...)`, `aliased.find(...)`
            if (isPayloadLikeExpression(callee.object, trackedPayloadVars)) {
              matchedMethodName = propName
              optionsArg = node.arguments[0]
            } else if (
              node.arguments[0]?.type === 'ObjectExpression' &&
              node.arguments[0].properties.some(
                (p) =>
                  p.type === 'Property' &&
                  (getPropertyName(p.key) === 'collection' || getPropertyName(p.key) === 'slug'),
              )
            ) {
              matchedMethodName = propName
              optionsArg = node.arguments[0]
            } else {
              requiresAutomaticFalse = false
            }
          }
        }

        if (!matchedMethodName || !requiresAutomaticFalse) {
          return
        }

        const { hasUnclobberedLiteralFalse, overridePropNode } = inspectOptionsObject(optionsArg)

        if (hasUnclobberedLiteralFalse) {
          return
        }

        if (hasJustificationComment(sourceCode, node, overridePropNode)) {
          return
        }

        context.report({
          node: overridePropNode ?? node,
          messageId: 'missingOverrideAccessFalse',
          data: { method: matchedMethodName },
        })
      },
    }
  },
}

export default requireOverrideAccessFalseRule
