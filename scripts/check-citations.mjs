import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Mechanical citation checker & generator (`P2-T8 R-13`, `handoff/README.md` §Evidence files).
 *
 * Usage:
 *   pnpm check:citations <report.md> [report2.md ...] <citations.log>
 *   node scripts/check-citations.mjs --generate <report.md> [report2.md ...] <citations.log>
 *
 * Rules enforced:
 * 1. Every file:line reference in a markdown report (outside fenced code blocks) must be written
 *    in the canonical form:
 *      `identifier` (`path:line`)
 *    Any bare/un-paired `path:line` (or range `path:10`–`path:20`) is rejected.
 * 2. Every cited `identifier` and every `git grep -n -e '<identifier>'` pattern in `citations.log`
 *    must match `/^[A-Za-z0-9_$.-]{3,}$/`, contain at least one ASCII letter, and not be a generic
 *    language keyword or common field word (`FORBIDDEN_COMMON_WORD_PATTERNS`).
 * 3. For every `` `identifier` (`path:line`) `` in the report:
 *    - `path` must exist on disk and line `line` (1-based) must contain `identifier`.
 *    - `citations.log` must contain the corresponding `$ git grep -n -e '<identifier>' -- <path>`
 *      block and include the matching `<path>:<line>:` output line.
 */

export const VALID_IDENTIFIER_REGEX = /^[A-Za-z0-9_$.-]{3,}$/

export const FORBIDDEN_COMMON_WORD_PATTERNS = new Set([
  'const',
  'let',
  'var',
  'function',
  'return',
  'async',
  'await',
  'import',
  'export',
  'from',
  'default',
  'true',
  'false',
  'null',
  'undefined',
  'string',
  'number',
  'boolean',
  'object',
  'void',
  'never',
  'unknown',
  'any',
  'type',
  'interface',
  'class',
  'extends',
  'implements',
  'try',
  'catch',
  'finally',
  'throw',
  'new',
  'this',
  'super',
  'for',
  'while',
  'switch',
  'case',
  'break',
  'continue',
  'else',
  'name',
  'value',
  'data',
  'result',
  'error',
  'err',
  'req',
  'res',
  'doc',
  'docs',
  'user',
  'users',
  'slug',
  'fields',
  'hooks',
  'access',
  'admin',
  'editor',
  'read',
  'create',
  'update',
  'delete',
  'test',
  'describe',
  'expect',
])

const REPO_FILE_LINE_REGEX =
  /(?:(?:src|tests|scripts|eslint-rules|docs|handoff|seed|design|public|\.github)\/[A-Za-z0-9_./()[\]-]+\.[A-Za-z0-9]+|(?:package\.json|eslint\.config\.mjs|next\.config\.ts|tsconfig\.json|vitest\.config\.ts|playwright\.config\.ts|Dockerfile|docker-compose\.yml)):(\d+)/g

const PAIRED_CITATION_REGEX =
  /`([^`\r\n]+)`\s*\(\s*`?((?:(?:src|tests|scripts|eslint-rules|docs|handoff|seed|design|public|\.github)\/[A-Za-z0-9_./()[\]-]+\.[A-Za-z0-9]+|(?:package\.json|eslint\.config\.mjs|next\.config\.ts|tsconfig\.json|vitest\.config\.ts|playwright\.config\.ts|Dockerfile|docker-compose\.yml))):(\d+)`?\s*\)/g

const STANDALONE_FILE_PATH_REGEX =
  /`((?:(?:src|tests|scripts|eslint-rules|docs|handoff|seed|design|public|\.github)\/[A-Za-z0-9_./()[\]-]+\.[A-Za-z0-9]+|(?:package\.json|eslint\.config\.mjs|next\.config\.ts|tsconfig\.json|vitest\.config\.ts|playwright\.config\.ts|Dockerfile|docker-compose\.yml)))`/g

const COMMITTED_SOURCE_PATH_PREFIX_REGEX =
  /^(?:src|tests|scripts|eslint-rules|seed|design|public|\.github)\/|^(?:package\.json|eslint\.config\.mjs|next\.config\.ts|tsconfig\.json|vitest\.config\.ts|playwright\.config\.ts|Dockerfile|docker-compose\.yml)$/

function hasGitCommit(repoRoot, gitRef = 'HEAD') {
  if (!gitRef || !fs.existsSync(path.join(repoRoot, '.git'))) {
    return false
  }
  try {
    execFileSync('git', ['rev-parse', '--verify', gitRef], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return true
  } catch {
    return false
  }
}

function readCommittedFileContent(repoRoot, filePath, gitRef = 'HEAD') {
  try {
    return execFileSync('git', ['cat-file', '-p', `${gitRef}:${filePath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return null
  }
}

