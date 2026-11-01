import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { chromium } from '@playwright/test'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * P3-T5 C3-1 (CTO decision 2a, 2026-11-01): related projects that arrive late never reset the card.
 *
 * The real client tree of home section 4 (`SystemsExplorer`, with its panel boundaries) runs with real
 * React in a real Chromium. The related-projects promise is controlled by the test; the 3D viewer is
 * a stub that logs its creation and disposal. A visitor goes live, activates the card and enters a
 * system before the promise resolves; once it resolves, the card, its canvas and its viewer must be
 * the same ones, the system still entered, and the panel shown.
 *
 * No bundler dependency: the modules (real `react` / `react-dom` CommonJS builds and this repo's TSX
 * transpiled with the project's `typescript`) are wrapped in a small CommonJS loader below.
 */

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src')
const VIEWER_MODULE = path.join(SRC, 'components', 'systems3d', 'viewer', 'createViewer.ts')
const HARNESS_ID = path.join(SRC, '__p3t5_late_related_harness__.js')
const ORIGIN = 'http://p3t5-late-related.test'

/** Stand-ins: `next/link` as an anchor, CSS modules as their class names, the viewer as a log. */
const STUBS: Record<string, string> = {
  'next/link': `
    var React = require('react');
    module.exports = { __esModule: true, default: function Link(props) {
      var rest = Object.assign({}, props); delete rest.children; delete rest.prefetch;
      return React.createElement('a', rest, props.children);
    } };`,
  [VIEWER_MODULE]: `
    module.exports = { createViewer: function (options) {
      var log = window.__viewerLog;
      log.created += 1;
      options.signal.addEventListener('abort', function () { log.disposed += 1; });
      options.onFirstFrame();
      return Promise.resolve({
        setActive: function () {}, setSystem: function (s) { log.systems.push(s); },
        resetView: function () {}, zoomBy: function () {}, rotateBy: function () {},
        stats: function () { return { tier: 'lite', gpu: null, bloom: false, lowTier: false,
          pixelRatio: 1, drawCalls: 0, triangles: 0, geometries: 0, textures: 0 }; },
        dispose: function () {},
      });
    } };`,
}

const CSS_MODULE = `module.exports = { __esModule: true, default: new Proxy({}, {
  get: function (_t, key) { return typeof key === 'string' ? key : undefined; } }) };`

/**
 * The client tree as page.tsx produces it for section 4: the explorer, which suspends only its
 * panels on the related-projects promise.
 */
const HARNESS = `
  var React = require('react');
  var client = require('react-dom/client');
  var SystemsExplorer = require('@/components/systems3d/SystemsExplorer').SystemsExplorer;
  var strings = require('@/components/systems3d/strings').SYSTEMS3D_STRINGS.en;
  window.__mount = function () {
    var resolveRelated;
    var related = new Promise(function (resolve) { resolveRelated = resolve; });
    window.__resolveRelated = resolveRelated;
    var ids = ['hvac', 'fire', 'plumbing', 'power', 'smart'];
    var props = {
      locale: 'en',
      poster: React.createElement('img', { alt: 'Tower' }),
      posterAlt: 'Tower',
      badgeLabel: '3D model',
      openLabel: 'Open the live 3D model',
      relatedHeading: 'Related projects',
      strings: strings,
      systems: ids.map(function (id, i) {
        return { key: 'row-' + id, system: id, title: 'System ' + (i + 1), text: 'About ' + id };
      }),
    };
    var tree = React.createElement(SystemsExplorer, Object.assign({}, props, { related: related }));
    client.createRoot(document.getElementById('mount')).render(tree);
  };
`

interface ModuleDef {
  code: string
  deps: Record<string, string>
}

function resolveFile(base: string): string {
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
  ]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate
    }
  }
  throw new Error(`cannot resolve ${base}`)
}

function resolveSpec(spec: string, from: string): string | null {
  if (spec in STUBS) {
    return spec
  }
  if (spec.startsWith('@/')) {
    return resolveFile(path.join(SRC, spec.slice(2)))
  }
  if (spec.startsWith('.')) {
    return resolveFile(path.resolve(path.dirname(from), spec))
  }
  try {
    return createRequire(from).resolve(spec)
  } catch {
    // An optional require inside a dependency that this tree never reaches.
    return null
  }
}

