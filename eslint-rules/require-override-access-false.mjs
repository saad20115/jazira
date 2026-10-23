/**
 * Custom ESLint rule `local/require-override-access-false` (Z6, P2-T8 Scope 3, R-6, R-12, R-21, & R-22).
 *
 * Enforces four defense-in-depth layers for Z6:
 * 1. Repo-wide re-export ban (`R-21`): re-exporting `payload`, `payload/*`, `@payload-config`,
 *    `@/payload.config`, or any binding imported from them (such as `getPayload`) is banned in
 *    EVERY module across the repository except `src/payload.config.ts` and `src/lib/cms/client.ts`
 *    (`isAllowedPayloadReExportFile`).
 * 2. Tightened runtime import allow-list + type-import allowance (`R-12`, `R-21`, `R-22`):
 *    - Runtime value imports of `payload` / `payload/*` are allowed only in `isAllowedPayloadServerFile`
 *      (where `src/fields/*` and `src/security/*` list only the 8 specific files that construct
 *      Payload runtime error classes, and `*.test.*` is exempt ONLY outside `src/app/**` and
 *      `src/components/**`).
 *    - Importing `getPayload`, `@payload-config`, or `@/payload.config` is restricted even further to
 *      `isAllowedGetPayloadEntryFile` (`src/payload.config.ts`, `src/instrumentation.ts`,
 *      `src/lib/cms/client.ts`, `src/app/(payload)/**`, `scripts/**`, `tests/**`, and non-app/non-component
 *      `*.test.*`).
 *    - Type-only imports (`import type { ... } from 'payload'` or `import { type ... } from 'payload'`)
 *      are allowed (`R-22`).
 * 3. Non-literal dynamic `import()` ban (`R-22`): in `src/app/**` and `src/components/**`, every
 *    `import(...)` expression must use a static string literal source (banning ``import(`payload`)``,
 *    `import(x)`, etc.).
 * 4. Call-site verification in `src/app/(frontend)/**`, `src/components/**`, and `src/lib/cms/**`:
 *    every Payload Local API call must pass an un-overridden `{ overrideAccess: false }` (or carry
 *    `// z6-allow-override-access: <reason>`).
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
 * Explicit list of files in `src/fields/` and `src/security/` that require `payload` at runtime
 * for `ValidationError`, `APIError`, `AuthenticationError`, or `LockedAuth` (`R-21`).
 */
export const EXPLICIT_RUNTIME_PAYLOAD_FIELD_AND_SECURITY_FILES = [
  'src/fields/link.ts',
  'src/fields/richText.ts',
  'src/fields/seo.ts',
  'src/fields/slug.ts',
  'src/security/apiError.ts',
  'src/security/loginEnumeration.ts',
  'src/security/passwordPolicy.ts',
  'src/security/uploadValidation.ts',
]

