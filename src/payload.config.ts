import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ar } from '@payloadcms/translations/languages/ar'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { env } from './env'
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
  collections: [Users, Media],
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
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_ADDRESS ?? 'no-reply@aljazira.co',
    defaultFromName: process.env.SMTP_FROM_NAME ?? 'Al Jazira for Imdad Smart Co.',
    skipVerify: true,
    transportOptions: {
      host: process.env.SMTP_HOST ?? '127.0.0.1',
      port: Number(process.env.SMTP_PORT ?? '1025'),
      secure: false,
    },
  }),
  upload: {
    limits: {
      fileSize: MAX_MEDIA_FILE_SIZE_BYTES,
    },
  },
  sharp,
  plugins: [],
})
