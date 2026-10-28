import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const TOKENS_JSON_PATH = path.join(REPO_ROOT, 'design', 'tokens.json')
const TOKENS_CSS_PATH = path.join(REPO_ROOT, 'src', 'styles', 'tokens.css')

/**
 * Typography mapping from `design/tokens.json` style keys to utility class slugs,
 * optional alias selectors, and proportional tablet (`768–1279px`) / mobile (`<768px`)
 * overrides per `docs/05-design.md` §"CTO decisions" #1 & #2:
 * - Display/XL -> 44/52 on mobile (56/64 on tablet)
 * - Display/L  -> 36/44 on mobile (44/52 on tablet)
 * - Heading/H2 -> 30/38 on mobile (36/44 on tablet)
 * - Scale the rest proportionally, never < 14px for body styles.
 */
export const TYPOGRAPHY_STYLE_MAP = {
  'Display/XL': {
    slug: 'display-xl',
    selectors: ['.t-display-xl'],
    tablet: { fontSize: 56, lineHeight: 64 },
    mobile: { fontSize: 44, lineHeight: 52 },
  },
  'Display/L': {
    slug: 'display-l',
    selectors: ['.t-display-l'],
    tablet: { fontSize: 44, lineHeight: 52 },
    mobile: { fontSize: 36, lineHeight: 44 },
  },
  'Heading/H2': {
    slug: 'h2',
    selectors: ['.t-h2', '.t-heading-h2'],
    tablet: { fontSize: 36, lineHeight: 44 },
    mobile: { fontSize: 30, lineHeight: 38 },
  },
  'Heading/H3': {
    slug: 'h3',
    selectors: ['.t-h3', '.t-heading-h3'],
    tablet: { fontSize: 24, lineHeight: 32 },
    mobile: { fontSize: 22, lineHeight: 30 },
  },
  'Heading/H4': {
    slug: 'h4',
    selectors: ['.t-h4', '.t-heading-h4'],
    tablet: { fontSize: 19, lineHeight: 27 },
    mobile: { fontSize: 18, lineHeight: 26 },
  },
  'Heading/H5': {
    slug: 'h5',
    selectors: ['.t-h5', '.t-heading-h5'],
    tablet: { fontSize: 16, lineHeight: 24 },
    mobile: { fontSize: 16, lineHeight: 24 },
  },
  'Body/L': {
    slug: 'body-l',
    selectors: ['.t-body-l'],
    tablet: { fontSize: 17, lineHeight: 28 },
    mobile: { fontSize: 16, lineHeight: 26 },
  },
  'Body/M': {
    slug: 'body-m',
    selectors: ['.t-body-m'],
    tablet: { fontSize: 16, lineHeight: 26 },
    mobile: { fontSize: 15, lineHeight: 24 },
  },
  'Body/M Medium': {
    slug: 'body-m-medium',
    selectors: ['.t-body-m-medium'],
    tablet: { fontSize: 16, lineHeight: 26 },
    mobile: { fontSize: 15, lineHeight: 24 },
  },
  'Body/M Strong': {
    slug: 'body-m-strong',
    selectors: ['.t-body-m-strong'],
    tablet: { fontSize: 16, lineHeight: 26 },
    mobile: { fontSize: 15, lineHeight: 24 },
  },
  'Body/Quote': {
    slug: 'body-quote',
    selectors: ['.t-body-quote'],
    tablet: { fontSize: 16, lineHeight: 26 },
    mobile: { fontSize: 15, lineHeight: 24 },
  },
  'Body/S': {
    slug: 'body-s',
    selectors: ['.t-body-s'],
    tablet: { fontSize: 14, lineHeight: 22 },
    mobile: { fontSize: 14, lineHeight: 22 },
  },
  'Body/S Medium': {
    slug: 'body-s-medium',
    selectors: ['.t-body-s-medium'],
    tablet: { fontSize: 14, lineHeight: 22 },
    mobile: { fontSize: 14, lineHeight: 22 },
  },
  Caption: {
    slug: 'caption',
    selectors: ['.t-caption'],
    tablet: { fontSize: 13, lineHeight: 20 },
    mobile: { fontSize: 13, lineHeight: 20 },
  },
  'Caption/S': {
    slug: 'caption-s',
    selectors: ['.t-caption-s'],
    tablet: { fontSize: 12, lineHeight: 18 },
    mobile: { fontSize: 12, lineHeight: 18 },
  },
  'Label/Button': {
    slug: 'label-button',
    selectors: ['.t-label-button'],
    tablet: { fontSize: 15, lineHeight: 22 },
    mobile: { fontSize: 15, lineHeight: 22 },
  },
  'Label/Caps': {
    slug: 'label-caps',
    selectors: ['.t-label-caps'],
    tablet: { fontSize: 12, lineHeight: 16 },
    mobile: { fontSize: 12, lineHeight: 16 },
  },
  'Label/Eyebrow': {
    slug: 'label-eyebrow',
    selectors: ['.t-label-eyebrow'],
    tablet: { fontSize: 12, lineHeight: 16 },
    mobile: { fontSize: 12, lineHeight: 16 },
  },
  'Label/Link': {
    slug: 'label-link',
    selectors: ['.t-label-link'],
    tablet: { fontSize: 14, lineHeight: 22 },
    mobile: { fontSize: 14, lineHeight: 22 },
  },
  'Label/Nav': {
    slug: 'label-nav',
    selectors: ['.t-label-nav'],
    tablet: { fontSize: 15, lineHeight: 22 },
    mobile: { fontSize: 15, lineHeight: 22 },
  },
  'Label/Tag': {
    slug: 'label-tag',
    selectors: ['.t-label-tag'],
    tablet: { fontSize: 11, lineHeight: 14 },
    mobile: { fontSize: 11, lineHeight: 14 },
  },
  'Stat/M': {
    slug: 'stat-m',
    selectors: ['.t-stat-m'],
    tablet: { fontSize: 36, lineHeight: 44 },
    mobile: { fontSize: 32, lineHeight: 40 },
  },
  'Stat/Number': {
    slug: 'stat-number',
    selectors: ['.t-stat-number'],
    tablet: { fontSize: 48, lineHeight: 54 },
    mobile: { fontSize: 40, lineHeight: 46 },
  },
}

