import 'server-only'

import crypto from 'node:crypto'
import { z } from 'zod'

import { env } from '@/env'
import type { SupportedLocale } from '@/i18n'
import { isValidInternalCmsPath, prefixInternalPathWithLocale } from '@/lib/link-safety'

/**
 * Derives the HMAC-SHA256 preview secret from `PAYLOAD_SECRET` (`handoff/tasks/P3-T1.md` §7, `S1`).
 */
export function getPreviewSecret(): string {
  return crypto
    .createHmac('sha256', env.PAYLOAD_SECRET)
    .update('aljazira-live-preview-secret-v1')
    .digest('hex')
}

export function verifyPreviewSecret(candidate: string): boolean {
  const expected = getPreviewSecret()
  const a = Buffer.from(candidate, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) {
    return false
  }
  return crypto.timingSafeEqual(a, b)
}

export const previewQuerySchema = z
  .object({
    secret: z.string().min(16).max(256),
    locale: z.enum(['ar', 'en']).optional().default('ar'),
    path: z.string().min(1).max(256).optional(),
    collection: z.enum(['services', 'projects']).optional(),
    global: z
      .enum([
        'home-page',
        'services-page',
        'about-page',
        'projects-page',
        'contact-page',
        'privacy-page',
      ])
      .optional(),
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
  })
  .strict()

export type PreviewQueryInput = z.infer<typeof previewQuerySchema>

const GLOBAL_ROUTE_MAP: Record<NonNullable<PreviewQueryInput['global']>, string> = {
  'home-page': '/',
  'services-page': '/services',
  'about-page': '/about',
  'projects-page': '/projects',
  'contact-page': '/contact',
  'privacy-page': '/privacy',
}

export function resolvePreviewTargetPath(input: {
  locale: SupportedLocale
  path?: string | undefined
  collection?: PreviewQueryInput['collection']
  global?: PreviewQueryInput['global']
  slug?: string | undefined
}): string | null {
  if (input.path) {
    if (!isValidInternalCmsPath(input.path)) {
      return null
    }
    return prefixInternalPathWithLocale(input.path, input.locale)
  }

  if (input.collection) {
    if (input.slug) {
      return `/${input.locale}/${input.collection}/${input.slug}`
    }
    return `/${input.locale}/${input.collection}`
  }

  if (input.global) {
    const baseRoute = GLOBAL_ROUTE_MAP[input.global]
    return prefixInternalPathWithLocale(baseRoute, input.locale)
  }

  return `/${input.locale}`
}

export const previewExitQuerySchema = z
  .object({
    returnTo: z.string().min(1).max(256).optional(),
  })
  .strict()
