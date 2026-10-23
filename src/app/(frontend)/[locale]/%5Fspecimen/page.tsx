import { notFound } from 'next/navigation'
import type React from 'react'

import { CmsLink } from '@/components/CmsLink'
import { getAlternateLocale, getDictionary, isSupportedLocale, type UiDictionary } from '@/i18n'
import gridStyles from '@/styles/grid.module.css'

import styles from './specimen.module.css'

interface SpecimenPageProps {
  params: Promise<{ locale: string }>
}

interface SwatchItem {
  token: string
  usage: string
  swatchClass: string
}

const BRAND_SWATCHES: readonly SwatchItem[] = [
  { token: '--gold-500', usage: 'Brand Gold Primary', swatchClass: styles.swatchGold500 },
  { token: '--gold-600', usage: 'Brand Gold Hover', swatchClass: styles.swatchGold600 },
  { token: '--gold-300', usage: 'Brand Gold Light', swatchClass: styles.swatchGold300 },
  { token: '--gold-50', usage: 'Brand Gold Surface Tint', swatchClass: styles.swatchGold50 },
  { token: '--navy-950', usage: 'Brand Navy Darkest', swatchClass: styles.swatchNavy950 },
  { token: '--navy-900', usage: 'Brand Navy Footer / Card', swatchClass: styles.swatchNavy900 },
  { token: '--navy-800', usage: 'Brand Navy Primary', swatchClass: styles.swatchNavy800 },
  { token: '--navy-600', usage: 'Brand Navy Mid', swatchClass: styles.swatchNavy600 },
  { token: '--text-body', usage: 'Body Copy Slate', swatchClass: styles.swatchTextBody },
  { token: '--text-muted', usage: 'Muted Caption Slate', swatchClass: styles.swatchTextMuted },
  { token: '--border', usage: 'Hairline Divider', swatchClass: styles.swatchBorder },
  { token: '--surface', usage: 'Off-white Section BG', swatchClass: styles.swatchSurface },
  { token: '--white', usage: 'Pure White', swatchClass: styles.swatchWhite },
  { token: '--danger', usage: 'Validation Error (CTO §10)', swatchClass: styles.swatchDanger },
]

const EXTRA_SWATCHES: readonly SwatchItem[] = [
  { token: '--overlay-navy-55', usage: 'Hero Scrim 55%', swatchClass: styles.swatchOverlay55 },
  { token: '--overlay-navy-90', usage: 'Card Scrim 90%', swatchClass: styles.swatchOverlay90 },
  { token: '--gold-tint-15', usage: 'Pill Gold Tint 15%', swatchClass: styles.swatchGoldTint },
  { token: '--whatsapp', usage: 'WhatsApp Brand', swatchClass: styles.swatchWhatsapp },
  { token: '--navy-deep', usage: 'Splash Background', swatchClass: styles.swatchNavyDeep },
]

interface TypographyRow {
  className: string
  figmaStyle: string
  specEn: string
  specAr: string
  sampleKey: keyof UiDictionary['specimen']
}

