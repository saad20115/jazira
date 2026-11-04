// CTO verifier: record CSP violation events (target element, directive, source) on a URL. Usage: node csp-probe.mjs <url>
import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire(path.join(process.cwd(), 'package.json')); const { chromium } = require('@playwright/test')
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.addInitScript(() => { window.__v = []; document.addEventListener('securitypolicyviolation', (e) => { const t = e.target; window.__v.push({ dir: e.violatedDirective, src: e.sourceFile, line: e.lineNumber, col: e.columnNumber, sample: e.sample, tag: t && t.tagName, cls: t && t.className && String(t.className).slice(0, 120), html: t && t.outerHTML && t.outerHTML.slice(0, 300) }) }, true) })
await p.goto(process.argv[2], { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
console.log(JSON.stringify(await p.evaluate(() => window.__v), null, 1)); await b.close()
