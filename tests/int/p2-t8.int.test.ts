import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  deriveCollectionTargetReferences,
  findCollectionTargetReferences,
} from '../../src/collections/Media'
import { cmsCount, cmsFind, cmsFindByID, cmsFindGlobal } from '../../src/lib/cms/client'
import { hashIp } from '../../src/lib/ipHash'
import type { User } from '../../src/payload-types'

type RouteHandler = (
  request: Request,
  context: { params: Promise<{ slug: string[] }> },
) => Promise<Response>

let payload: Payload
let restGet: RouteHandler
let restPost: RouteHandler
let restPatch: RouteHandler
let restDelete: RouteHandler
let adminToken = ''
let editorToken = ''
let adminUser: User
let editorUser: User

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC',
  'base64',
)

const MINIMAL_MP4 = Buffer.from(
  '00000018667479706d703432000000006d70343269736f6d000000086d646174',
  'hex',
)

interface JsonApiCallOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  slugPath: string[]
  query?: Record<string, string>
  token?: string
  body?: unknown
}

async function callJsonApi(options: JsonApiCallOptions): Promise<{
  status: number
  body: Record<string, unknown>
}> {
  const { method, slugPath, query, token, body } = options
  const url = new URL(`http://localhost:3000/api/${slugPath.join('/')}`)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v)
    }
  }

  const headers = new Headers({
    Origin: 'http://localhost:3000',
  })
  if (token) {
    headers.set('cookie', `payload-token=${token}`)
    headers.set('Authorization', `JWT ${token}`)
  }
  let reqBody: string | undefined
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    reqBody = JSON.stringify(body)
  }

  const request = new Request(url.toString(), {
    method,
    headers,
    body: reqBody,
  })

  const routeContext = {
    params: Promise.resolve({ slug: slugPath }),
  }

  let response: Response
  if (method === 'GET') {
    response = await restGet(request, routeContext)
  } else if (method === 'POST') {
    response = await restPost(request, routeContext)
  } else if (method === 'PATCH') {
    response = await restPatch(request, routeContext)
  } else {
    response = await restDelete(request, routeContext)
  }

  const parsed = (await response.json().catch(() => ({}))) as Record<string, unknown>
  return {
    status: response.status,
    body: parsed,
  }
}