/**
 * Only `src/payload.config.ts` and `src/lib/cms/client.ts` may re-export anything from
 * `payload`, `@payload-config`, or `@/payload.config` (`R-21`).
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isAllowedPayloadReExportFile(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  const normalized = filename.replace(/\\/g, '/')
  return (
    /(?:^|\/)src\/payload\.config\.[cm]?[jt]s$/.test(normalized) ||
    /(?:^|\/)src\/lib\/cms\/client\.[cm]?[jt]s$/.test(normalized)
  )
}

/**
 * Only server entry points, admin routes, scripts, and non-app/non-component tests may import
 * `getPayload`, `@payload-config`, or `@/payload.config` (`R-21`).
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isAllowedGetPayloadEntryFile(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  const normalized = filename.replace(/\\/g, '/')
  if (
    /\.test\.[cm]?[jt]sx?$/.test(normalized) &&
    !/(?:^|\/)src\/app\//.test(normalized) &&
    !/(?:^|\/)src\/components\//.test(normalized)
  ) {
    return true
  }
  return (
    /(?:^|\/)src\/payload\.config\.[cm]?[jt]s$/.test(normalized) ||
    /(?:^|\/)src\/instrumentation\.[cm]?[jt]s$/.test(normalized) ||
    /(?:^|\/)src\/lib\/cms\/client\.[cm]?[jt]s$/.test(normalized) ||
    /(?:^|\/)src\/app\/\(payload\)\//.test(normalized) ||
    /(?:^|\/)scripts\//.test(normalized) ||
    /(?:^|\/)tests\//.test(normalized) ||
    /(?:^|\/)(?:next|vitest|playwright|eslint)\.config\.[cm]?[jt]s$/.test(normalized)
  )
}

/**
 * Explicit allow-list of server/config/test/script modules permitted to import `payload`
 * at runtime (`R-12`, `R-21`).
 * - `src/fields/**` and `src/security/**` are NOT blanket-allowed; only the 8 specific files in
 *   `EXPLICIT_RUNTIME_PAYLOAD_FIELD_AND_SECURITY_FILES` are permitted.
 * - `*.test.*` is exempt ONLY outside `src/app/**` and `src/components/**`.
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isAllowedPayloadServerFile(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  if (isAllowedGetPayloadEntryFile(filename)) {
    return true
  }
  const normalized = filename.replace(/\\/g, '/')
  if (
    EXPLICIT_RUNTIME_PAYLOAD_FIELD_AND_SECURITY_FILES.some((relPath) =>
      normalized.endsWith('/' + relPath) || normalized === relPath,
    )
  ) {
    return true
  }
  return (
    /(?:^|\/)src\/collections\//.test(normalized) ||
    /(?:^|\/)src\/globals\//.test(normalized) ||
    /(?:^|\/)src\/hooks\//.test(normalized) ||
    /(?:^|\/)src\/access\//.test(normalized) ||
    /(?:^|\/)src\/migrations\//.test(normalized)
  )
}

/**
 * Returns true when `filename` is inside `src/app/**` or `src/components/**` (`R-22`).
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isAppOrComponentFile(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  const normalized = filename.replace(/\\/g, '/')
  return /(?:^|\/)src\/(?:app|components)\//.test(normalized)
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
 * Returns true when `filename` is NOT in the explicit server allow-list (`R-12`, `R-21`).
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
 * Returns true when `sourceValue` points to `@payload-config` or `payload.config`.
 *
 * @param {unknown} sourceValue
 * @returns {boolean}
 */
export function isPayloadConfigModuleSource(sourceValue) {
  if (typeof sourceValue !== 'string') {
    return false
  }
  const trimmed = sourceValue.trim().replace(/\\/g, '/')
  return (
    trimmed === '@payload-config' ||
    trimmed === '@/payload.config' ||
    trimmed === '@/payload.config.ts' ||
    /(?:^|\/)payload\.config(?:\.[cm]?[jt]s)?$/.test(trimmed)
  )
}

/**
 * Returns true if an `ImportDeclaration` only imports TypeScript types from `payload` or `payload/*` (`R-22`).
 *
 * @param {import('eslint').Rule.Node} node
 * @returns {boolean}
 */