function moduleCode(id: string): string {
  if (id in STUBS) {
    return STUBS[id] ?? ''
  }
  if (id === HARNESS_ID) {
    return HARNESS
  }
  if (id.endsWith('.css')) {
    return CSS_MODULE
  }
  const source = fs.readFileSync(id, 'utf8')
  if (id.endsWith('.json')) {
    return `module.exports = ${source};`
  }
  if (/\.tsx?$/.test(id)) {
    return ts.transpileModule(source, {
      fileName: id,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText
  }
  return source
}

/** Every module reachable from the harness, wrapped for the loader. */
function bundle(): string {
  const defs = new Map<string, ModuleDef>()
  const queue = [HARNESS_ID]
  while (queue.length > 0) {
    const id = queue.shift() ?? ''
    if (defs.has(id)) {
      continue
    }
    const code = moduleCode(id)
    const deps: Record<string, string> = {}
    const from = id in STUBS ? HARNESS_ID : id
    for (const match of code.matchAll(/\brequire\((['"])([^'"]+)\1\)/g)) {
      const spec = match[2]
      const target = resolveSpec(spec, from)
      if (target !== null) {
        deps[spec] = target
        queue.push(target)
      }
    }
    defs.set(id, { code, deps })
  }
  const entries = [...defs].map(
    ([id, def]) =>
      `${JSON.stringify(id)}: { deps: ${JSON.stringify(def.deps)}, fn: function (module, exports, require) {\n${def.code}\n} }`,
  )
  return `(function () {
    var process = { env: { NODE_ENV: 'development' } };
    var defs = {${entries.join(',\n')}};
    var cache = {};
    function load(id) {
      if (cache[id]) { return cache[id].exports; }
      var def = defs[id];
      if (!def) { throw new Error('module not bundled: ' + id); }
      var module = { exports: {} };
      cache[id] = module;
      def.fn.call(module.exports, module, module.exports, function (spec) {
        if (!(spec in def.deps)) { throw new Error('unresolved require ' + spec + ' in ' + id); }
        return load(def.deps[spec]);
      });
      return module.exports;
    }
    window.process = process;
    load(${JSON.stringify(HARNESS_ID)});
  })();`
}

const PAGE = `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><style>
  [data-interactive-3d-card] { position: relative; display: block; width: 600px; height: 580px; }
  [data-interactive-3d-card] canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
</style></head><body><div id="mount"></div></body></html>`

describe('P3-T5 C3-1: late related projects never reset the card (real React, real Chromium)', () => {
  it('a visitor enters a system before the related projects arrive; their arrival changes nothing else', async () => {
    const script = bundle()
    const browser = await chromium.launch({ headless: true })
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      // Device hints of a capable desktop, set from outside the code (the card reads real hints).
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
        Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
        Object.assign(window, { __viewerLog: { created: 0, disposed: 0, systems: [] } })
      })
      await context.route(`${ORIGIN}/**`, (route) =>
        route.fulfill({ status: 200, contentType: 'text/html', body: PAGE }),
      )
      const page = await context.newPage()
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      await page.goto(`${ORIGIN}/en`)
      await page.addScriptTag({ content: script })
      await page.evaluate(() => {
        ;(window as unknown as { __mount: () => void }).__mount()
      })

      const card = page.locator('[data-interactive-3d-card]')
      // Go live (mouse intent), activate (click), then pick the second system (key 2 on the card).
      await card.hover()
      await expect.poll(() => card.getAttribute('data-viewer-state')).toBe('live')
      await card.click({ position: { x: 20, y: 20 } })
      await expect.poll(() => card.getAttribute('data-viewer-active')).toBe('true')
      await page.keyboard.press('2')
      await expect.poll(() => card.getAttribute('data-entered')).toBe('fire')
      expect(await page.locator('[data-related-panel]').count()).toBe(0)

      await page.evaluate(() => {
        const w = window as unknown as Record<string, unknown>
        w.__cardBefore = document.querySelector('[data-interactive-3d-card]')
        w.__canvasBefore = document.querySelector('[data-interactive-3d-card] canvas')
      })

      // The related projects arrive now.
      await page.evaluate(() => {
        const w = window as unknown as { __resolveRelated: (value: unknown) => void }
        w.__resolveRelated({
          fire: {
            projects: [{ id: '1', title: 'Tower A', href: '/en/projects/tower-a' }],
            allHref: '/en/projects?scope=fire-fighting',
          },
        })
      })
      await expect.poll(() => page.locator('[data-related-panel="card"]').count()).toBe(1)
      await page.waitForTimeout(200)

      const after = await page.evaluate(() => {
        const w = window as unknown as Record<string, unknown> & {
          __viewerLog: { created: number; disposed: number }
        }
        const cardNow = document.querySelector('[data-interactive-3d-card]')
        return {
          sameCard: cardNow !== null && cardNow === w.__cardBefore,
          sameCanvas:
            w.__canvasBefore !== null &&
            document.querySelector('[data-interactive-3d-card] canvas') === w.__canvasBefore,
          viewersCreated: w.__viewerLog.created,
          viewersDisposed: w.__viewerLog.disposed,
          entered: cardNow?.getAttribute('data-entered'),
          state: cardNow?.getAttribute('data-viewer-state'),
          active: cardNow?.getAttribute('data-viewer-active'),
          panelLinks: [...document.querySelectorAll('[data-related-panel="card"] a')].map((a) =>
            a.getAttribute('href'),
          ),
        }
      })
      expect(after).toEqual({
        sameCard: true,
        sameCanvas: true,
        viewersCreated: 1,
        viewersDisposed: 0,
        entered: 'fire',
        state: 'live',
        active: 'true',
        panelLinks: ['/en/projects/tower-a', '/en/projects?scope=fire-fighting'],
      })
      expect(errors).toEqual([])
    } finally {
      await browser.close()
    }
  })
})
