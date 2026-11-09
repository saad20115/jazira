import { execFileSync, execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

/**
 * Milestone M1 proof for `P3-T5` E3 step 1 (the seam): moving home section 4 into
 * `src/components/systems3d/InteractiveSystemsSection.tsx` must not change the output.
 *
 * Usage (against a production build served on the p3t5 port):
 *   node scripts/evidence/p3-t5-seam-proof.mjs capture <before|after> <outDir> [baseUrl]
 *   node scripts/evidence/p3-t5-seam-proof.mjs compare <outDir>
 *
 * `capture` stores, per locale (`en`, `ar` with the Arabic switch on):
 *   - the raw server HTML of `/<locale>` and a normalized copy (see `normalizeHtml`);
 *   - the raw section-4 markup;
 *   - the computed style + box of every element in section 4 at 1440×900 and 390×844
 *     (`*.styles.json.gz`, gzip level 9; about 5.7 MB of JSON each when unpacked);
 *   - a PNG screenshot of section 4 at both viewports.
 * `compare` diffs before vs after and writes `seam-proof-summary.txt`. Nothing is filtered:
 * every diff line is written to the `*.diff` files.
 */

const LOCALES = ['en', 'ar']
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
]
const SECTION_SELECTOR = 'section[data-home-section="interactive-systems"]'

// Turbopack production CSS-module class names: `<6-char module hash>_<local name>`, e.g.
// `Lr065q_interactiveSection`. Only rewritten inside `class="…"` attributes and RSC `className`
// strings, never in free text.
const CSS_MODULE_TOKEN = /^[A-Za-z0-9_-]{6}_([a-z][A-Za-z0-9]*)$/
const CLASS_ATTR = /(class="|className\\?":\\?")([^"\\]*)/g

function normalizeClassList(list) {
  return list
    .split(' ')
    .map((token) => token.replace(CSS_MODULE_TOKEN, 'cssm__$1'))
    .join(' ')
}

function repoHeader() {
  const head = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  const status = execSync('git status --short', { encoding: 'utf8' })
  return `$ git rev-parse HEAD\n${head}\n$ git status --short\n${status}`
}

/**
 * Removes only per-build and per-request tokens:
 *   - the CSP nonce value (random per request);
 *   - the build id (`.next/BUILD_ID`);
 *   - `/_next/static/...` asset paths (content-hashed file names);
 *   - the `<hash>_` prefix of CSS-module class names (the local name is kept).
 */
export function normalizeHtml(html, buildId) {
  let out = html
  const nonceMatch = /\snonce="([^"]+)"/.exec(out)
  if (nonceMatch) {
    out = out.split(nonceMatch[1]).join('<NONCE>')
  }
  if (buildId) {
    out = out.split(buildId).join('<BUILD_ID>')
  }
  out = out.replace(/\/_next\/static\/[^"'\s\\)]+/g, '/_next/static/<ASSET>')
  out = out.replace(CLASS_ATTR, (_match, prefix, list) => `${prefix}${normalizeClassList(list)}`)
  return out.replace(/></g, '>\n<')
}

export function extractSection(html) {
  const marker = 'data-home-section="interactive-systems"'
  const markerIdx = html.indexOf(marker)
  if (markerIdx === -1) {
    return null
  }
  const start = html.lastIndexOf('<section', markerIdx)
  const end = html.indexOf('</section>', markerIdx)
  return html.slice(start, end + '</section>'.length)
}

async function captureStyles(page) {
  return page.evaluate((selector) => {
    const section = document.querySelector(selector)
    if (!section) {
      return null
    }
    const pathOf = (el) => {
      const parts = []
      let node = el
      while (node && node !== section.parentElement) {
        const parent = node.parentElement
        const idx = parent ? Array.prototype.indexOf.call(parent.children, node) : 0
        parts.unshift(`${node.tagName.toLowerCase()}[${String(idx)}]`)
        node = parent
      }
      return parts.join('>')
    }
    // Sorted: Chrome enumerates custom properties in no fixed order between page loads.
    const styleMap = (cs) => {
      const props = []
      for (let i = 0; i < cs.length; i += 1) {
        props.push(cs.item(i))
      }
      props.sort()
      const map = {}
      for (const prop of props) {
        map[prop] = cs.getPropertyValue(prop)
      }
      return map
    }
    return [section, ...section.querySelectorAll('*')].map((el) => {
      const rect = el.getBoundingClientRect()
      return {
        path: pathOf(el),
        box: [rect.x, rect.y, rect.width, rect.height].map((v) => Math.round(v * 100) / 100),
        style: styleMap(getComputedStyle(el)),
        before: styleMap(getComputedStyle(el, '::before')),
        after: styleMap(getComputedStyle(el, '::after')),
      }
    })
  }, SECTION_SELECTOR)
}

async function capture(label, outDir, baseUrl) {
  fs.mkdirSync(outDir, { recursive: true })
  const buildId = fs.readFileSync(path.resolve('.next', 'BUILD_ID'), 'utf8').trim()
  fs.writeFileSync(path.join(outDir, `${label}-repo.txt`), `${repoHeader()}build_id: ${buildId}\n`)

  for (const locale of LOCALES) {
    const res = await fetch(`${baseUrl}/${locale}`, { redirect: 'manual' })
    if (res.status !== 200) {
      throw new Error(`GET /${locale} -> HTTP ${String(res.status)} (is arabicEnabled on?)`)
    }
    const html = await res.text()
    const section = extractSection(html)
    if (!section) {
      throw new Error(`/${locale}: section 4 not found in the server HTML`)
    }
    fs.writeFileSync(path.join(outDir, `${label}-${locale}.raw.html`), html)
    fs.writeFileSync(
      path.join(outDir, `${label}-${locale}.norm.html`),
      normalizeHtml(html, buildId),
    )
    fs.writeFileSync(path.join(outDir, `${label}-${locale}.section.raw.html`), section)
  }

  const browser = await chromium.launch()
  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      for (const locale of LOCALES) {
        await page.goto(`${baseUrl}/${locale}`, { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts.ready)
        const section = page.locator(SECTION_SELECTOR)
        await section.scrollIntoViewIfNeeded()
        await page.waitForFunction(
          (selector) =>
            [...document.querySelectorAll(`${selector} img`)].every((img) => img.complete),
          SECTION_SELECTOR,
        )
        const styles = await captureStyles(page)
        fs.writeFileSync(
          path.join(outDir, `${label}-${locale}-${viewport.name}.styles.json.gz`),
          zlib.gzipSync(`${JSON.stringify(styles, null, 1)}\n`, { level: 9 }),
        )
        await section.screenshot({
          path: path.join(outDir, `${label}-${locale}-${viewport.name}.section.png`),
          animations: 'disabled',
        })
      }
      await context.close()
    }
  } finally {
    await browser.close()
  }
  process.stdout.write(`captured ${label} into ${outDir}\n`)
}