/**
 * @param {string} identifier
 * @returns {{ valid: boolean; reason?: string }}
 */
export function validateCitationIdentifier(identifier) {
  if (typeof identifier !== 'string' || identifier.length < 3) {
    return {
      valid: false,
      reason: `Identifier "${String(identifier)}" must be at least 3 characters long.`,
    }
  }
  if (!VALID_IDENTIFIER_REGEX.test(identifier)) {
    return {
      valid: false,
      reason: `Identifier "${identifier}" contains disallowed characters (only [A-Za-z0-9_$.-] allowed).`,
    }
  }
  if (!/[A-Za-z]/.test(identifier)) {
    return {
      valid: false,
      reason: `Identifier "${identifier}" must contain at least one ASCII letter.`,
    }
  }
  if (FORBIDDEN_COMMON_WORD_PATTERNS.has(identifier)) {
    return {
      valid: false,
      reason: `Identifier "${identifier}" is a forbidden common word / keyword pattern.`,
    }
  }
  return { valid: true }
}

/**
 * Strip fenced code blocks (``` ... ```) so raw pasted log snippets inside code fences
 * are not mistaken for prose citations.
 *
 * @param {string} markdown
 * @returns {string}
 */
export function stripFencedCodeBlocks(markdown) {
  const lines = markdown.split(/\r?\n/)
  const out = []
  let inFence = false
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      out.push('')
      continue
    }
    out.push(inFence ? '' : line)
  }
  return out.join('\n')
}

/**
 * Extracts all paired `` `identifier` (`path:line`) `` citations and any un-paired
 * `path:line` occurrences from a markdown report.
 *
 * @param {string} markdown
 * @param {string} reportLabel
 */
export function parseReportCitations(markdown, reportLabel = 'report.md') {
  const stripped = stripFencedCodeBlocks(markdown)
  const lines = stripped.split('\n')

  /**
   * @type {Array<{
   *   identifier: string
   *   filePath: string
   *   lineNumber: number
   *   reportLine: number
   *   reportLabel: string
   * }>}
   */
  const paired = []

  /**
   * @type {Array<{
   *   rawRef: string
   *   reportLine: number
   *   reportLabel: string
   * }>}
   */
  const unpaired = []

  /**
   * @type {Array<{
   *   filePath: string
   *   reportLine: number
   *   reportLabel: string
   * }>}
   */
  const referencedFiles = []

  for (let idx = 0; idx < lines.length; idx++) {
    const lineText = lines[idx]
    const reportLine = idx + 1

    /** @type {Set<string>} */
    const matchedSpans = new Set()

    PAIRED_CITATION_REGEX.lastIndex = 0
    let match
    while ((match = PAIRED_CITATION_REGEX.exec(lineText)) !== null) {
      const [, identifier, filePath, lineStr] = match
      const lineNumber = Number.parseInt(lineStr, 10)
      paired.push({
        identifier,
        filePath,
        lineNumber,
        reportLine,
        reportLabel,
      })
      matchedSpans.add(`${filePath}:${lineStr}@${String(match.index)}`)
    }

    // Remove all paired matches from lineText and check if any bare `path:line` remains
    const remainder = lineText.replace(PAIRED_CITATION_REGEX, ' ')
    REPO_FILE_LINE_REGEX.lastIndex = 0
    let bareMatch
    while ((bareMatch = REPO_FILE_LINE_REGEX.exec(remainder)) !== null) {
      unpaired.push({
        rawRef: bareMatch[0],
        reportLine,
        reportLabel,
      })
    }

    STANDALONE_FILE_PATH_REGEX.lastIndex = 0
    let fileMatch
    while ((fileMatch = STANDALONE_FILE_PATH_REGEX.exec(remainder)) !== null) {
      const [, filePath] = fileMatch
      referencedFiles.push({
        filePath,
        reportLine,
        reportLabel,
      })
    }
  }

  return { paired, unpaired, referencedFiles }
}

/**
 * Parses `citations.log` into structured blocks and validates every block's grep pattern.
 *
 * @param {string} citationsLogText
 */
