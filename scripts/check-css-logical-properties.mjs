import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')

const PUBLIC_CSS_SCAN_DIRS = [
  path.join(REPO_ROOT, 'src', 'app', '(frontend)'),
  path.join(REPO_ROOT, 'src', 'components'),
  path.join(REPO_ROOT, 'src', 'styles'),
]

const EXCLUDED_SUBPATHS = [
  path.join(REPO_ROOT, 'src', 'components', 'admin'),
  path.join(REPO_ROOT, 'src', 'styles', 'tokens.css'),
]

const PHYSICAL_PROPERTY_REPLACEMENTS = new Map([
  ['left', 'inset-inline-start'],
  ['right', 'inset-inline-end'],
  ['top', 'inset-block-start'],
  ['bottom', 'inset-block-end'],
  ['margin-left', 'margin-inline-start'],
  ['margin-right', 'margin-inline-end'],
  ['margin-top', 'margin-block-start'],
  ['margin-bottom', 'margin-block-end'],
  ['padding-left', 'padding-inline-start'],
  ['padding-right', 'padding-inline-end'],
  ['padding-top', 'padding-block-start'],
  ['padding-bottom', 'padding-block-end'],
  ['border-left', 'border-inline-start'],
  ['border-right', 'border-inline-end'],
  ['border-top', 'border-block-start'],
  ['border-bottom', 'border-block-end'],
  ['border-left-width', 'border-inline-start-width'],
  ['border-right-width', 'border-inline-end-width'],
  ['border-top-width', 'border-block-start-width'],
  ['border-bottom-width', 'border-block-end-width'],
  ['border-left-style', 'border-inline-start-style'],
  ['border-right-style', 'border-inline-end-style'],
  ['border-top-style', 'border-block-start-style'],
  ['border-bottom-style', 'border-block-end-style'],
  ['border-left-color', 'border-inline-start-color'],
  ['border-right-color', 'border-inline-end-color'],
  ['border-top-color', 'border-block-start-color'],
  ['border-bottom-color', 'border-block-end-color'],
  ['border-top-left-radius', 'border-start-start-radius'],
  ['border-top-right-radius', 'border-start-end-radius'],
  ['border-bottom-left-radius', 'border-end-start-radius'],
  ['border-bottom-right-radius', 'border-end-end-radius'],
])

const PHYSICAL_VALUE_PATTERNS = [
  {
    prop: 'text-align',
    regex: /^(left|right)\b/i,
    replacement: 'text-align: start | end',
  },
  {
    prop: 'float',
    regex: /^(left|right)\b/i,
    replacement: 'float: inline-start | inline-end',
  },
  {
    prop: 'clear',
    regex: /^(left|right)\b/i,
    replacement: 'clear: inline-start | inline-end',
  },
]

const LOGICAL_IGNORE_REGEX = /\/\*\s*logical-ignore:\s*\S[\s\S]*?\*\//i

/**
 * Checks a CSS source string for physical directional properties (`R-8`, `handoff/tasks/P3-T2.md`).
 *
 * @param {string} cssContent
 * @param {string} [filePath]
 * @returns {Array<{ filePath: string; line: number; property: string; value: string; suggestion: string }>}
 */
