import { notFound } from 'next/navigation'
import type { ReactElement } from 'react'

import { Accordion, AccordionItem } from '@/components/Accordion'
import {
  Button,
  BUTTON_STATES,
  BUTTON_VARIANTS,
} from '@/components/Button'
import { Eyebrow } from '@/components/Eyebrow'
import {
  Footer,
  getSocialAriaLabel,
} from '@/components/Footer'
import {
  ArrowRightIcon,
  SERVICE_ICON_OPTIONS,
  ServiceIcon,
  SOCIAL_ICON_KEYS,
  SocialIcon,
} from '@/components/icons'
import {
  Logo,
  LOGO_COLORS,
  LOGO_TYPES,
} from '@/components/Logo'
import {
  Navbar,
  type NavbarPage,
  type NavbarTheme,
} from '@/components/Navbar'
import {
  NAV_LINK_STATES,
  NavLink,
} from '@/components/NavLink'
import {
  WhatsAppFab,
  WHATSAPP_FAB_STATES,
} from '@/components/WhatsAppFab'
import {
  getDictionary,
  isSupportedLocale,
  type SupportedLocale,
} from '@/i18n'

import { getStyleguideStrings } from './styleguide-data'
import styles from './styleguide.module.css'

interface StyleguidePageProps {
  params: Promise<{ locale: string }>
}

const NODE_IDS = {
  logo: 'Figma 100:515',
  button: 'Figma 12:36',
  eyebrow: 'Figma 12:47',
  navLink: 'Figma 12:66',
  navbar: 'Figma 13:489',
  footer: 'Figma 13:490',
  whatsappFab: 'Figma 12:93',
  accordionItem: 'Figma 105:310',
  icons: 'Figma Icons (10 Service + 5 Social + Directional)',
} as const

const STYLEGUIDE_NAVBAR_THEMES: readonly NavbarTheme[] = ['Light', 'Dark']
const STYLEGUIDE_NAVBAR_PAGES: readonly NavbarPage[] = [
  'Home',
  'Services',
  'About Us',
  'Projects',
  'Contact Us',
]
const BADGE_ONE = '01'
const BADGE_TWO = '02'
const DIRECTIONAL_KEY = 'ArrowRightIcon (RTL scaleX(-1))'