function diffFiles(outDir, a, b, diffName, inputDir = outDir) {
  let diff = ''
  try {
    execFileSync(
      'git',
      [
        'diff',
        '--no-index',
        '--no-color',
        '--unified=0',
        path.join(inputDir, a),
        path.join(inputDir, b),
      ],
      { encoding: 'utf8' },
    )
  } catch (err) {
    // `git diff --no-index` exits 1 when the files differ; the diff is on stdout.
    diff = err.stdout ?? ''
  }
  fs.writeFileSync(path.join(outDir, diffName), diff)
  const changed = diff
    .split('\n')
    .filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---) /.test(line)).length
  return changed
}

async function pixelDiff(fileA, fileB) {
  const [a, b] = await Promise.all(
    [fileA, fileB].map((file) =>
      sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    ),
  )
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
    return `size differs: ${String(a.info.width)}x${String(a.info.height)} vs ${String(b.info.width)}x${String(b.info.height)}`
  }
  let differing = 0
  for (let i = 0; i < a.data.length; i += 4) {
    if (
      a.data[i] !== b.data[i] ||
      a.data[i + 1] !== b.data[i + 1] ||
      a.data[i + 2] !== b.data[i + 2] ||
      a.data[i + 3] !== b.data[i + 3]
    ) {
      differing += 1
    }
  }
  return `${String(a.info.width)}x${String(a.info.height)}, differing pixels: ${String(differing)}`
}

async function compare(outDir) {
  const lines = [repoHeader(), '']
  const unpackDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p3t5-seam-styles-'))
  for (const locale of LOCALES) {
    const normChanged = diffFiles(
      outDir,
      `before-${locale}.norm.html`,
      `after-${locale}.norm.html`,
      `${locale}.norm.diff`,
    )
    const sectionChanged = diffFiles(
      outDir,
      `before-${locale}.section.raw.html`,
      `after-${locale}.section.raw.html`,
      `${locale}.section.raw.diff`,
    )
    lines.push(`/${locale} normalized full HTML: ${String(normChanged)} changed lines`)
    lines.push(
      `/${locale} raw section-4 markup: ${String(sectionChanged)} changed lines (unnormalized)`,
    )
    for (const viewport of VIEWPORTS) {
      const key = `${locale}-${viewport.name}`
      const [before, after] = ['before', 'after'].map((label) => {
        const json = zlib
          .gunzipSync(fs.readFileSync(path.join(outDir, `${label}-${key}.styles.json.gz`)))
          .toString('utf8')
        fs.writeFileSync(path.join(unpackDir, `${label}-${key}.styles.json`), json)
        return json
      })
      const styleChanged = diffFiles(
        outDir,
        `before-${key}.styles.json`,
        `after-${key}.styles.json`,
        `${key}.styles.diff`,
        unpackDir,
      )
      const elementCount = (JSON.parse(before) ?? []).length
      lines.push(
        `/${locale} @${viewport.name}: computed styles of ${String(elementCount)} elements identical=${String(before === after)} (${String(styleChanged)} changed lines)`,
      )
      const pixels = await pixelDiff(
        path.join(outDir, `before-${key}.section.png`),
        path.join(outDir, `after-${key}.section.png`),
      )
      lines.push(`/${locale} @${viewport.name}: section screenshot ${pixels}`)
    }
  }
  const summary = `${lines.join('\n')}\n`
  fs.writeFileSync(path.join(outDir, 'seam-proof-summary.txt'), summary)
  process.stdout.write(summary)
}

const [mode, ...rest] = process.argv.slice(2)
if (mode === 'capture') {
  const [label, outDir, baseUrl = 'http://localhost:3170'] = rest
  if (label !== 'before' && label !== 'after') {
    throw new Error('capture needs <before|after>')
  }
  await capture(label, outDir, baseUrl.replace(/\/$/, ''))
} else if (mode === 'compare') {
  await compare(rest[0])
} else {
  throw new Error('usage: capture <before|after> <outDir> [baseUrl] | compare <outDir>')
}
