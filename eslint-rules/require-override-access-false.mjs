/**
 * Custom ESLint rule `local/require-override-access-false` (Z6, P2-T8 Scope 3, R-6, R-12, R-21, R-22, R-3, & R-13).
 *
 * Enforces defense-in-depth layers for Z6:
 * 1. Repo-wide re-export ban (`R-21`, `R-3`, `R-13`): re-exporting `payload`, `payload/*`, `@payload-config`,
 *    `@/payload.config`, or any binding imported from them (such as `getPayload`) is banned in
 *    EVERY module across the repository except `src/payload.config.ts` and `src/lib/cms/client.ts`
 *    (`isAllowedPayloadReExportFile`).
 * 2. Tightened runtime import allow-list + type-import allowance (`R-12`, `R-21`, `R-22`, `R-3`, `R-13`):
 *    - Runtime value imports of `payload` / `payload/*` are allowed only in `isAllowedPayloadServerFile`
 *      (where `src/fields/*` and `src/security/*` list only the 8 specific files that construct
 *      Payload runtime error classes, `src/app/(payload)/*` lists only the 4 generated route files,
 *      and `*.test.*` is exempt ONLY outside `src/app/**`, `src/components/**`, and `src/lib/**`).
 *    - Importing `getPayload`, `@payload-config`, or `@/payload.config` is restricted even further to
 *      `isAllowedGetPayloadEntryFile` (`src/payload.config.ts`, `src/instrumentation.ts`,
 *      `src/lib/cms/client.ts`, `scripts/**`, `tests/**`, and non-app/non-component/non-lib `*.test.*`).
 *    - Type-only imports (`import type { ... } from 'payload'` or `import { type ... } from 'payload'`)
 *      are allowed (`R-22`).
 * 3. `scripts/**` and `tests/**` import ban in `src/**` (`R-13`): no file in `src/**` may import,
 *    re-export, or `require()` from `scripts/**` or `tests/**`.
 * 4. `src/lib/**` guard (`R-13`):
 *    - `src/lib/**` (everything except `src/lib/cms/client.ts`, with pure modules explicitly listed in
 *      `EXPLICIT_PURE_LIB_FILES`) is banned from importing `payload`, `@payload-config`, `getPayload`,
 *      or any of the 8 server directories (`@/app/(payload)`, `@/collections`, `@/globals`, `@/hooks`,
 *      `@/access`, `@/migrations`, `@/fields`, `@/security`), and from accessing `req.payload`.
 *    - `src/app/(frontend)/**` and `src/components/**` may only import `src/lib/cms/client.ts` and
 *      the listed pure modules in `EXPLICIT_PURE_LIB_FILES` from `src/lib/**`.
 * 5. Non-literal dynamic `import()` ban (`R-22`, `R-13`): in `src/app/**`, `src/components/**`, and
 *    `src/lib/**`, every `import(...)` expression must use a static string literal source.
 * 6. Call-site verification in `src/app/(frontend)/**`, `src/components/**`, and `src/lib/**` (`Z6`, `R-13`):
 *    - Every Payload Local API call must pass an un-overridden `{ overrideAccess: false }` (or carry
 *      `// z6-allow-override-access: <reason>`).
 *    - Any Local API call whose options contain a `user` key is flagged (`R-13`).
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

export const CMS_WRAPPER_METHODS = new Set([
  'cmsFind',
  'cmsFindAllSmallCollection',
  'cmsFindByID',
  'cmsFindGlobal',
  'cmsCount',
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
 * Explicit list of the 4 generated Payload route files in `src/app/(payload)/` that legitimately
 * import `@payload-config` (`R-3`). Arbitrary helper files in `src/app/(payload)/` (e.g. `x.ts`)
 * are not allow-listed.
 */
export const EXPLICIT_PAYLOAD_ADMIN_ROUTE_FILES = [
  'src/app/(payload)/admin/[[...segments]]/not-found.tsx',
  'src/app/(payload)/admin/[[...segments]]/page.tsx',
  'src/app/(payload)/api/[...slug]/route.ts',
  'src/app/(payload)/layout.tsx',
]

/**
 * Explicit list of pure/wrapper modules in `src/lib/**` (besides `src/lib/cms/client.ts`) (`R-13`).
 */