const TYPOGRAPHY_ROWS: readonly TypographyRow[] = [
  {
    className: 't-display-xl',
    figmaStyle: 'Display/XL',
    specEn: '700 · 72px / 80px · -1.08px (Tab 56/64 · Mob 44/52)',
    specAr: '700 · 72px / 88px · 0px (Tab 56/70.4 · Mob 44/57.2)',
    sampleKey: 'sampleDisplayXl',
  },
  {
    className: 't-display-l',
    figmaStyle: 'Display/L',
    specEn: '700 · 56px / 64px · -0.672px (Tab 44/52 · Mob 36/44)',
    specAr: '700 · 56px / 70.4px · 0px (Tab 44/57.2 · Mob 36/48.4)',
    sampleKey: 'sampleDisplayL',
  },
  {
    className: 't-h2',
    figmaStyle: 'Heading/H2',
    specEn: '700 · 44px / 52px · -0.44px (Tab 36/44 · Mob 30/38)',
    specAr: '700 · 44px / 57.2px · 0px (Tab 36/48.4 · Mob 30/41.8)',
    sampleKey: 'sampleH2',
  },
  {
    className: 't-h3',
    figmaStyle: 'Heading/H3',
    specEn: '700 · 28px / 36px · -0.112px (Tab 24/32 · Mob 22/30)',
    specAr: '700 · 28px / 39.6px · 0px (Tab 24/35.2 · Mob 22/33)',
    sampleKey: 'sampleH3',
  },
  {
    className: 't-h4',
    figmaStyle: 'Heading/H4',
    specEn: '600 · 20px / 28px · 0px (Tab 19/27 · Mob 18/26)',
    specAr: '600 · 20px / 30.8px · 0px (Tab 19/29.7 · Mob 18/28.6)',
    sampleKey: 'sampleH4',
  },
  {
    className: 't-h5',
    figmaStyle: 'Heading/H5',
    specEn: '600 · 17px / 24px · 0px (Tab 16/24 · Mob 16/24)',
    specAr: '600 · 17px / 26.4px · 0px (Tab 16/26.4 · Mob 16/26.4)',
    sampleKey: 'sampleH5',
  },
  {
    className: 't-stat-number',
    figmaStyle: 'Stat/Number',
    specEn: '700 · 56px / 60px · -0.56px (Tab 48/54 · Mob 40/46)',
    specAr: '700 · 56px / 66px · 0px (Tab 48/59.4 · Mob 40/50.6)',
    sampleKey: 'sampleStatNumber',
  },
  {
    className: 't-stat-m',
    figmaStyle: 'Stat/M',
    specEn: '700 · 40px / 48px · -0.4px (Tab 36/44 · Mob 32/40)',
    specAr: '700 · 40px / 52.8px · 0px (Tab 36/48.4 · Mob 32/44)',
    sampleKey: 'sampleStatM',
  },
  {
    className: 't-body-l',
    figmaStyle: 'Body/L',
    specEn: '400 · 18px / 30px · 0px (Tab 17/28 · Mob 16/26)',
    specAr: '400 · 18px / 33px · 0px (Tab 17/30.8 · Mob 16/28.6)',
    sampleKey: 'sampleBodyL',
  },
  {
    className: 't-body-m',
    figmaStyle: 'Body/M',
    specEn: '400 · 16px / 26px · 0px (Mob 15/24)',
    specAr: '400 · 16px / 28.6px · 0px (Mob 15/26.4)',
    sampleKey: 'sampleBodyM',
  },
  {
    className: 't-body-m-medium',
    figmaStyle: 'Body/M-Medium',
    specEn: '500 · 16px / 26px · 0px (Mob 15/24)',
    specAr: '500 · 16px / 28.6px · 0px (Mob 15/26.4)',
    sampleKey: 'sampleBodyMMedium',
  },
  {
    className: 't-body-m-strong',
    figmaStyle: 'Body/M-Strong',
    specEn: '600 · 16px / 26px · 0px (Mob 15/24)',
    specAr: '600 · 16px / 28.6px · 0px (Mob 15/26.4)',
    sampleKey: 'sampleBodyMStrong',
  },
  {
    className: 't-body-quote',
    figmaStyle: 'Body/Quote',
    specEn: '400 Italic · 16px / 26px · 0px (Mob 15/24)',
    specAr: '400 · 16px / 28.6px · 0px (Mob 15/26.4)',
    sampleKey: 'sampleBodyQuote',
  },
  {
    className: 't-body-s',
    figmaStyle: 'Body/S',
    specEn: '400 · 14px / 22px · 0px',
    specAr: '400 · 14px / 24.2px · 0px',
    sampleKey: 'sampleBodyS',
  },
  {
    className: 't-body-s-medium',
    figmaStyle: 'Body/S-Medium',
    specEn: '500 · 14px / 22px · 0px',
    specAr: '500 · 14px / 24.2px · 0px',
    sampleKey: 'sampleBodySMedium',
  },
  {
    className: 't-caption',
    figmaStyle: 'Caption',
    specEn: '400 · 13px / 20px · 0px',
    specAr: '400 · 13px / 22px · 0px',
    sampleKey: 'sampleCaption',
  },
  {
    className: 't-caption-s',
    figmaStyle: 'Caption/S',
    specEn: '400 · 12px / 18px · 0px',
    specAr: '400 · 12px / 19.8px · 0px',
    sampleKey: 'sampleCaptionS',
  },
  {
    className: 't-label-button',
    figmaStyle: 'Label/Button',
    specEn: '600 · 15px / 22px · 0px',
    specAr: '600 · 15px / 24.2px · 0px',
    sampleKey: 'sampleLabelButton',
  },
  {
    className: 't-label-caps',
    figmaStyle: 'Label/Caps',
    specEn: '600 · 12px / 16px · +1.2px · UPPERCASE',
    specAr: '600 · 12px / 17.6px · 0px · no uppercase',
    sampleKey: 'sampleLabelCaps',
  },
  {
    className: 't-label-eyebrow',
    figmaStyle: 'Label/Eyebrow',
    specEn: '600 · 12px / 16px · +0.96px · UPPERCASE',
    specAr: '600 · 12px / 17.6px · 0px · no uppercase',
    sampleKey: 'sampleLabelEyebrow',
  },
  {
    className: 't-label-link',
    figmaStyle: 'Label/Link',
    specEn: '600 · 14px / 22px · 0px',
    specAr: '600 · 14px / 24.2px · 0px',
    sampleKey: 'sampleLabelLink',
  },
  {
    className: 't-label-nav',
    figmaStyle: 'Label/Nav',
    specEn: '500 · 15px / 22px · 0px',
    specAr: '500 · 15px / 24.2px · 0px',
    sampleKey: 'sampleLabelNav',
  },
  {
    className: 't-label-tag',
    figmaStyle: 'Label/Tag',
    specEn: '600 · 11px / 14px · +0.66px · UPPERCASE',
    specAr: '600 · 11px / 15.4px · 0px · no uppercase',
    sampleKey: 'sampleLabelTag',
  },
]

