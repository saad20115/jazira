import type { Media } from '@/payload-types'

export interface ResolvedMediaAsset {
  alt: string
  height?: number | null
  url: string
  width?: number | null
}

/**
 * Safely extracts a populated `Media` asset from a Payload upload relationship field
 * (`number | Media | null | undefined`), preferring the `card` or `thumb` size when requested.
 */
export function resolveMediaAsset(
  media: number | Media | null | undefined,
  fallbackAlt: string,
  preferredSize?: 'thumb' | 'card' | 'hero' | 'og',
): ResolvedMediaAsset | null {
  if (!media || typeof media !== 'object') {
    return null
  }

  const sizeEntry = preferredSize ? media.sizes?.[preferredSize] : undefined
  const url = (sizeEntry?.url ?? media.url ?? '').trim()
  if (!url) {
    return null
  }

  const alt =
    typeof media.alt === 'string' && media.alt.trim().length > 0 ? media.alt.trim() : fallbackAlt

  return {
    url,
    alt,
    width: sizeEntry?.width ?? media.width ?? null,
    height: sizeEntry?.height ?? media.height ?? null,
  }
}

/**
 * Extracts 1–2 uppercase initials from a person's name (supporting both Arabic and Latin scripts).
 */
export function extractInitials(name: string): string {
  const cleaned = name.replace(/^(Eng\.|Dr\.|Mr\.|Ms\.|Mrs\.|م\.|د\.|أ\.)\s*/i, '').trim()
  if (!cleaned) {
    return ''
  }
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return Array.from(parts[0] ?? '')
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }
  const first = Array.from(parts[0] ?? '')[0] ?? ''
  const last = Array.from(parts[parts.length - 1] ?? '')[0] ?? ''
  return `${first}${last}`.toUpperCase()
}

/**
 * Formats a 1-based service index as a 2-digit badge string (`01`, `02`, ..., `10`).
 */
export function formatServiceNumber(num: number): string {
  const safe = Math.max(1, Math.floor(num))
  return String(safe).padStart(2, '0')
}
