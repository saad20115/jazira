import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { ar } from '@payloadcms/translations/languages/ar'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { isAdmin } from './access'
import { livePreviewConfig } from './admin/livePreview'
import { lockDownJobStatsGlobal } from './access/jobStatsGlobal'
import { Brands } from './collections/Brands'
import { Materials } from './collections/Materials'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { QuoteRateLimits } from './collections/QuoteRateLimits'
import { QuoteRequests } from './collections/QuoteRequests'
import { Services } from './collections/Services'
import { Stats } from './collections/Stats'
import { Team } from './collections/Team'
import { Users } from './collections/Users'
import { Videos } from './collections/Videos'
import { env } from './env'
import { createLimitedLexicalEditor } from './fields/richText'
import {
  AboutPage,
  ContactPage,
  HomePage,
  Navigation,
  PrivacyPage,
  ProjectsPage,
  ServicesPage,
  SiteSettings,
} from './globals'
import { notifyQuoteRequestTask } from './jobs/notifyQuoteRequest'
import { purgeExpiredQuoteRequestsTask } from './jobs/purgeExpiredQuoteRequests'
import { shouldAutoRunJobs } from './jobs/shouldAutoRun'
import { ensurePublicErrorMessageAfterError } from './security/apiError'
import { buildNonBlockingEmailAdapter } from './security/emailAdapter'
import { MAX_MEDIA_FILE_SIZE_BYTES } from './security/uploadValidation'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isAdminJobAccess = ({ req }: { req: Parameters<typeof isAdmin>[0]['req'] }): boolean =>
  isAdmin({ req }) === true

/**
 * P2-T7: the staff are not technical, so the "API" tab of every edit view is hidden. It only hides
 * the tab; access to the REST API is decided by each collection's access rules, as before.
 */
function withoutApiTab<T extends { admin?: { hideAPIURL?: boolean } }>(entity: T): T {
  return { ...entity, admin: { ...entity.admin, hideAPIURL: true } }
}

const config = buildConfig({
  serverURL: env.SERVER_URL,
  cors: [env.SERVER_URL],
  csrf: [env.SERVER_URL],
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // P2-T7 §5: one look for every member of staff (the brand colours are tuned for light).
    theme: 'light',
    // P2-T7 §3: Live Preview of projects, services and every page, at 1440 / 768 / 390.
    livePreview: livePreviewConfig,
    meta: {
      titleSuffix: ' | Al Jazira',
      icons: [{ rel: 'icon', type: 'image/x-icon', url: '/favicon.ico' }],
      defaultOGImageType: 'off',
    },
    components: {
      // P2-T7 §2: Payload's nav with its groups in the card order.
      Nav: '/admin/AdminNav#AdminNav',
      // P2-T7 §1: the language switch, always visible in the header.
      actions: ['/components/admin/AdminLanguageToggle#AdminLanguageToggle'],
      // P2-T7 §4: the dashboard home (summary cards, then every section in the card order).
      views: {
        dashboard: { Component: '/admin/AdminDashboard#AdminDashboard' },
      },
      graphics: {
        Logo: '/components/admin/AdminBrand#AdminLogo',
        Icon: '/components/admin/AdminBrand#AdminIcon',
      },
    },
  },
  i18n: {
    supportedLanguages: { en, ar },
    // English stays the fallback (owner decision 2026-10-24, pinned by the P3-T12 tests). A browser
    // set to Arabic gets the Arabic dashboard, and the header switch (P2-T7 §1) changes it for anyone.
    fallbackLanguage: 'en',
  },
  localization: {
    locales: [
      {
        code: 'ar',
        label: {
          ar: 'العربية',
          en: 'Arabic',
        },
        rtl: true,
      },
      {
        code: 'en',
        label: {
          ar: 'الإنجليزية',
          en: 'English',
        },
        rtl: false,
      },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [
    Users,
    Media,
    Videos,
    Brands,
    Stats,
    Materials,
    Services,
    Team,
    Projects,
    QuoteRequests,
    QuoteRateLimits,
  ].map(withoutApiTab),
  globals: [
    SiteSettings,
    Navigation,
    HomePage,
    ServicesPage,
    AboutPage,
    ProjectsPage,
    ContactPage,
    PrivacyPage,
  ].map(withoutApiTab),
  hooks: {
    afterError: [ensurePublicErrorMessageAfterError],
  },
  editor: createLimitedLexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  graphQL: {
    disable: true,
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
    pool: {
      connectionString: env.DATABASE_URL,
    },
  }),
  email: buildNonBlockingEmailAdapter(),
  jobs: {
    access: {
      run: isAdminJobAccess,
      queue: isAdminJobAccess,
      cancel: isAdminJobAccess,
    },
    autoRun: [
      {
        cron: '* * * * *',
        limit: 10,
        queue: 'default',
      },
    ],
    shouldAutoRun: () => shouldAutoRunJobs(),
    tasks: [notifyQuoteRequestTask, purgeExpiredQuoteRequestsTask],
  },
  upload: {
    limits: {
      files: 1,
      fileSize: MAX_MEDIA_FILE_SIZE_BYTES + 1,
    },
  },
  sharp,
  plugins: [
    seoPlugin({
      collections: [],
      uploadsCollection: 'media',
      generateTitle: ({ doc, locale }) => {
        const title =
          doc && typeof doc === 'object' && typeof (doc as { title?: unknown }).title === 'string'
            ? (doc as { title: string }).title
            : ''
        const suffix =
          locale === 'en' ? 'Al Jazira for Imdad Smart Co.' : 'شركة الجزيرة الإمداد الذكي'
        return title ? `${title} | ${suffix}` : suffix
      },
      generateDescription: ({ doc }) => {
        if (doc && typeof doc === 'object') {
          const shortDesc = (doc as { shortDescription?: unknown }).shortDescription
          if (typeof shortDesc === 'string') {
            return shortDesc
          }
          const summary = (doc as { summary?: unknown }).summary
          if (typeof summary === 'string') {
            return summary
          }
        }
        return ''
      },
    }),
  ],
})

// P5-T2: the scheduler's system global gets explicit deny-all access (Z1).
export default config.then(lockDownJobStatsGlobal)
