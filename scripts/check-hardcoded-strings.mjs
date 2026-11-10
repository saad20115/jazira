// P3-T10 §7 — static scan: no business sentences hard-coded in public components.
// Visible text belongs in the CMS or in the i18n dictionaries (src/i18n/). This scan reads every
// .tsx file under src/components/ and src/app/(frontend)/ (tests, the dev styleguide and the
// specimen page excluded), strips comments, and fails on:
//   - any Arabic letters in JSX text or in a string literal;
//   - English JSX text of three or more words;
//   - English string literals of three or more words passed to text props
//     (aria-label, alt, title, placeholder, label, children).
// Usage: node scripts/check-hardcoded-strings.mjs   (exit 1 on any finding)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SCAN_DIRS = [
  path.join(REPO_ROOT, 'src', 'components'),
  path.join(REPO_ROOT, 'src', 'app', '(frontend)'),
]
const EXCLUDED = [
  path.join(REPO_ROOT, 'src', 'components', 'admin'),
  path.join(REPO_ROOT, 'src', 'app', '(frontend)', '[locale]', 'styleguide'),
  path.join(REPO_ROOT, 'src', 'app', '(frontend)', '[locale]', '%5Fspecimen'),
]
// Files allowed to hold bilingual labels, each with the reason. Keep this list short.
const ALLOWED_FILES = new Map([
  [
    'src/components/icons/ServiceIcon.tsx',
    'SERVICE_ICON_OPTIONS: admin select labels for the icon picker (Services collection and the admin field); never rendered on a public page',
  ],
])
const ARABIC = /[\u0600-\u06FF]/
const TEXT_PROPS = /\b(aria-label|alt|title|placeholder|label|children)\s*=\s*(["'])([^"'\n]*)\2/g

function listFiles(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (EXCLUDED.some((ex) => full === ex || full.startsWith(ex + path.sep))) continue
    if (entry.isDirectory()) out.push(...listFiles(full))
    else if (/\.tsx$/.test(entry.name) && !/\.test\.tsx$/.test(entry.name)) out.push(full)
  }
  return out
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:"'`])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length))
}

function wordCount(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => /[A-Za-z]{2,}/.test(w)).length
}

const findings = []
for (const file of SCAN_DIRS.flatMap(listFiles)) {
  const source = stripComments(fs.readFileSync(file, 'utf8'))
  const lineOf = (index) => source.slice(0, index).split('\n').length
  const rel = path.relative(REPO_ROOT, file).split(path.sep).join('/')
  if (ALLOWED_FILES.has(rel)) continue

  // JSX text between tags.
  for (const match of source.matchAll(/>([^<>{}]+)</g)) {
    const text = match[1].trim()
    if (!text || !/[A-Za-z\u0600-\u06FF]/.test(text)) continue
    if (/[=;()]|=>|&&/.test(text)) continue // TypeScript generics or expressions, not JSX text
    if (ARABIC.test(text) || wordCount(text) >= 3) {
      findings.push(`${rel}:${lineOf(match.index)} JSX text "${text.slice(0, 60)}"`)
    }
  }
  // Arabic anywhere in a string literal.
  for (const match of source.matchAll(/(["'`])((?:(?!\1)[^\\\n]|\\.)*)\1/g)) {
    if (ARABIC.test(match[2])) {
      findings.push(`${rel}:${lineOf(match.index)} Arabic literal "${match[2].slice(0, 60)}"`)
    }
  }
  // English sentences in text props.
  for (const match of source.matchAll(TEXT_PROPS)) {
    if (wordCount(match[3]) >= 3) {
      findings.push(`${rel}:${lineOf(match.index)} ${match[1]}="${match[3].slice(0, 60)}"`)
    }
  }
}

if (findings.length > 0) {
  console.error('Hard-coded business text found (move it to the CMS or src/i18n/):')
  for (const finding of findings) console.error(`  ${finding}`)
  process.exit(1)
}
console.log('check-hardcoded-strings: no hard-coded business text in public components')
