import fs from 'node:fs'
import path from 'node:path'

import { Linter } from 'eslint'
import { NextRequest } from 'next/server'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import tseslint from 'typescript-eslint'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { noJsxStringLiteralsRule } from '../eslint-rules/no-jsx-string-literals.mjs'
import { generateTokensFile, TYPOGRAPHY_STYLE_MAP } from '../scripts/generate-tokens.mjs'
import { CmsLink } from './components/CmsLink'
import {
  arDictionary,
  DEFAULT_LOCALE,
  enDictionary,
  formatStepCounter,
  getAlternateLocale,
  getDictionary,
  getLocaleDirection,
  isSupportedLocale,
} from './i18n'
import {
  isValidInternalCmsPath,
  resolveSafeCmsLinkData,
  sanitizeCmsHref,
} from './lib/link-safety'
import {
  getPreviewSecret,
  previewExitQuerySchema,
  previewQuerySchema,
  resolvePreviewTargetPath,
  verifyPreviewSecret,
} from './lib/preview'
import { generateCspNonce, proxy, resolveLocaleFromPathname } from './proxy'
import {
  ADMIN_CSP_RELAXATIONS,
  buildAdminCspHeader,
  buildPublicCspHeader,
  I4_VIDEO_FRAME_SOURCES,
  isAdminRoutePath,
  isHomePagePath,
} from './security/csp'

function walkFiles(dir: string, filterFn: (filePath: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return []
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, filterFn))
    } else if (entry.isFile() && filterFn(fullPath)) {
      results.push(fullPath)
    }
  }
  return results
}

function lintJsxSnippet(code: string, filename: string): Linter.LintMessage[] {
  const linter = new Linter({ configType: 'flat' })
  return linter.verify(
    code,
    [
      {
        files: ['**/*.tsx', '**/*.ts'],
        languageOptions: {
          parser: tseslint.parser,
          ecmaVersion: 'latest',
          sourceType: 'module',
          parserOptions: {
            ecmaFeatures: {
              jsx: true,
            },
          },
        },
        plugins: {
          'local-rules': {
            rules: {
              'no-jsx-string-literals': noJsxStringLiteralsRule,
            },
          },
        },
        rules: {
          'local-rules/no-jsx-string-literals': 'error',
        },
      },
    ],
    { filename: path.resolve(process.cwd(), filename) },
  )
}