export function parseCitationsLog(citationsLogText) {
  const lines = citationsLogText.replace(/\r\n/g, '\n').split('\n')
  /**
   * @type {Map<string, Set<string>>} key: `${identifier}:::${filePath}` -> set of output lines
   */
  const blocks = new Map()
  /** @type {string[]} */
  const errors = []

  let currentKey = null
  let currentFile = null
  let currentPattern = null
  let currentLines = 0
  let totalBlocks = 0

  const headerRegex = /^\$ git grep -n -e '([^']*)' -- (\S+)$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '') {
      continue
    }
    const headerMatch = headerRegex.exec(line)
    if (headerMatch) {
      if (currentKey !== null && currentLines === 0) {
        errors.push(`Block "${currentKey}" in citations.log has 0 output lines.`)
      }
      totalBlocks++
      currentPattern = headerMatch[1]
      currentFile = headerMatch[2]
      currentKey = `${currentPattern}:::${currentFile}`
      currentLines = 0

      const idCheck = validateCitationIdentifier(currentPattern)
      if (!idCheck.valid) {
        errors.push(
          `citations.log line ${String(i + 1)}: invalid git grep pattern "${currentPattern}" (${idCheck.reason ?? 'invalid'})`,
        )
      }
      if (!blocks.has(currentKey)) {
        blocks.set(currentKey, new Set())
      }
      continue
    }

    if (currentKey === null || currentFile === null) {
      errors.push(
        `citations.log line ${String(i + 1)}: unexpected line before any "$ git grep -n -e" header: ${line}`,
      )
      continue
    }

    if (!line.startsWith(`${currentFile}:`)) {
      errors.push(
        `citations.log line ${String(i + 1)}: output line does not start with "${currentFile}:": ${line}`,
      )
      continue
    }

    blocks.get(currentKey).add(line)
    currentLines++
  }

  if (currentKey !== null && currentLines === 0) {
    errors.push(`Block "${currentKey}" in citations.log has 0 output lines.`)
  }

  if (totalBlocks === 0) {
    errors.push('citations.log contains 0 "$ git grep -n -e" blocks.')
  }

  return { blocks, errors, totalBlocks }
}

/**
 * Verifies parsed report citations against committed `HEAD` files (or disk files when `gitRef: null`
 * or outside a git repository) and `citations.log` (`R-17`).
 *
 * @param {object} params
 * @param {string} params.repoRoot
 * @param {Array<{ reportPath: string; markdown: string }>} params.reports
 * @param {string} params.citationsLogText
 * @param {string | null} [params.gitRef]
 */
