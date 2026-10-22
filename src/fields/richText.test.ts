import { describe, expect, it } from 'vitest'

import {
  limitedRichTextField,
  validateLimitedLexicalState,
  validateRichTextLinkUrl,
} from './richText'

describe('limitedRichTextField & validateLimitedLexicalState (I2)', () => {
  it('accepts valid Lexical AST nodes within the allowed feature set (h2-h4, paragraph, bold, italic, bullet/number lists, quote, safe link, media upload)', () => {
    const validState = {
      root: {
        type: 'root',
        direction: 'rtl',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'heading',
            tag: 'h2',
            version: 1,
            children: [
              { type: 'text', text: 'نطاق الأعمال الكهروميكانيكية', format: 1, version: 1 },
            ],
          },
          {
            type: 'heading',
            tag: 'h3',
            version: 1,
            children: [{ type: 'text', text: 'MEP Systems Overview', format: 2, version: 1 }],
          },
          {
            type: 'heading',
            tag: 'h4',
            version: 1,
            children: [{ type: 'text', text: 'Testing & Commissioning', format: 3, version: 1 }],
          },
          {
            type: 'paragraph',
            version: 1,
            children: [
              { type: 'text', text: 'فقرة نصية مع ', format: 0, version: 1 },
              {
                type: 'link',
                version: 1,
                fields: {
                  linkType: 'custom',
                  url: 'https://aljazira.co/ar/projects',
                  newTab: false,
                },
                children: [{ type: 'text', text: 'رابط آمن', format: 0, version: 1 }],
              },
            ],
          },
          {
            type: 'list',
            listType: 'bullet',
            tag: 'ul',
            version: 1,
            children: [
              {
                type: 'listitem',
                version: 1,
                children: [
                  { type: 'text', text: 'أنظمة التكييف والتهوية HVAC', format: 0, version: 1 },
                ],
              },
            ],
          },
          {
            type: 'quote',
            version: 1,
            children: [{ type: 'text', text: 'جودة هندسية بمعايير عالمية', format: 0, version: 1 }],
          },
          {
            type: 'upload',
            relationTo: 'media',
            value: 1,
            version: 1,
          },
        ],
      },
    }

    expect(validateLimitedLexicalState(validState)).toBe(true)
  })

  it('rejects disallowed node types (iframe, rawHtml, script, code, block, horizontalrule) and raw HTML properties (I2)', () => {
    for (const badType of ['iframe', 'rawHtml', 'script', 'code', 'block', 'horizontalrule']) {
      const badState = {
        root: {
          type: 'root',
          version: 1,
          children: [
            {
              type: badType,
              version: 1,
              children: [],
            },
          ],
        },
      }
      const res = validateLimitedLexicalState(badState)
      expect(res).not.toBe(true)
      expect(String(res)).toContain(badType)
    }

    const withRawHtmlProp = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            rawHtml: '<iframe src="https://evil.com"></iframe>',
            version: 1,
            children: [],
          },
        ],
      },
    }
    expect(validateLimitedLexicalState(withRawHtmlProp)).not.toBe(true)
  })

  it('rejects headings outside h2-h4 (e.g. h1, h5, h6), checklist lists, disallowed text format bitmasks, non-media uploads, and unsafe link URLs (I2, I3)', () => {
    // Disallowed h1 heading
    expect(
      validateLimitedLexicalState({
        root: {
          type: 'root',
          children: [{ type: 'heading', tag: 'h1', children: [] }],
        },
      }),
    ).not.toBe(true)

    // Disallowed h5 heading
    expect(
      validateLimitedLexicalState({
        root: {
          type: 'root',
          children: [{ type: 'heading', tag: 'h5', children: [] }],
        },
      }),
    ).not.toBe(true)

    // Disallowed checklist
    expect(
      validateLimitedLexicalState({
        root: {
          type: 'root',
          children: [{ type: 'list', listType: 'check', tag: 'ul', children: [] }],
        },
      }),
    ).not.toBe(true)

    // Disallowed text format bitmask (e.g. 8 = underline, 16 = inline code)
    expect(
      validateLimitedLexicalState({
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: 'underlined', format: 8 }],
            },
          ],
        },
      }),
    ).not.toBe(true)

    // Disallowed upload collection ('videos' instead of 'media')
    expect(
      validateLimitedLexicalState({
        root: {
          type: 'root',
          children: [{ type: 'upload', relationTo: 'videos', value: 1 }],
        },
      }),
    ).not.toBe(true)

    // Disallowed javascript: link inside richText (I3)
    expect(
      validateLimitedLexicalState({
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'link',
                  fields: { linkType: 'custom', url: 'javascript:alert(1)' },
                  children: [{ type: 'text', text: 'XSS', format: 0 }],
                },
              ],
            },
          ],
        },
      }),
    ).not.toBe(true)

    expect(validateRichTextLinkUrl('https://aljazira.co')).toBe(true)
    expect(validateRichTextLinkUrl('/ar/services')).toBe(true)
    expect(validateRichTextLinkUrl('JaVaScRiPt:alert(1)')).not.toBe(true)
    expect(validateRichTextLinkUrl('//evil.com')).not.toBe(true)
  })

  it('preserves factory beforeValidate hook and admin config when overrides are passed to limitedRichTextField', () => {
    const customHook = ({ value }: { value?: unknown }) => value
    const field = limitedRichTextField({
      overrides: {
        admin: {
          description: 'Custom description',
        },
        hooks: {
          beforeValidate: [customHook],
        },
      },
    })

    expect(field.hooks?.beforeValidate).toHaveLength(2)
    expect(field.admin?.description).toBe('Custom description')
  })
})
