import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * GHSA-gcqx-w48m-w2h4 ("deepmerge mergeObject() allows prototype poisoning of returned objects").
 * `deepmerge` is used by Payload (`payload/dist/utilities/deepMerge.js`); we override it with the
 * vendored, fixed copy in `vendor/deepmerge-safe` (see `vendor/deepmerge-safe/VENDORED.md`).
 *
 * `DEEPMERGE_UNDER_TEST` lets a reviewer point the same assertions at the original npm file to
 * see them fail (e.g. `DEEPMERGE_UNDER_TEST=<path to deepmerge@4.3.1/dist/cjs.js> pnpm vitest
 * run tests/unit/deepmerge-vendor.test.ts`).
 */

type DeepMerge = (target: unknown, source: unknown, options?: unknown) => unknown

const require = createRequire(import.meta.url)
const repoRoot = path.resolve(import.meta.dirname, '..', '..')
const vendoredEntry = path.join(repoRoot, 'vendor', 'deepmerge-safe', 'dist', 'cjs.js')
// By default the assertions run against the module Payload actually loads (pnpm.overrides installs
// the vendored folder under node_modules/.pnpm, so the path differs but the bytes must be equal).
const payloadRequire = createRequire(require.resolve('payload'))
const resolvedForPayload = payloadRequire.resolve('deepmerge')
const entryUnderTest = process.env.DEEPMERGE_UNDER_TEST ?? resolvedForPayload
const deepmerge = require(entryUnderTest) as DeepMerge

describe('deepmerge override (GHSA-gcqx-w48m-w2h4)', () => {
  it('resolves `deepmerge` for Payload to the vendored copy, not the npm package', () => {
    expect(fs.readFileSync(resolvedForPayload)).toEqual(fs.readFileSync(vendoredEntry))
    expect(fs.readFileSync(resolvedForPayload, 'utf8')).toContain('GHSA-gcqx-w48m-w2h4')
    const pkg = payloadRequire('deepmerge/package.json') as { version: string }
    expect(pkg.version).toBe('4.3.1-aljazira.1')
  })

  it('a JSON "__proto__" key cannot replace the prototype of the returned object (null-prototype target)', () => {
    const attack: unknown = JSON.parse('{"__proto__": {"polluted": "yes"}, "safe": 1}')
    const result = deepmerge(Object.create(null), attack) as Record<string, unknown>
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(result.polluted).toBeUndefined()
    expect(result.safe).toBe(1)
  })

  it('a JSON "__proto__" key in the target is not copied either', () => {
    const poisonedTarget: unknown = JSON.parse('{"__proto__": {"polluted": "yes"}, "a": 1}')
    const result = deepmerge(poisonedTarget, { b: 2 }) as Record<string, unknown>
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(result.polluted).toBeUndefined()
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('"constructor" and "prototype" keys are dropped, and the global Object.prototype is untouched', () => {
    const attack: unknown = JSON.parse(
      '{"constructor": {"prototype": {"polluted": "yes"}}, "prototype": {"x": 1}, "ok": true}',
    )
    const result = deepmerge(Object.create(null), attack) as Record<string, unknown>
    expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(result, 'prototype')).toBe(false)
    expect(result.ok).toBe(true)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('keeps normal deepmerge behaviour (nested objects, arrays, options.arrayMerge)', () => {
    expect(deepmerge({ a: { x: 1 }, list: [1] }, { a: { y: 2 }, list: [2] })).toEqual({
      a: { x: 1, y: 2 },
      list: [1, 2],
    })
    expect(
      deepmerge({ list: [1, 2] }, { list: [3] }, { arrayMerge: (_t: unknown, s: unknown) => s }),
    ).toEqual({ list: [3] })
  })
})
