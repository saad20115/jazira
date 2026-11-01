/**
 * Motion system pure helpers (`docs/05-design.md` CTO decision #20, P3-T14).
 *
 * Everything here is framework-free and DOM-free so it can be unit tested in the Node test
 * environment and shared by the client `MotionRoot` controller and the server `CountUp` component.
 * No secrets and no server-only imports: this module is safe for client bundles.
 */

/** Media query for the user's reduced-motion preference. */
export const MOTION_REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

/** `--stagger` steps are capped at 6 (indices 0..5) by §20. */
export const MOTION_MAX_STAGGER_STEPS = 6

/** Fallback for `--motion-countup` when the token cannot be read (§20 catalogue 9: 1.2 s). */
export const COUNT_UP_FALLBACK_DURATION_MS = 1200

/** §20 catalogue 1: a reveal fires when 15% of the target is visible. */
export const REVEAL_VISIBILITY_THRESHOLD = 0.15

/** If the intro never reports `data-intro="seen"`, motion still starts after this delay. */
export const INTRO_WAIT_TIMEOUT_MS = 4000

export interface MotionEnvironment {
  hasIntersectionObserver: boolean
  prefersReducedMotion: boolean
}

/**
 * §20 hard rule: `html[data-motion="on"]` is set only when `IntersectionObserver` exists and the
 * user has not asked for reduced motion. In every other case motion stays off and all content
 * keeps its final, visible state.
 */
export function shouldEnableMotion(env: MotionEnvironment): boolean {
  return env.hasIntersectionObserver && !env.prefersReducedMotion
}

/**
 * The intro splash marks `html[data-intro="active"]` while its overlay is on screen. Motion waits
 * for it to end (`data-intro="seen"`). A missing attribute means there is no intro on this page.
 */
export function isIntroPending(introAttribute: string | null | undefined): boolean {
  return introAttribute === 'active'
}

/** Caps a stagger index to the 0..5 range allowed by §20. */
export function clampStaggerIndex(index: number): number {
  if (!Number.isFinite(index) || index <= 0) {
    return 0
  }
  return Math.min(Math.floor(index), MOTION_MAX_STAGGER_STEPS - 1)
}

/**
 * Returns `true` when the rectangle overlaps the viewport at all. Used to decide which reveal
 * targets are already on screen when motion turns on: those are revealed instantly instead of
 * being hidden and re-animated (no flash of already-painted content).
 */
export function isRectInViewport(
  rect: { top: number; bottom: number; left: number; right: number },
  viewport: { width: number; height: number },
): boolean {
  return (
    rect.bottom > 0 && rect.top < viewport.height && rect.right > 0 && rect.left < viewport.width
  )
}

/**
 * A reveal target counts as "seen" once 15% of it is visible, or once the visible part covers 15%
 * of the viewport height (so targets taller than the viewport still reveal).
 */
export function hasReachedRevealThreshold(
  intersectionRatio: number,
  visibleHeight: number,
  viewportHeight: number,
): boolean {
  if (intersectionRatio >= REVEAL_VISIBILITY_THRESHOLD) {
    return true
  }
  return viewportHeight > 0 && visibleHeight >= viewportHeight * REVEAL_VISIBILITY_THRESHOLD
}

const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const ARABIC_THOUSANDS_SEPARATOR = '٬'
const ARABIC_DECIMAL_SEPARATOR = '٫'

export interface CountUpParts {
  /** Text before the number (kept verbatim from the CMS). */
  prefix: string
  /** Numeric target value. */
  value: number
  /** Number of digits after the decimal separator in the CMS text. */
  decimals: number
  /** Text after the number, e.g. `+` or `%` (kept verbatim from the CMS). */
  suffix: string
  /** Whether the CMS text grouped thousands (`1,200`). */
  grouped: boolean
  /** Digit system used by the CMS text. */
  digits: 'latin' | 'arabic-indic'
}

function toLatinDigits(text: string): string {
  let out = ''
  for (const ch of text) {
    const idx = ARABIC_INDIC_DIGITS.indexOf(ch)
    if (idx >= 0) {
      out += String(idx)
    } else if (ch === ARABIC_THOUSANDS_SEPARATOR) {
      out += ','
    } else if (ch === ARABIC_DECIMAL_SEPARATOR) {
      out += '.'
    } else {
      out += ch
    }
  }
  return out
}

