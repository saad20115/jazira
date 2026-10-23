import { type TextField, type TextFieldSingleValidation, ValidationError } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  buildExternalUrlValidator,
  buildInternalPathValidator,
  getEffectiveAllowedProtocols,
  linkField,
  PRODUCTION_ALLOWED_LINK_PROTOCOLS,
  resolveLinkHref,
  validateExternalUrl,
  validateInternalPath,
  validateLinkGroupBeforeValidate,
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

    it('rejects javascript:, data:, vbscript:, mixed-case/whitespace schemes, and //host paths in validateLinkGroupBeforeValidate on draft/autosave (R-1)', () => {
      const group = linkField({ required: true })
      expect(group.hooks?.beforeValidate).toContain(validateLinkGroupBeforeValidate)

      const runHook = (
        value: Record<string, unknown>,
        path: Array<number | string> = ['cta', 'primaryButton', 'link'],
      ): unknown =>
        validateLinkGroupBeforeValidate({
          value,
          path,
          req: {} as never,
          data: {},
          siblingData: {},
          field: group as never,
          operation: 'update',
          overrideAccess: false,
          context: {},
        } as never)

      for (const badUrl of [
        'javascript:alert(document.cookie)',
        '  JaVaScRiPt:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
      ]) {
        expect(() => {
          runHook({
            label: 'Click',
            type: 'external',
            url: badUrl,
          })
        }).toThrow(ValidationError)
      }

      for (const badPath of ['//evil.com', '  //evil.com/path', '/%2f%2fevil.com']) {
        expect(() => {
          runHook({
            label: 'Click',
            type: 'internal',
            internalRoute: 'custom',
            internalPath: badPath,
          })
        }).toThrow(ValidationError)
      }

      const validExternal = runHook({
        label: 'Visit',
        type: 'external',
        url: '  https://aljazira.co/brochure.pdf  ',
      }) as Record<string, unknown>
      expect(validExternal.url).toBe('https://aljazira.co/brochure.pdf')

      const validInternal = runHook({
        label: 'Services',
        type: 'internal',
        internalRoute: 'custom',
        internalPath: '  /services#hvac  ',
      }) as Record<string, unknown>
      expect(validInternal.internalPath).toBe('/services#hvac')
    })

    it('allows http: only when NODE_ENV !== production and rejects http: in production while allowing https:, mailto:, tel:, and single-slash internal paths (R-9)', () => {
      expect(getEffectiveAllowedProtocols(undefined, 'development')).toEqual([
        'http:',
        'https:',
        'mailto:',
        'tel:',
      ])
      expect(getEffectiveAllowedProtocols(undefined, 'test')).toEqual([
        'http:',
        'https:',
        'mailto:',
        'tel:',
      ])
      expect(getEffectiveAllowedProtocols(undefined, 'production')).toEqual([
        ...PRODUCTION_ALLOWED_LINK_PROTOCOLS,
      ])

      // Non-production accepts http:
      expect(validateExternalUrl('http://aljazira.co', { nodeEnv: 'development' })).toBe(true)
      expect(validateExternalUrl('http://aljazira.co', { nodeEnv: 'test' })).toBe(true)

      // Production rejects http: (even if caller passed allowedProtocols: ['http:', 'https:'])
      const prodHttp = validateExternalUrl('http://aljazira.co', {
        allowedProtocols: ['http:', 'https:'],
        nodeEnv: 'production',
      })
      expect(typeof prodHttp).toBe('string')
      expect(String(prodHttp)).toContain('http:')

      // Production accepts https:, mailto:, tel:
      expect(validateExternalUrl('https://aljazira.co', { nodeEnv: 'production' })).toBe(true)
      expect(validateExternalUrl('mailto:info@aljazira.co', { nodeEnv: 'production' })).toBe(true)
      expect(validateExternalUrl('tel:+966573534185', { nodeEnv: 'production' })).toBe(true)

      // Temporarily simulate NODE_ENV='production' for linkField hook and resolveLinkHref
      const originalNodeEnv = process.env.NODE_ENV
      const envRecord = process.env as Record<string, string | undefined>
      try {
        envRecord.NODE_ENV = 'production'
        const group = linkField({ required: true })
        expect(() => {
          validateLinkGroupBeforeValidate({
            value: {
              label: 'Insecure',
              type: 'external',
              url: 'http://aljazira.co',
            },
            path: ['cta', 'button', 'link'],
            req: {} as never,
            data: {},
            siblingData: {},
            field: group as never,
            operation: 'update',
            overrideAccess: false,
            context: {},
          } as never)
        }).toThrow(ValidationError)

        expect(
          resolveLinkHref({
            type: 'external',
            url: 'http://aljazira.co',
          }),
        ).toBeNull()

        expect(
          resolveLinkHref({
            type: 'external',
            url: 'https://aljazira.co',
          }),
        ).toBe('https://aljazira.co')

        expect(
          resolveLinkHref({
            type: 'internal',
            internalRoute: 'custom',
            internalPath: '/projects/king-salman-park',
          }),
        ).toBe('/projects/king-salman-park')
      } finally {
        envRecord.NODE_ENV = originalNodeEnv
      }
    })
  })
})