export function scanCssForPhysicalProperties(cssContent, filePath = 'inline.css') {
  const lines = cssContent.replace(/\r\n/g, '\n').split('\n')
  const violations = []
  let inMultilineComment = false

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i] ?? ''
    const prevRawLine = i > 0 ? (lines[i - 1] ?? '') : ''
    const hasJustification =
      LOGICAL_IGNORE_REGEX.test(rawLine) || LOGICAL_IGNORE_REGEX.test(prevRawLine)

    // Strip single-line block comments on this line while tracking multi-line comments
    let working = rawLine
    if (inMultilineComment) {
      const endIdx = working.indexOf('*/')
      if (endIdx === -1) {
        continue
      }
      working = working.slice(endIdx + 2)
      inMultilineComment = false
    }

    while (working.includes('/*')) {
      const startIdx = working.indexOf('/*')
      const endIdx = working.indexOf('*/', startIdx + 2)
      if (endIdx === -1) {
        working = working.slice(0, startIdx)
        inMultilineComment = true
        break
      }
      working = `${working.slice(0, startIdx)} ${working.slice(endIdx + 2)}`
    }

    const trimmed = working.trim()
    if (!trimmed || trimmed.startsWith('@') || trimmed.endsWith('{') || trimmed === '}') {
      continue
    }

    const match = trimmed.match(/^([a-zA-Z-]+)\s*:\s*([^;]+);?/)
    if (!match) {
      continue
    }

    const prop = (match[1] ?? '').toLowerCase()
    const val = (match[2] ?? '').trim()

    if (hasJustification) {
      continue
    }

    const replacementProp = PHYSICAL_PROPERTY_REPLACEMENTS.get(prop)
    if (replacementProp) {
      violations.push({
        filePath,
        line: i + 1,
        property: prop,
        value: val,
        suggestion: `Use logical property "${replacementProp}" instead of "${prop}" (or add /* logical-ignore: <reason> */).`,
      })
      continue
    }

    for (const rule of PHYSICAL_VALUE_PATTERNS) {
      if (prop === rule.prop && rule.regex.test(val)) {
        violations.push({
          filePath,
          line: i + 1,
          property: prop,
          value: val,
          suggestion: `Use logical value (${rule.replacement}) instead of "${prop}: ${val}" (or add /* logical-ignore: <reason> */).`,
        })
      }
    }
  }

  return violations
}

/**
 * Recursively collects `.css` files under `dirPath`.
 *
 * @param {string} dirPath
 * @returns {string[]}
 */
function collectCssFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return []
  }
  const resolvedDir = path.resolve(dirPath)
  if (
    EXCLUDED_SUBPATHS.some((ex) => resolvedDir === ex || resolvedDir.startsWith(`${ex}${path.sep}`))
  ) {
    return []
  }

  const entries = fs.readdirSync(resolvedDir, { withFileTypes: true })
  /** @type {string[]} */
  const results = []
  for (const entry of entries) {
    const fullPath = path.join(resolvedDir, entry.name)
    if (
      EXCLUDED_SUBPATHS.some((ex) => fullPath === ex || fullPath.startsWith(`${ex}${path.sep}`))
    ) {
      continue
    }
    if (entry.isDirectory()) {
      results.push(...collectCssFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.css')) {
      results.push(fullPath)
    }
  }
  return results
}

export function checkAllPublicCssLogicalProperties() {
  const cssFiles = PUBLIC_CSS_SCAN_DIRS.flatMap((dir) => collectCssFiles(dir)).sort()
  /** @type {Array<{ filePath: string; line: number; property: string; value: string; suggestion: string }>} */
  const allViolations = []

  for (const absPath of cssFiles) {
    const relPath = path.relative(REPO_ROOT, absPath).replace(/\\/g, '/')
    const content = fs.readFileSync(absPath, 'utf8')
    allViolations.push(...scanCssForPhysicalProperties(content, relPath))
  }

  return {
    scannedFileCount: cssFiles.length,
    violations: allViolations,
  }
}

if (
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/check-css-logical-properties.mjs')
) {
  const { scannedFileCount, violations } = checkAllPublicCssLogicalProperties()
  if (violations.length > 0) {
    for (const v of violations) {
      process.stderr.write(
        `[css-logical-properties] ERROR ${v.filePath}:${String(v.line)} — "${v.property}: ${v.value}" -> ${v.suggestion}\n`,
      )
    }
    process.exit(1)
  }
  process.stdout.write(
    `[css-logical-properties] Verified ${String(scannedFileCount)} public CSS files use logical directional properties (0 violations).\n`,
  )
}