const SHADOW_ITEMS = [
  { token: '--shadow-card-rest', boxClass: styles.shadowCardRest },
  { token: '--shadow-card-hover', boxClass: styles.shadowCardHover },
  { token: '--shadow-card-raised', boxClass: styles.shadowCardRaised },
  { token: '--shadow-panel-lg', boxClass: styles.shadowPanelLg },
  { token: '--shadow-button-gold', boxClass: styles.shadowButtonGold },
] as const

const RADIUS_ITEMS = [
  { token: '--radius-xs (4px)', boxClass: styles.radiusXs },
  { token: '--radius-sm (8px)', boxClass: styles.radiusSm },
  { token: '--radius-md (10px)', boxClass: styles.radiusMd },
  { token: '--radius-lg (12px)', boxClass: styles.radiusLg },
  { token: '--radius-2xl (16px)', boxClass: styles.radius2xl },
  { token: '--radius-pill (100px)', boxClass: styles.radiusPill },
] as const

const GRID_CELL_LABELS = ['Col 1', 'Col 2', 'Col 3', 'Col 4'] as const

/**
 * Temporary development-only type & token specimen page (`/[locale]/_specimen`,
 * `handoff/tasks/P3-T1.md` §Evidence).
 *
 * Returns `404 Not Found` when `process.env.NODE_ENV === 'production'`.
 */
