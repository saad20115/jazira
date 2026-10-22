import type { TextField, TextFieldSingleValidation } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  buildExternalUrlValidator,
  buildInternalPathValidator,
  linkField,
  resolveLinkHref,
  validateExternalUrl,
  validateInternalPath,
} from './link'

type SingleValidateOpts = Parameters<TextFieldSingleValidation>[1]

const makeValidateOpts = (siblingData: Record<string, unknown> = {}): SingleValidateOpts =>
  ({
    req: {},
    siblingData,
  }) as unknown as SingleValidateOpts

describe('linkField & URL validation (I3)', () => {
  it('creates a group field with localized label, internal/external type, and route/url subfields', () => {
    const group = linkField({ required: true })
    expect(group.type).toBe('group')
    expect(group.name).toBe('link')

    const fieldNames = group.fields.map((f) => ('name' in f ? f.name : ''))
    expect(fieldNames).toEqual(['label', 'type', 'internalRoute', 'internalPath', 'url', 'newTab'])

    const labelField = group.fields.find(
      (f): f is TextField => 'name' in f && f.name === 'label' && f.type === 'text',
    )
    expect(labelField?.localized).toBe(true)
    expect(labelField?.required).toBe(true)
  })

  describe('validateExternalUrl (I3 scheme allowlist)', () => {
    it('accepts safe http:, https:, mailto:, and tel: URLs', () => {
      const safeUrls = [
        'https://aljazira.co',
        'https://www.aljazira.co/en/projects?cat=mep#top',
        'http://example.com/brochure.pdf',
        'mailto:info@aljazira.co',
        'tel:+966573534185',
      ]

      for (const url of safeUrls) {
        expect(validateExternalUrl(url, { required: true })).toBe(true)
      }
    })

    it('rejects javascript: (including mixed case JaVaScRiPt: and control-char obfuscation), data:, vbscript:, file:, and protocol-relative URLs', () => {
      const unsafeUrls = [
        'javascript:alert(1)',
        'JaVaScRiPt:alert(document.cookie)',
        '   JaVaScRiPt:void(0)',
        'java\tscript:alert(1)',
        'java\nscript:alert(1)',
        'java\u0000script:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'DATA:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        'vbscript:msgbox("xss")',
        'VBSCRIPT:exec()',
        'file:///etc/passwd',
        'blob:https://aljazira.co/550e8400-e29b-41d4-a716-446655440000',
        'ftp://files.example.com/archive.zip',
        '//evil.com/phish',
        '///evil.com/phish',
        '/\\evil.com/phish',
        '\\\\evil.com\\phish',
        'https://admin:secret@evil.com/',
        'mailto:',
        'tel:   ',
      ]

      for (const bad of unsafeUrls) {
        const result = validateExternalUrl(bad, { required: true })
        expect(typeof result, `Expected "${bad}" to be rejected`).toBe('string')
      }
    })

    it('enforces optional host allowlist (e.g. linkedin.com)', () => {
      const opts = {
        required: true,
        allowedProtocols: ['https:'] as const,
        allowedHosts: ['linkedin.com', 'www.linkedin.com'] as const,
      }
      expect(validateExternalUrl('https://www.linkedin.com/in/aljazira', opts)).toBe(true)
      expect(typeof validateExternalUrl('http://www.linkedin.com/in/aljazira', opts)).toBe('string')
      expect(typeof validateExternalUrl('https://linkedin.com.evil.com/in/aljazira', opts)).toBe(
        'string',
      )
    })
  })

  describe('validateInternalPath (R-11)', () => {
    it('accepts safe internal paths starting with a single /', () => {
      expect(validateInternalPath('/projects/sofitel-makkah-hotel', { required: true })).toBe(true)
      expect(validateInternalPath('/services#fire-fighting', { required: true })).toBe(true)
    })

    it('rejects protocol-relative //, backslashes \\, percent-encoded slashes %2F/%5C, path traversal .., schemes, and missing leading / (R-11)', () => {
      const badPaths = [
        '//evil.com',
        '/\\evil.com',
        '/a\\b',
        '/%2F%2Fevil.com',
        '/%2fprojects',
        '/%5cevil.com',
        '/projects/%2e%2e/admin',
        '/projects/../admin',
        'projects/sofitel',
        '/javascript:alert(1)',
        '/path with spaces',
      ]

      for (const bad of badPaths) {
        expect(
          typeof validateInternalPath(bad, { required: true }),
          `Expected "${bad}" to be rejected`,
        ).toBe('string')
      }
    })
  })

  describe('linkField embedded validators & precedence (R-11)', () => {
    it('validates external URL when type === "external" and skips when type === "internal"', async () => {
      const validateUrl = buildExternalUrlValidator(true)

      const rejected = await validateUrl(
        'JaVaScRiPt:alert(1)',
        makeValidateOpts({ type: 'external' }),
      )
      expect(typeof rejected).toBe('string')

      const skippedForInternal = await validateUrl('', makeValidateOpts({ type: 'internal' }))
      expect(skippedForInternal).toBe(true)
    })

    it('validates internalPath only when type !== "external" and internalRoute === "custom" (R-11)', async () => {
      const validatePath = buildInternalPathValidator(true)

      // Skipped when internalRoute is a fixed route ('/services'), even if internalPath has stale invalid text
      expect(
        await validatePath(
          'not-a-valid-path',
          makeValidateOpts({ type: 'internal', internalRoute: '/services' }),
        ),
      ).toBe(true)

      // Skipped when type is 'external'
      expect(
        await validatePath(
          'not-a-valid-path',
          makeValidateOpts({ type: 'external', internalRoute: 'custom' }),
        ),
      ).toBe(true)

      // Enforced when type is 'internal' and internalRoute === 'custom'
      const rejected = await validatePath(
        '/%2F%2Fevil.com',
        makeValidateOpts({ type: 'internal', internalRoute: 'custom' }),
      )
      expect(typeof rejected).toBe('string')

      const accepted = await validatePath(
        '/projects/sofitel-makkah-hotel',
        makeValidateOpts({ type: 'internal', internalRoute: 'custom' }),
      )
      expect(accepted).toBe(true)
    })

    it('gives reference precedence over internalRoute and internalPath when both are set (R-11)', () => {
      // Reference wins over fixed internalRoute
      expect(
        resolveLinkHref({
          type: 'internal',
          internalRoute: '/about',
          reference: {
            relationTo: 'projects',
            value: { slug: 'sofitel-makkah-hotel' },
          },
        }),
      ).toBe('/projects/sofitel-makkah-hotel')

      // Reference wins over custom internalPath
      expect(
        resolveLinkHref({
          type: 'internal',
          internalRoute: 'custom',
          internalPath: '/contact',
          reference: {
            relationTo: 'services',
            value: { slug: 'mep-works' },
          },
        }),
      ).toBe('/services/mep-works')

      // Falls back to custom internalPath when reference is unset
      expect(
        resolveLinkHref({
          type: 'internal',
          internalRoute: 'custom',
          internalPath: '/projects?scope=hvac',
          reference: null,
        }),
      ).toBe('/projects?scope=hvac')

      // Falls back to fixed internalRoute when reference is unset and internalRoute !== 'custom'
      expect(
        resolveLinkHref({
          type: 'internal',
          internalRoute: '/services',
          reference: null,
        }),
      ).toBe('/services')

      // R-16: Rejects populated reference with traversal/invalid slug (../../evil) and does not fall back to internalRoute
      expect(
        resolveLinkHref({
          type: 'internal',
          internalRoute: '/about',
          reference: {
            relationTo: 'projects',
            value: { slug: '../../evil' },
          },
        }),
      ).toBeNull()

      // R-16: Rejects unknown relationTo (returns null instead of /<relationTo>)
      expect(
        resolveLinkHref({
          type: 'internal',
          internalRoute: '/about',
          reference: {
            relationTo: 'unknown-collection',
            value: { slug: 'some-doc' },
          },
        }),
      ).toBeNull()

      // R-16: Unpopulated collection reference at depth 0 (bare ID) returns null and does not silently fall back to internalRoute
      expect(
        resolveLinkHref({
          type: 'internal',
          internalRoute: '/about',
          reference: {
            relationTo: 'projects',
            value: 42,
          },
        }),
      ).toBeNull()
    })
  })
})