async function callUploadApi(options: {
  collectionSlug: 'media' | 'videos'
  token?: string
  fileBuffer: Buffer
  filename: string
  mimeType: string
  payloadFields: Record<string, unknown>
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const formData = new FormData()
  formData.set('_payload', JSON.stringify(options.payloadFields))
  formData.set(
    'file',
    new Blob([new Uint8Array(options.fileBuffer)], { type: options.mimeType }),
    options.filename,
  )

  const headers = new Headers({
    Origin: 'http://localhost:3000',
  })
  if (options.token) {
    headers.set('cookie', `payload-token=${options.token}`)
    headers.set('Authorization', `JWT ${options.token}`)
  }

  const request = new Request(`http://localhost:3000/api/${options.collectionSlug}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  const response = await restPost(request, {
    params: Promise.resolve({ slug: [options.collectionSlug] }),
  })
  const parsed = (await response.json().catch(() => ({}))) as Record<string, unknown>
  return {
    status: response.status,
    body: parsed,
  }
}

export interface CollectionMatrixRow {
  target: string
  anonRead: number
  anonCreate: number
  anonUpdate: number
  anonDelete: number
  editorRead: number
  editorCreate: number
  editorUpdate: number
  editorDelete: number
  adminRead: number
  adminCreate: number
  adminUpdate: number
  adminDelete: number
}

export interface GlobalMatrixRow {
  slug: string
  anonRead: number
  anonUpdate: number
  editorRead: number
  editorUpdate: number
  adminRead: number
  adminUpdate: number
}

export const recordedCollectionMatrix: CollectionMatrixRow[] = []
export const recordedGlobalMatrix: GlobalMatrixRow[] = []

describe(
  'P2-T8 Access Control Matrix & Phase 2 Verification Suite (Z1–Z6, R-6..R-9)',
  { shuffle: false },
  () => {
    beforeAll(async () => {
      const tmpBase = await fs.mkdtemp(path.join(os.tmpdir(), 'aljazira-p2t8-'))
      process.env.MEDIA_DIR = path.join(tmpBase, 'media')
      process.env.VIDEOS_DIR = path.join(tmpBase, 'videos')
      process.env.UPLOAD_TMP_DIR = path.join(tmpBase, 'tmp')
      await fs.mkdir(process.env.MEDIA_DIR, { recursive: true })
      await fs.mkdir(process.env.VIDEOS_DIR, { recursive: true })
      await fs.mkdir(process.env.UPLOAD_TMP_DIR, { recursive: true })

      const configModule = await import('../../src/payload.config')
      const routesModule = await import('@payloadcms/next/routes')
      const { assertTestDatabaseIsolation } = await import('./_helpers/testDbIsolation')
      assertTestDatabaseIsolation()

      restGet = routesModule.REST_GET(configModule.default)
      restPost = routesModule.REST_POST(configModule.default)
      restPatch = routesModule.REST_PATCH(configModule.default)
      restDelete = routesModule.REST_DELETE(configModule.default)

      payload = await getPayload({ config: configModule.default })

      await payload.db.migrateFresh({ forceAcceptWarning: true })

      const adminPassword = 'Str0ng!Admin#Pass2026$XyZ'
      const editorPassword = 'Str0ng!Editor#Pass2026$AbC'

      adminUser = await payload.create({
        collection: 'users',
        data: {
          name: 'م. أحمد الحربي (مدير النظام)',
          email: 'admin-p2t8@aljazira.co',
          password: adminPassword,
          role: 'admin',
        },
        overrideAccess: true,
      })

      editorUser = await payload.create({
        collection: 'users',
        data: {
          name: 'م. خالد العتيبي (محرر المحتوى)',
          email: 'editor-p2t8@aljazira.co',
          password: editorPassword,
          role: 'editor',
        },
        overrideAccess: true,
      })

      const adminLogin = await callJsonApi({
        method: 'POST',
        slugPath: ['users', 'login'],
        body: { email: 'admin-p2t8@aljazira.co', password: adminPassword },
      })
      expect(adminLogin.status).toBe(200)
      adminToken = String(adminLogin.body.token)

      const editorLogin = await callJsonApi({
        method: 'POST',
        slugPath: ['users', 'login'],
        body: { email: 'editor-p2t8@aljazira.co', password: editorPassword },
      })
      expect(editorLogin.status).toBe(200)
      editorToken = String(editorLogin.body.token)
    }, 120_000)

    afterAll(async () => {
      const mediaDir = process.env.MEDIA_DIR ?? ''
      const videosDir = process.env.VIDEOS_DIR ?? ''
      const tmpDir = process.env.UPLOAD_TMP_DIR ?? ''
      await fs.rm(mediaDir, { recursive: true, force: true })
      await fs.rm(videosDir, { recursive: true, force: true })
      await fs.rm(tmpDir, { recursive: true, force: true })
    }, 60_000)

    it('executes the complete REST Role Matrix (anonymous / editor / admin × every collection × read/create/update/delete) with real sessions (Z1, Z3, Z4, Z5)', async () => {
      // Seed baseline fixture records for read/update/delete checks
      const baseMedia = await payload.create({
        collection: 'media',
        locale: 'ar',
        overrideAccess: true,
        data: { alt: 'صورة مصفوفة الصلاحيات الأساسية' },
        file: {
          data: PNG_1X1,
          mimetype: 'image/png',
          name: 'matrix-base.png',
          size: PNG_1X1.length,
        },
      })

      // 1. users (self vs other)
      const tempUserForAdminDelete = await payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          name: 'مستخدم مؤقت للحذف',
          email: 'temp-delete-p2t8@aljazira.co',
          password: 'Str0ng!Temp#Pass2026$ZyX',
          role: 'editor',
        },
      })

      // users (self for editor, admin on any)
      const usersSelfRow: CollectionMatrixRow = {
        target: 'users (self)',
        anonRead: (await callJsonApi({ method: 'GET', slugPath: ['users', String(editorUser.id)] }))
          .status,
        anonCreate: (
          await callJsonApi({
            method: 'POST',
            slugPath: ['users'],
            body: {
              name: 'Anon User',
              email: 'anon-create@aljazira.co',
              password: 'Str0ng!Anon#Pass2026$AbC',
              role: 'editor',
            },
          })
        ).status,
        anonUpdate: (
          await callJsonApi({
            method: 'PATCH',
            slugPath: ['users', String(editorUser.id)],
            body: { name: 'Hack' },
          })
        ).status,
        anonDelete: (
          await callJsonApi({ method: 'DELETE', slugPath: ['users', String(editorUser.id)] })
        ).status,
        editorRead: (
          await callJsonApi({
            method: 'GET',
            slugPath: ['users', String(editorUser.id)],
            token: editorToken,
          })
        ).status,
        editorCreate: (
          await callJsonApi({
            method: 'POST',
            slugPath: ['users'],
            token: editorToken,
            body: {
              name: 'Editor Created User',
              email: 'editor-create@aljazira.co',
              password: 'Str0ng!EdCr#Pass2026$AbC',
              role: 'editor',
            },
          })
        ).status,
        editorUpdate: (
          await callJsonApi({
            method: 'PATCH',
            slugPath: ['users', String(editorUser.id)],
            token: editorToken,
            body: { name: 'م. خالد العتيبي (محدّث)' },
          })
        ).status,
        editorDelete: (
          await callJsonApi({
            method: 'DELETE',
            slugPath: ['users', String(editorUser.id)],
            token: editorToken,
          })
        ).status,
        adminRead: (
          await callJsonApi({
            method: 'GET',
            slugPath: ['users', String(adminUser.id)],
            token: adminToken,
          })
        ).status,
        adminCreate: (
          await callJsonApi({
            method: 'POST',
            slugPath: ['users'],
            token: adminToken,
            body: {
              name: 'مستخدم أنشأه المدير',
              email: 'admin-created-p2t8@aljazira.co',
              password: 'Str0ng!AdmCr#Pass2026$AbC',
              role: 'editor',
            },
          })
        ).status,
        adminUpdate: (
          await callJsonApi({
            method: 'PATCH',
            slugPath: ['users', String(adminUser.id)],
            token: adminToken,
            body: { name: 'م. أحمد الحربي (مدير النظام)' },
          })
        ).status,
        adminDelete: (
          await callJsonApi({
            method: 'DELETE',
            slugPath: ['users', String(tempUserForAdminDelete.id)],
            token: adminToken,
          })
        ).status,
      }
      expect(usersSelfRow).toEqual({
        target: 'users (self)',
        anonRead: 403,
        anonCreate: 403,
        anonUpdate: 403,
        anonDelete: 403,
        editorRead: 200,
        editorCreate: 403,
        editorUpdate: 200,
        editorDelete: 403,
        adminRead: 200,
        adminCreate: 201,
        adminUpdate: 200,
        adminDelete: 200,
      })
      recordedCollectionMatrix.push(usersSelfRow)

      // users (other user record for editor: GET returns 200 with ONLY { id, name } and no email/role/sessions per R-11; PATCH/DELETE return 403/404; all 12 cells measured per R-4)
      const usersOtherAnonRead = await callJsonApi({
        method: 'GET',
        slugPath: ['users', String(adminUser.id)],
      })
      const usersOtherAnonCreate = await callJsonApi({
        method: 'POST',
        slugPath: ['users'],
        body: {
          name: 'مستخدم مجهول (other)',
          email: 'anon-other-create-z5@aljazira.co',
          password: 'Str0ng!AnonOt#Pass2026$AbC',
          role: 'editor',
        },
      })
      const usersOtherAnonUpdate = await callJsonApi({
        method: 'PATCH',
        slugPath: ['users', String(adminUser.id)],
        body: { name: 'تعديل مجهول' },
      })
      const usersOtherAnonDelete = await callJsonApi({
        method: 'DELETE',
        slugPath: ['users', String(adminUser.id)],
      })
      const usersOtherEditorRead = await callJsonApi({
        method: 'GET',
        slugPath: ['users', String(adminUser.id)],
        token: editorToken,
      })
      const usersOtherEditorCreate = await callJsonApi({
        method: 'POST',
        slugPath: ['users'],
        token: editorToken,
        body: {
          name: 'مستخدم أنشأه محرر (other)',
          email: 'editor-other-create-z5@aljazira.co',
          password: 'Str0ng!EdOtCr#Pass2026$AbC',
          role: 'editor',
        },
      })
      const usersOtherEditorPatch = await callJsonApi({
        method: 'PATCH',
        slugPath: ['users', String(adminUser.id)],
        token: editorToken,
        body: { name: 'تعديل غير مصرح' },
      })
      const usersOtherEditorDelete = await callJsonApi({
        method: 'DELETE',
        slugPath: ['users', String(adminUser.id)],
        token: editorToken,
      })
      const usersOtherAdminRead = await callJsonApi({
        method: 'GET',
        slugPath: ['users', String(editorUser.id)],
        token: adminToken,
      })
      const usersOtherAdminCreate = await callJsonApi({
        method: 'POST',
        slugPath: ['users'],
        token: adminToken,
        body: {
          name: 'م. عمر الزهراني (مؤقت للحذف R-4)',
          email: 'temp-admin-other-delete-z5@aljazira.co',
          password: 'Str0ng!AdmOt#Pass2026$AbC',
          role: 'editor',
        },
      })
      const tempOtherUserId = (usersOtherAdminCreate.body.doc as { id: number }).id
      const usersOtherAdminUpdate = await callJsonApi({
        method: 'PATCH',
        slugPath: ['users', String(tempOtherUserId)],
        token: adminToken,
        body: { name: 'م. عمر الزهراني (محدث بواسطة المدير)' },
      })
      const usersOtherAdminDelete = await callJsonApi({
        method: 'DELETE',
        slugPath: ['users', String(tempOtherUserId)],
        token: adminToken,
      })

      expect(usersOtherEditorRead.status).toBe(200)
      expect(usersOtherEditorRead.body).toEqual({
        id: adminUser.id,
        name: 'م. أحمد الحربي (مدير النظام)',
      })
      expect(usersOtherEditorRead.body.email).toBeUndefined()
      expect(usersOtherEditorRead.body.role).toBeUndefined()
      expect(usersOtherEditorRead.body.sessions).toBeUndefined()
      expect([403, 404]).toContain(usersOtherEditorPatch.status)
      expect(usersOtherEditorDelete.status).toBe(403)

      const usersOtherRow: CollectionMatrixRow = {
        target: 'users (other — id & name only for editor per R-11)',
        anonRead: usersOtherAnonRead.status,
        anonCreate: usersOtherAnonCreate.status,
        anonUpdate: usersOtherAnonUpdate.status,
        anonDelete: usersOtherAnonDelete.status,
        editorRead: usersOtherEditorRead.status,
        editorCreate: usersOtherEditorCreate.status,
        editorUpdate: usersOtherEditorPatch.status,
        editorDelete: usersOtherEditorDelete.status,
        adminRead: usersOtherAdminRead.status,
        adminCreate: usersOtherAdminCreate.status,
        adminUpdate: usersOtherAdminUpdate.status,
        adminDelete: usersOtherAdminDelete.status,
      }
      expect(usersOtherRow).toEqual({
        target: 'users (other — id & name only for editor per R-11)',
        anonRead: 403,
        anonCreate: 403,
        anonUpdate: 403,
        anonDelete: 403,
        editorRead: 200,
        editorCreate: 403,
        editorUpdate: 403,
        editorDelete: 403,
        adminRead: 200,
        adminCreate: 201,
        adminUpdate: 200,
        adminDelete: 200,
      })
      recordedCollectionMatrix.push(usersOtherRow)

      // 2. media
      const anonMediaCreate = await callUploadApi({
        collectionSlug: 'media',
        fileBuffer: PNG_1X1,
        filename: 'anon.png',
        mimeType: 'image/png',
        payloadFields: { alt: 'Anon media' },
      })
      const editorMediaCreate = await callUploadApi({
        collectionSlug: 'media',
        token: editorToken,
        fileBuffer: PNG_1X1,
        filename: 'editor-media.png',
        mimeType: 'image/png',
        payloadFields: { alt: 'صورة أنشأها المحرر' },
      })
      const adminMediaCreate = await callUploadApi({
        collectionSlug: 'media',
        token: adminToken,
        fileBuffer: PNG_1X1,
        filename: 'admin-media.png',
        mimeType: 'image/png',
        payloadFields: { alt: 'صورة أنشأها المدير' },
      })
      const editorMediaId = (editorMediaCreate.body.doc as { id: number }).id
      const adminMediaId = (adminMediaCreate.body.doc as { id: number }).id

      const mediaRow: CollectionMatrixRow = {
        target: 'media',
        anonRead: (await callJsonApi({ method: 'GET', slugPath: ['media', String(editorMediaId)] }))
          .status,
        anonCreate: anonMediaCreate.status,
        anonUpdate: (
          await callJsonApi({
            method: 'PATCH',
            slugPath: ['media', String(editorMediaId)],
            body: { alt: 'Anon edit' },
          })
        ).status,
        anonDelete: (
          await callJsonApi({ method: 'DELETE', slugPath: ['media', String(editorMediaId)] })
        ).status,
        editorRead: (
          await callJsonApi({
            method: 'GET',
            slugPath: ['media', String(editorMediaId)],
            token: editorToken,
          })
        ).status,
        editorCreate: editorMediaCreate.status,
        editorUpdate: (
          await callJsonApi({
            method: 'PATCH',
            slugPath: ['media', String(editorMediaId)],
            token: editorToken,
            body: { alt: 'صورة محدّثة من المحرر' },
          })
        ).status,
        editorDelete: (
          await callJsonApi({
            method: 'DELETE',
            slugPath: ['media', String(editorMediaId)],
            token: editorToken,
          })
        ).status,
        adminRead: (
          await callJsonApi({
            method: 'GET',
            slugPath: ['media', String(adminMediaId)],
            token: adminToken,
          })
        ).status,
        adminCreate: adminMediaCreate.status,
        adminUpdate: (
          await callJsonApi({
            method: 'PATCH',
            slugPath: ['media', String(adminMediaId)],
            token: adminToken,
            body: { alt: 'صورة محدّثة من المدير' },
          })
        ).status,
        adminDelete: (
          await callJsonApi({
            method: 'DELETE',
            slugPath: ['media', String(adminMediaId)],
            token: adminToken,
          })
        ).status,
      }
      expect(mediaRow).toEqual({
        target: 'media',
        anonRead: 200,
        anonCreate: 403,
        anonUpdate: 403,
        anonDelete: 403,
        editorRead: 200,
        editorCreate: 201,
        editorUpdate: 200,
        editorDelete: 200,
        adminRead: 200,
        adminCreate: 201,
        adminUpdate: 200,
        adminDelete: 200,
      })
      recordedCollectionMatrix.push(mediaRow)

      // 3. videos
      const anonVideoCreate = await callUploadApi({
        collectionSlug: 'videos',
        fileBuffer: MINIMAL_MP4,
        filename: 'anon.mp4',
        mimeType: 'video/mp4',
        payloadFields: { title: 'Anon video' },
      })
      const editorVideoCreate = await callUploadApi({
        collectionSlug: 'videos',
        token: editorToken,
        fileBuffer: MINIMAL_MP4,
        filename: 'editor.mp4',
        mimeType: 'video/mp4',
        payloadFields: { title: 'فيديو المحرر' },
      })
      const adminVideoCreate = await callUploadApi({
        collectionSlug: 'videos',
        token: adminToken,
        fileBuffer: MINIMAL_MP4,
        filename: 'admin.mp4',
        mimeType: 'video/mp4',
        payloadFields: { title: 'فيديو المدير' },
      })
      const editorVideoId = (editorVideoCreate.body.doc as { id: number }).id
      const adminVideoId = (adminVideoCreate.body.doc as { id: number }).id

      const videosRow: CollectionMatrixRow = {
        target: 'videos',
        anonRead: (
          await callJsonApi({ method: 'GET', slugPath: ['videos', String(editorVideoId)] })
        ).status,
        anonCreate: anonVideoCreate.status,
        anonUpdate: (
          await callJsonApi({
            method: 'PATCH',
            slugPath: ['videos', String(editorVideoId)],
            body: { title: 'Anon edit' },
          })
        ).status,
        anonDelete: (
          await callJsonApi({ method: 'DELETE', slugPath: ['videos', String(editorVideoId)] })
        ).status,
        editorRead: (
          await callJsonApi({
            method: 'GET',
            slugPath: ['videos', String(editorVideoId)],
            token: editorToken,
          })
        ).status,
        editorCreate: editorVideoCreate.status,
        editorUpdate: (
          await callJsonApi({
            method: 'PATCH',
            slugPath: ['videos', String(editorVideoId)],
            token: editorToken,
            body: { title: 'فيديو المحرر المحدّث' },
          })
        ).status,
        editorDelete: (
          await callJsonApi({
            method: 'DELETE',
            slugPath: ['videos', String(editorVideoId)],
            token: editorToken,
          })
        ).status,
        adminRead: (
          await callJsonApi({
            method: 'GET',
            slugPath: ['videos', String(adminVideoId)],
            token: adminToken,
          })
        ).status,
        adminCreate: adminVideoCreate.status,
        adminUpdate: (
          await callJsonApi({
            method: 'PATCH',
            slugPath: ['videos', String(adminVideoId)],
            token: adminToken,
            body: { title: 'فيديو المدير المحدّث' },
          })
        ).status,
        adminDelete: (
          await callJsonApi({
            method: 'DELETE',
            slugPath: ['videos', String(adminVideoId)],
            token: adminToken,
          })
        ).status,
      }
      expect(videosRow).toEqual({
        target: 'videos',
        anonRead: 200,
        anonCreate: 403,
        anonUpdate: 403,
        anonDelete: 403,
        editorRead: 200,
        editorCreate: 201,
        editorUpdate: 200,
        editorDelete: 200,
        adminRead: 200,
        adminCreate: 201,
        adminUpdate: 200,
        adminDelete: 200,
      })
      recordedCollectionMatrix.push(videosRow)

      // Helper for JSON collections where editor & admin have full CRUD and anon has public read
      const baseBrandForMaterials = await payload.create({
        collection: 'brands',
        locale: 'ar',
        overrideAccess: true,
        data: { name: 'علامة مرجعية للمواد', order: 1 },
      })

      const jsonCrudSpecs: Array<{
        slug: 'brands' | 'stats' | 'materials' | 'services' | 'team' | 'projects'
        createPayloadEditor: Record<string, unknown>
        createPayloadAdmin: Record<string, unknown>
        updatePayload: Record<string, unknown>
      }> = [
        {
          slug: 'brands',
          createPayloadEditor: { name: 'الفنار (اختبار المحرر)', order: 2 },
          createPayloadAdmin: { name: 'شنايدر (اختبار المدير)', order: 3 },
          updatePayload: { order: 5 },
        },
        {
          slug: 'stats',
          createPayloadEditor: { value: '45+', label: 'عاماً من الخبرة', order: 1 },
          createPayloadAdmin: { value: '100+', label: 'مشروع منجز', order: 2 },
          updatePayload: { order: 4 },
        },
        {
          slug: 'materials',
          createPayloadEditor: {
            itemNo: 101,
            system: 'electrical',
            description: 'قواطع كهربائية جهد منخفض',
            brands: [baseBrandForMaterials.id],
          },
          createPayloadAdmin: {
            itemNo: 102,
            system: 'mechanical',
            description: 'مضخات مياه مبردة',
            brands: [baseBrandForMaterials.id],
          },
          updatePayload: { description: 'مضخات وقواطع محدّثة' },
        },
        {
          slug: 'services',
          createPayloadEditor: {
            title: 'الأعمال الكهروميكانيكية (MEP)',
            slug: 'matrix-mep-editor',
            tier: 'main',
            icon: 'mep',
            shortDescription: 'وصف الخدمة من المحرر.',
            order: 1,
            _status: 'published',
          },
          createPayloadAdmin: {
            title: 'أنظمة التيار الخفيف (ELV)',
            slug: 'matrix-elv-admin',
            tier: 'main',
            icon: 'smart',
            shortDescription: 'وصف الخدمة من المدير.',
            order: 2,
            _status: 'published',
          },
          updatePayload: { shortDescription: 'وصف محدّث للخدمة.' },
        },
        {
          slug: 'team',
          createPayloadEditor: {
            name: 'م. سلطان الشمري',
            position: 'مدير المشاريع',
            tier: 'leadership',
            photo: baseMedia.id,
            active: true,
            order: 1,
          },
          createPayloadAdmin: {
            name: 'م. فيصل القحطاني',
            position: 'المدير التنفيذي',
            tier: 'leadership',
            photo: baseMedia.id,
            active: true,
            order: 2,
          },
          updatePayload: { order: 3 },
        },
        {
          slug: 'projects',
          createPayloadEditor: {
            title: 'مشروع بوابة الدرعية (اختبار المحرر)',
            slug: 'matrix-diriyah-editor',
            summary: 'تنفيذ الأعمال الكهروميكانيكية لمشروع بوابة الدرعية.',
            location: 'الرياض',
            category: 'mep',
            scope: ['hvac', 'electrical'],
            coverImage: baseMedia.id,
            status: 'completed',
            featured: true,
            order: 1,
            _status: 'published',
          },
          createPayloadAdmin: {
            title: 'مشروع حديقة الملك سلمان (اختبار المدير)',
            slug: 'matrix-ksp-admin',
            summary: 'تنفيذ أنظمة البنية التحتية والتبريد لمشروع حديقة الملك سلمان.',
            location: 'الرياض',
            category: 'civil-mep',
            scope: ['civil', 'plumbing'],
            coverImage: baseMedia.id,
            status: 'completed',
            featured: false,
            order: 2,
            _status: 'published',
          },
          updatePayload: { location: 'مكة المكرمة' },
        },
      ]

      for (const spec of jsonCrudSpecs) {
        const anonCreate = await callJsonApi({
          method: 'POST',
          slugPath: [spec.slug],
          query: { locale: 'ar' },
          body: spec.createPayloadEditor,
        })
        const editorCreate = await callJsonApi({
          method: 'POST',
          slugPath: [spec.slug],
          query: { locale: 'ar' },
          token: editorToken,
          body: spec.createPayloadEditor,
        })
        const adminCreate = await callJsonApi({
          method: 'POST',
          slugPath: [spec.slug],
          query: { locale: 'ar' },
          token: adminToken,
          body: spec.createPayloadAdmin,
        })
        const editorDocId = (editorCreate.body.doc as { id: number }).id
        const adminDocId = (adminCreate.body.doc as { id: number }).id

        const row: CollectionMatrixRow = {
          target: spec.slug,
          anonRead: (
            await callJsonApi({
              method: 'GET',
              slugPath: [spec.slug, String(editorDocId)],
              query: { locale: 'ar' },
            })
          ).status,
          anonCreate: anonCreate.status,
          anonUpdate: (
            await callJsonApi({
              method: 'PATCH',
              slugPath: [spec.slug, String(editorDocId)],
              query: { locale: 'ar' },
              body: spec.updatePayload,
            })
          ).status,
          anonDelete: (
            await callJsonApi({
              method: 'DELETE',
              slugPath: [spec.slug, String(editorDocId)],
            })
          ).status,
          editorRead: (
            await callJsonApi({
              method: 'GET',
              slugPath: [spec.slug, String(editorDocId)],
              query: { locale: 'ar' },
              token: editorToken,
            })
          ).status,
          editorCreate: editorCreate.status,
          editorUpdate: (
            await callJsonApi({
              method: 'PATCH',
              slugPath: [spec.slug, String(editorDocId)],
              query: { locale: 'ar' },
              token: editorToken,
              body: spec.updatePayload,
            })
          ).status,
          editorDelete: (
            await callJsonApi({
              method: 'DELETE',
              slugPath: [spec.slug, String(editorDocId)],
              token: editorToken,
            })
          ).status,
          adminRead: (
            await callJsonApi({
              method: 'GET',
              slugPath: [spec.slug, String(adminDocId)],
              query: { locale: 'ar' },
              token: adminToken,
            })
          ).status,
          adminCreate: adminCreate.status,
          adminUpdate: (
            await callJsonApi({
              method: 'PATCH',
              slugPath: [spec.slug, String(adminDocId)],
              query: { locale: 'ar' },
              token: adminToken,
              body: spec.updatePayload,
            })
          ).status,
          adminDelete: (
            await callJsonApi({
              method: 'DELETE',
              slugPath: [spec.slug, String(adminDocId)],
              token: adminToken,
            })
          ).status,
        }

        expect(row, `Collection matrix mismatch for ${spec.slug}`).toEqual({
          target: spec.slug,
          anonRead: 200,
          anonCreate: 403,
          anonUpdate: 403,
          anonDelete: 403,
          editorRead: 200,
          editorCreate: 201,
          editorUpdate: 200,
          editorDelete: 200,
          adminRead: 200,
          adminCreate: 201,
          adminUpdate: 200,
          adminDelete: 200,
        })
        recordedCollectionMatrix.push(row)
      }

      // 10. quote-requests (Z4: create always 403; read/update editor+admin; delete admin only)
      const seededQuote = await payload.create({
        collection: 'quote-requests',
        overrideAccess: true,
        data: {
          name: 'م. عبدالرحمن السديري',
          company: 'شركة البناء الحديث',
          email: 'abdulrahman@modernbuild.example.sa',
          phone: '+966 57 353 4185',
          message: 'طلب عرض سعر لأعمال التكييف المركزي.',
          locale: 'ar',
          sourcePage: '/ar/contact',
          consent: true,
          status: 'new',
          emailStatus: 'pending',
          emailAttempts: 0,
          ipHash: hashIp('203.0.113.77'),
        },
      })

      const quoteBodyAttempt = {
        name: 'Attempt via REST',
        email: 'attempt@example.sa',
        phone: '+966573534185',
        locale: 'ar',
        consent: true,
      }

      const quoteRow: CollectionMatrixRow = {
        target: 'quote-requests',
        anonRead: (
          await callJsonApi({
            method: 'GET',
            slugPath: ['quote-requests', String(seededQuote.id)],
          })
        ).status,
        anonCreate: (
          await callJsonApi({
            method: 'POST',
            slugPath: ['quote-requests'],
            body: quoteBodyAttempt,
          })
        ).status,
        anonUpdate: (
          await callJsonApi({
            method: 'PATCH',
            slugPath: ['quote-requests', String(seededQuote.id)],
            body: { status: 'contacted' },
          })
        ).status,
        anonDelete: (
          await callJsonApi({
            method: 'DELETE',
            slugPath: ['quote-requests', String(seededQuote.id)],
          })
        ).status,
        editorRead: (
          await callJsonApi({
            method: 'GET',
            slugPath: ['quote-requests', String(seededQuote.id)],
            token: editorToken,
          })
        ).status,
        editorCreate: (
          await callJsonApi({
            method: 'POST',
            slugPath: ['quote-requests'],
            token: editorToken,
            body: quoteBodyAttempt,
          })
        ).status,
        editorUpdate: (
          await callJsonApi({
            method: 'PATCH',
            slugPath: ['quote-requests', String(seededQuote.id)],
            token: editorToken,
            body: { status: 'contacted', internalNotes: 'تم التواصل مع العميل.' },
          })
        ).status,
        editorDelete: (
          await callJsonApi({
            method: 'DELETE',
            slugPath: ['quote-requests', String(seededQuote.id)],
            token: editorToken,
          })
        ).status,
        adminRead: (
          await callJsonApi({
            method: 'GET',
            slugPath: ['quote-requests', String(seededQuote.id)],
            token: adminToken,
          })
        ).status,
        adminCreate: (
          await callJsonApi({
            method: 'POST',
            slugPath: ['quote-requests'],
            token: adminToken,
            body: quoteBodyAttempt,
          })
        ).status,
        adminUpdate: (
          await callJsonApi({
            method: 'PATCH',
            slugPath: ['quote-requests', String(seededQuote.id)],
            token: adminToken,
            body: { status: 'quoted' },
          })
        ).status,
        adminDelete: (
          await callJsonApi({
            method: 'DELETE',
            slugPath: ['quote-requests', String(seededQuote.id)],
            token: adminToken,
          })
        ).status,
      }
      expect(quoteRow).toEqual({
        target: 'quote-requests',
        anonRead: 403,
        anonCreate: 403,
        anonUpdate: 403,
        anonDelete: 403,
        editorRead: 200,
        editorCreate: 403,
        editorUpdate: 200,
        editorDelete: 403,
        adminRead: 200,
        adminCreate: 403,
        adminUpdate: 200,
        adminDelete: 200,
      })
      recordedCollectionMatrix.push(quoteRow)
    }, 120_000)

    it('executes the complete REST Role Matrix across all 8 globals (anonymous / editor / admin × read/update) (Z1, Z5)', async () => {
      const globalUpdatePayloads: Record<string, Record<string, unknown>> = {
        'site-settings': {
          companyName: 'شركة الجزيرة للإمداد الذكي المحدودة',
        },
        navigation: {
          headerCta: {
            label: 'اطلب عرض سعر',
            link: { type: 'internal', internalRoute: '/contact' },
          },
        },
        'home-page': {
          _status: 'published',
          hero: {
            eyebrow: 'الجزيرة للإمداد الذكي',
            title: 'شريككم الهندسي الموثوق',
          },
        },
        'services-page': {
          _status: 'published',
          pageHeader: {
            title: 'خدماتنا الهندسية',
            subtitle: 'حلول متكاملة في الأعمال الكهروميكانيكية والمقاولات.',
          },
        },
        'about-page': {
          _status: 'published',
          pageHeader: {
            title: 'من نحن',
            subtitle: 'خبرة تمتد لأكثر من 45 عاماً في المملكة العربية السعودية.',
          },
        },
        'projects-page': {
          _status: 'published',
          pageHeader: {
            title: 'مشاريعنا',
            subtitle: 'سجل حافل بالمشاريع الكبرى.',
          },
        },
        'contact-page': {
          _status: 'published',
          pageHeader: {
            title: 'تواصل معنا',
            subtitle: 'نسعد بخدمتكم والرد على استفساراتكم.',
          },
        },
        'privacy-page': {
          _status: 'published',
          pageHeader: {
            title: 'سياسة الخصوصية',
            subtitle: 'التزامنا بحماية البيانات وفق نظام حماية البيانات الشخصية السعودي.',
          },
        },
      }

      for (const [slug, body] of Object.entries(globalUpdatePayloads)) {
        // Ensure published baseline exists first via admin
        const seedRes = await callJsonApi({
          method: 'POST',
          slugPath: ['globals', slug],
          query: { locale: 'ar' },
          token: adminToken,
          body,
        })
        expect(seedRes.status, `Initial seed of global:${slug}`).toBe(200)

        const anonRead = await callJsonApi({
          method: 'GET',
          slugPath: ['globals', slug],
          query: { locale: 'ar' },
        })
        const anonUpdate = await callJsonApi({
          method: 'POST',
          slugPath: ['globals', slug],
          query: { locale: 'ar' },
          body,
        })
        const editorRead = await callJsonApi({
          method: 'GET',
          slugPath: ['globals', slug],
          query: { locale: 'ar' },
          token: editorToken,
        })
        const editorUpdate = await callJsonApi({
          method: 'POST',
          slugPath: ['globals', slug],
          query: { locale: 'ar' },
          token: editorToken,
          body,
        })
        const adminRead = await callJsonApi({
          method: 'GET',
          slugPath: ['globals', slug],
          query: { locale: 'ar' },
          token: adminToken,
        })
        const adminUpdate = await callJsonApi({
          method: 'POST',
          slugPath: ['globals', slug],
          query: { locale: 'ar' },
          token: adminToken,
          body,
        })

        const row: GlobalMatrixRow = {
          slug,
          anonRead: anonRead.status,
          anonUpdate: anonUpdate.status,
          editorRead: editorRead.status,
          editorUpdate: editorUpdate.status,
          adminRead: adminRead.status,
          adminUpdate: adminUpdate.status,
        }

        const expectedEditorUpdate = slug === 'site-settings' ? 403 : 200
        expect(row, `Global matrix mismatch for ${slug}`).toEqual({
          slug,
          anonRead: 200,
          anonUpdate: 403,
          editorRead: 200,
          editorUpdate: expectedEditorUpdate,
          adminRead: 200,
          adminUpdate: 200,
        })
        recordedGlobalMatrix.push(row)
      }

      const colLines = [
        '=== Z5 COLLECTION ROLE MATRIX ===',
        '| Target | Anon Read | Anon Create | Anon Update | Anon Delete | Editor Read | Editor Create | Editor Update | Editor Delete | Admin Read | Admin Create | Admin Update | Admin Delete |',
        '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
        ...recordedCollectionMatrix.map(
          (r) =>
            `| \`${r.target}\` | ${String(r.anonRead)} | ${String(r.anonCreate)} | ${String(r.anonUpdate)} | ${String(r.anonDelete)} | ${String(r.editorRead)} | ${String(r.editorCreate)} | ${String(r.editorUpdate)} | ${String(r.editorDelete)} | ${String(r.adminRead)} | ${String(r.adminCreate)} | ${String(r.adminUpdate)} | ${String(r.adminDelete)} |`,
        ),
        '=== Z5 GLOBAL ROLE MATRIX ===',
        '| Global | Anon Read | Anon Update | Editor Read | Editor Update | Admin Read | Admin Update |',
        '|---|---|---|---|---|---|---|',
        ...recordedGlobalMatrix.map(
          (r) =>
            `| \`${r.slug}\` | ${String(r.anonRead)} | ${String(r.anonUpdate)} | ${String(r.editorRead)} | ${String(r.editorUpdate)} | ${String(r.adminRead)} | ${String(r.adminUpdate)} |`,
        ),
      ]
      console.info(colLines.join('\n'))
    }, 120_000)

    it('enforces Z2 (draft isolation) across all versioned collections (services, projects) and versioned globals in both REST (?draft=true) and Local API (overrideAccess: false) (Z2, Z5)', async () => {
      const coverMedia = await payload.create({
        collection: 'media',
        locale: 'ar',
        overrideAccess: true,
        data: { alt: 'صورة غلاف اختبار المسودات Z2' },
        file: {
          data: PNG_1X1,
          mimetype: 'image/png',
          name: 'z2-draft-cover.png',
          size: PNG_1X1.length,
        },
      })

      // 1. Draft-only service & project
      const draftService = await payload.create({
        collection: 'services',
        locale: 'ar',
        draft: true,
        overrideAccess: true,
        data: {
          title: 'خدمة مسودة سرية غير منشورة',
          slug: 'secret-draft-service-z2',
          tier: 'additional',
          icon: 'fire',
          shortDescription: 'لا يجب أن تظهر للزوار أبداً.',
          order: 99,
          _status: 'draft',
        },
      })

      const draftProject = await payload.create({
        collection: 'projects',
        locale: 'ar',
        draft: true,
        overrideAccess: true,
        data: {
          title: 'مشروع مسودة سري غير منشور',
          slug: 'secret-draft-project-z2',
          summary: 'مسودة مشروع قيد الإعداد.',
          location: 'الرياض',
          category: 'mep',
          scope: ['hvac'],
          coverImage: coverMedia.id,
          status: 'in-progress',
          featured: false,
          order: 99,
          _status: 'draft',
        },
      })

      // Anonymous REST GET ?draft=true must never return draft-only docs
      for (const [slug, draftId] of [
        ['services', draftService.id],
        ['projects', draftProject.id],
      ] as const) {
        const anonListDraft = await callJsonApi({
          method: 'GET',
          slugPath: [slug],
          query: { locale: 'ar', draft: 'true' },
        })
        expect(anonListDraft.status).toBe(200)
        const anonIds = (anonListDraft.body.docs as Array<{ id: number }>).map((d) => d.id)
        expect(anonIds).not.toContain(draftId)

        const anonByIdDraft = await callJsonApi({
          method: 'GET',
          slugPath: [slug, String(draftId)],
          query: { locale: 'ar', draft: 'true' },
        })
        expect(anonByIdDraft.status).toBe(404)

        // Anonymous Local API with overrideAccess: false and draft: true
        const localList = await payload.find({
          collection: slug,
          locale: 'ar',
          draft: true,
          overrideAccess: false,
        })
        expect(localList.docs.map((d) => d.id)).not.toContain(draftId)

        await expect(
          payload.findByID({
            collection: slug,
            id: draftId,
            locale: 'ar',
            draft: true,
            overrideAccess: false,
          }),
        ).rejects.toThrow()

        // Editor & Admin REST GET ?draft=true DO see the draft
        const editorByIdDraft = await callJsonApi({
          method: 'GET',
          slugPath: [slug, String(draftId)],
          query: { locale: 'ar', draft: 'true' },
          token: editorToken,
        })
        expect(editorByIdDraft.status).toBe(200)
        expect(editorByIdDraft.body._status).toBe('draft')
      }

      // 2. Published project with an unpublished draft revision on top
      const pubProject = await payload.create({
        collection: 'projects',
        locale: 'ar',
        draft: false,
        overrideAccess: true,
        data: {
          title: 'العنوان المنشور للجمهور',
          slug: 'published-with-newer-draft-z2',
          summary: 'ملخص المشروع المنشور.',
          location: 'الرياض',
          category: 'civil-mep',
          scope: ['civil'],
          coverImage: coverMedia.id,
          status: 'completed',
          featured: true,
          order: 10,
          _status: 'published',
        },
      })

      // Save a draft update on top of the published project
      const saveDraftOnPub = await callJsonApi({
        method: 'PATCH',
        slugPath: ['projects', String(pubProject.id)],
        query: { locale: 'ar', draft: 'true' },
        token: editorToken,
        body: {
          title: 'عنوان مسودة جديد لم يُنشر بعد',
          _status: 'draft',
        },
      })
      expect(saveDraftOnPub.status).toBe(200)

      // Anonymous GET /api/projects/:id?draft=true returns 404 (draft version has _status: 'draft', blocked by publishedOrLoggedIn)
      const anonGetPubWithDraft = await callJsonApi({
        method: 'GET',
        slugPath: ['projects', String(pubProject.id)],
        query: { locale: 'ar', draft: 'true' },
      })
      expect(anonGetPubWithDraft.status).toBe(404)

      // Anonymous public GET /api/projects/:id returns 200 with the PUBLISHED title, never the newer draft title
      const anonGetPubWithoutDraft = await callJsonApi({
        method: 'GET',
        slugPath: ['projects', String(pubProject.id)],
        query: { locale: 'ar' },
      })
      expect(anonGetPubWithoutDraft.status).toBe(200)
      expect(anonGetPubWithoutDraft.body.title).toBe('العنوان المنشور للجمهور')

      // Editor GET /api/projects/:id?draft=true returns the newer DRAFT title
      const editorGetPubWithDraft = await callJsonApi({
        method: 'GET',
        slugPath: ['projects', String(pubProject.id)],
        query: { locale: 'ar', draft: 'true' },
        token: editorToken,
      })
      expect(editorGetPubWithDraft.status).toBe(200)
      expect(editorGetPubWithDraft.body.title).toBe('عنوان مسودة جديد لم يُنشر بعد')

      // 3. All 6 versioned page globals: save draft on each and verify anonymous ?draft=true & Local API see published only while editor sees draft (Z2, R-5)
      const versionedPageGlobalCases: ReadonlyArray<{
        slug:
          | 'home-page'
          | 'services-page'
          | 'about-page'
          | 'projects-page'
          | 'contact-page'
          | 'privacy-page'
        groupKey: 'hero' | 'pageHeader'
        publishedTitle: string
        draftTitle: string
        draftBody: Record<string, unknown>
      }> = [
        {
          slug: 'home-page',
          groupKey: 'hero',
          publishedTitle: 'شريككم الهندسي الموثوق',
          draftTitle: 'عنوان مسودة غير منشور للصفحة الرئيسية',
          draftBody: {
            _status: 'draft',
            hero: {
              eyebrow: 'الجزيرة للإمداد الذكي',
              title: 'عنوان مسودة غير منشور للصفحة الرئيسية',
            },
          },
        },
        {
          slug: 'services-page',
          groupKey: 'pageHeader',
          publishedTitle: 'خدماتنا الهندسية',
          draftTitle: 'عنوان مسودة غير منشور لصفحة الخدمات',
          draftBody: {
            _status: 'draft',
            pageHeader: {
              title: 'عنوان مسودة غير منشور لصفحة الخدمات',
              subtitle: 'مسودة داخلية',
            },
          },
        },
        {
          slug: 'about-page',
          groupKey: 'pageHeader',
          publishedTitle: 'من نحن',
          draftTitle: 'عنوان مسودة غير منشور لصفحة من نحن',
          draftBody: {
            _status: 'draft',
            pageHeader: {
              title: 'عنوان مسودة غير منشور لصفحة من نحن',
              subtitle: 'مسودة داخلية',
            },
          },
        },
        {
          slug: 'projects-page',
          groupKey: 'pageHeader',
          publishedTitle: 'مشاريعنا',
          draftTitle: 'عنوان مسودة غير منشور لصفحة المشاريع',
          draftBody: {
            _status: 'draft',
            pageHeader: {
              title: 'عنوان مسودة غير منشور لصفحة المشاريع',
              subtitle: 'مسودة داخلية',
            },
          },
        },
        {
          slug: 'contact-page',
          groupKey: 'pageHeader',
          publishedTitle: 'تواصل معنا',
          draftTitle: 'عنوان مسودة غير منشور لصفحة التواصل',
          draftBody: {
            _status: 'draft',
            pageHeader: {
              title: 'عنوان مسودة غير منشور لصفحة التواصل',
              subtitle: 'مسودة داخلية',
            },
          },
        },
        {
          slug: 'privacy-page',
          groupKey: 'pageHeader',
          publishedTitle: 'سياسة الخصوصية',
          draftTitle: 'عنوان مسودة غير منشور لصفحة سياسة الخصوصية',
          draftBody: {
            _status: 'draft',
            pageHeader: {
              title: 'عنوان مسودة غير منشور لصفحة سياسة الخصوصية',
              subtitle: 'مسودة داخلية',
            },
          },
        },
      ]

      for (const globalCase of versionedPageGlobalCases) {
        const saveDraftGlobal = await callJsonApi({
          method: 'POST',
          slugPath: ['globals', globalCase.slug],
          query: { locale: 'ar', draft: 'true' },
          token: editorToken,
          body: globalCase.draftBody,
        })
        expect(saveDraftGlobal.status, `save draft on ${globalCase.slug}`).toBe(200)

        const anonGlobalDraft = await callJsonApi({
          method: 'GET',
          slugPath: ['globals', globalCase.slug],
          query: { locale: 'ar', draft: 'true' },
        })
        expect(anonGlobalDraft.status).toBe(200)
        expect(
          (anonGlobalDraft.body[globalCase.groupKey] as { title: string }).title,
          `anon REST ?draft=true on ${globalCase.slug}`,
        ).toBe(globalCase.publishedTitle)

        const localGlobalAnon = (await payload.findGlobal({
          slug: globalCase.slug,
          locale: 'ar',
          draft: true,
          overrideAccess: false,
        })) as unknown as Record<string, { title?: string } | undefined>
        expect(
          localGlobalAnon[globalCase.groupKey]?.title,
          `anon Local API draft:true on ${globalCase.slug}`,
        ).toBe(globalCase.publishedTitle)

        const editorGlobalDraft = await callJsonApi({
          method: 'GET',
          slugPath: ['globals', globalCase.slug],
          query: { locale: 'ar', draft: 'true' },
          token: editorToken,
        })
        expect(editorGlobalDraft.status).toBe(200)
        expect(
          (editorGlobalDraft.body[globalCase.groupKey] as { title: string }).title,
          `editor REST ?draft=true on ${globalCase.slug}`,
        ).toBe(globalCase.draftTitle)
      }
    }, 120_000)

    it('enforces Z3: editor cannot escalate own role to admin via REST PATCH or Local API (overrideAccess: false), while admin can update roles (Z3, Z5, R-5)', async () => {
      const editorEscalationAttempt = await callJsonApi({
        method: 'PATCH',
        slugPath: ['users', String(editorUser.id)],
        token: editorToken,
        body: {
          role: 'admin',
          name: 'م. خالد العتيبي (محاولة ترقية)',
        },
      })
      expect(editorEscalationAttempt.status).toBe(200)

      const storedEditor = await payload.findByID({
        collection: 'users',
        id: editorUser.id,
        overrideAccess: true,
      })
      expect(storedEditor.role).toBe('editor')
      expect(storedEditor.name).toBe('م. خالد العتيبي (محاولة ترقية)')

      // Local API with overrideAccess: false as editor also ignores role change
      const afterLocalAttempt = await payload.update({
        collection: 'users',
        id: editorUser.id,
        user: storedEditor,
        overrideAccess: false,
        data: {
          role: 'admin',
        },
      })
      expect(afterLocalAttempt.role).toBe('editor')

      // Admin CAN update a user's role via REST PATCH and Local API (overrideAccess: false) (R-5)
      const adminPromotesEditor = await callJsonApi({
        method: 'PATCH',
        slugPath: ['users', String(editorUser.id)],
        token: adminToken,
        body: {
          role: 'admin',
        },
      })
      expect(adminPromotesEditor.status).toBe(200)
      expect((adminPromotesEditor.body.doc as { role: string }).role).toBe('admin')

      const adminRestoresEditor = await payload.update({
        collection: 'users',
        id: editorUser.id,
        user: adminUser,
        overrideAccess: false,
        data: {
          role: 'editor',
        },
      })
      expect(adminRestoresEditor.role).toBe('editor')
    })

    it('verifies R-8 (config-driven collection media guard) and R-9 (http: external links rejected when NODE_ENV === production) over REST', async () => {
      // R-8: Create a media item and verify findCollectionTargetReferences protects a synthetic nested array upload path
      const guardedMedia = await payload.create({
        collection: 'media',
        locale: 'ar',
        overrideAccess: true,
        data: { alt: 'صورة محمية باختبار R-8' },
        file: {
          data: PNG_1X1,
          mimetype: 'image/png',
          name: 'r8-guarded.png',
          size: PNG_1X1.length,
        },
      })

      const brandReferencingMedia = await payload.create({
        collection: 'brands',
        locale: 'ar',
        overrideAccess: true,
        data: {
          name: 'علامة تجارية تختبر حماية الوسائط التلقائية R-8',
          logo: guardedMedia.id,
          order: 20,
        },
      })

      // Attempt to delete guardedMedia via REST DELETE -> 400 with brand title
      const delBlocked = await callJsonApi({
        method: 'DELETE',
        slugPath: ['media', String(guardedMedia.id)],
        token: adminToken,
      })
      expect(delBlocked.status).toBe(400)
      expect(JSON.stringify(delBlocked.body)).toContain(
        'brands(علامة تجارية تختبر حماية الوسائط التلقائية R-8)',
      )

      // Also verify deriveCollectionTargetReferences + findCollectionTargetReferences on a synthetic nested path
      const syntheticSpecs = deriveCollectionTargetReferences(
        [
          {
            slug: 'brands',
            admin: { useAsTitle: 'name' },
            fields: [
              { name: 'name', type: 'text', localized: true },
              { name: 'logo', type: 'upload', relationTo: 'media' },
            ],
          },
        ],
        'media',
      )
      expect(syntheticSpecs).toHaveLength(1)
      const refsMap = new Map<string, string>()
      await findCollectionTargetReferences({
        check: syntheticSpecs[0],
        targetId: guardedMedia.id,
        referencesByKey: refsMap,
        req: { payload } as never,
      })
      expect([...refsMap.values()]).toContain(
        'brands(علامة تجارية تختبر حماية الوسائط التلقائية R-8)',
      )

      // Remove brand reference and confirm media deletes cleanly
      await payload.delete({
        collection: 'brands',
        id: brandReferencingMedia.id,
        overrideAccess: true,
      })
      const delAllowed = await callJsonApi({
        method: 'DELETE',
        slugPath: ['media', String(guardedMedia.id)],
        token: adminToken,
      })
      expect(delAllowed.status).toBe(200)

      // R-9: Simulate NODE_ENV === 'production' and verify http: is rejected with 400 while https:, mailto:, tel:, and /internal succeed
      const originalNodeEnv = process.env.NODE_ENV
      const envRecord = process.env as Record<string, string | undefined>
      try {
        envRecord.NODE_ENV = 'production'

        const httpNavRes = await callJsonApi({
          method: 'POST',
          slugPath: ['globals', 'navigation'],
          query: { locale: 'ar' },
          token: editorToken,
          body: {
            headerCta: {
              label: 'رابط غير مشفر في الإنتاج',
              link: {
                type: 'external',
                url: 'http://aljazira.co/contact',
              },
            },
          },
        })
        expect(httpNavRes.status).toBe(400)

        const httpBrandRes = await callJsonApi({
          method: 'POST',
          slugPath: ['brands'],
          query: { locale: 'ar' },
          token: editorToken,
          body: {
            name: 'علامة برابط http في الإنتاج',
            website: 'http://vendor.example.com',
            order: 30,
          },
        })
        expect(httpBrandRes.status).toBe(400)

        for (const allowedProdUrl of [
          'https://aljazira.co/contact',
          'mailto:info@aljazira.co',
          'tel:+966573534185',
        ]) {
          const okNavRes = await callJsonApi({
            method: 'POST',
            slugPath: ['globals', 'navigation'],
            query: { locale: 'ar' },
            token: editorToken,
            body: {
              headerCta: {
                label: 'رابط آمن في الإنتاج',
                link: {
                  type: 'external',
                  url: allowedProdUrl,
                },
              },
            },
          })
          expect(okNavRes.status, `Expected ${allowedProdUrl} to be accepted in production`).toBe(
            200,
          )
        }

        const internalNavRes = await callJsonApi({
          method: 'POST',
          slugPath: ['globals', 'navigation'],
          query: { locale: 'ar' },
          token: editorToken,
          body: {
            headerCta: {
              label: 'مشاريعنا',
              link: {
                type: 'internal',
                internalRoute: 'custom',
                internalPath: '/projects',
              },
            },
          },
        })
        expect(internalNavRes.status).toBe(200)
      } finally {
        envRecord.NODE_ENV = originalNodeEnv
      }
    })

    it('enforces Z6 R-11 whitelist at runtime: smuggling user, req, showHiddenFields, overrideAccess, or draft via a non-literal options object into cmsFind, cmsFindByID, cmsFindGlobal, and cmsCount has zero effect', async () => {
      const smuggledUsersOpts: Record<string, unknown> = {
        collection: 'users',
        user: adminUser,
        req: { user: adminUser },
        showHiddenFields: true,
        overrideAccess: true,
        draft: true,
      }
      await expect(cmsFind(smuggledUsersOpts as never)).rejects.toThrow()
      await expect(cmsCount(smuggledUsersOpts as never)).rejects.toThrow()

      const draftOnlyProject = await payload.create({
        collection: 'projects',
        locale: 'ar',
        draft: true,
        overrideAccess: true,
        data: {
          title: 'مشروع مسودة لاختبار R-11',
          slug: 'r11-draft-whitelist-test',
          status: 'in-progress',
          category: 'mep',
          order: 99,
          _status: 'draft',
        },
      })

      try {
        const smuggledProjectFindOpts: Record<string, unknown> = {
          collection: 'projects',
          where: { id: { equals: draftOnlyProject.id } },
          user: adminUser,
          req: { user: adminUser },
          showHiddenFields: true,
          overrideAccess: true,
          draft: true,
        }
        const findRes = await cmsFind<'projects'>(smuggledProjectFindOpts as never)
        expect(findRes.docs).toHaveLength(0)

        const smuggledProjectByIdOpts: Record<string, unknown> = {
          collection: 'projects',
          id: draftOnlyProject.id,
          user: adminUser,
          req: { user: adminUser },
          showHiddenFields: true,
          overrideAccess: true,
          draft: true,
        }
        const byIdRes = await cmsFindByID<'projects'>(smuggledProjectByIdOpts as never)
        expect(byIdRes).toBeNull()

        const smuggledGlobalOpts: Record<string, unknown> = {
          slug: 'privacy-page',
          locale: 'ar',
          user: adminUser,
          req: { user: adminUser },
          showHiddenFields: true,
          overrideAccess: true,
          draft: true,
        }
        const globalRes = await cmsFindGlobal<'privacy-page'>(smuggledGlobalOpts as never)
        expect(globalRes.pageHeader?.title).not.toBe('مسودة سرية Z2-6')
      } finally {
        await payload.delete({
          collection: 'projects',
          id: draftOnlyProject.id,
          overrideAccess: true,
        })
      }
    })
  },
)