describe('P3-T1 Scope 1 & 2 — Design tokens, CSS Modules, logical properties, and no raw hex', () => {
  it('verifies src/styles/tokens.css is up-to-date with design/tokens.json and contains all 23 typography classes + CTO tokens', () => {
    const res = generateTokensFile({ checkOnly: true })
    expect(res.updated).toBe(false)

    const tokensCss = fs.readFileSync(res.path, 'utf8')
    expect(tokensCss).toContain('--gold-500: #dfa82a;')
    expect(tokensCss).toContain('--navy-950: #011025;')
    expect(tokensCss).toContain('--danger: #b42318;')
    expect(tokensCss).toContain('--font-lh-multiplier: 1.1;')

    const styleCount = Object.keys(TYPOGRAPHY_STYLE_MAP).length
    expect(styleCount).toBe(23)

    for (const styleConfig of Object.values(TYPOGRAPHY_STYLE_MAP)) {
      for (const selector of styleConfig.selectors) {
        expect(tokensCss).toContain(selector)
      }
    }
  })

  it('enforces zero raw hex colors (#...) across src/app/(frontend) and src/components', () => {
    const repoRoot = process.cwd()
    const targetDirs = [
      path.join(repoRoot, 'src', 'app', '(frontend)'),
      path.join(repoRoot, 'src', 'components'),
    ]

    const hexRegex = /#[0-9a-fA-F]{3,8}\b/g
    const violations: Array<{ file: string; matches: string[] }> = []

    for (const dir of targetDirs) {
      const files = walkFiles(dir, (f) => /\.(tsx?|css|mjs)$/.test(f))
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8')
        // Strip `#main-content` anchor hashes so only color hex literals are matched
        const stripped = content.replace(/#main-content\b/g, '')
        const matches = stripped.match(hexRegex)
        if (matches && matches.length > 0) {
          violations.push({
            file: path.relative(repoRoot, file).replace(/\\/g, '/'),
            matches,
          })
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('enforces logical CSS properties (no physical margin/padding/border/text-align left/right) in frontend CSS', () => {
    const repoRoot = process.cwd()
    const cssFiles = [
      path.join(repoRoot, 'src', 'styles', 'globals.css'),
      path.join(repoRoot, 'src', 'styles', 'grid.module.css'),
      ...walkFiles(path.join(repoRoot, 'src', 'app', '(frontend)'), (f) => f.endsWith('.css')),
      ...walkFiles(path.join(repoRoot, 'src', 'components'), (f) => f.endsWith('.css')),
    ]

    const bannedPhysicalRegex =
      /\b(margin-left|margin-right|padding-left|padding-right|border-left|border-right|text-align\s*:\s*(left|right))\b/i

    const violations: string[] = []
    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf8')
      if (bannedPhysicalRegex.test(content)) {
        violations.push(path.relative(repoRoot, file).replace(/\\/g, '/'))
      }
    }

    expect(violations).toEqual([])
  })
})

describe('P3-T1 Scope 4 — i18n dictionaries, routing helpers, and local-rules/no-jsx-string-literals', () => {
  it('validates supported locales, RTL/LTR directions, alternate locales, and identical dictionary key trees', () => {
    expect(DEFAULT_LOCALE).toBe('ar')
    expect(isSupportedLocale('ar')).toBe(true)
    expect(isSupportedLocale('en')).toBe(true)
    expect(isSupportedLocale('fr')).toBe(false)
    expect(isSupportedLocale('')).toBe(false)

    expect(getLocaleDirection('ar')).toBe('rtl')
    expect(getLocaleDirection('en')).toBe('ltr')
    expect(getAlternateLocale('ar')).toBe('en')
    expect(getAlternateLocale('en')).toBe('ar')

    expect(Object.keys(getDictionary('ar'))).toEqual(Object.keys(getDictionary('en')))
    for (const sectionKey of Object.keys(arDictionary) as Array<keyof typeof arDictionary>) {
      expect(Object.keys(arDictionary[sectionKey])).toEqual(
        Object.keys(enDictionary[sectionKey]),
      )
    }

    expect(formatStepCounter(arDictionary.quoteForm.stepOfTotal, 2, 4)).toBe('2 / 4')
  })

  it('local-rules/no-jsx-string-literals flags raw JSX text and user-facing attribute literals in public components', () => {
    const badCode = [
      'import React from "react"',
      'export function Hero() {',
      '  return (',
      '    <section aria-label="Main hero">',
      '      <h1>Al Jazira</h1>',
      '      <p>{"Hardcoded copy"}</p>',
      '    </section>',
      '  )',
      '}',
    ].join('\n')

    const messages = lintJsxSnippet(badCode, 'src/app/(frontend)/[locale]/page.tsx')
    expect(messages).toHaveLength(3)
    expect(messages.every((m) => m.ruleId === 'local-rules/no-jsx-string-literals')).toBe(true)

    const goodCode = [
      'import React from "react"',
      'export function Hero({ dict, title }: { dict: { label: string }; title: string }) {',
      '  return (',
      '    <section aria-label={dict.label} data-theme="dark">',
      '      <h1>{title}</h1>',
      '      <span>·</span>',
      '    </section>',
      '  )',
      '}',
    ].join('\n')

    expect(lintJsxSnippet(goodCode, 'src/app/(frontend)/[locale]/page.tsx')).toEqual([])
    expect(lintJsxSnippet(badCode, 'src/components/admin/Logo.tsx')).toEqual([])
  })
})

describe('P3-T1 Scope 5 — proxy.ts and Content Security Policy (H3 & H3a)', () => {
  it('redirects / -> 308 Permanent Redirect to /ar with strict public CSP header', () => {
    const req = new NextRequest('http://localhost:3000/?utm=test')
    const res = proxy(req)

    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe('http://localhost:3000/ar?utm=test')
    const csp = res.headers.get('Content-Security-Policy') ?? ''
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("'strict-dynamic'")
  })

  it('builds strict H3 public CSP with H3a (wasm-unsafe-eval + blob worker) ONLY on /ar and /en home', () => {
    const nonce = generateCspNonce()
    expect(nonce.length).toBeGreaterThan(16)

    expect(isHomePagePath('/ar')).toBe(true)
    expect(isHomePagePath('/en')).toBe(true)
    expect(isHomePagePath('/ar/')).toBe(true)
    expect(isHomePagePath('/ar/projects')).toBe(false)
    expect(isHomePagePath('/en/services')).toBe(false)

    const homeCsp = buildPublicCspHeader({ nonce, pathname: '/ar' })
    expect(homeCsp).toContain(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'`)
    expect(homeCsp).toContain(`style-src 'self' 'nonce-${nonce}'`)
    expect(homeCsp).toContain("worker-src 'self' blob:")
    expect(homeCsp).toContain(`frame-src ${I4_VIDEO_FRAME_SOURCES.join(' ')}`)
    expect(homeCsp).not.toContain("'unsafe-eval'")
    expect(homeCsp).not.toContain("'unsafe-inline'")

    const innerPageCsp = buildPublicCspHeader({ nonce, pathname: '/en/projects' })
    expect(innerPageCsp).toContain(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`)
    expect(innerPageCsp).not.toContain("'wasm-unsafe-eval'")
    expect(innerPageCsp).not.toContain('worker-src')
    expect(innerPageCsp).not.toContain("'unsafe-eval'")
    expect(innerPageCsp).not.toContain("'unsafe-inline'")
  })

  it('scopes relaxed Admin CSP strictly to /admin and preserves payload-lng=ar default cookie', () => {
    expect(isAdminRoutePath('/admin')).toBe(true)
    expect(isAdminRoutePath('/admin/collections/projects')).toBe(true)
    expect(isAdminRoutePath('/ar/admin')).toBe(false)

    expect(ADMIN_CSP_RELAXATIONS.length).toBeGreaterThanOrEqual(6)
    const adminCsp = buildAdminCspHeader()
    expect(adminCsp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")

    const adminReq = new NextRequest('http://localhost:3000/admin/login')
    const adminRes = proxy(adminReq)
    expect(adminRes.headers.get('Content-Security-Policy')).toBe(adminCsp)
    expect(adminRes.cookies.get('payload-lng')?.value).toBe('ar')

    expect(resolveLocaleFromPathname('/en/about')).toBe('en')
    expect(resolveLocaleFromPathname('/ar/services')).toBe('ar')
    expect(resolveLocaleFromPathname('/fr')).toBe('ar')
  })
})

describe('P3-T1 Scope 6 — Link safety and <CmsLink> (I3)', () => {
  it('rejects javascript:, data:, vbscript:, protocol-relative //, and production http: URLs', () => {
    expect(sanitizeCmsHref('javascript:alert(1)')).toBeNull()
    expect(sanitizeCmsHref('JAVASCRIPT:alert(1)')).toBeNull()
    expect(sanitizeCmsHref('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(sanitizeCmsHref('vbscript:msgbox(1)')).toBeNull()
    expect(sanitizeCmsHref('//evil.example.com/phish')).toBeNull()
    expect(sanitizeCmsHref('http://example.com', { nodeEnv: 'production' })).toBeNull()
    expect(sanitizeCmsHref('http://localhost:3000/test', { nodeEnv: 'development' })).toEqual({
      href: 'http://localhost:3000/test',
      isExternal: true,
    })
  })

  it('prefixes unlocalized internal paths with active locale and marks external https/mailto/tel links', () => {
    expect(sanitizeCmsHref('/services', { locale: 'ar' })).toEqual({
      href: '/ar/services',
      isExternal: false,
    })
    expect(sanitizeCmsHref('/', { locale: 'en' })).toEqual({
      href: '/en',
      isExternal: false,
    })
    expect(sanitizeCmsHref('https://www.youtube-nocookie.com/embed/abc')).toEqual({
      href: 'https://www.youtube-nocookie.com/embed/abc',
      isExternal: true,
    })
    expect(sanitizeCmsHref('mailto:info@aljazira.sa')).toEqual({
      href: 'mailto:info@aljazira.sa',
      isExternal: true,
    })
    expect(sanitizeCmsHref('tel:+966500000000')).toEqual({
      href: 'tel:+966500000000',
      isExternal: true,
    })

    const refLink = resolveSafeCmsLinkData(
      {
        type: 'internal',
        reference: {
          relationTo: 'projects',
          value: { slug: 'al-khalil-makkah' },
        },
      },
      { locale: 'ar' },
    )
    expect(refLink).toEqual({
      href: '/ar/projects/al-khalil-makkah',
      isExternal: false,
      newTab: false,
    })
  })

  it('renders <CmsLink> as <span> when href is unsafe and attaches rel="noopener noreferrer" on external links', () => {
    const unsafeHtml = renderToStaticMarkup(
      React.createElement(CmsLink, { href: 'javascript:alert(1)' }, 'Bad Link'),
    )
    expect(unsafeHtml).toContain('<span data-cms-link-fallback="plain-text">Bad Link</span>')
    expect(unsafeHtml).not.toContain('href=')

    const externalHtml = renderToStaticMarkup(
      React.createElement(
        CmsLink,
        { href: 'https://example.com/spec.pdf', newTab: true },
        'Spec Sheet',
      ),
    )
    expect(externalHtml).toContain('href="https://example.com/spec.pdf"')
    expect(externalHtml).toContain('target="_blank"')
    expect(externalHtml).toContain('rel="noopener noreferrer"')
  })
})

describe('P3-T1 Scope 7 — Preview secret & target path validation (Z2, I1)', () => {
  it('verifies preview secret in constant time and resolves only safe internal preview paths', () => {
    const validSecret = getPreviewSecret()
    expect(verifyPreviewSecret(validSecret)).toBe(true)
    expect(verifyPreviewSecret('wrong-secret')).toBe(false)
    expect(verifyPreviewSecret('')).toBe(false)

    expect(isValidInternalCmsPath('/ar/projects/al-khalil')).toBe(true)
    expect(isValidInternalCmsPath('//evil.com')).toBe(false)
    expect(isValidInternalCmsPath('/admin/collections/projects')).toBe(false)
    expect(isValidInternalCmsPath('/api/users')).toBe(false)

    const parsed = previewQuerySchema.parse({
      secret: validSecret,
      locale: 'en',
      collection: 'projects',
      slug: 'al-khalil-tower',
    })
    expect(resolvePreviewTargetPath(parsed)).toBe('/en/projects/al-khalil-tower')

    expect(
      resolvePreviewTargetPath({
        locale: 'ar',
        global: 'services-page',
      }),
    ).toBe('/ar/services')

    expect(
      resolvePreviewTargetPath({
        locale: 'ar',
        path: '//evil.com',
      }),
    ).toBeNull()

    expect(previewExitQuerySchema.parse({ returnTo: '/en' })).toEqual({ returnTo: '/en' })
  })
})