export const EXPLICIT_PURE_LIB_FILES = [
  'src/lib/ipHash.ts',
  'src/lib/link-safety.ts',
  'src/lib/preview.ts',
  'src/lib/quote/schema.ts',
  'src/lib/cms/collections.ts',
  'src/lib/cms/globals.ts',
  'src/lib/cms/index.ts',
  'src/lib/cms/tags.ts',
]

const ALLOWED_LIB_IMPORT_Specifiers = new Set([
  '@/lib/cms',
  '@/lib/cms/client',
  '@/lib/cms/collections',
  '@/lib/cms/globals',
  '@/lib/cms/index',
  '@/lib/cms/tags',
  '@/lib/ipHash',
  '@/lib/link-safety',
  '@/lib/preview',
  '@/lib/quote/schema',
])

/**
 * Returns true when `filename` is `src/lib/cms/client.ts` (`R-13`).
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isCmsClientFile(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  const normalized = filename.replace(/\\/g, '/')
  return /(?:^|\/)src\/lib\/cms\/client\.[cm]?[jt]s$/.test(normalized)
}

/**
 * Only `src/payload.config.ts` and `src/lib/cms/client.ts` may re-export anything from
 * `payload`, `@payload-config`, or `@/payload.config` (`R-21`, `R-3`).
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
    /(?:^|\/)src\/payload\.config\.[cm]?[jt]s$/.test(normalized) || isCmsClientFile(normalized)
  )
}

/**
 * Only `src/payload.config.ts`, `src/instrumentation.ts`, `src/lib/cms/client.ts`,
 * `scripts/**`, `tests/**`, and non-app/non-component/non-lib `*.test.*` may import, reference,
 * or call `getPayload` / `getPayloadClient` (`R-21`, `R-3`, `R-13`).
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
    !/(?:^|\/)src\/components\//.test(normalized) &&
    !/(?:^|\/)src\/lib\//.test(normalized)
  ) {
    return true
  }
  return (
    /(?:^|\/)src\/payload\.config\.[cm]?[jt]s$/.test(normalized) ||
    /(?:^|\/)src\/instrumentation\.[cm]?[jt]s$/.test(normalized) ||
    isCmsClientFile(normalized) ||
    /(?:^|\/)scripts\//.test(normalized) ||
    /(?:^|\/)tests\//.test(normalized) ||
    /(?:^|\/)(?:next|vitest|playwright|eslint)\.config\.[cm]?[jt]s$/.test(normalized)
  )
}

/**
 * Files allowed to import `@payload-config` / `@/payload.config`:
 * `isAllowedGetPayloadEntryFile` plus the 4 explicit Payload admin/API route files (`R-3`).
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isAllowedPayloadConfigEntryFile(filename) {
  if (isAllowedGetPayloadEntryFile(filename)) {
    return true
  }
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  const normalized = filename.replace(/\\/g, '/')
  return EXPLICIT_PAYLOAD_ADMIN_ROUTE_FILES.some(
    (relPath) => normalized.endsWith('/' + relPath) || normalized === relPath,
  )
}

/**
 * Explicit allow-list of server/config/test/script modules permitted to import `payload`
 * at runtime (`R-12`, `R-21`, `R-3`, `R-13`).
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isAllowedPayloadServerFile(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  if (isAllowedPayloadConfigEntryFile(filename)) {
    return true
  }
  const normalized = filename.replace(/\\/g, '/')
  if (
    EXPLICIT_RUNTIME_PAYLOAD_FIELD_AND_SECURITY_FILES.some(
      (relPath) => normalized.endsWith('/' + relPath) || normalized === relPath,
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
 * Returns true when `filename` is inside `src/**` (`R-13`).
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isSrcFile(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  const normalized = filename.replace(/\\/g, '/')
  return /(?:^|\/)src\//.test(normalized)
}

/**
 * Returns true when `sourceValue` points to `happy-dom`, `happy-dom/*`, `@lexical/headless`, or `@lexical/headless/*` (`R-24`).
 *
 * @param {unknown} sourceValue
 * @returns {boolean}
 */
export function isForbiddenHappyDomOrLexicalHeadlessSource(sourceValue) {
  if (typeof sourceValue !== 'string') {
    return false
  }
  const trimmed = sourceValue.trim().replace(/\\/g, '/')
  return (
    trimmed === 'happy-dom' ||
    trimmed.startsWith('happy-dom/') ||
    trimmed === '@lexical/headless' ||
    trimmed.startsWith('@lexical/headless/')
  )
}

