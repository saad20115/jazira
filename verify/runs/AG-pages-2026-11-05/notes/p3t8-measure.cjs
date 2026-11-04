const { chromium } = require(require('module').createRequire('D:/jazira-verify/2026-11-05/ag-pages2/package.json').resolve('@playwright/test'));
const OUT = 'D:/jazira-verify/2026-11-05/notes/P3-T8-shots/';
const BASE = 'http://localhost:3323';
const collect = () => {
  const res = {};
  for (const el of document.querySelectorAll('[class]')) {
    for (const c of el.classList) {
      let m = c.match(/^_?[A-Za-z0-9-]{6}_([a-z][A-Za-z0-9]+)$/);
      if (!m) continue; const k = m[1];
      (res[k] ||= []);
      if (res[k].length >= 4) continue;
      const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
      res[k].push({ x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height), fs: s.fontSize, lh: s.lineHeight, fw: s.fontWeight, c: s.color, bg: s.backgroundColor, bgi: s.backgroundImage.slice(0, 80), b: s.border, r: s.borderRadius, sh: s.boxShadow, op: s.opacity, pad: s.padding, gap: s.gap, t: (el.innerText || '').slice(0, 40) });
    }
  }
  return res;
};
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const out = {};
  for (const [name, url] of [['projects', '/en/projects'], ['detail', '/en/projects/sofitel-makkah-hotel']]) {
    const resp = await p.goto(BASE + url, { waitUntil: 'networkidle' });
    for (let y = 0; y < 6000; y += 400) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(120); }
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800);
    out[name] = { status: resp.status(), docH: await p.evaluate(() => document.documentElement.scrollHeight), m: await p.evaluate(collect) };
    await p.screenshot({ path: OUT + `en-1440-${name}.png`, fullPage: true });
  }
  out.galleryButtons = await p.locator('[class*="galleryItemButton"]').count();
  require('fs').writeFileSync(OUT + 'measure-p3t8.json', JSON.stringify(out, null, 1));
  await b.close();
  console.log('ok');
})().catch(e => { console.error(e); process.exit(1); });
