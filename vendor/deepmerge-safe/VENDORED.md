# Vendored `deepmerge` (fix for GHSA-gcqx-w48m-w2h4)

- **Upstream:** `deepmerge@4.3.1`, MIT. Source: https://github.com/TehShrike/deepmerge. The upstream
  license is kept in `license.txt`.
- **Why it is vendored:** `pnpm audit --prod` reports GHSA-gcqx-w48m-w2h4: "deepmerge mergeObject()
  allows prototype poisoning of returned objects".
  - Vulnerable versions: `>=4.2.0 <=4.3.1`. Patched versions: `<0.0.0`, i.e. no fixed release exists.
  - Path: `.>payload>deepmerge`. We never import deepmerge ourselves; Payload does, in
    `payload/dist/utilities/deepMerge.js`.
  - `payload@3.92.1`, the latest at the time of writing, still depends on `deepmerge@4.3.1`, which is
    the latest deepmerge release.
- **How it is wired:** `package.json` has `pnpm.overrides`: `"deepmerge": "file:./vendor/deepmerge-safe"`.
  Every package that asks for `deepmerge` gets this copy. The npm copy is no longer installed.
- **What differs from upstream:**
  1. `dist/cjs.js` is upstream's file plus **one guard** in `mergeObject()`: own keys named
     `__proto__`, `constructor` or `prototype` in the *source* object are skipped. The exact diff is
     the commit that follows the "vendor deepmerge 4.3.1 unchanged" commit.
  2. `index.d.ts` was renamed `index.d.cts` (content unchanged), so the repository's TS-only ESLint
     config does not lint third-party declarations.
  3. This `package.json` and `VENDORED.md` are new. Upstream's README, changelog, `umd.js` and dev
     tooling are not copied, because nothing here uses them.
- **Proof:** `tests/unit/deepmerge-vendor.test.ts`.
  - It merges `JSON.parse('{"__proto__": {...}}')` into a null-prototype target. Upstream 4.3.1
    returns an object whose prototype is the attacker's object; the vendored copy does not.
  - It also checks that `deepmerge` resolves to this folder.
- **How to undo:** when upstream (or Payload) ships a fixed version, remove the override from
  `package.json`, delete this folder, run `pnpm install`, and keep the unit test pointed at the npm
  copy.