function isTypeOnlyPayloadImportDeclaration(node) {
  if (!node || node.type !== 'ImportDeclaration') {
    return false
  }
  const sourceVal = node.source?.value
  if (typeof sourceVal !== 'string') {
    return false
  }
  const trimmed = sourceVal.trim()
  if (trimmed !== 'payload' && !trimmed.startsWith('payload/')) {
    return false
  }
  if (node.importKind === 'type') {
    return true
  }
  const specifiers = node.specifiers ?? []
  if (specifiers.length === 0) {
    return false
  }
  return specifiers.every((spec) => spec.type === 'ImportSpecifier' && spec.importKind === 'type')
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
        'Ban direct Payload imports and re-exports outside the server allow-list, ban non-literal import() in src/app/** and src/components/**, and require un-overridden `overrideAccess: false` on all Payload Local API calls in frontend/CMS code (Z6, R-6, R-12, R-21, R-22).',
    },
    messages: {
      forbiddenPayloadImport:
        'Importing "{{source}}" is forbidden outside the server allow-list (`src/lib/cms/client.ts` is the only allowed CMS wrapper). Use `cmsFind`, `cmsFindByID`, `cmsFindGlobal`, or `cmsCount` instead (Z6, R-6, R-12, R-21).',
      forbiddenPayloadReExport:
        'Re-exporting "{{source}}" is forbidden everywhere except `src/payload.config.ts` and `src/lib/cms/client.ts` (Z6, R-21).',
      forbiddenNonLiteralDynamicImport:
        'Non-literal dynamic `import()` is forbidden in `src/app/**` and `src/components/**` (R-22).',
      missingOverrideAccessFalse:
        'Payload Local API call "{{method}}()" in frontend/CMS code must pass an un-overridden "{ overrideAccess: false }" (or include a "// z6-allow-override-access: <reason>" comment) (Z6).',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename()
    const forbidImports = isPayloadImportForbiddenFile(filename)
    const allowGetPayloadEntry = isAllowedGetPayloadEntryFile(filename)
    const allowReExport = isAllowedPayloadReExportFile(filename)
    const inAppOrComponents = isAppOrComponentFile(filename)
    const checkCalls = isFrontendOrCmsFile(filename)

    const sourceCode = context.sourceCode ?? context.getSourceCode()

    /** @type {Set<string>} */
    const trackedPayloadVars = new Set(['payload', 'client'])
    /** @type {Map<string, string>} localVarName -> guardedMethodName */
    const destructuredPayloadMethods = new Map()
    /** @type {Map<string, string>} localBindingName -> sourceName */
    const importedPayloadValueBindings = new Map()

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

    return {
      ImportDeclaration(node) {
        const sourceVal = node.source?.value
        const isPayloadSource = isForbiddenPayloadModuleSource(sourceVal)

        if (isPayloadSource && node.importKind !== 'type') {
          for (const spec of node.specifiers ?? []) {
            if (spec.type === 'ImportSpecifier' && spec.importKind === 'type') {
              continue
            }
            if (spec.local?.type === 'Identifier') {
              importedPayloadValueBindings.set(spec.local.name, String(sourceVal))
            }
          }
        }

        // R-21: Importing @payload-config / @/payload.config or `getPayload` is restricted to `isAllowedGetPayloadEntryFile`
        if (!allowGetPayloadEntry) {
          if (isPayloadConfigModuleSource(sourceVal)) {
            context.report({
              node,
              messageId: 'forbiddenPayloadImport',
              data: { source: String(sourceVal) },
            })
            return
          }
          for (const spec of node.specifiers ?? []) {
            if (
              spec.type === 'ImportSpecifier' &&
              spec.importKind !== 'type' &&
              spec.imported.type === 'Identifier' &&
              (spec.imported.name === 'getPayload' || spec.imported.name === 'getPayloadClient')
            ) {
              context.report({
                node: spec,
                messageId: 'forbiddenPayloadImport',
                data: { source: spec.imported.name },
              })
              return
            }
          }
        }

        if (!forbidImports) {
          return
        }

        // R-22: Allow type-only imports from 'payload' or 'payload/*'
        if (isTypeOnlyPayloadImportDeclaration(node)) {
          return
        }

        if (isPayloadSource) {
          context.report({
            node,
            messageId: 'forbiddenPayloadImport',
            data: { source: String(sourceVal) },
          })
          return
        }

        for (const spec of node.specifiers ?? []) {
          if (
            spec.type === 'ImportSpecifier' &&
            spec.importKind !== 'type' &&
            spec.imported.type === 'Identifier' &&
            (spec.imported.name === 'getPayload' || spec.imported.name === 'getPayloadClient')
          ) {
            context.report({
              node: spec,
              messageId: 'forbiddenPayloadImport',
              data: { source: spec.imported.name },
            })
          }
        }
      },

      ExportNamedDeclaration(node) {
        if (allowReExport) {
          return
        }
        const sourceVal = node.source?.value
        if (isForbiddenPayloadModuleSource(sourceVal)) {
          context.report({
            node,
            messageId: 'forbiddenPayloadReExport',
            data: { source: String(sourceVal) },
          })
          return
        }
        for (const spec of node.specifiers ?? []) {
          if (spec.type === 'ExportSpecifier') {
            const localName = spec.local.type === 'Identifier' ? spec.local.name : ''
            const exportedName = spec.exported.type === 'Identifier' ? spec.exported.name : ''
            if (
              localName === 'getPayload' ||
              localName === 'getPayloadClient' ||
              exportedName === 'getPayload' ||
              exportedName === 'getPayloadClient' ||
              importedPayloadValueBindings.has(localName)
            ) {
              context.report({
                node: spec,
                messageId: 'forbiddenPayloadReExport',
                data: {
                  source:
                    importedPayloadValueBindings.get(localName) || exportedName || localName,
                },
              })
            }
          }
        }
        if (node.declaration?.type === 'VariableDeclaration') {
          for (const decl of node.declaration.declarations) {
            if (
              decl.init?.type === 'Identifier' &&
              (decl.init.name === 'getPayload' ||
                decl.init.name === 'getPayloadClient' ||
                importedPayloadValueBindings.has(decl.init.name))
            ) {
              context.report({
                node: decl,
                messageId: 'forbiddenPayloadReExport',
                data: {
                  source:
                    importedPayloadValueBindings.get(decl.init.name) || decl.init.name,
                },
              })
            }
          }
        }
      },

      ExportAllDeclaration(node) {
        if (allowReExport) {
          return
        }
        const sourceVal = node.source?.value
        if (isForbiddenPayloadModuleSource(sourceVal)) {
          context.report({
            node,
            messageId: 'forbiddenPayloadReExport',
            data: { source: String(sourceVal) },
          })
        }
      },

      ExportDefaultDeclaration(node) {
        if (allowReExport) {
          return
        }
        if (
          node.declaration?.type === 'Identifier' &&
          (node.declaration.name === 'getPayload' ||
            node.declaration.name === 'getPayloadClient' ||
            importedPayloadValueBindings.has(node.declaration.name))
        ) {
          context.report({
            node,
            messageId: 'forbiddenPayloadReExport',
            data: {
              source:
                importedPayloadValueBindings.get(node.declaration.name) || node.declaration.name,
            },
          })
        }
      },

      ImportExpression(node) {
        // R-22: Ban non-literal dynamic `import()` in `src/app/**` and `src/components/**`
        if (
          inAppOrComponents &&
          (node.source?.type !== 'Literal' || typeof node.source.value !== 'string')
        ) {
          context.report({
            node,
            messageId: 'forbiddenNonLiteralDynamicImport',
          })
          return
        }

        if (
          !allowGetPayloadEntry &&
          node.source?.type === 'Literal' &&
          isPayloadConfigModuleSource(node.source.value)
        ) {
          context.report({
            node,
            messageId: 'forbiddenPayloadImport',
            data: { source: String(node.source.value) },
          })
          return
        }

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
          callee.type === 'Identifier' &&
          callee.name === 'require' &&
          node.arguments[0]?.type === 'Literal'
        ) {
          if (!allowGetPayloadEntry && isPayloadConfigModuleSource(node.arguments[0].value)) {
            context.report({
              node,
              messageId: 'forbiddenPayloadImport',
              data: { source: String(node.arguments[0].value) },
            })
            return
          }
          if (forbidImports && isForbiddenPayloadModuleSource(node.arguments[0].value)) {
            context.report({
              node,
              messageId: 'forbiddenPayloadImport',
              data: { source: String(node.arguments[0].value) },
            })
            return
          }
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
