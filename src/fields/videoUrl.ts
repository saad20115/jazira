import type { FieldHook, TextField, TextFieldSingleValidation, TypeWithID } from 'payload'

export const ALLOWED_VIDEO_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
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
  startSeconds?: number
  unlistedHash?: string
}

const DEFAULT_VIDEO_DESCRIPTION = {
  en: 'HTTPS YouTube or Vimeo link only. Stored normalized and rendered via privacy-enhanced embed.',
  ar: 'رابط HTTPS من يوتيوب أو فيميو فقط. يُحفظ بصيغة موحّدة ويُعرض عبر مشغّل مضمّن آمن.',
} as const

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

function isValidVimeoHash(hash: string): boolean {
  if (hash.length < 1 || hash.length > 32) {
    return false
  }
  for (let i = 0; i < hash.length; i += 1) {
    const code = hash.charCodeAt(i)
    const isUpper = code >= 65 && code <= 90
    const isLower = code >= 97 && code <= 122
    const isDigit = code >= 48 && code <= 57
    if (!isUpper && !isLower && !isDigit) {
      return false
    }
  }
  return true
}

/**
 * Parses a YouTube `t` or `start` query parameter (`10`, `10s`, `1m30s`, `1h2m3s`)
 * into a positive integer number of seconds, or returns `'invalid'` if malformed.
 */
function parseYouTubeStartTime(searchParams: URLSearchParams): number | undefined | 'invalid' {
  const hasT = searchParams.has('t')
  const hasStart = searchParams.has('start')
  if (!hasT && !hasStart) {
    return undefined
  }

  const raw = (searchParams.get('t') ?? searchParams.get('start') ?? '').trim()
  if (raw.length === 0 || raw.length > 16) {
    return 'invalid'
  }

  if (/^\d{1,6}$/.test(raw)) {
    const seconds = Number.parseInt(raw, 10)
    return seconds > 0 ? seconds : undefined
  }

  const durationMatch = /^(?:(\d{1,2})h)?(?:(\d{1,2})m)?(?:(\d{1,4})s)?$/i.exec(raw)
  if (!durationMatch || (!durationMatch[1] && !durationMatch[2] && !durationMatch[3])) {
    return 'invalid'
  }

  const hours = durationMatch[1] ? Number.parseInt(durationMatch[1], 10) : 0
  const minutes = durationMatch[2] ? Number.parseInt(durationMatch[2], 10) : 0
  const seconds = durationMatch[3] ? Number.parseInt(durationMatch[3], 10) : 0
  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  return totalSeconds > 0 ? totalSeconds : undefined
}

/**
 * Security baseline I4 parser:
 * Parses exclusively with `new URL()` (never regex on the raw string), enforces `https:` only,
 * checks exact host allowlist (`youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`,
 * `vimeo.com`, `player.vimeo.com`), preserves YouTube `t`/`start` and Vimeo unlisted `h` hash,
 * and constructs normalized and privacy-enhanced embed URLs.
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

  if (
    hostname === 'youtube.com' ||
    hostname === 'www.youtube.com' ||
    hostname === 'm.youtube.com' ||
    hostname === 'youtu.be'
  ) {
    let candidateId = ''
    if (hostname === 'youtu.be') {
      if (segments.length !== 1) {
        return null
      }
      candidateId = segments[0] ?? ''
    } else if (segments.length === 1 && segments[0] === 'watch') {
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

    const startSeconds = parseYouTubeStartTime(parsed.searchParams)
    if (startSeconds === 'invalid') {
      return null
    }

    const normalizedUrl =
      startSeconds !== undefined
        ? `https://www.youtube.com/watch?v=${candidateId}&t=${String(startSeconds)}`
        : `https://www.youtube.com/watch?v=${candidateId}`

    const embedUrl =
      startSeconds !== undefined
        ? `https://www.youtube-nocookie.com/embed/${candidateId}?start=${String(startSeconds)}`
        : `https://www.youtube-nocookie.com/embed/${candidateId}`

    return {
      provider: 'youtube',
      videoId: candidateId,
      normalizedUrl,
      embedUrl,
      ...(startSeconds !== undefined ? { startSeconds } : {}),
    }
  }

  // Vimeo (`vimeo.com` or `player.vimeo.com`)
  let vimeoId = ''
  let pathHash: string | undefined

  if (hostname === 'vimeo.com') {
    if (segments.length === 1) {
      vimeoId = segments[0] ?? ''
    } else if (segments.length === 2 && segments[0] === 'video') {
      vimeoId = segments[1] ?? ''
    } else if (segments.length === 2 && isValidVimeoId(segments[0] ?? '')) {
      // Unlisted path format: https://vimeo.com/<id>/<hash>
      vimeoId = segments[0] ?? ''
      pathHash = segments[1] ?? ''
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

  let unlistedHash: string | undefined
  if (pathHash !== undefined) {
    if (!isValidVimeoHash(pathHash)) {
      return null
    }
    unlistedHash = pathHash
  }

  if (parsed.searchParams.has('h')) {
    const queryHash = parsed.searchParams.get('h') ?? ''
    if (!isValidVimeoHash(queryHash)) {
      return null
    }
    unlistedHash = queryHash
  }

  const normalizedUrl =
    unlistedHash !== undefined
      ? `https://vimeo.com/${vimeoId}?h=${unlistedHash}`
      : `https://vimeo.com/${vimeoId}`

  const embedUrl =
    unlistedHash !== undefined
      ? `https://player.vimeo.com/video/${vimeoId}?h=${unlistedHash}`
      : `https://player.vimeo.com/video/${vimeoId}`

  return {
    provider: 'vimeo',
    videoId: vimeoId,
    normalizedUrl,
    embedUrl,
    ...(unlistedHash !== undefined ? { unlistedHash } : {}),
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
    return 'يجب أن يكون رابط الفيديو عبر https: ومن نطاق مسموح فقط (youtube.com, www.youtube.com, m.youtube.com, youtu.be, vimeo.com, player.vimeo.com). / Video URL must use https: and be from an allowlisted YouTube or Vimeo host.'
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
  const { admin: adminOverrides, hooks: hookOverrides, ...restOverrides } = overrides

  const rawDesc = adminOverrides?.description
  const mergedDescription =
    typeof rawDesc === 'object'
      ? {
          ...DEFAULT_VIDEO_DESCRIPTION,
          ...rawDesc,
        }
      : (rawDesc ?? DEFAULT_VIDEO_DESCRIPTION)

  return {
    name,
    type: 'text',
    required,
    label: {
      en: 'External Video URL (YouTube / Vimeo)',
      ar: 'رابط فيديو خارجي (يوتيوب / فيميو)',
    },
    validate: buildVideoUrlValidator(required),
    ...restOverrides,
    admin: {
      placeholder: 'https://www.youtube.com/watch?v=...',
      ...adminOverrides,
      description: mergedDescription,
    },
    hooks: {
      ...hookOverrides,
      beforeValidate: [normalizeVideoUrlBeforeValidate, ...(hookOverrides?.beforeValidate ?? [])],
      beforeChange: [...(hookOverrides?.beforeChange ?? [])],
      afterChange: [...(hookOverrides?.afterChange ?? [])],
      afterRead: [...(hookOverrides?.afterRead ?? [])],
      beforeDuplicate: [...(hookOverrides?.beforeDuplicate ?? [])],
    },
    hasMany: false,
  }
}
