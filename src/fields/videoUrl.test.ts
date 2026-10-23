import type { FieldHook, FieldHookArgs, TypeWithID } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  ALLOWED_VIDEO_HOSTS,
  normalizeVideoUrlBeforeValidate,
  parseVideoUrl,
  toEmbedUrl,
  validateVideoUrl,
  videoUrlField,
} from './videoUrl'

type VideoHookArgs = FieldHookArgs<TypeWithID, unknown, Record<string, unknown>>

const makeHookArgs = (value: unknown): VideoHookArgs =>
  ({
    value,
  }) as unknown as VideoHookArgs

describe('videoUrlField, parseVideoUrl & toEmbedUrl (I4)', () => {
  it('exposes the exact 6 allowlisted video hosts (including m.youtube.com per R-10)', () => {
    expect(ALLOWED_VIDEO_HOSTS).toEqual([
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'youtu.be',
      'vimeo.com',
      'player.vimeo.com',
    ])
  })

  it('accepts, normalizes, and generates embed URLs for all allowlisted hosts, preserving YouTube t/start and Vimeo h hash (R-10)', () => {
    const cases = [
      {
        input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be',
        normalized: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        embed: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      },
      {
        input: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        normalized: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        embed: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      },
      {
        input: 'https://youtube.com/embed/dQw4w9WgXcQ?start=95',
        normalized: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=95',
        embed: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=95',
      },
      {
        input: 'https://youtu.be/dQw4w9WgXcQ?t=42',
        normalized: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42',
        embed: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=42',
      },
      {
        input: 'https://youtu.be/dQw4w9WgXcQ?t=1m30s',
        normalized: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90',
        embed: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90',
      },
      {
        input: 'https://vimeo.com/76979871',
        normalized: 'https://vimeo.com/76979871',
        embed: 'https://player.vimeo.com/video/76979871',
      },
      {
        input: 'https://player.vimeo.com/video/76979871?h=abc123def0',
        normalized: 'https://vimeo.com/76979871?h=abc123def0',
        embed: 'https://player.vimeo.com/video/76979871?h=abc123def0',
      },
      {
        input: 'https://vimeo.com/76979871/abc123def0',
        normalized: 'https://vimeo.com/76979871?h=abc123def0',
        embed: 'https://player.vimeo.com/video/76979871?h=abc123def0',
      },
      {
        input: '  https://youtu.be/dQw4w9WgXcQ  ',
        normalized: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        embed: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      },
    ]

    const field = videoUrlField()
    expect(field.hooks?.beforeValidate?.[0]).toBe(normalizeVideoUrlBeforeValidate)

    for (const c of cases) {
      expect(validateVideoUrl(c.input, { required: true })).toBe(true)
      expect(parseVideoUrl(c.input)?.normalizedUrl).toBe(c.normalized)
      expect(toEmbedUrl(c.input)).toBe(c.embed)
      expect(normalizeVideoUrlBeforeValidate(makeHookArgs(c.input))).toBe(c.normalized)
    }
  })

  it('rejects spoofed hosts (https://youtube.com.evil.com), non-HTTPS schemes, credentials, and malformed IDs/params', () => {
    const rejectedInputs = [
      'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ',
      'https://vimeo.com.evil.com/76979871',
      'https://evil-youtube.com/watch?v=dQw4w9WgXcQ',
      'https://evil.com/https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com@evil.com/watch?v=dQw4w9WgXcQ',
      'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'http://vimeo.com/76979871',
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      '//www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch',
      'https://www.youtube.com/watch?v=short',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ"><script>',
      'https://youtu.be/dQw4w9WgXcQ?t=10"onload="alert(1)',
      'https://vimeo.com/not-numeric',
      'https://player.vimeo.com/video/123abc',
      'https://vimeo.com/76979871/bad"hash',
      'https://player.vimeo.com/video/76979871?h=bad<script>',
      'https://youtube.com:8443/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com:8080/watch?v=dQw4w9WgXcQ',
      'https://youtu.be:8443/dQw4w9WgXcQ',
      'https://vimeo.com:8443/76979871',
    ]

    for (const bad of rejectedInputs) {
      expect(parseVideoUrl(bad), `Expected parseVideoUrl("${bad}") to be null`).toBeNull()
      expect(toEmbedUrl(bad), `Expected toEmbedUrl("${bad}") to be null`).toBeNull()
      const validationResult = validateVideoUrl(bad, { required: true })
      expect(typeof validationResult, `Expected "${bad}" to fail validation`).toBe('string')
    }
  })

  it('allows empty value when optional and rejects empty when required', () => {
    expect(validateVideoUrl('', { required: false })).toBe(true)
    expect(validateVideoUrl(undefined, { required: false })).toBe(true)
    expect(typeof validateVideoUrl('', { required: true })).toBe('string')
  })

  it('deep-merges admin overrides and concatenates hooks without losing normalizeVideoUrlBeforeValidate (R-1)', () => {
    const customBeforeValidate: FieldHook = ({ value }): unknown => value
    const customAfterRead: FieldHook = ({ value }): unknown => value
    const field = videoUrlField({
      overrides: {
        admin: {
          readOnly: false,
        },
        hooks: {
          beforeValidate: [customBeforeValidate],
          afterRead: [customAfterRead],
        },
      },
    })

    expect(field.hooks?.beforeValidate).toEqual([
      normalizeVideoUrlBeforeValidate,
      customBeforeValidate,
    ])
    expect(field.hooks?.afterRead).toEqual([customAfterRead])
    expect(field.admin?.readOnly).toBe(false)
    expect(field.admin?.placeholder).toBe('https://www.youtube.com/watch?v=...')
    expect(field.admin?.description).toBeDefined()
  })
})
