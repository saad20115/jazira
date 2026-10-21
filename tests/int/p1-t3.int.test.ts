import configPromise from '@payload-config'
import { REST_DELETE, REST_GET, REST_PATCH, REST_POST } from '@payloadcms/next/routes'
import fs from 'fs/promises'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const BASE_URL = 'http://localhost:3000'

const getHandler = REST_GET(configPromise)
const postHandler = REST_POST(configPromise)
const patchHandler = REST_PATCH(configPromise)
const deleteHandler = REST_DELETE(configPromise)

interface RouteContext {
  params: Promise<{ slug: string[] }>
}

function makeRouteContext(apiPath: string): RouteContext {
  const clean = apiPath.replace(/^\/api\//, '').split('?')[0] ?? ''
  const slug = clean.split('/').filter(Boolean)
  return {
    params: Promise.resolve({ slug }),
  }
}

async function callJsonApi(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  apiPath: string,
  options: {
    body?: Record<string, unknown>
    token?: string
  } = {},
): Promise<{ status: number; json: Record<string, unknown>; headers: Headers }> {
  const headers = new Headers()
  if (options.body !== undefined) {
    headers.set('content-type', 'application/json')
  }
  if (options.token) {
    headers.set('authorization', `JWT ${options.token}`)
  }

  const req = new Request(`${BASE_URL}${apiPath}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  const ctx = makeRouteContext(apiPath)

  const handler =
    method === 'GET'
      ? getHandler
      : method === 'POST'
        ? postHandler
        : method === 'PATCH'
          ? patchHandler
          : deleteHandler

  const res = await handler(req, ctx)
  const text = await res.text()
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(text) as Record<string, unknown>
  } catch {
    parsed = { raw: text }
  }

  return {
    status: res.status,
    json: parsed,
    headers: res.headers,
  }
}

async function callMultipartUploadApi(
  apiPath: string,
  options: {
    fileBuffer: Buffer
    filename: string
    mimeType: string
    payloadData: Record<string, unknown>
    token?: string
  },
): Promise<{ status: number; json: Record<string, unknown> }> {
  const form = new FormData()
  form.set('_payload', JSON.stringify(options.payloadData))
  const uint8 = new Uint8Array(options.fileBuffer)
  const blob = new Blob([uint8], { type: options.mimeType })
  form.set('file', blob, options.filename)

  const headers = new Headers()
  if (options.token) {
    headers.set('authorization', `JWT ${options.token}`)
  }

  const req = new Request(`${BASE_URL}${apiPath}`, {
    method: 'POST',
    headers,
    body: form,
  })
  const res = await postHandler(req, makeRouteContext(apiPath))
  const json = (await res.json()) as Record<string, unknown>
  return {
    status: res.status,
    json,
  }
}

describe('P1-T3 integration suite (Postgres test DB via migrations)', () => {
  let payload: Payload
  let adminToken = ''
  let adminId: number | string = ''
  let editorToken = ''
  let editorId: number | string = ''
  const createdMediaFilenames: string[] = []

  beforeAll(async () => {
    payload = await getPayload({ config: configPromise })
    // Build schema strictly from committed migrations on aljazira_test (never push)
    await payload.db.migrateFresh({ forceAcceptWarning: true })
  })

  afterAll(async () => {
    // Clean up test media files written during the test run
    const mediaDir = path.resolve(import.meta.dirname, '../../media')
    for (const fname of createdMediaFilenames) {
      try {
        await fs.unlink(path.join(mediaDir, fname))
      } catch {
        // ignore missing files
      }
    }
  })

  it('registers the first user as admin via /api/users/first-register and blocks any second first-register attempt (A6)', async () => {
    const firstRes = await callJsonApi('POST', '/api/users/first-register', {
      body: {
        name: 'First Admin',
        email: 'admin@aljazira.co',
        password: 'Strong!AdminPass#2026',
      },
    })

    expect(firstRes.status).toBe(200)
    const user = firstRes.json.user as {
      id: number | string
      role: string
      email: string
    }
    expect(user.email).toBe('admin@aljazira.co')
    expect(user.role).toBe('admin')
    expect(typeof firstRes.json.token).toBe('string')

    adminToken = firstRes.json.token as string
    adminId = user.id

    // A second call to /api/users/first-register must be forbidden once a user exists
    const secondRes = await callJsonApi('POST', '/api/users/first-register', {
      body: {
        name: 'Attacker',
        email: 'attacker@aljazira.co',
        password: 'Strong!AttackerPass#2026',
      },
    })
    expect(secondRes.status).toBe(403)
  })

  it('allows admin to create an editor user (defaulting to editor) and prevents editor from escalating role via REST or Local API (Z1, Z3)', async () => {
    const createRes = await callJsonApi('POST', '/api/users', {
      token: adminToken,
      body: {
        name: 'Content Editor',
        email: 'editor@aljazira.co',
        password: 'Strong!EditorPass#2026',
      },
    })

    expect(createRes.status).toBe(201)
    const doc = createRes.json.doc as { id: number | string; role: string }
    expect(doc.role).toBe('editor')
    editorId = doc.id

    const loginRes = await callJsonApi('POST', '/api/users/login', {
      body: {
        email: 'editor@aljazira.co',
        password: 'Strong!EditorPass#2026',
      },
    })
    expect(loginRes.status).toBe(200)
    editorToken = loginRes.json.token as string

    // Editor attempts PATCH /api/users/:id { role: 'admin' } on self via REST
    const escalateRest = await callJsonApi('PATCH', `/api/users/${String(editorId)}`, {
      token: editorToken,
      body: {
        name: 'Editor Renamed',
        role: 'admin',
      },
    })
    expect(escalateRest.status).toBe(200)
    const updatedRestDoc = escalateRest.json.doc as {
      name: string
      role: string
    }
    expect(updatedRestDoc.name).toBe('Editor Renamed')
    expect(updatedRestDoc.role).toBe('editor')

    // Editor attempts to escalate role via Local API with overrideAccess: false
    const editorUserDoc = await payload.findByID({
      collection: 'users',
      id: editorId,
    })
    const updatedLocalDoc = await payload.update({
      collection: 'users',
      id: editorId,
      data: {
        role: 'admin',
      },
      user: editorUserDoc,
      overrideAccess: false,
    })
    expect(updatedLocalDoc.role).toBe('editor')
  })

  it('blocks editor from creating/deleting users and blocks anonymous from listing/creating users (Z1, A6)', async () => {
    // Editor cannot create users via REST
    const editorCreateRest = await callJsonApi('POST', '/api/users', {
      token: editorToken,
      body: {
        name: 'Unauthorized User',
        email: 'unauth@aljazira.co',
        password: 'Strong!UnauthPass#2026',
      },
    })
    expect(editorCreateRest.status).toBe(403)

    // Editor cannot create users via Local API with overrideAccess: false
    const editorUserDoc = await payload.findByID({
      collection: 'users',
      id: editorId,
    })
    await expect(
      payload.create({
        collection: 'users',
        data: {
          name: 'Unauthorized Local',
          email: 'unauth-local@aljazira.co',
          password: 'Strong!UnauthPass#2026',
          role: 'editor',
        },
        user: editorUserDoc,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    // Editor cannot delete admin
    const editorDeleteRest = await callJsonApi('DELETE', `/api/users/${String(adminId)}`, {
      token: editorToken,
    })
    expect(editorDeleteRest.status).toBe(403)

    // Editor listing users only sees self
    const editorListRest = await callJsonApi('GET', '/api/users', {
      token: editorToken,
    })
    expect(editorListRest.status).toBe(200)
    const docs = editorListRest.json.docs as Array<{ id: number | string }>
    expect(docs).toHaveLength(1)
    expect(docs[0]?.id).toBe(editorId)

    // Anonymous cannot list or create users
    const anonListRest = await callJsonApi('GET', '/api/users')
    expect(anonListRest.status).toBe(403)

    const anonCreateRest = await callJsonApi('POST', '/api/users', {
      body: {
        name: 'Anon',
        email: 'anon@aljazira.co',
        password: 'Strong!AnonPass#2026',
      },
    })
    expect(anonCreateRest.status).toBe(403)
  })

  it('enforces the password policy (min 12 chars + common password blocklist) on create, update, and reset-password (A4)', async () => {
    // 1. Create with short password -> rejected
    const shortCreate = await callJsonApi('POST', '/api/users', {
      token: adminToken,
      body: {
        name: 'Short Pass User',
        email: 'short@aljazira.co',
        password: 'short',
      },
    })
    expect(shortCreate.status).toBe(400)

    // 2. Create with common 12-char password -> rejected
    const commonCreate = await callJsonApi('POST', '/api/users', {
      token: adminToken,
      body: {
        name: 'Common Pass User',
        email: 'common@aljazira.co',
        password: 'password1234',
      },
    })
    expect(commonCreate.status).toBe(400)

    // 3. Update with short and common password -> rejected
    const shortUpdate = await callJsonApi('PATCH', `/api/users/${String(editorId)}`, {
      token: editorToken,
      body: {
        password: 'short',
      },
    })
    expect(shortUpdate.status).toBe(400)

    const commonUpdate = await callJsonApi('PATCH', `/api/users/${String(editorId)}`, {
      token: editorToken,
      body: {
        password: 'password1234',
      },
    })
    expect(commonUpdate.status).toBe(400)

    // 4. Reset-password with short, common, and strong passwords
    const resetTarget = await payload.create({
      collection: 'users',
      data: {
        name: 'Reset Target',
        email: 'reset-target@aljazira.co',
        password: 'Strong!InitialPass#2026',
        role: 'editor',
      },
    })

    const resetToken = await payload.forgotPassword({
      collection: 'users',
      data: {
        email: 'reset-target@aljazira.co',
      },
      disableEmail: true,
    })
    expect(typeof resetToken).toBe('string')

    const shortReset = await callJsonApi('POST', '/api/users/reset-password', {
      body: {
        token: resetToken,
        password: 'short',
      },
    })
    expect(shortReset.status).toBe(400)

    const commonReset = await callJsonApi('POST', '/api/users/reset-password', {
      body: {
        token: resetToken,
        password: 'password1234',
      },
    })
    expect(commonReset.status).toBe(400)

    const strongReset = await callJsonApi('POST', '/api/users/reset-password', {
      body: {
        token: resetToken,
        password: 'Strong!UpdatedPass#2026',
      },
    })
    expect(strongReset.status).toBe(200)
    expect(typeof strongReset.json.token).toBe('string')
    expect((strongReset.json.user as { id: number | string }).id).toBe(resetTarget.id)
  })

  it('locks the account after 5 failed login attempts for 15 minutes and refuses the correct password while locked (A1)', async () => {
    await payload.create({
      collection: 'users',
      data: {
        name: 'Lockout User',
        email: 'lockout@aljazira.co',
        password: 'Strong!LockoutPass#2026',
        role: 'editor',
      },
    })

    for (let attempt = 1; attempt <= 5; attempt++) {
      const wrongRes = await callJsonApi('POST', '/api/users/login', {
        body: {
          email: 'lockout@aljazira.co',
          password: `Wrong!PassAttempt#${String(attempt)}`,
        },
      })
      expect(wrongRes.status).toBe(401)
    }

    // 6th wrong password triggers lockout
    const sixthWrong = await callJsonApi('POST', '/api/users/login', {
      body: {
        email: 'lockout@aljazira.co',
        password: 'Wrong!PassAttempt#6',
      },
    })
    expect(sixthWrong.status).toBe(401)

    // Correct password is now refused while the account is locked
    const correctWhileLocked = await callJsonApi('POST', '/api/users/login', {
      body: {
        email: 'lockout@aljazira.co',
        password: 'Strong!LockoutPass#2026',
      },
    })
    expect(correctWhileLocked.status).toBe(401)

    const lockedDoc = await payload.db.findOne({
      collection: 'users',
      where: {
        email: { equals: 'lockout@aljazira.co' },
      },
    })
    const lockUntilStr = (lockedDoc as { lockUntil?: string } | null)?.lockUntil
    expect(typeof lockUntilStr).toBe('string')
    const lockRemainingMs = new Date(lockUntilStr ?? '').getTime() - Date.now()
    // Should be close to 15 minutes (between 14 and 15.1 minutes)
    expect(lockRemainingMs).toBeGreaterThan(14 * 60 * 1000)
    expect(lockRemainingMs).toBeLessThanOrEqual(15 * 60 * 1000 + 5000)
  })

  it('revokes JWT access immediately on user logout and on admin-forced session removal (A2)', async () => {
    const sessionUser = await payload.create({
      collection: 'users',
      data: {
        name: 'Session User',
        email: 'session@aljazira.co',
        password: 'Strong!SessionPass#2026',
        role: 'editor',
      },
    })

    // 1. Normal login -> token works -> logout -> old token rejected
    const login1 = await callJsonApi('POST', '/api/users/login', {
      body: {
        email: 'session@aljazira.co',
        password: 'Strong!SessionPass#2026',
      },
    })
    expect(login1.status).toBe(200)
    const token1 = login1.json.token as string

    // Verify Set-Cookie header has HttpOnly and SameSite=Strict (A3)
    const setCookieHeader = login1.headers.get('set-cookie') ?? ''
    expect(setCookieHeader).toContain('HttpOnly')
    expect(setCookieHeader).toContain('SameSite=Strict')

    const beforeLogout = await callJsonApi('GET', '/api/users', {
      token: token1,
    })
    expect(beforeLogout.status).toBe(200)

    const logoutRes = await callJsonApi('POST', '/api/users/logout', {
      token: token1,
    })
    expect(logoutRes.status).toBe(200)

    // Old token after logout is rejected on protected endpoint (403), refresh-token (403), and /api/users/me returns user: null
    const afterLogoutProtected = await callJsonApi('GET', '/api/users', {
      token: token1,
    })
    expect(afterLogoutProtected.status).toBe(403)

    const afterLogoutRefresh = await callJsonApi('POST', '/api/users/refresh-token', {
      token: token1,
    })
    expect(afterLogoutRefresh.status).toBe(403)

    const afterLogoutMe = await callJsonApi('GET', '/api/users/me', {
      token: token1,
    })
    expect(afterLogoutMe.json.user).toBeNull()

    // 2. Admin-forced session removal -> old token rejected
    const login2 = await callJsonApi('POST', '/api/users/login', {
      body: {
        email: 'session@aljazira.co',
        password: 'Strong!SessionPass#2026',
      },
    })
    expect(login2.status).toBe(200)
    const token2 = login2.json.token as string

    const beforeRevoke = await callJsonApi('GET', '/api/users', {
      token: token2,
    })
    expect(beforeRevoke.status).toBe(200)

    // Admin clears user's server-side sessions array
    const adminRevoke = await callJsonApi('PATCH', `/api/users/${String(sessionUser.id)}`, {
      token: adminToken,
      body: {
        sessions: [],
      },
    })
    expect(adminRevoke.status).toBe(200)

    const afterAdminRevokeProtected = await callJsonApi('GET', '/api/users', {
      token: token2,
    })
    expect(afterAdminRevokeProtected.status).toBe(403)

    const afterAdminRevokeRefresh = await callJsonApi('POST', '/api/users/refresh-token', {
      token: token2,
    })
    expect(afterAdminRevokeRefresh.status).toBe(403)

    const afterAdminRevokeMe = await callJsonApi('GET', '/api/users/me', {
      token: token2,
    })
    expect(afterAdminRevokeMe.json.user).toBeNull()
  })

  it('returns identical forgot-password responses for known and unknown emails with <= 1h token expiry (A5)', async () => {
    const knownRes = await callJsonApi('POST', '/api/users/forgot-password', {
      body: {
        email: 'editor@aljazira.co',
      },
    })

    const unknownRes = await callJsonApi('POST', '/api/users/forgot-password', {
      body: {
        email: 'unknown-nobody@aljazira.co',
      },
    })

    expect(knownRes.status).toBe(200)
    expect(unknownRes.status).toBe(200)
    expect(knownRes.json).toEqual(unknownRes.json)

    const updatedEditor = await payload.db.findOne({
      collection: 'users',
      where: {
        email: { equals: 'editor@aljazira.co' },
      },
    })
    const expiryIso = (updatedEditor as { resetPasswordExpiration?: string } | null)
      ?.resetPasswordExpiration
    expect(typeof expiryIso).toBe('string')
    const ttlMs = new Date(expiryIso ?? '').getTime() - Date.now()
    expect(ttlMs).toBeGreaterThan(55 * 60 * 1000)
    expect(ttlMs).toBeLessThanOrEqual(60 * 60 * 1000 + 5000)
  })

  it('rejects anonymous uploads, rejects .svg and disguised HTML renamed .jpg by magic bytes, and accepts a real JPEG generating all 4 webp sizes (I5, Z1)', async () => {
    const validJpegBuffer = await sharp({
      create: {
        width: 2000,
        height: 1200,
        channels: 3,
        background: { r: 18, g: 64, b: 112 },
      },
    })
      .jpeg({ quality: 85 })
      .toBuffer()

    // 1. Anonymous upload -> 403
    const anonUpload = await callMultipartUploadApi('/api/media', {
      fileBuffer: validJpegBuffer,
      filename: 'anon.jpg',
      mimeType: 'image/jpeg',
      payloadData: {
        alt: 'محاولة غير مصرح بها',
      },
    })
    expect(anonUpload.status).toBe(403)

    // 2. Upload .svg -> rejected (400)
    const svgBuffer = Buffer.from(
      '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>',
      'utf8',
    )
    const svgUpload = await callMultipartUploadApi('/api/media', {
      token: editorToken,
      fileBuffer: svgBuffer,
      filename: 'vector.svg',
      mimeType: 'image/svg+xml',
      payloadData: {
        alt: 'ملف SVG مرفوض',
      },
    })
    expect(svgUpload.status).toBe(400)

    // 3. Disguised HTML renamed .jpg with image/jpeg client MIME -> rejected (400) by magic-byte check
    const htmlAsJpgBuffer = Buffer.from(
      '<!DOCTYPE html><html><body><script>alert("xss")</script></body></html>',
      'utf8',
    )
    const disguisedUpload = await callMultipartUploadApi('/api/media', {
      token: editorToken,
      fileBuffer: htmlAsJpgBuffer,
      filename: 'disguised-html.jpg',
      mimeType: 'image/jpeg',
      payloadData: {
        alt: 'ملف HTML متنكر',
      },
    })
    expect(disguisedUpload.status).toBe(400)

    // 4. Real 2000x1200 JPEG with unsafe filename -> accepted, sanitized filename, and all 4 sizes generated as webp
    const validUpload = await callMultipartUploadApi('/api/media', {
      token: editorToken,
      fileBuffer: validJpegBuffer,
      filename: '../../.hidden..project!photo.jpg',
      mimeType: 'image/jpeg',
      payloadData: {
        alt: 'صورة مشروع كهروميكانيك',
        caption: 'اختبار توليد الأحجام بصيغة WebP',
      },
    })
    expect(validUpload.status).toBe(201)

    const doc = validUpload.json.doc as {
      filename: string
      mimeType: string
      sizes: Record<
        string,
        {
          filename: string | null
          mimeType: string | null
          width: number | null
          height: number | null
        }
      >
    }

    expect(doc.filename).not.toContain('..')
    expect(doc.filename).not.toContain('/')
    expect(doc.filename.startsWith('.')).toBe(false)
    expect(doc.mimeType).toBe('image/webp')

    createdMediaFilenames.push(doc.filename)
    for (const sizeKey of ['thumb', 'card', 'hero', 'og'] as const) {
      const sizeObj = doc.sizes[sizeKey]
      expect(sizeObj).toBeDefined()
      expect(sizeObj.mimeType).toBe('image/webp')
      expect(sizeObj.filename?.endsWith('.webp')).toBe(true)
      if (sizeObj.filename) {
        createdMediaFilenames.push(sizeObj.filename)
      }
    }

    expect(doc.sizes.thumb.width).toBe(400)
    expect(doc.sizes.card.width).toBe(800)
    expect(doc.sizes.hero.width).toBe(1920)
    expect(doc.sizes.og.width).toBe(1200)
    expect(doc.sizes.og.height).toBe(630)
  })
})