export default async function StyleguidePage({
  params,
}: StyleguidePageProps): Promise<ReactElement> {
  // Task P3-T2 §10 & Acceptance Criteria: dev-only route, unreachable (404) in production builds
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  const { locale } = await params
  if (!isSupportedLocale(locale)) {
    notFound()
  }

  const resolvedLocale: SupportedLocale = locale
  const dict = getDictionary(resolvedLocale)
  const sg = getStyleguideStrings(resolvedLocale)

  return (
    <div className={styles.page} data-page="styleguide" data-locale={resolvedLocale}>
      <section className={styles.heroBanner}>
        <div className={styles.container}>
          <div className={styles.heroHeader}>
            <div className={styles.heroTitleGroup}>
              <Eyebrow label={sg.eyebrow} tone="Dark" />
              <h1 className={styles.heroTitle}>{sg.title}</h1>
              <p className={styles.heroSubtitle}>{sg.subtitle}</p>
            </div>
            <Button
              href={`/${resolvedLocale === 'ar' ? 'en' : 'ar'}/styleguide`}
              label={dict.nav.languageSwitcherLabel}
              locale={resolvedLocale}
              size="sm"
              variant="Glass"
            />
          </div>
        </div>
      </section>

      <div className={`${styles.container} ${styles.sectionsStack}`}>
        {/* 1. Logo (100:515) */}
        <section
          className={styles.sectionCard}
          data-styleguide-section="logo"
          id="styleguide-logo"
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{sg.sectionLogo}</h2>
            <span className={styles.nodeBadge} dir="ltr">
              {NODE_IDS.logo}
            </span>
          </div>

          {LOGO_TYPES.map((logoType) => (
            <div className={styles.logoGrid} key={logoType}>
              {LOGO_COLORS.map((logoColor) => {
                const isOnDark = logoColor === 'Reversed' || logoColor === 'White'
                const caption = `${logoType} / ${logoColor}`
                return (
                  <div
                    className={`${styles.logoCell} ${isOnDark ? styles.logoCellDark : ''}`}
                    key={`${logoType}-${logoColor}`}
                  >
                    <Logo
                      alt={dict.nav.brandName}
                      color={logoColor}
                      type={logoType}
                    />
                    <span className={styles.cellCaption} dir="ltr">
                      {caption}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </section>

        {/* 2. Button (12:36) */}
        <section
          className={styles.sectionCard}
          data-styleguide-section="button"
          id="styleguide-button"
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{sg.sectionButton}</h2>
            <span className={styles.nodeBadge} dir="ltr">
              {NODE_IDS.button}
            </span>
          </div>

          <div className={styles.buttonRows}>
            {BUTTON_VARIANTS.map((variant) => {
              const isDarkSurface = variant === 'Glass'
              return (
                <div
                  className={`${styles.buttonVariantRow} ${isDarkSurface ? styles.buttonVariantRowDark : ''}`}
                  key={variant}
                >
                  <span className={styles.variantTitle} dir="ltr">
                    {variant}
                  </span>
                  {BUTTON_STATES.map((btnState) => (
                    <div className={styles.buttonCell} key={`${variant}-${btnState}`}>
                      <Button
                        label={dict.nav.requestQuote}
                        locale={resolvedLocale}
                        state={btnState}
                        variant={variant}
                      />
                      <span className={styles.cellCaption} dir="ltr">
                        {btnState}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </section>

        {/* 3. Eyebrow (12:47) */}
        <section
          className={styles.sectionCard}
          data-styleguide-section="eyebrow"
          id="styleguide-eyebrow"
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{sg.sectionEyebrow}</h2>
            <span className={styles.nodeBadge} dir="ltr">
              {NODE_IDS.eyebrow}
            </span>
          </div>

          <div className={styles.dualGrid}>
            <div className={styles.lightShowcase}>
              <Eyebrow label={sg.sampleEyebrow} tone="Light" />
            </div>
            <div className={styles.darkShowcase}>
              <Eyebrow label={sg.sampleEyebrow} tone="Dark" />
            </div>
          </div>
        </section>

        {/* 4. NavLink (12:66) */}
        <section
          className={styles.sectionCard}
          data-styleguide-section="nav-link"
          id="styleguide-nav-link"
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{sg.sectionNavLink}</h2>
            <span className={styles.nodeBadge} dir="ltr">
              {NODE_IDS.navLink}
            </span>
          </div>

          <div className={styles.dualGrid}>
            <div className={styles.lightShowcase}>
              {NAV_LINK_STATES.map((navState) => (
                <NavLink
                  href={`/${resolvedLocale}/services`}
                  key={`light-${navState}`}
                  label={dict.nav.services}
                  locale={resolvedLocale}
                  state={navState}
                  theme="Light"
                />
              ))}
            </div>
            <div className={styles.darkShowcase}>
              {NAV_LINK_STATES.map((navState) => (
                <NavLink
                  href={`/${resolvedLocale}/services`}
                  key={`dark-${navState}`}
                  label={dict.nav.services}
                  locale={resolvedLocale}
                  state={navState}
                  theme="Dark"
                />
              ))}
            </div>
          </div>
        </section>

        {/* 5. Navbar (13:489) */}
        <section
          className={styles.sectionCard}
          data-styleguide-section="navbar"
          id="styleguide-navbar"
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{sg.sectionNavbar}</h2>
            <span className={styles.nodeBadge} dir="ltr">
              {NODE_IDS.navbar}
            </span>
          </div>

          <div className={styles.fullBleedStack}>
            {STYLEGUIDE_NAVBAR_THEMES.flatMap((navTheme) =>
              STYLEGUIDE_NAVBAR_PAGES.map((navPage) => {
                const isDarkNav = navTheme === 'Dark'
                const variantCaption = `Theme=${navTheme}, Page=${navPage}`
                return (
                  <div
                    className={`${styles.navbarFrame} ${isDarkNav ? styles.navbarFrameDark : ''}`}
                    key={`${navTheme}-${navPage}`}
                  >
                    <div className={styles.frameLabelBar} dir="ltr">
                      {variantCaption}
                    </div>
                    <Navbar
                      locale={resolvedLocale}
                      page={navPage}
                      staticPreview
                      theme={navTheme}
                    />
                  </div>
                )
              }),
            )}
          </div>
        </section>

        {/* 6. Footer (13:490) */}
        <section
          className={styles.sectionCard}
          data-styleguide-section="footer"
          id="styleguide-footer"
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{sg.sectionFooter}</h2>
            <span className={styles.nodeBadge} dir="ltr">
              {NODE_IDS.footer}
            </span>
          </div>

          <div className={styles.navbarFrame}>
            <Footer locale={resolvedLocale} {...sg.footerPreview} />
          </div>
        </section>

        {/* 7. WhatsAppFab (12:93) */}
        <section
          className={styles.sectionCard}
          data-styleguide-section="whatsapp-fab"
          id="styleguide-whatsapp-fab"
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{sg.sectionWhatsappFab}</h2>
            <span className={styles.nodeBadge} dir="ltr">
              {NODE_IDS.whatsappFab}
            </span>
          </div>

          <div className={styles.fabShowcaseRow}>
            {WHATSAPP_FAB_STATES.map((fabState) => (
              <div className={styles.fabStateCard} key={fabState}>
                <WhatsAppFab
                  inline
                  locale={resolvedLocale}
                  state={fabState}
                  whatsapp={sg.whatsappPreviewNumber}
                />
                <span className={styles.cellCaption} dir="ltr">
                  {fabState}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 8. AccordionItem (105:310) & interactive Accordion */}
        <section
          className={styles.sectionCard}
          data-styleguide-section="accordion-item"
          id="styleguide-accordion-item"
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{sg.sectionAccordion}</h2>
            <span className={styles.nodeBadge} dir="ltr">
              {NODE_IDS.accordionItem}
            </span>
          </div>

          <div className={styles.accordionShowcase}>
            <AccordionItem
              body={sg.accordionSampleBody1}
              id="styleguide-acc-collapsed"
              locale={resolvedLocale}
              numberBadge={BADGE_ONE}
              state="Collapsed"
              title={sg.accordionSampleTitle1}
            />
            <AccordionItem
              body={sg.accordionSampleBody2}
              id="styleguide-acc-expanded"
              locale={resolvedLocale}
              numberBadge={BADGE_TWO}
              state="Expanded"
              title={sg.accordionSampleTitle2}
            />
          </div>

          <Accordion
            className={styles.accordionShowcase}
            items={[
              {
                id: 'interactive-acc-1',
                numberBadge: BADGE_ONE,
                title: sg.accordionSampleTitle1,
                body: sg.accordionSampleBody1,
                defaultExpanded: false,
              },
              {
                id: 'interactive-acc-2',
                numberBadge: BADGE_TWO,
                title: sg.accordionSampleTitle2,
                body: sg.accordionSampleBody2,
                defaultExpanded: true,
              },
            ]}
            locale={resolvedLocale}
          />
        </section>

        {/* 9. Icons (10 Service + 5 Social + Directional) */}
        <section
          className={styles.sectionCard}
          data-styleguide-section="icons"
          id="styleguide-icons"
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{sg.sectionIcons}</h2>
            <span className={styles.nodeBadge} dir="ltr">
              {NODE_IDS.icons}
            </span>
          </div>

          <h3 className={styles.iconsSubheading}>{sg.serviceIconsTitle}</h3>
          <div className={styles.iconsGrid}>
            {SERVICE_ICON_OPTIONS.map((opt) => (
              <div className={styles.iconTile} key={opt.value}>
                <span className={styles.iconBox}>
                  <ServiceIcon name={opt.value} size={20} />
                </span>
                <div className={styles.iconMeta}>
                  <span className={styles.iconKey} dir="ltr">
                    {opt.value}
                  </span>
                  <span className={styles.iconLabel}>{opt.label[resolvedLocale]}</span>
                </div>
              </div>
            ))}
          </div>

          <h3 className={styles.iconsSubheading}>{sg.socialIconsTitle}</h3>
          <div className={styles.iconsGrid}>
            {SOCIAL_ICON_KEYS.map((socialKey) => (
              <div className={styles.iconTile} key={socialKey}>
                <span className={styles.iconBoxDark}>
                  <SocialIcon name={socialKey} size={20} />
                </span>
                <div className={styles.iconMeta}>
                  <span className={styles.iconKey} dir="ltr">
                    {socialKey}
                  </span>
                  <span className={styles.iconLabel}>
                    {getSocialAriaLabel(resolvedLocale, socialKey)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <h3 className={styles.iconsSubheading}>{sg.directionalIconsTitle}</h3>
          <div className={styles.iconsGrid}>
            <div className={styles.iconTile}>
              <span className={styles.iconBox}>
                <ArrowRightIcon size={18} />
              </span>
              <div className={styles.iconMeta}>
                <span className={styles.iconKey} dir="ltr">
                  {DIRECTIONAL_KEY}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
