// read-only: walks quote form to step 3 at 1440/390 en; never presses Send. Non-authoritative helper for P3-T9 r2 notes.
import { createRequire } from 'node:module';
const req = createRequire('D:/jazira-verify/2026-11-05/ag-pages2/package.json');
const { chromium } = req('@playwright/test');
const base = 'http://localhost:3323';
const browser = await chromium.launch();
const out = {};
for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(base + '/en/contact', { waitUntil: 'networkidle' });
  const r = (sel) => page.locator(sel).evaluateAll((els) => els.map((e) => { const b = e.getBoundingClientRect(); return { tag: e.tagName, cls: (e.className && e.className.baseVal === undefined ? String(e.className) : '').slice(0, 60), t: (e.innerText || '').trim().slice(0, 40), x: Math.round(b.x + scrollX), y: Math.round(b.y + scrollY), w: Math.round(b.width), h: Math.round(b.height) }; }));
  const bodyText = await page.locator('body').innerText();
  out[w] = { timeWords: (bodyText.match(/within[^.]*|working day[^.]*|\b24 ?h[^.]*|as soon as[^.]*/gi) || []) };
  out[w].form = await r('[data-quote-step="1"]');
  await page.locator('[data-quote-next="step-1"]').click();
  await page.locator('[data-quote-step="2"]').waitFor();
  out[w].step2btns = await r('[data-quote-step="2"] button, [data-quote-next="step-2"]');
  await page.locator('#quote-name').fill('Test Name'); await page.locator('#quote-company').fill('Test Co'); await page.locator('#quote-phone').fill('57 353 4185'); await page.locator('#quote-email').fill('test@example.com');
  await page.locator('[data-quote-next="step-2"]').click();
  await page.locator('[data-quote-step="3"]').waitFor();
  out[w].step3 = await r('[data-quote-step="3"], [data-quote-step="3"] > *, [data-quote-step="3"] > * > *');
  out[w].step3btns = await r('[data-quote-step="3"] button, [data-quote-submit]');
  out[w].formCard = await r('form');
  await page.locator('[data-quote-step="3"]').screenshot({ path: `D:/jazira-verify/2026-11-05/notes/p3t9-en-${w}-step3-verifier.png` });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