/**
 * Returns true when `sourceValue` points to `scripts/**` or `tests/**` (`R-13`).
 *
 * @param {unknown} sourceValue
 * @returns {boolean}
 */
export function isForbiddenScriptsOrTestsSource(sourceValue) {
  if (typeof sourceValue !== 'string') {
    return false
  }
  const trimmed = sourceValue.trim().replace(/\\/g, '/')
  return (
    /^@\/(?:\.\.\/)*(?:scripts|tests)(?:\/|$)/.test(trimmed) ||
    /^(?:scripts|tests)(?:\/|$)/.test(trimmed) ||
    (trimmed.startsWith('.') && /(?:^|\/)(?:scripts|tests)(?:\/|$)/.test(trimmed))
  )
}

/**
 * Returns true when `filename` is inside `src/app/**`, `src/components/**`, or `src/lib/**` (`R-22`, `R-13`).
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isAppOrComponentFile(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  const normalized = filename.replace(/\\/g, '/')
  return /(?:^|\/)src\/(?:app|components|lib)\//.test(normalized)
}

/**
 * Returns true when `filename` is inside `src/app/(frontend)/**`, `src/components/**`, or `src/lib/**` (`R-3`, `R-13`).
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isFrontendOrComponentFile(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false
  }
  const normalized = filename.replace(/\\/g, '/')
  return (
    /(?:^|\/)src\/app\/\(frontend\)\//.test(normalized) ||
    /(?:^|\/)src\/components\//.test(normalized) ||
    /(?:^|\/)src\/lib\//.test(normalized)
  )
}

/**
 * Returns true when `sourceValue` is an import of `src/lib/**` that is NOT `src/lib/cms/client.ts`
 * and NOT one of the listed pure modules in `EXPLICIT_PURE_LIB_FILES` (`R-13`).
 *
 * @param {unknown} sourceValue
 * @returns {boolean}
 */