/**
 * Converts a token key like `gold/500` or `glass/border-white-16` to a kebab-case CSS custom property name.
 * @param {string} rawKey
 * @param {string} [prefix]
 * @returns {string}
 */
function toCssVarName(rawKey, prefix = '') {
  const normalized = rawKey
    .trim()
    .replace(/\//g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
  return prefix ? `--${prefix}-${normalized}` : `--${normalized}`
}

/**
 * Extracts the leading CSS length value (e.g. `"8px (buttons, inputs)"` -> `"8px"`).
 * @param {string} rawValue
 * @returns {string}
 */
function cleanCssDimensionValue(rawValue) {
  const match = String(rawValue)
    .trim()
    .match(/^([0-9.]+px)/)
  return match ? match[1] : String(rawValue).trim()
}

/**
 * Formats a number to at most 2 decimal places without trailing zeros.
 * @param {number} n
 * @returns {string}
 */
function formatPx(n) {
  const rounded = Math.round(n * 1000) / 1000
  return `${rounded}px`
}

/**
 * Generates the exact contents of `src/styles/tokens.css` from the parsed `design/tokens.json` object.
 * @param {Record<string, unknown>} tokens
 * @returns {string}
 */
export function buildTokensCss(tokens) {
  const lines = [
    '/*',
    ' * AUTO-GENERATED FILE — DO NOT EDIT MANUALLY.',
    ' * Generated from `design/tokens.json` and `docs/05-design.md` (§"CTO decisions")',
    ' * by `scripts/generate-tokens.mjs` (`pnpm tokens`).',
    ' */',
    '',
    ':root {',
    '  /* === 1. Brand & Semantic Colors (Figma variables `design/tokens.json` -> `color`) === */',
  ]

  const colors = /** @type {Record<string, string>} */ (tokens.color ?? {})
  for (const [key, val] of Object.entries(colors)) {
    lines.push(`  ${toCssVarName(key)}: ${val};`)
  }
  // Short aliases referenced in `docs/05-design.md` §Tokens (lines 41–46)
  lines.push('  --gold: var(--gold-500);')
  lines.push('  --gold-700: #8a6410;')
  lines.push('  --body: var(--text-body);')
  lines.push('  --muted: var(--text-muted);')
  // CTO decisions §10 (`docs/05-design.md` line 137): error state token (contrast >= 4.5:1 on white)
  lines.push('  --danger: #b42318;')
  lines.push('  --danger-bg: rgba(180, 35, 24, 0.12);')

  lines.push('')
  lines.push(
    '  /* === 2. Literal Colors from Reference Code (`design/tokens.json` -> `colorExtra`, CTO §15) === */',
  )
  const colorExtra = /** @type {Record<string, string>} */ (tokens.colorExtra ?? {})
  for (const [key, val] of Object.entries(colorExtra)) {
    if (key.startsWith('$')) continue
    lines.push(`  ${toCssVarName(key)}: ${val.replace(/,(?!\s)/g, ', ')};`)
  }
  lines.push('  --glass-white-4: rgba(255, 255, 255, 0.04);')
  lines.push('  --glass-white-18: rgba(255, 255, 255, 0.18);')
  lines.push('  --glass-border-white-8: rgba(255, 255, 255, 0.08);')
  lines.push('  --glass-border-white-10: rgba(255, 255, 255, 0.1);')
  lines.push('  --glass-border-white-14: rgba(255, 255, 255, 0.14);')
  lines.push('  --glass-border-white-20: rgba(255, 255, 255, 0.2);')
  lines.push('  --glass-border-white-22: rgba(255, 255, 255, 0.22);')
  lines.push('  --glass-border-white-24: rgba(255, 255, 255, 0.24);')
  lines.push('  --glass-border-white-30: rgba(255, 255, 255, 0.3);')
  lines.push('  --glass-border-white-50: rgba(255, 255, 255, 0.5);')
  lines.push('  --overlay-navy-70: rgba(1, 16, 37, 0.7);')
  lines.push('  --gold-border-45: rgba(223, 168, 42, 0.45);')
  lines.push('  --border-gold-light: rgba(239, 203, 118, 0.6);')
  lines.push('  --success-border: rgba(51, 204, 128, 0.5);')
  lines.push('  --success-dot: rgb(51, 204, 128);')
  lines.push('  --surface-navbar-light: rgba(255, 255, 255, 0.94);')
  lines.push('  --icon-social-muted: rgb(153, 166, 186);')

  lines.push('')
  lines.push('  /* === 3. Gradients (`design/tokens.json` -> `gradient`, CTO §15) === */')
  lines.push('  --gradient-image-overlay-top-to-bottom: linear-gradient(')
  lines.push('    to bottom,')
  lines.push('    rgba(1, 16, 37, 0.15),')
  lines.push('    rgba(1, 16, 37, 0.9)')
  lines.push('  );')
  lines.push('  --gradient-service-card-default: linear-gradient(')
  lines.push('    to bottom,')
  lines.push('    rgba(1, 16, 37, 0.25) 0%,')
  lines.push('    rgba(1, 16, 37, 0.92) 100%')
  lines.push('  );')
  lines.push('  --gradient-service-card-hover: linear-gradient(')
  lines.push('    to bottom,')
  lines.push('    rgba(1, 16, 37, 0.45) 0%,')
  lines.push('    rgba(1, 16, 37, 0.96) 100%')
  lines.push('  );')
  lines.push('  --gradient-project-card-default: linear-gradient(')
  lines.push('    to bottom,')
  lines.push('    rgba(1, 16, 37, 0.15) 0%,')
  lines.push('    rgba(1, 16, 37, 0.92) 100%')
  lines.push('  );')
  lines.push('  --gradient-project-card-hover: linear-gradient(')
  lines.push('    to bottom,')
  lines.push('    rgba(1, 16, 37, 0.35) 0%,')
  lines.push('    rgba(1, 16, 37, 0.96) 100%')
  lines.push('  );')
  lines.push('  --gradient-team-card-overlay: linear-gradient(')
  lines.push('    to top,')
  lines.push('    var(--navy-950) 0%,')
  lines.push('    rgba(1, 16, 37, 0) 100%')
  lines.push('  );')
  lines.push('  --gradient-portrait-glow: radial-gradient(')
  lines.push('    circle at center,')
  lines.push('    rgba(223, 168, 42, 0.28) 0%,')
  lines.push('    rgba(223, 168, 42, 0) 100%')
  lines.push('  );')
  lines.push(
    '  --gradient-gold-accent-line: linear-gradient(to right, var(--gold-500), var(--gold-300));',
  )
  lines.push(
    '  --gradient-marquee-edge-fade: linear-gradient(to right, var(--surface), rgba(246, 248, 251, 0));',
  )
  lines.push(
    '  --gradient-navy-panel: linear-gradient(to bottom, var(--navy-800), var(--navy-950));',
  )
  lines.push(
    '  --gradient-footer: radial-gradient(50% 50% at 50% 50%, var(--navy-900) 0%, var(--navy-950) 100%);',
  )
  lines.push('  --gradient-hero-overlay: linear-gradient(')
  lines.push('    to bottom,')
  lines.push('    rgba(1, 16, 37, 0.75) 0%,')
  lines.push('    rgba(1, 16, 37, 0.6) 55%,')
  lines.push('    rgba(1, 16, 37, 0.92) 100%')
  lines.push('  );')
  lines.push('  --gradient-hero-gold-glow: radial-gradient(')
  lines.push('    circle at center,')
  lines.push('    rgba(223, 168, 42, 0.18) 0%,')
  lines.push('    rgba(223, 168, 42, 0) 100%')
  lines.push('  );')
  lines.push('  --gradient-intro-gold-glow: radial-gradient(')
  lines.push('    circle at center,')
  lines.push('    rgba(223, 168, 42, 0.22) 0%,')
  lines.push('    rgba(223, 168, 42, 0) 100%')
  lines.push('  );')
  lines.push('  --gradient-interactive-card: radial-gradient(')
  lines.push('    50% 50% at 50% 50%,')
  lines.push('    rgba(23, 43, 82, 1) 0%,')
  lines.push('    rgba(12, 30, 59, 1) 50%,')
  lines.push('    rgba(1, 16, 37, 1) 100%')
  lines.push('  );')
  lines.push('  --gradient-stats-overlay: linear-gradient(')
  lines.push('    to bottom,')
  lines.push('    rgba(1, 16, 37, 0.88) 0%,')
  lines.push('    rgba(1, 16, 37, 0.94) 100%')
  lines.push('  );')
  lines.push('  --gradient-cta-overlay: linear-gradient(')
  lines.push('    to bottom,')
  lines.push('    rgba(1, 16, 37, 0.9) 0%,')
  lines.push('    rgba(1, 16, 37, 0.85) 100%')
  lines.push('  );')

  lines.push('')
  lines.push('  /* === 4. Shadows (`design/tokens.json` -> `shadow`, CTO §15) === */')
  const shadows = /** @type {Record<string, string>} */ (tokens.shadow ?? {})
  for (const [key, val] of Object.entries(shadows)) {
    if (key.startsWith('$')) continue
    lines.push(`  ${toCssVarName(key, 'shadow')}: ${val.replace(/,(?!\s)/g, ', ')};`)
  }
  lines.push('  --shadow-navbar-light: 0 2px 8px 0 rgba(1, 16, 37, 0.06);')
  lines.push('  --shadow-button-dark-hover: 0 10px 12px 0 rgba(1, 16, 37, 0.25);')
  lines.push('  --shadow-team-card-hover: 0 26px 48px 0 rgba(1, 16, 37, 0.28);')
  lines.push('  --shadow-partner-tile-rest: 0 4px 6px rgba(1, 16, 37, 0.03);')
  lines.push('  --shadow-partner-tile-hover: 0 18px 18px rgba(1, 16, 37, 0.12);')
  lines.push('  --shadow-who-image: 0 24px 50px 0 rgba(1, 16, 37, 0.18);')
  lines.push('  --shadow-who-badge: 0 18px 20px 0 rgba(1, 16, 37, 0.16);')

  lines.push('')
  lines.push('  /* === 5. Border Radii (`design/tokens.json` -> `radius`, CTO §15) === */')
  const radii = /** @type {Record<string, string>} */ (tokens.radius ?? {})
  for (const [key, val] of Object.entries(radii)) {
    if (key.startsWith('$')) continue
    lines.push(`  ${toCssVarName(key, 'radius')}: ${cleanCssDimensionValue(val)};`)
  }
  lines.push('  --radius-5xl: 24px;')

  lines.push('')
  lines.push('  /* === 6. Spacing Scale (`design/tokens.json` -> `spacing.scale`) === */')
  const spacingObj = /** @type {{ scale?: number[] }} */ (tokens.spacing ?? {})
  for (const step of spacingObj.scale ?? []) {
    lines.push(`  --space-${step}: ${step}px;`)
  }

  lines.push('')
  lines.push(
    '  /* === 7. Layout Geometry & Breakpoint Gutters (`design/tokens.json` -> `layout`, CTO §1) === */',
  )
  const layout = /** @type {Record<string, unknown>} */ (tokens.layout ?? {})
  for (const requiredLayoutKey of ['gutter', 'gutterTablet', 'gutterMobile']) {
    if (
      typeof layout[requiredLayoutKey] !== 'number' ||
      !Number.isFinite(layout[requiredLayoutKey])
    ) {
      throw new Error(
        `Missing or invalid required numeric token layout.${requiredLayoutKey} in design/tokens.json`,
      )
    }
  }
  lines.push(`  --frame-width: ${Number(layout.frameWidth ?? 1440)}px;`)
  lines.push(`  --container-width: ${Number(layout.containerWidth ?? 1160)}px;`)
  lines.push(`  --gutter-desktop: ${Number(layout.gutter)}px;`)
  lines.push(`  --gutter-tablet: ${Number(layout.gutterTablet)}px;`)
  lines.push(`  --gutter-mobile: ${Number(layout.gutterMobile)}px;`)
  lines.push('  --container-gutter: var(--gutter-desktop);')
  const sectionPaddingObj = /** @type {{ typical?: number }} */ (layout.sectionPaddingY ?? {})
  lines.push(`  --section-padding-y: ${Number(sectionPaddingObj.typical ?? 72)}px;`)
  lines.push(`  --page-header-height: ${Number(layout.pageHeaderHeight ?? 537)}px;`)
  lines.push(`  --navbar-height: ${Number(layout.navbarHeight ?? 80)}px;`)
  lines.push(`  --footer-height: ${Number(layout.footerHeight ?? 503)}px;`)
  lines.push(`  --hero-height: ${Number(layout.heroHeight ?? 864)}px;`)

  lines.push('')
  lines.push('  /* === 8. Motion System (`design/tokens.json` -> `motion`, CTO §20) === */')
  const motion =
    /** @type {{ duration?: Record<string, unknown>; easing?: Record<string, unknown>; distance?: Record<string, unknown>; stagger?: Record<string, unknown> }} */ (
      tokens.motion ?? {}
    )
  /**
   * @param {Record<string, unknown> | undefined} group
   * @param {string} groupName
   * @param {string} key
   * @returns {number}
   */
  const requireMotionNumber = (group, groupName, key) => {
    const value = group?.[key]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error(
        `Missing or invalid required numeric token motion.${groupName}.${key} in design/tokens.json`,
      )
    }
    return value
  }
  /**
   * @param {Record<string, unknown> | undefined} group
   * @param {string} groupName
   * @param {string} key
   * @returns {string}
   */
  const requireMotionEasing = (group, groupName, key) => {
    const value = group?.[key]
    if (typeof value !== 'string' || !/^cubic-bezier\([\d.,\s]+\)$/.test(value)) {
      throw new Error(
        `Missing or invalid required easing token motion.${groupName}.${key} in design/tokens.json`,
      )
    }
    return value
  }
  /** @type {Array<[string, string]>} */
  const motionDurations = [
    ['--motion-fast', 'fast'],
    ['--motion-base', 'base'],
    ['--motion-slow', 'slow'],
    ['--motion-reveal', 'reveal'],
    ['--motion-countup', 'countUp'],
    ['--motion-hero-settle', 'heroSettle'],
    ['--motion-sheen', 'sheen'],
    ['--motion-cta-drift', 'ctaDrift'],
  ]
  for (const [cssVar, key] of motionDurations) {
    lines.push(`  ${cssVar}: ${requireMotionNumber(motion.duration, 'duration', key)}ms;`)
  }
  lines.push(`  --ease-out: ${requireMotionEasing(motion.easing, 'easing', 'out')};`)
  lines.push(`  --ease-in-out: ${requireMotionEasing(motion.easing, 'easing', 'inOut')};`)
  lines.push(
    `  --reveal-distance: ${formatPx(requireMotionNumber(motion.distance, 'distance', 'reveal'))};`,
  )
  lines.push(
    `  --hover-lift: ${formatPx(requireMotionNumber(motion.distance, 'distance', 'hoverLift'))};`,
  )
  lines.push(
    `  --hover-lift-card: ${formatPx(requireMotionNumber(motion.distance, 'distance', 'hoverLiftCard'))};`,
  )
  lines.push(`  --stagger: ${requireMotionNumber(motion.stagger, 'stagger', 'step')}ms;`)
  lines.push(
    `  --stagger-max-steps: ${requireMotionNumber(motion.stagger, 'stagger', 'maxSteps')};`,
  )

  lines.push('')
  lines.push(
    '  /* === 9. Font Family & Typography Scale (`design/tokens.json` -> `typography`, CTO §1 & §2) === */',
  )
  lines.push('  --font-sans: var(--font-poppins), sans-serif;')
  lines.push('  --font-lh-multiplier: 1;')

  const typography =
    /** @type {Record<string, { fontWeight: number; fontStyle: string; fontSize: number; lineHeight: number; letterSpacingPx: number }>} */ (
      tokens.typography ?? {}
    )

  for (const [styleName, styleDef] of Object.entries(typography)) {
    const mapEntry = TYPOGRAPHY_STYLE_MAP[styleName]
    if (!mapEntry) {
      throw new Error(`Unmapped typography style in design/tokens.json: "${styleName}"`)
    }
    const { slug } = mapEntry
    lines.push(`  --t-${slug}-weight: ${styleDef.fontWeight};`)
    lines.push(
      `  --t-${slug}-style: ${styleDef.fontStyle.toLowerCase() === 'italic' ? 'italic' : 'normal'};`,
    )
    lines.push(`  --t-${slug}-size: ${formatPx(styleDef.fontSize)};`)
    lines.push(`  --t-${slug}-lh-en: ${formatPx(styleDef.lineHeight)};`)
    lines.push(`  --t-${slug}-lh-ar: ${formatPx(styleDef.lineHeight * 1.1)};`)
    lines.push(`  --t-${slug}-lh: var(--t-${slug}-lh-en);`)
    lines.push(`  --t-${slug}-ls-en: ${formatPx(styleDef.letterSpacingPx)};`)
    lines.push(`  --t-${slug}-ls: var(--t-${slug}-ls-en);`)
  }
  lines.push('}')

  lines.push('')
  lines.push(
    '/* === Arabic (`ar`, RTL) Typography Rules (`docs/05-design.md` §"CTO decisions" #2) === */',
  )
  lines.push('/* Noto Kufi Arabic for all text, letter-spacing 0, line-height +10%. */')
  lines.push(":root[lang='ar'],")
  lines.push("[dir='rtl'] {")
  lines.push('  --font-sans: var(--font-noto-kufi-arabic), sans-serif;')
  lines.push('  --font-lh-multiplier: 1.1;')
  for (const [styleName, styleDef] of Object.entries(typography)) {
    const { slug } = TYPOGRAPHY_STYLE_MAP[styleName]
    if (styleDef.fontStyle.toLowerCase() === 'italic') {
      lines.push(`  --t-${slug}-style: normal;`)
    }
    lines.push(`  --t-${slug}-lh: var(--t-${slug}-lh-ar);`)
    lines.push(`  --t-${slug}-ls: 0px;`)
  }
  lines.push('}')

  lines.push('')
  lines.push('/* === English (`en`, LTR) Typography Rules === */')
  lines.push(":root[lang='en'],")
  lines.push("[dir='ltr'] {")
  lines.push('  --font-sans: var(--font-poppins), sans-serif;')
  lines.push('  --font-lh-multiplier: 1;')
  for (const [styleName, styleDef] of Object.entries(typography)) {
    const { slug } = TYPOGRAPHY_STYLE_MAP[styleName]
    if (styleDef.fontStyle.toLowerCase() === 'italic') {
      lines.push(`  --t-${slug}-style: italic;`)
    }
    lines.push(`  --t-${slug}-lh: var(--t-${slug}-lh-en);`)
    lines.push(`  --t-${slug}-ls: var(--t-${slug}-ls-en);`)
  }
  lines.push('}')

  lines.push('')
  lines.push('/* === Tablet Breakpoint Scale (`768px` – `1279.98px`, CTO §1) === */')
  lines.push('@media (min-width: 768px) and (max-width: 1279.98px) {')
  lines.push('  :root {')
  lines.push('    --container-gutter: var(--gutter-tablet);')
  lines.push('    --section-padding-y: var(--space-56);')
  for (const [styleName, styleDef] of Object.entries(typography)) {
    const { slug, tablet } = TYPOGRAPHY_STYLE_MAP[styleName]
    if (tablet.fontSize !== styleDef.fontSize || tablet.lineHeight !== styleDef.lineHeight) {
      lines.push(`    --t-${slug}-size: ${formatPx(tablet.fontSize)};`)
      lines.push(`    --t-${slug}-lh-en: ${formatPx(tablet.lineHeight)};`)
      lines.push(`    --t-${slug}-lh-ar: ${formatPx(tablet.lineHeight * 1.1)};`)
      if (styleDef.letterSpacingPx !== 0 && tablet.fontSize !== styleDef.fontSize) {
        const scaledTabletLs = (styleDef.letterSpacingPx / styleDef.fontSize) * tablet.fontSize
        lines.push(`    --t-${slug}-ls-en: ${formatPx(scaledTabletLs)};`)
      }
    }
  }
  lines.push('  }')
  lines.push('}')

  lines.push('')
  lines.push('/* === Mobile Breakpoint Scale (`< 768px`, CTO §1) === */')
  lines.push('@media (max-width: 767.98px) {')
  lines.push('  :root {')
  lines.push('    --container-gutter: var(--gutter-mobile);')
  lines.push('    --section-padding-y: var(--space-48);')
  for (const [styleName, styleDef] of Object.entries(typography)) {
    const { slug, mobile } = TYPOGRAPHY_STYLE_MAP[styleName]
    if (mobile.fontSize !== styleDef.fontSize || mobile.lineHeight !== styleDef.lineHeight) {
      lines.push(`    --t-${slug}-size: ${formatPx(mobile.fontSize)};`)
      lines.push(`    --t-${slug}-lh-en: ${formatPx(mobile.lineHeight)};`)
      lines.push(`    --t-${slug}-lh-ar: ${formatPx(mobile.lineHeight * 1.1)};`)
      if (styleDef.letterSpacingPx !== 0 && mobile.fontSize !== styleDef.fontSize) {
        const scaledMobileLs = (styleDef.letterSpacingPx / styleDef.fontSize) * mobile.fontSize
        lines.push(`    --t-${slug}-ls-en: ${formatPx(scaledMobileLs)};`)
      }
    }
  }
  lines.push('  }')
  lines.push('}')

  lines.push('')
  lines.push('/* === Text Style Utility Classes (`design/tokens.json` -> `typography`) === */')
  for (const [styleName, styleDef] of Object.entries(typography)) {
    const { slug, selectors } = TYPOGRAPHY_STYLE_MAP[styleName]
    lines.push(`${selectors.join(',\n')} {`)
    lines.push('  font-family: var(--font-sans);')
    lines.push(`  font-weight: var(--t-${slug}-weight);`)
    lines.push(`  font-style: var(--t-${slug}-style);`)
    lines.push(`  font-size: var(--t-${slug}-size);`)
    lines.push(`  line-height: var(--t-${slug}-lh);`)
    lines.push(`  letter-spacing: var(--t-${slug}-ls);`)
    if (styleName === 'Label/Caps' || styleName === 'Label/Eyebrow' || styleName === 'Label/Tag') {
      lines.push('  text-transform: uppercase;')
    }
    lines.push('}')
    if (styleName === 'Label/Caps' || styleName === 'Label/Eyebrow' || styleName === 'Label/Tag') {
      const arSelectors = selectors
        .flatMap((s) => [`:root[lang='ar'] ${s}`, `[lang='ar'] ${s}`])
        .join(',\n')
      lines.push(`${arSelectors} {`)
      lines.push('  text-transform: none;')
      lines.push('  letter-spacing: 0px;')
      lines.push('}')
    }
  }

  lines.push('')
  return lines.join('\n')
}