function toArabicIndicDigits(text: string): string {
  let out = ''
  for (const ch of text) {
    if (ch >= '0' && ch <= '9') {
      out += ARABIC_INDIC_DIGITS.charAt(Number(ch))
    } else if (ch === ',') {
      out += ARABIC_THOUSANDS_SEPARATOR
    } else if (ch === '.') {
      out += ARABIC_DECIMAL_SEPARATOR
    } else {
      out += ch
    }
  }
  return out
}

const COUNT_UP_PATTERN = /^(\D*?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(\D*)$/

/**
 * Parses a CMS stat text such as `45+`, `85%`, `1,200+` or `٤٥+` into a count-up target.
 * Returns `null` for anything that is not exactly one number with optional non-digit prefix and
 * suffix (e.g. `24/7`, `ISO 9001:2015`, empty text). Those values stay static (§20 catalogue 9).
 */
export function parseCountUpValue(raw: string | null | undefined): CountUpParts | null {
  if (typeof raw !== 'string') {
    return null
  }
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return null
  }
  const hasArabicIndic = /[٠-٩]/.test(trimmed)
  const latin = toLatinDigits(trimmed)
  const match = COUNT_UP_PATTERN.exec(latin)
  if (!match) {
    return null
  }
  // Optional capture groups are `undefined` at runtime when they do not match.
  const [, prefix = '', integerText = '', fractionText = '', suffix = ''] = match
  const value = Number(`${integerText.replace(/,/g, '')}${fractionText ? `.${fractionText}` : ''}`)
  if (!Number.isFinite(value)) {
    return null
  }
  return {
    prefix: hasArabicIndic ? toArabicIndicDigits(prefix) : prefix,
    value,
    decimals: fractionText.length,
    suffix: hasArabicIndic ? toArabicIndicDigits(suffix) : suffix,
    grouped: integerText.includes(','),
    digits: hasArabicIndic ? 'arabic-indic' : 'latin',
  }
}

/**
 * Formats the in-between value of a count-up with the same prefix, suffix, decimals, grouping and
 * digit system as the CMS text. `formatCountUpValue(parts, parts.value)` reproduces the CMS text.
 */
export function formatCountUpValue(parts: CountUpParts, current: number): string {
  const clamped = Math.min(Math.max(current, 0), parts.value)
  const fixed = clamped.toFixed(parts.decimals)
  const dotIndex = fixed.indexOf('.')
  const integerPart = dotIndex >= 0 ? fixed.slice(0, dotIndex) : fixed
  const fractionPart = dotIndex >= 0 ? fixed.slice(dotIndex + 1) : null
  const groupedInteger = parts.grouped
    ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : integerPart
  const numberText = fractionPart !== null ? `${groupedInteger}.${fractionPart}` : groupedInteger
  const localized = parts.digits === 'arabic-indic' ? toArabicIndicDigits(numberText) : numberText
  return `${parts.prefix}${localized}${parts.suffix}`
}

/** `--ease-out`-like curve for the count-up (fast start, calm landing). */
export function easeOutCubic(progress: number): number {
  const t = Math.min(Math.max(progress, 0), 1)
  return 1 - (1 - t) ** 3
}

/**
 * Parses a CSS time token (`1200ms`, `1.2s`) into milliseconds. Returns the fallback for anything
 * else so a missing token never breaks the count-up.
 */
export function parseCssTimeToMs(raw: string | null | undefined, fallbackMs: number): number {
  if (typeof raw !== 'string') {
    return fallbackMs
  }
  const value = raw.trim()
  const msMatch = /^(\d+(?:\.\d+)?)ms$/.exec(value)
  if (msMatch?.[1]) {
    return Number(msMatch[1])
  }
  const sMatch = /^(\d+(?:\.\d+)?)s$/.exec(value)
  if (sMatch?.[1]) {
    return Number(sMatch[1]) * 1000
  }
  return fallbackMs
}