export function isForbiddenUnlistedLibSource(sourceValue) {
  if (typeof sourceValue !== 'string') {
    return false
  }
  const trimmed = sourceValue
    .trim()
    .replace(/\\/g, '/')
    .replace(/\.[cm]?[jt]sx?$/, '')

  if (trimmed.startsWith('@/lib/')) {
    return !ALLOWED_LIB_IMPORT_Specifiers.has(trimmed)
  }

  if (trimmed.startsWith('.') && /(?:^|\/)lib\//.test(trimmed)) {
    const afterLib = trimmed.replace(/^.*?(?:^|\/)lib\//, '@/lib/')
    return !ALLOWED_LIB_IMPORT_Specifiers.has(afterLib)
  }

  return false
}

/**
 * Returns true when `sourceValue` points to a server-only directory banned in
 * `src/app/(frontend)/**`, `src/components/**`, and `src/lib/**` (`R-3`, `R-13`):
 * `@/app/(payload)/**`, `@/collections/**`, `@/globals/**`, `@/hooks/**`,
 * `@/access/**`, `@/migrations/**`, `@/fields/**`, `@/security/**` (or relative equivalents).
 *
 * @param {unknown} sourceValue
 * @param {string} [filename]
 * @returns {boolean}
 */
export function isForbiddenFrontendServerDirSource(sourceValue, filename = '') {
  if (typeof sourceValue !== 'string') {
    return false
  }
  const trimmed = sourceValue.trim().replace(/\\/g, '/')
  if (
    /^@\/(?:app\/\(payload\)|collections|globals|hooks|access|migrations|fields|security)(?:\/|$)/.test(
      trimmed,
    )
  ) {
    return true
  }
  if (trimmed.startsWith('.')) {
    const normalizedFile = typeof filename === 'string' ? filename.replace(/\\/g, '/') : ''
    // Sibling imports `./collections` and `./globals` inside `src/lib/cms/` refer to `src/lib/cms/{collections,globals}.ts`
    if (
      /(?:^|\/)src\/lib\/cms\//.test(normalizedFile) &&
      /^\.\/(?:collections|globals)(?:\.[cm]?[jt]sx?)?$/.test(trimmed)
    ) {
      return false
    }
    if (
      /(?:^|\/)(?:\(payload\)|collections|globals|hooks|access|migrations|fields|security)(?:\/|$)/.test(
        trimmed,
      )
    ) {
      return true
    }
  }
  return false
}

/**
 * Returns true when `filename` is inside `src/app/(frontend)/**`, `src/components/**`, or `src/lib/**` (`Z6`, `R-13`).
 *
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
    /(?:^|\/)src\/lib(?:\/|$)/.test(normalized)
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
 * Unwraps TypeScript type assertions (`as any`, `<any>`, `satisfies`) and parentheses.
 *
 * @param {import('eslint').Rule.Node | null | undefined} node
 * @returns {import('eslint').Rule.Node | null | undefined}
 */
function unwrapTypeAssertions(node) {
  let curr = node
  while (
    curr &&
    typeof curr === 'object' &&
    (curr.type === 'TSAsExpression' ||
      curr.type === 'TSTypeAssertion' ||
      curr.type === 'TSSatisfiesExpression' ||
      curr.type === 'ParenthesizedExpression')
  ) {
    curr = /** @type {any} */ (curr).expression
  }
  return curr
}

/**
 * Checks whether an options ObjectExpression safely sets `overrideAccess: false`
 * without being clobbered by a subsequent spread (`...other`) or duplicate key,
 * and checks whether it contains a `user` key (`R-13`).
 *
 * @param {import('eslint').Rule.Node | undefined} rawOptionsArg
 * @param {Map<string, import('eslint').Rule.Node>} trackedObjectExpressions
 * @param {boolean} allowInternalDraftStaffUserSpread
 * @returns {{
 *   hasUnclobberedLiteralFalse: boolean,
 *   overridePropNode: import('eslint').Rule.Node | null,
 *   userPropNode: import('eslint').Rule.Node | null
 * }}
 */
function inspectOptionsObject(
  rawOptionsArg,
  trackedObjectExpressions,
  allowInternalDraftStaffUserSpread = false,
) {
  /** @type {import('eslint').Rule.Node | null} */
  let overridePropNode = null
  /** @type {import('eslint').Rule.Node | null} */
  let userPropNode = null
  let hasUnclobberedLiteralFalse = false

  const unwrappedRaw = unwrapTypeAssertions(rawOptionsArg)
  const optionsArg = unwrapTypeAssertions(
    unwrappedRaw?.type === 'Identifier'
      ? trackedObjectExpressions.get(unwrappedRaw.name)
      : unwrappedRaw,
  )

  if (!optionsArg || optionsArg.type !== 'ObjectExpression') {
    return { hasUnclobberedLiteralFalse: false, overridePropNode: null, userPropNode: null }
  }

  /**
   * @param {import('eslint').Rule.Node | null | undefined} rawNode
   */
  function findUserPropertyInNode(rawNode) {
    const node = unwrapTypeAssertions(rawNode)
    if (!node || typeof node !== 'object') {
      return null
    }
    if (node.type === 'Identifier' && trackedObjectExpressions.has(node.name)) {
      return findUserPropertyInNode(trackedObjectExpressions.get(node.name))
    }
    if (node.type === 'ObjectExpression') {
      for (const p of node.properties ?? []) {
        if (p.type === 'Property') {
          const k = !p.computed
            ? getPropertyName(p.key)
            : p.key.type === 'Literal' && typeof p.key.value === 'string'
              ? p.key.value
              : null
          if (k === 'user') {
            return p
          }
        } else if (p.type === 'SpreadElement') {
          const hit = findUserPropertyInNode(p.argument)
          if (hit) return hit
        }
      }
    }
    if (node.type === 'ConditionalExpression') {
      return findUserPropertyInNode(node.consequent) || findUserPropertyInNode(node.alternate)
    }
    if (node.type === 'LogicalExpression') {
      return findUserPropertyInNode(node.left) || findUserPropertyInNode(node.right)
    }
    return null
  }

  for (const prop of optionsArg.properties) {
    if (prop.type === 'SpreadElement') {
      if (hasUnclobberedLiteralFalse) {
        hasUnclobberedLiteralFalse = false
      }
      if (!allowInternalDraftStaffUserSpread) {
        const spreadUserHit = findUserPropertyInNode(prop.argument)
        if (spreadUserHit && !userPropNode) {
          userPropNode = spreadUserHit
        }
      }
      continue
    }
    if (prop.type === 'Property') {
      const keyName = !prop.computed
        ? getPropertyName(prop.key)
        : prop.key.type === 'Literal' && typeof prop.key.value === 'string'
          ? prop.key.value
          : null

      if (keyName === 'user') {
        userPropNode = prop
      }

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

  return { hasUnclobberedLiteralFalse, overridePropNode, userPropNode }
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
        'Ban direct Payload imports and re-exports outside the server allow-list, ban scripts/ and tests/ imports from src/, guard src/lib/**, ban non-literal import() in src/app/**, src/components/**, and src/lib/**, and require un-overridden `overrideAccess: false` without a `user` key on all Payload Local API calls in frontend/CMS code (Z6, R-6, R-12, R-21, R-22, R-3, R-13).',
    },
    messages: {
      forbiddenPayloadImport:
        'Importing "{{source}}" is forbidden outside the server allow-list (`src/lib/cms/client.ts` is the only allowed CMS wrapper). Use `cmsFind`, `cmsFindByID`, `cmsFindGlobal`, or `cmsCount` instead (Z6, R-6, R-12, R-21, R-3).',
      forbiddenFrontendServerDirImport:
        'Importing server module "{{source}}" is forbidden in `src/app/(frontend)/**`, `src/components/**`, and `src/lib/**` (R-3, R-13).',
      forbiddenScriptsOrTestsImport:
        'Importing "{{source}}" from `scripts/**` or `tests/**` is forbidden inside `src/**` (R-13).',
      forbiddenHappyDomImport:
        'Importing, re-exporting, or requiring "{{source}}" (`happy-dom` / `@lexical/headless`) is forbidden across the repository (R-24 waiver guard).',
      forbiddenUnlistedLibImport:
        'Importing unlisted `src/lib` module "{{source}}" is forbidden. Only `src/lib/cms/client.ts` and listed pure modules (`EXPLICIT_PURE_LIB_FILES`) are allowed (R-13).',
      forbiddenGetPayloadValue:
        'Referencing or calling "{{name}}" as a value is forbidden outside `src/lib/cms/client.ts` and `src/instrumentation.ts` (Z6, R-21, R-3, R-13).',
      forbiddenPayloadReExport:
        'Re-exporting "{{source}}" is forbidden everywhere except `src/payload.config.ts` and `src/lib/cms/client.ts` (Z6, R-21, R-3, R-13).',
      forbiddenNonLiteralDynamicImport:
        'Non-literal dynamic `import()` is forbidden in `src/app/**`, `src/components/**`, and `src/lib/**` (R-22, R-13).',
      forbiddenUserOptionInLocalApi:
        'Passing a "user" option to Payload Local API call "{{method}}()" is forbidden in frontend and `src/lib/**` code (Z6, R-13).',
      missingOverrideAccessFalse:
        'Payload Local API call "{{method}}()" in frontend/CMS code must pass an un-overridden "{ overrideAccess: false }" (or include a "// z6-allow-override-access: <reason>" comment) (Z6).',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename()
    const inSrc = isSrcFile(filename)
    const isCmsClient = isCmsClientFile(filename)
    const forbidImports = isPayloadImportForbiddenFile(filename)
    const allowGetPayloadEntry = isAllowedGetPayloadEntryFile(filename)
    const allowPayloadConfigEntry = isAllowedPayloadConfigEntryFile(filename)
    const allowReExport = isAllowedPayloadReExportFile(filename)
    const inAppOrComponents = isAppOrComponentFile(filename)
    const inFrontendOrComponents = isFrontendOrComponentFile(filename)
    const checkCalls = isFrontendOrCmsFile(filename)

    const sourceCode = context.sourceCode ?? context.getSourceCode()

    /** @type {Set<string>} */
    const trackedPayloadVars = new Set(['payload', 'client'])
    /** @type {Map<string, string>} localVarName -> guardedMethodName */
    const destructuredPayloadMethods = new Map()
    /** @type {Map<string, string>} localBindingName -> sourceName */
    const importedPayloadValueBindings = new Map()
    /** @type {Map<string, import('eslint').Rule.Node>} varName -> ObjectExpression */
    const trackedObjectExpressions = new Map()

    /**
     * Checks whether an exported expression directly re-exports `getPayload`, `getPayloadClient`,
     * or a binding/member imported from `payload` / `@payload-config` (`R-21`, `R-3`).
     *
     * @param {import('eslint').Rule.Node | null | undefined} expr
     * @returns {string | null}
     */
    function getDirectReExportedPayloadSource(expr) {
      if (!expr || typeof expr !== 'object') {
        return null
      }
      if (expr.type === 'Identifier') {
        if (expr.name === 'getPayload' || expr.name === 'getPayloadClient') {
          return expr.name
        }
        if (importedPayloadValueBindings.has(expr.name)) {
          return importedPayloadValueBindings.get(expr.name) || expr.name
        }
      }
      if (expr.type === 'MemberExpression') {
        const propName = getMemberMethodName(expr)
        if (
          propName === 'getPayload' ||
          propName === 'getPayloadClient' ||
          propName === 'payload'
        ) {
          return propName
        }
        if (
          expr.object?.type === 'Identifier' &&
          importedPayloadValueBindings.has(expr.object.name)
        ) {
          return importedPayloadValueBindings.get(expr.object.name) || expr.object.name
        }
      }
      return null
    }

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

        // R-24: Repo-wide ban on `happy-dom`, `happy-dom/*`, `@lexical/headless`, `@lexical/headless/*`
        if (isForbiddenHappyDomOrLexicalHeadlessSource(sourceVal)) {
          context.report({
            node,
            messageId: 'forbiddenHappyDomImport',
            data: { source: String(sourceVal) },
          })
          return
        }

        // R-13: Ban importing `scripts/**` or `tests/**` from any file in `src/**`
        if (inSrc && isForbiddenScriptsOrTestsSource(sourceVal)) {
          context.report({
            node,
            messageId: 'forbiddenScriptsOrTestsImport',
            data: { source: String(sourceVal) },
          })
          return
        }

        // R-3 & R-13: Ban importing server directories in `src/app/(frontend)/**`, `src/components/**`, and `src/lib/**`
        if (inFrontendOrComponents && isForbiddenFrontendServerDirSource(sourceVal, filename)) {
          context.report({
            node,
            messageId: 'forbiddenFrontendServerDirImport',
            data: { source: String(sourceVal) },
          })
          return
        }

        // R-13: Ban importing unlisted `src/lib/**` modules in frontend, components, and server files
        if (inSrc && isForbiddenUnlistedLibSource(sourceVal)) {
          context.report({
            node,
            messageId: 'forbiddenUnlistedLibImport',
            data: { source: String(sourceVal) },
          })
          return
        }

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

        // R-21 & R-3: Importing @payload-config / @/payload.config is restricted to `isAllowedPayloadConfigEntryFile`
        if (!allowPayloadConfigEntry && isPayloadConfigModuleSource(sourceVal)) {
          context.report({
            node,
            messageId: 'forbiddenPayloadImport',
            data: { source: String(sourceVal) },
          })
          return
        }

        // R-21 & R-3: Importing `getPayload` or `getPayloadClient` is restricted to `isAllowedGetPayloadEntryFile`
        if (!allowGetPayloadEntry) {
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

      MemberExpression(node) {
        const propName = getMemberMethodName(node)
        if (!allowGetPayloadEntry && (propName === 'getPayload' || propName === 'getPayloadClient')) {
          context.report({
            node,
            messageId: 'forbiddenGetPayloadValue',
            data: { name: propName },
          })
          return
        }
        // R-13: Ban accessing `.payload` (e.g. `req.payload`) in `src/app/(frontend)/**`, `src/components/**`, and `src/lib/**` (outside `src/lib/cms/client.ts`)
        if (inFrontendOrComponents && !isCmsClient && propName === 'payload') {
          context.report({
            node,
            messageId: 'forbiddenGetPayloadValue',
            data: { name: 'payload' },
          })
        }
      },

      ObjectPattern(node) {
        for (const prop of node.properties) {
          if (prop.type === 'Property') {
            const origName = getPropertyName(prop.key)
            if (
              !allowGetPayloadEntry &&
              (origName === 'getPayload' || origName === 'getPayloadClient')
            ) {
              context.report({
                node: prop,
                messageId: 'forbiddenGetPayloadValue',
                data: { name: origName },
              })
            } else if (inFrontendOrComponents && !isCmsClient && origName === 'payload') {
              context.report({
                node: prop,
                messageId: 'forbiddenGetPayloadValue',
                data: { name: origName },
              })
            }
          }
        }
      },

      ExportNamedDeclaration(node) {
        const sourceVal = node.source?.value
        if (isForbiddenHappyDomOrLexicalHeadlessSource(sourceVal)) {
          context.report({
            node,
            messageId: 'forbiddenHappyDomImport',
            data: { source: String(sourceVal) },
          })
          return
        }
        if (inSrc && isForbiddenScriptsOrTestsSource(sourceVal)) {
          context.report({
            node,
            messageId: 'forbiddenScriptsOrTestsImport',
            data: { source: String(sourceVal) },
          })
          return
        }
        if (inFrontendOrComponents && isForbiddenFrontendServerDirSource(sourceVal, filename)) {
          context.report({
            node,
            messageId: 'forbiddenFrontendServerDirImport',
            data: { source: String(sourceVal) },
          })
          return
        }
        if (inSrc && isForbiddenUnlistedLibSource(sourceVal)) {
          context.report({
            node,
            messageId: 'forbiddenUnlistedLibImport',
            data: { source: String(sourceVal) },
          })
          return
        }
        if (allowReExport) {
          return
        }
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
            const hit = getDirectReExportedPayloadSource(decl.init)
            if (hit) {
              context.report({
                node: decl,
                messageId: 'forbiddenPayloadReExport',
                data: { source: hit },
              })
            }
          }
        }
      },

      ExportAllDeclaration(node) {
        const sourceVal = node.source?.value
        if (isForbiddenHappyDomOrLexicalHeadlessSource(sourceVal)) {
          context.report({
            node,
            messageId: 'forbiddenHappyDomImport',
            data: { source: String(sourceVal) },
          })
          return
        }
        if (inSrc && isForbiddenScriptsOrTestsSource(sourceVal)) {
          context.report({
            node,
            messageId: 'forbiddenScriptsOrTestsImport',
            data: { source: String(sourceVal) },
          })
          return
        }
        if (inFrontendOrComponents && isForbiddenFrontendServerDirSource(sourceVal, filename)) {
          context.report({
            node,
            messageId: 'forbiddenFrontendServerDirImport',
            data: { source: String(sourceVal) },
          })
          return
        }
        if (inSrc && isForbiddenUnlistedLibSource(sourceVal)) {
          context.report({
            node,
            messageId: 'forbiddenUnlistedLibImport',
            data: { source: String(sourceVal) },
          })
          return
        }
        if (allowReExport) {
          return
        }
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
        const hit = getDirectReExportedPayloadSource(
          /** @type {import('eslint').Rule.Node} */ (node.declaration),
        )
        if (hit) {
          context.report({
            node,
            messageId: 'forbiddenPayloadReExport',
            data: { source: hit },
          })
        }
      },

      ImportExpression(node) {
        if (
          node.source?.type === 'Literal' &&
          isForbiddenHappyDomOrLexicalHeadlessSource(node.source.value)
        ) {
          context.report({
            node,
            messageId: 'forbiddenHappyDomImport',
            data: { source: String(node.source.value) },
          })
          return
        }

        // R-22 & R-13: Ban non-literal dynamic `import()` in `src/app/**`, `src/components/**`, and `src/lib/**`
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
          inSrc &&
          node.source?.type === 'Literal' &&
          isForbiddenScriptsOrTestsSource(node.source.value)
        ) {
          context.report({
            node,
            messageId: 'forbiddenScriptsOrTestsImport',
            data: { source: String(node.source.value) },
          })
          return
        }

        if (
          inFrontendOrComponents &&
          node.source?.type === 'Literal' &&
          isForbiddenFrontendServerDirSource(node.source.value, filename)
        ) {
          context.report({
            node,
            messageId: 'forbiddenFrontendServerDirImport',
            data: { source: String(node.source.value) },
          })
          return
        }

        if (
          inSrc &&
          node.source?.type === 'Literal' &&
          isForbiddenUnlistedLibSource(node.source.value)
        ) {
          context.report({
            node,
            messageId: 'forbiddenUnlistedLibImport',
            data: { source: String(node.source.value) },
          })
          return
        }

        if (
          !allowPayloadConfigEntry &&
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
        const unwrappedInit = unwrapTypeAssertions(node.init)
        if (node.id.type === 'Identifier' && unwrappedInit?.type === 'ObjectExpression') {
          trackedObjectExpressions.set(node.id.name, unwrappedInit)
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

        // R-3: Flag `getPayload(...)` or `getPayloadClient(...)` called anywhere outside `isAllowedGetPayloadEntryFile`
        if (
          !allowGetPayloadEntry &&
          callee.type === 'Identifier' &&
          (callee.name === 'getPayload' || callee.name === 'getPayloadClient')
        ) {
          context.report({
            node: callee,
            messageId: 'forbiddenGetPayloadValue',
            data: { name: callee.name },
          })
          return
        }

        // Check `require(...)`
        if (
          callee.type === 'Identifier' &&
          callee.name === 'require' &&
          node.arguments[0]?.type === 'Literal'
        ) {
          if (isForbiddenHappyDomOrLexicalHeadlessSource(node.arguments[0].value)) {
            context.report({
              node,
              messageId: 'forbiddenHappyDomImport',
              data: { source: String(node.arguments[0].value) },
            })
            return
          }
          if (inSrc && isForbiddenScriptsOrTestsSource(node.arguments[0].value)) {
            context.report({
              node,
              messageId: 'forbiddenScriptsOrTestsImport',
              data: { source: String(node.arguments[0].value) },
            })
            return
          }
          if (inFrontendOrComponents && isForbiddenFrontendServerDirSource(node.arguments[0].value, filename)) {
            context.report({
              node,
              messageId: 'forbiddenFrontendServerDirImport',
              data: { source: String(node.arguments[0].value) },
            })
            return
          }
          if (inSrc && isForbiddenUnlistedLibSource(node.arguments[0].value)) {
            context.report({
              node,
              messageId: 'forbiddenUnlistedLibImport',
              data: { source: String(node.arguments[0].value) },
            })
            return
          }
          if (!allowPayloadConfigEntry && isPayloadConfigModuleSource(node.arguments[0].value)) {
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

        // R-13: Also check `user` key on CMS wrapper calls (`cmsFind`, `cmsFindByID`, `cmsFindGlobal`, `cmsCount`, `cmsFindAllSmallCollection`)
        if (callee.type === 'Identifier' && CMS_WRAPPER_METHODS.has(callee.name)) {
          const { userPropNode } = inspectOptionsObject(
            node.arguments[0],
            trackedObjectExpressions,
            false,
          )
          if (userPropNode) {
            context.report({
              node: userPropNode,
              messageId: 'forbiddenUserOptionInLocalApi',
              data: { method: callee.name },
            })
          }
          return
        }

        /** @type {string | null} */
        let matchedMethodName = null
        /** @type {import('eslint').Rule.Node | undefined} */
        let optionsArg = undefined
        let requiresAutomaticFalse = true

        // Case 1: Destructured, imported, or bare method identifier `find({ ... })`, `find(o)`, etc. (`R-6`, `R-13`)
        if (callee.type === 'Identifier') {
          if (destructuredPayloadMethods.has(callee.name)) {
            matchedMethodName = destructuredPayloadMethods.get(callee.name) ?? callee.name
            optionsArg = node.arguments[0]
          } else if (GUARDED_PAYLOAD_METHODS.has(callee.name)) {
            const firstArg = node.arguments[0]
            if (
              !firstArg ||
              (firstArg.type !== 'ArrowFunctionExpression' &&
                firstArg.type !== 'FunctionExpression')
            ) {
              matchedMethodName = callee.name
              optionsArg = firstArg
            }
          }
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
            // Case 3: `payload.find(...)`, `(await db()).find(o)`, `p.find(o)`, `client.find(...)`
            const firstArg = node.arguments[0]
            const resolvedFirstArgObj =
              firstArg?.type === 'Identifier'
                ? trackedObjectExpressions.get(firstArg.name)
                : firstArg

            const isNonPayloadArrayOrBuiltInCall =
              (propName === 'find' &&
                (firstArg?.type === 'ArrowFunctionExpression' ||
                  firstArg?.type === 'FunctionExpression')) ||
              ((propName === 'delete' || propName === 'update' || propName === 'create') &&
                !isPayloadLikeExpression(callee.object, trackedPayloadVars) &&
                resolvedFirstArgObj?.type !== 'ObjectExpression')

            if (!isNonPayloadArrayOrBuiltInCall) {
              matchedMethodName = propName
              optionsArg = firstArg
            } else {
              requiresAutomaticFalse = false
            }
          }
        }

        if (!matchedMethodName || !requiresAutomaticFalse) {
          return
        }

        const { hasUnclobberedLiteralFalse, overridePropNode, userPropNode } =
          inspectOptionsObject(optionsArg, trackedObjectExpressions, isCmsClient)

        if (userPropNode) {
          context.report({
            node: userPropNode,
            messageId: 'forbiddenUserOptionInLocalApi',
            data: { method: matchedMethodName },
          })
          return
        }

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
