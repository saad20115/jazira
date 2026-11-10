import crypto from 'node:crypto'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: unknown) => fn,
}))

vi.mock('next/headers', () => ({
  draftMode: () => Promise.resolve({ isEnabled: false }),
  headers: () => Promise.resolve(new Headers()),
}))

import sitemap from '@/app/sitemap'
import { isArabicEnabled } from '@/lib/cms'
import config from '@/payload.config'

let payload: Payload
let adminUserId: number
let editorUserId: number
let initialArabicEnabled = false

describe(
  'P3-T12 Integration — English default + site-settings.arabicEnabled RBAC & Sitemap',
  { shuffle: false },
  () => {
    beforeAll(async () => {
      const { assertTestDatabaseIsolation } = await import('./_helpers/testDbIsolation')
      assertTestDatabaseIsolation()
      const resolvedConfig = await config
      payload = await getPayload({ config: resolvedConfig })
      await payload.db.migrate()

      const currentSettings = await payload.findGlobal({
        slug: 'site-settings',
        locale: 'en',
        overrideAccess: true,
      })
      initialArabicEnabled = currentSettings.arabicEnabled === true

      const ephemeralPassword = () => `Ephem!${crypto.randomBytes(16).toString('hex')}#9A`
      const adminUser = await payload.create({
        collection: 'users',
        data: {
          name: 'P3-T12 Admin',
          email: `p3-t12-admin-${String(Date.now())}@aljazira.co`,
          password: ephemeralPassword(),
          role: 'admin',
        },
        user: { id: 1, email: 'bootstrap@aljazira.co', role: 'admin', collection: 'users' },
        overrideAccess: true,
      })
      adminUserId = adminUser.id

      const editorUser = await payload.create({
        collection: 'users',
        data: {
          name: 'P3-T12 Editor',
          email: `p3-t12-editor-${String(Date.now())}@aljazira.co`,
          password: ephemeralPassword(),
          role: 'editor',
        },
        overrideAccess: true,
      })
      editorUserId = editorUser.id
    })

    afterAll(async () => {
      await payload.updateGlobal({
        slug: 'site-settings',
        locale: 'en',
        data: {
          arabicEnabled: initialArabicEnabled,
        },
        context: { disableRevalidate: true },
        overrideAccess: true,
      })

      for (const id of [adminUserId, editorUserId]) {
        if (id) {
          await payload
            .delete({
              collection: 'users',
              id,
              overrideAccess: true,
            })
            .catch(() => null)
        }
      }
    })

    it('configures defaultLocale = "en" and fallbackLanguage = "en" in payload.config.ts', () => {
      const locConfig = payload.config.localization
      expect(locConfig && typeof locConfig === 'object' ? locConfig.defaultLocale : null).toBe('en')
      expect(payload.config.i18n.fallbackLanguage).toBe('en')
    })

    it('enforces isAdminFieldLevel on site-settings.arabicEnabled: editor cannot flip arabicEnabled, admin can', async () => {
      const rawAdminUser = await payload.findByID({
        collection: 'users',
        id: adminUserId,
        overrideAccess: true,
      })
      const rawEditorUser = await payload.findByID({
        collection: 'users',
        id: editorUserId,
        overrideAccess: true,
      })
      const adminUser = { ...rawAdminUser, collection: 'users' as const }
      const editorUser = { ...rawEditorUser, collection: 'users' as const }

      // Ensure arabicEnabled starts false
      await payload.updateGlobal({
        slug: 'site-settings',
        locale: 'en',
        data: {
          companyName: 'Al Jazira for Imdad Smart Co.',
          arabicEnabled: false,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: adminUser,
      })

      expect(await isArabicEnabled()).toBe(false)
      const sitemapWhenOff = (await sitemap()).map((e) => e.url)
      expect(sitemapWhenOff[0]).toBe('http://localhost:3000/en')
      expect(sitemapWhenOff.some((url) => url.startsWith('http://localhost:3000/ar'))).toBe(false)

      // Editor attempts to set arabicEnabled: true with overrideAccess: false -> 403 Forbidden
      await expect(
        payload.updateGlobal({
          slug: 'site-settings',
          locale: 'en',
          data: {
            arabicEnabled: true,
          },
          context: { disableRevalidate: true },
          overrideAccess: false,
          user: editorUser,
        }),
      ).rejects.toThrow(/not allowed/i)
      expect(await isArabicEnabled()).toBe(false)

      // Admin sets arabicEnabled: true with overrideAccess: false -> succeeds
      const afterAdminEnable = await payload.updateGlobal({
        slug: 'site-settings',
        locale: 'en',
        data: {
          arabicEnabled: true,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: adminUser,
      })
      expect(afterAdminEnable.arabicEnabled).toBe(true)
      expect(await isArabicEnabled()).toBe(true)

      const sitemapWhenOn = (await sitemap()).map((e) => e.url)
      expect(sitemapWhenOn.slice(0, 2)).toEqual([
        'http://localhost:3000/en',
        'http://localhost:3000/ar',
      ])
      // P3-T10 §1: with Arabic on, every English page has its Arabic twin right after it.
      for (let i = 0; i < sitemapWhenOn.length; i += 2) {
        expect(sitemapWhenOn[i + 1]).toBe(
          sitemapWhenOn[i]?.replace('http://localhost:3000/en', 'http://localhost:3000/ar'),
        )
      }

      // Editor attempts to set arabicEnabled: false -> 403 Forbidden, remains true
      await expect(
        payload.updateGlobal({
          slug: 'site-settings',
          locale: 'en',
          data: {
            arabicEnabled: false,
          },
          context: { disableRevalidate: true },
          overrideAccess: false,
          user: editorUser,
        }),
      ).rejects.toThrow(/not allowed/i)
      expect(await isArabicEnabled()).toBe(true)

      // Admin sets arabicEnabled: false -> succeeds
      const afterAdminDisable = await payload.updateGlobal({
        slug: 'site-settings',
        locale: 'en',
        data: {
          arabicEnabled: false,
        },
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: adminUser,
      })
      expect(afterAdminDisable.arabicEnabled).toBe(false)
      expect(await isArabicEnabled()).toBe(false)
    })
  },
)
