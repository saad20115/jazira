// read-only computed-style probe for P3-T9 r2 buttons (non-authoritative helper)
import { createRequire } from 'node:module';
const { chromium } = createRequire('D:/jazira-verify/2026-11-05/ag-pages2/package.json')('@playwright/test');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3323/en/contact', { waitUntil: 'networkidle' });
console.log(JSON.stringify(await p.locator('[data-quote-next="step-1"], a[data-component="button"]').evaluateAll(els => els.map(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return { t: e.innerText.trim(), fw: s.fontWeight, fs: s.fontSize, lh: s.lineHeight, ff: s.fontFamily.slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y + scrollY) }; }))));
await b.close();