export function generateTokensFile({ checkOnly = false } = {}) {
  const rawJson = fs.readFileSync(TOKENS_JSON_PATH, 'utf8')
  const parsed = JSON.parse(rawJson)
  const expectedCss = buildTokensCss(parsed)

  if (checkOnly) {
    if (!fs.existsSync(TOKENS_CSS_PATH)) {
      throw new Error(`Missing generated tokens file: ${TOKENS_CSS_PATH}. Run "pnpm tokens".`)
    }
    const currentCss = fs.readFileSync(TOKENS_CSS_PATH, 'utf8').replace(/\r\n/g, '\n')
    if (currentCss !== expectedCss) {
      throw new Error(
        `Stale src/styles/tokens.css detected (differs from design/tokens.json). Run "pnpm tokens".`,
      )
    }
    return { updated: false, path: TOKENS_CSS_PATH }
  }

  fs.mkdirSync(path.dirname(TOKENS_CSS_PATH), { recursive: true })
  fs.writeFileSync(TOKENS_CSS_PATH, expectedCss, 'utf8')
  return { updated: true, path: TOKENS_CSS_PATH }
}

if (
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/generate-tokens.mjs')
) {
  const checkOnly = process.argv.includes('--check')
  try {
    const res = generateTokensFile({ checkOnly })
    if (checkOnly) {
      process.stdout.write(
        '[tokens] Verified src/styles/tokens.css is up-to-date with design/tokens.json.\n',
      )
    } else {
      process.stdout.write(
        `[tokens] Generated ${path.relative(REPO_ROOT, res.path).replace(/\\/g, '/')}.\n`,
      )
    }
  } catch (err) {
    process.stderr.write(`[tokens] ERROR: ${err instanceof Error ? err.message : String(err)}\n`)
    process.exit(1)
  }
}
