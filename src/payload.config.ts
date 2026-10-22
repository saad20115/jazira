import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ar } from '@payloadcms/translations/languages/ar'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Brands } from './collections/Brands'
import { Materials } from './collections/Materials'
import { Media } from './collections/Media'
import { Stats } from './collections/Stats'
import { Users } from './collections/Users'
import { Videos } from './collections/Videos'
import { env } from './env'
import { buildNonBlockingEmailAdapter } from './security/emailAdapter'
import { MAX_MEDIA_FILE_SIZE_BYTES } from './security/uploadValidation'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: env.SERVER_URL,
  cors: [env.SERVER_URL],
  csrf: [env.SERVER_URL],
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    supportedLanguages: { ar, en },
    fallbackLanguage: 'ar',
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
    defaultLocale: 'ar',
    fallback: true,
  },
  collections: [Users, Media, Videos, Brands, Stats, Materials],
  editor: lexicalEditor(),
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
  upload: {
    limits: {
      fileSize: MAX_MEDIA_FILE_SIZE_BYTES,
    },
  },
  sharp,
  plugins: [],
})