export default async function DesignTokenSpecimenPage({
  params,
}: SpecimenPageProps): Promise<React.JSX.Element> {
  const { locale } = await params
  if (process.env.NODE_ENV === 'production' || !isSupportedLocale(locale)) {
    notFound()
  }

  const dict = getDictionary(locale)
  const alternateLocale = getAlternateLocale(locale)

  return (
    <div className={styles.page}>
      <div className={gridStyles.container}>
        <header className={styles.headerBanner} data-theme="dark">
          <div className={styles.headerTop}>
            <span className={`${styles.badge} t-label-eyebrow`}>{dict.specimen.badge}</span>
            <CmsLink
              href={`/${alternateLocale}/_specimen`}
              aria-label={dict.a11y.languageSwitcherLabel}
              className={`${styles.localeButton} t-label-button`}
            >
              <span>{dict.localeSwitcher.targetCode}</span>
              <span>{dict.localeSwitcher.targetName}</span>
            </CmsLink>
          </div>
          <h1 className={`${styles.headerTitle} t-h2`}>{dict.specimen.title}</h1>
          <p className={`${styles.headerSubtitle} t-body-l`}>{dict.specimen.subtitle}</p>
        </header>
      </div>

      <div className={gridStyles.container}>
        <section className={styles.sectionCard}>
          <h2 className={`${styles.sectionTitle} t-h3`}>{dict.specimen.colorsHeading}</h2>
          <div className={styles.swatchGrid}>
            {BRAND_SWATCHES.map((item) => (
              <div key={item.token} className={styles.swatchCard}>
                <div className={`${styles.swatchPreview} ${item.swatchClass}`} />
                <div className={styles.swatchMeta}>
                  <code dir="ltr" className={`${styles.swatchName} t-body-s-medium`}>
                    {item.token}
                  </code>
                  <span dir="ltr" className={`${styles.swatchNote} t-caption-s`}>
                    {item.usage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={gridStyles.container}>
        <section className={styles.sectionCard}>
          <h2 className={`${styles.sectionTitle} t-h3`}>{dict.specimen.extraColorsHeading}</h2>
          <div className={styles.swatchGrid}>
            {EXTRA_SWATCHES.map((item) => (
              <div key={item.token} className={styles.swatchCard}>
                <div className={`${styles.swatchPreview} ${item.swatchClass}`} />
                <div className={styles.swatchMeta}>
                  <code dir="ltr" className={`${styles.swatchName} t-body-s-medium`}>
                    {item.token}
                  </code>
                  <span dir="ltr" className={`${styles.swatchNote} t-caption-s`}>
                    {item.usage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={gridStyles.container}>
        <section className={styles.sectionCard}>
          <h2 className={`${styles.sectionTitle} t-h3`}>{dict.specimen.typographyHeading}</h2>
          <div className={styles.typeList}>
            {TYPOGRAPHY_ROWS.map((row) => (
              <div key={row.className} className={styles.typeRow}>
                <div>
                  <code dir="ltr" className={`${styles.typeClass} t-body-s-medium`}>
                    {`.${row.className}`}
                  </code>
                  <p dir="ltr" className={`${styles.typeSpec} t-caption-s`}>
                    {row.figmaStyle}
                  </p>
                </div>
                <p dir="ltr" className={`${styles.typeSpec} t-caption`}>
                  {locale === 'ar' ? row.specAr : row.specEn}
                </p>
                <p className={`${styles.typeSample} ${row.className}`}>
                  {dict.specimen[row.sampleKey]}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={gridStyles.container}>
        <section className={styles.sectionCard}>
          <h2 className={`${styles.sectionTitle} t-h3`}>{dict.specimen.shadowsHeading}</h2>
          <div className={styles.tokenDemoGrid}>
            {SHADOW_ITEMS.map((item) => (
              <div key={item.token} className={`${styles.shadowBox} ${item.boxClass}`}>
                <code dir="ltr" className="t-body-s-medium">
                  {item.token}
                </code>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={gridStyles.container}>
        <section className={styles.sectionCard}>
          <h2 className={`${styles.sectionTitle} t-h3`}>{dict.specimen.radiiHeading}</h2>
          <div className={styles.tokenDemoGrid}>
            {RADIUS_ITEMS.map((item) => (
              <div key={item.token} className={`${styles.radiusBox} ${item.boxClass}`}>
                <code dir="ltr" className="t-body-s-medium">
                  {item.token}
                </code>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={gridStyles.container}>
        <section className={styles.sectionCard}>
          <h2 className={`${styles.sectionTitle} t-h3`}>{dict.specimen.gridHeading}</h2>
          <div className={gridStyles.grid4}>
            {GRID_CELL_LABELS.map((label) => (
              <div key={label} className={`${styles.gridCell} t-label-button`}>
                {label}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