export function verifyCitations({ repoRoot, reports, citationsLogText, gitRef = 'HEAD' }) {
  /** @type {string[]} */
  const errors = []
  const parsedLog = parseCitationsLog(citationsLogText)
  errors.push(...parsedLog.errors)

  const checkAgainstGit = Boolean(gitRef && hasGitCommit(repoRoot, gitRef))
  /** @type {Map<string, string[] | null>} */
  const fileLinesCache = new Map()

  function getFileLines(filePath) {
    if (fileLinesCache.has(filePath)) {
      return fileLinesCache.get(filePath)
    }
    if (checkAgainstGit && COMMITTED_SOURCE_PATH_PREFIX_REGEX.test(filePath)) {
      const committedContent = readCommittedFileContent(repoRoot, filePath, gitRef)
      const lines =
        committedContent !== null ? committedContent.replace(/\r\n/g, '\n').split('\n') : null
      fileLinesCache.set(filePath, lines)
      return lines
    }
    const absFile = path.resolve(repoRoot, filePath)
    if (!fs.existsSync(absFile)) {
      fileLinesCache.set(filePath, null)
      return null
    }
    const lines = fs.readFileSync(absFile, 'utf8').replace(/\r\n/g, '\n').split('\n')
    fileLinesCache.set(filePath, lines)
    return lines
  }

  let totalPairedCitations = 0
  let totalUnpairedCitations = 0
  let totalReferencedFiles = 0

  for (const { reportPath, markdown } of reports) {
    const { paired, unpaired, referencedFiles } = parseReportCitations(markdown, reportPath)
    totalPairedCitations += paired.length
    totalUnpairedCitations += unpaired.length
    totalReferencedFiles += referencedFiles.length

    for (const u of unpaired) {
      errors.push(
        `${u.reportLabel}:${String(u.reportLine)}: un-paired citation "${u.rawRef}" (must be written as \`identifier\` (\`${u.rawRef}\`)).`,
      )
    }

    for (const refFile of referencedFiles) {
      if (checkAgainstGit && COMMITTED_SOURCE_PATH_PREFIX_REGEX.test(refFile.filePath)) {
        const committedLines = getFileLines(refFile.filePath)
        if (!committedLines) {
          errors.push(
            `${refFile.reportLabel}:${String(refFile.reportLine)}: referenced file "${refFile.filePath}" does not exist in commit ${String(gitRef)}.`,
          )
        }
        continue
      }
      const absRef = path.resolve(repoRoot, refFile.filePath)
      if (!fs.existsSync(absRef)) {
        errors.push(
          `${refFile.reportLabel}:${String(refFile.reportLine)}: referenced file "${refFile.filePath}" does not exist on disk.`,
        )
      }
    }

    for (const c of paired) {
      const idCheck = validateCitationIdentifier(c.identifier)
      if (!idCheck.valid) {
        errors.push(
          `${c.reportLabel}:${String(c.reportLine)}: invalid identifier \`${c.identifier}\` for (${c.filePath}:${String(c.lineNumber)}): ${idCheck.reason ?? 'invalid'}`,
        )
        continue
      }

      const fileLines = getFileLines(c.filePath)
      if (!fileLines) {
        errors.push(
          `${c.reportLabel}:${String(c.reportLine)}: cited file "${c.filePath}" does not exist${checkAgainstGit && COMMITTED_SOURCE_PATH_PREFIX_REGEX.test(c.filePath) ? ` in commit ${String(gitRef)}` : ''}.`,
        )
        continue
      }

      if (c.lineNumber < 1 || c.lineNumber > fileLines.length) {
        errors.push(
          `${c.reportLabel}:${String(c.reportLine)}: cited line ${c.filePath}:${String(c.lineNumber)} is out of range (file has ${String(fileLines.length)} lines).`,
        )
        continue
      }

      const actualLine = fileLines[c.lineNumber - 1]
      if (!actualLine.includes(c.identifier)) {
        errors.push(
          `${c.reportLabel}:${String(c.reportLine)}: identifier \`${c.identifier}\` not found on ${c.filePath}:${String(c.lineNumber)} (actual line: "${actualLine.trim()}").`,
        )
        continue
      }

      const key = `${c.identifier}:::${c.filePath}`
      const blockLines = parsedLog.blocks.get(key)
      if (!blockLines) {
        errors.push(
          `${c.reportLabel}:${String(c.reportLine)}: missing "$ git grep -n -e '${c.identifier}' -- ${c.filePath}" block in citations.log.`,
        )
        continue
      }

      const expectedPrefix = `${c.filePath}:${String(c.lineNumber)}:`
      const hasLineInBlock = [...blockLines].some((l) => l.startsWith(expectedPrefix))
      if (!hasLineInBlock) {
        errors.push(
          `${c.reportLabel}:${String(c.reportLine)}: block "$ git grep -n -e '${c.identifier}' -- ${c.filePath}" in citations.log does not contain "${expectedPrefix}".`,
        )
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    totalPairedCitations,
    totalUnpairedCitations,
    totalReferencedFiles,
    totalBlocks: parsedLog.totalBlocks,
  }
}

/**
 * Generates a clean per-identifier `citations.log` from one or more markdown reports
 * by running `git grep -n -e '<identifier>' HEAD -- <filePath>` for each unique pair.
 *
 * @param {object} params
 * @param {string} params.repoRoot
 * @param {string[]} params.reportPaths
 * @param {string} params.outPath
 * @param {string | null} [params.gitRef]
 */
export function generateCitationsLogFromReports({
  repoRoot,
  reportPaths,
  outPath,
  gitRef = 'HEAD',
}) {
  /** @type {Map<string, { identifier: string; filePath: string }>} */
  const uniquePairs = new Map()
  /** @type {string[]} */
  const preflightErrors = []
  const useGitRef = Boolean(gitRef && hasGitCommit(repoRoot, gitRef))

  for (const relOrAbsPath of reportPaths) {
    const absReport = path.resolve(repoRoot, relOrAbsPath)
    const relReport = path.relative(repoRoot, absReport).replace(/\\/g, '/')
    const markdown = fs.readFileSync(absReport, 'utf8')
    const { paired, unpaired } = parseReportCitations(markdown, relReport)

    for (const u of unpaired) {
      preflightErrors.push(
        `${u.reportLabel}:${String(u.reportLine)}: un-paired citation "${u.rawRef}" (must be written as \`identifier\` (\`${u.rawRef}\`)).`,
      )
    }

    for (const c of paired) {
      const idCheck = validateCitationIdentifier(c.identifier)
      if (!idCheck.valid) {
        preflightErrors.push(
          `${c.reportLabel}:${String(c.reportLine)}: invalid identifier \`${c.identifier}\` for (${c.filePath}:${String(c.lineNumber)}): ${idCheck.reason ?? 'invalid'}`,
        )
        continue
      }
      const key = `${c.identifier}:::${c.filePath}`
      if (!uniquePairs.has(key)) {
        uniquePairs.set(key, { identifier: c.identifier, filePath: c.filePath })
      }
    }
  }

  if (preflightErrors.length > 0) {
    throw new Error(`Cannot generate citations.log:\n${preflightErrors.join('\n')}`)
  }

  const outBlocks = []
  for (const { identifier, filePath } of uniquePairs.values()) {
    const grepArgs =
      useGitRef && COMMITTED_SOURCE_PATH_PREFIX_REGEX.test(filePath)
        ? ['--literal-pathspecs', 'grep', '-n', '-e', identifier, gitRef, '--', filePath]
        : ['--literal-pathspecs', 'grep', '-n', '-e', identifier, '--', filePath]
    const rawStdout = execFileSync('git', grepArgs, {
      cwd: repoRoot,
      encoding: 'utf8',
    })
      .replace(/\r\n/g, '\n')
      .trimEnd()
    const stdout =
      useGitRef && COMMITTED_SOURCE_PATH_PREFIX_REGEX.test(filePath)
        ? rawStdout
            .split('\n')
            .map((line) => (line.startsWith(`${gitRef}:`) ? line.slice(`${gitRef}:`.length) : line))
            .join('\n')
        : rawStdout
    outBlocks.push(`$ git grep -n -e '${identifier}' -- ${filePath}\n${stdout}`)
  }

  const finalContent = `${outBlocks.join('\n\n')}\n`
  fs.mkdirSync(path.dirname(path.resolve(repoRoot, outPath)), { recursive: true })
  fs.writeFileSync(path.resolve(repoRoot, outPath), finalContent, { encoding: 'utf8' })
}

if (
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/check-citations.mjs')
) {
  const rawArgs = process.argv.slice(2)
  const isGenerate = rawArgs[0] === '--generate'
  const args = isGenerate ? rawArgs.slice(1) : rawArgs

  if (args.length < 2) {
    process.stderr.write(
      'Usage: pnpm check:citations [--generate] <report.md> [report2.md ...] <citations.log>\n',
    )
    process.exit(1)
  }

  const repoRoot = process.cwd()
  const citationsLogArg = args[args.length - 1]
  const reportArgs = args.slice(0, -1)

  if (isGenerate) {
    generateCitationsLogFromReports({
      repoRoot,
      reportPaths: reportArgs,
      outPath: citationsLogArg,
    })
  }

  const citationsLogAbs = path.resolve(repoRoot, citationsLogArg)
  if (!fs.existsSync(citationsLogAbs)) {
    process.stderr.write(`[check:citations] ERROR: citations.log not found: ${citationsLogArg}\n`)
    process.exit(1)
  }

  const citationsLogText = fs.readFileSync(citationsLogAbs, 'utf8')
  const reports = reportArgs.map((p) => {
    const abs = path.resolve(repoRoot, p)
    return {
      reportPath: path.relative(repoRoot, abs).replace(/\\/g, '/'),
      markdown: fs.readFileSync(abs, 'utf8'),
    }
  })

  const result = verifyCitations({
    repoRoot,
    reports,
    citationsLogText,
  })

  if (!result.ok) {
    process.stderr.write(
      `[check:citations] FAILED with ${String(result.errors.length)} error(s):\n`,
    )
    for (const err of result.errors) {
      process.stderr.write(`  - ${err}\n`)
    }
    process.exit(1)
  }

  process.stdout.write(
    `[check:citations] PASS: Verified ${String(result.totalPairedCitations)} paired citation(s) and ${String(result.totalReferencedFiles)} referenced file path(s) across ${String(reports.length)} report(s) against ${String(result.totalBlocks)} identifier-only git grep block(s) in ${citationsLogArg} (0 un-paired citations, 0 errors).\n`,
  )
}
