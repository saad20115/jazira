import type { FieldHook, TextField, TextFieldSingleValidation, TypeWithID } from 'payload'

export const ALLOWED_VIDEO_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
] as const

export type AllowedVideoHost = (typeof ALLOWED_VIDEO_HOSTS)[number]
export type SingleTextField = Extract<TextField, { hasMany?: false | undefined }>
export type VideoUrlFieldHook = FieldHook<TypeWithID, unknown, Record<string, unknown>>

export interface ParsedVideoUrl {
  provider: 'youtube' | 'vimeo'
  videoId: string
  normalizedUrl: string
  embedUrl: string
}

function isValidYouTubeId(id: string): boolean {
  if (id.length !== 11) {
    return false
  }
  for (let i = 0; i < id.length; i += 1) {
    const code = id.charCodeAt(i)
    const isUpper = code >= 65 && code <= 90
    const isLower = code >= 97 && code <= 122
    const isDigit = code >= 48 && code <= 57
    const isDashOrUnderscore = code === 45 || code === 95
    if (!isUpper && !isLower && !isDigit && !isDashOrUnderscore) {
      return false
    }
  }
  return true
}

function isValidVimeoId(id: string): boolean {
  if (id.length < 1 || id.length > 20) {
    return false
  }
  for (let i = 0; i < id.length; i += 1) {
    const code = id.charCodeAt(i)
    if (code < 48 || code > 57) {
      return false
    }
  }
  return true
}

/**
 * Security baseline I4 parser:
 * Parses exclusively with `new URL()` (never regex on the raw string), enforces `https:` only,
 * checks exact host allowlist (`youtube.com`, `www.youtube.com`, `youtu.be`, `vimeo.com`,
 * `player.vimeo.com`), and constructs normalized and privacy-enhanced embed URLs.
 */
export function parseVideoUrl(input: unknown): ParsedVideoUrl | null {
  if (typeof input !== 'string') {
    return null
  }

  const trimmed = input.trim()
  if (trimmed.length === 0 || trimmed.startsWith('//')) {
    return null
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return null
  }

  if (parsed.protocol !== 'https:') {
    return null
  }

  if (parsed.username !== '' || parsed.password !== '') {
    return null
  }

  const hostname = parsed.hostname.toLowerCase()
  const isAllowedHost = (ALLOWED_VIDEO_HOSTS as readonly string[]).includes(hostname)
  if (!isAllowedHost) {
    return null
  }

  const segments = parsed.pathname.split('/').filter((segment) => segment.length > 0)

  if (hostname === 'youtube.com' || hostname === 'www.youtube.com') {
    let candidateId = ''
    if (segments.length === 1 && segments[0] === 'watch') {
      candidateId = parsed.searchParams.get('v') ?? ''
    } else if (
      segments.length === 2 &&
      (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'v')
    ) {
      candidateId = segments[1] ?? ''
    }

    if (!isValidYouTubeId(candidateId)) {
      return null
    }

    return {
      provider: 'youtube',
      videoId: candidateId,
      normalizedUrl: `https://www.youtube.com/watch?v=${candidateId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${candidateId}`,
    }
  }

  if (hostname === 'youtu.be') {
    if (segments.length !== 1) {
      return null
    }
    const candidateId = segments[0] ?? ''
    if (!isValidYouTubeId(candidateId)) {
      return null
    }

    return {
      provider: 'youtube',
      videoId: candidateId,
      normalizedUrl: `https://www.youtube.com/watch?v=${candidateId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${candidateId}`,
    }
  }

  // Vimeo (`vimeo.com` or `player.vimeo.com`)
  let vimeoId = ''
  if (hostname === 'vimeo.com') {
    if (segments.length === 1) {
      vimeoId = segments[0] ?? ''
    } else if (segments.length === 2 && segments[0] === 'video') {
      vimeoId = segments[1] ?? ''
    } else if (segments.length === 3 && segments[0] === 'channels') {
      vimeoId = segments[2] ?? ''
    }
  } else if (hostname === 'player.vimeo.com') {
    if (segments.length === 2 && segments[0] === 'video') {
      vimeoId = segments[1] ?? ''
    } else if (segments.length === 1) {
      vimeoId = segments[0] ?? ''
    }
  }

  if (!isValidVimeoId(vimeoId)) {
    return null
  }

  return {
    provider: 'vimeo',
    videoId: vimeoId,
    normalizedUrl: `https://vimeo.com/${vimeoId}`,
    embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
  }
}

export function toEmbedUrl(input: unknown): string | null {
  const parsed = parseVideoUrl(input)
  return parsed ? parsed.embedUrl : null
}

export function validateVideoUrl(
  value: unknown,
  options: { required?: boolean } = {},
): true | string {
  const { required = false } = options
  if (value === null || value === undefined || value === '') {
    return required ? 'رابط الفيديو مطلوب. / Video URL is required.' : true
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    return required ? 'رابط الفيديو مطلوب. / Video URL is required.' : true
  }

  const parsed = parseVideoUrl(value)
  if (!parsed) {
    return 'يجب أن يكون رابط الفيديو عبر https: ومن نطاق مسموح فقط (youtube.com, www.youtube.com, youtu.be, vimeo.com, player.vimeo.com). / Video URL must use https: and be from an allowlisted YouTube or Vimeo host.'
  }

  return true
}

export const normalizeVideoUrlBeforeValidate: VideoUrlFieldHook = ({ value }) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return value
  }
  const parsed = parseVideoUrl(value)
  return parsed ? parsed.normalizedUrl : value.trim()
}

export function buildVideoUrlValidator(required = false): TextFieldSingleValidation {
  return (value) => validateVideoUrl(value, { required })
}

export interface VideoUrlFieldOptions {
  name?: string
  required?: boolean
  overrides?: Partial<SingleTextField>
}

export function videoUrlField(options: VideoUrlFieldOptions = {}): SingleTextField {
  const { name = 'videoUrl', required = false, overrides = {} } = options

  return {
    name,
    type: 'text',
    required,
    label: {
      en: 'External Video URL (YouTube / Vimeo)',
      ar: 'رابط فيديو خارجي (يوتيوب / فيميو)',
    },
    admin: {
      placeholder: 'https://www.youtube.com/watch?v=...',
      description: {
        en: 'HTTPS YouTube or Vimeo link only. Stored normalized and rendered via privacy-enhanced embed.',
        ar: 'رابط HTTPS من يوتيوب أو فيميو فقط. يُحفظ بصيغة موحّدة ويُعرض عبر مشغّل مضمّن آمن.',
      },
      ...overrides.admin,
    },
    hooks: {
      ...overrides.hooks,
      beforeValidate: [normalizeVideoUrlBeforeValidate, ...(overrides.hooks?.beforeValidate ?? [])],
    },
    validate: buildVideoUrlValidator(required),
    ...overrides,
    hasMany: false,
  }
}
