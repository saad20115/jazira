import configPromise from '@payload-config'
import { REST_DELETE, REST_GET, REST_PATCH, REST_POST } from '@payloadcms/next/routes'
import fs from 'fs/promises'
import path from 'path'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { env } from '../../src/env'
import { waitForPendingEmails } from '../../src/security/emailAdapter'

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
    await waitForPendingEmails()
    // Clean up test media files written during the test run
    for (const fname of createdMediaFilenames) {
      try {
        await fs.unlink(path.join(env.MEDIA_DIR, fname))
      } catch {
        // ignore missing files
      }
    }
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
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

    // 2. Admin-forced session removal via POST /api/users/:id/revoke-sessions (R-3)
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

    // Verify arbitrary sessions array in PATCH is ignored and never stored (R-3)
    const fabricatedPatch = await callJsonApi('PATCH', `/api/users/${String(sessionUser.id)}`, {
      token: adminToken,
      body: {
        sessions: [
          {
            id: 'fabricated-by-admin',
            expiresAt: '2099-01-01T00:00:00.000Z',
          },
        ],
      },
    })
    expect(fabricatedPatch.status).toBe(200)

    const userAfterFabricatedPatch = (await payload.db.findOne({
      collection: 'users',
      where: {
        id: { equals: sessionUser.id },
      },
    })) as { sessions?: Array<{ id: string }> } | null
    const sessionIdsAfterPatch = (userAfterFabricatedPatch?.sessions ?? []).map((s) => s.id)
    expect(sessionIdsAfterPatch).not.toContain('fabricated-by-admin')
    expect(sessionIdsAfterPatch.length).toBe(1)

    // Editor cannot call POST /api/users/:id/revoke-sessions -> 403
    const editorRevokeAttempt = await callJsonApi(
      'POST',
      `/api/users/${String(sessionUser.id)}/revoke-sessions`,
      {
        token: editorToken,
      },
    )
    expect(editorRevokeAttempt.status).toBe(403)

    // Admin calls POST /api/users/:id/revoke-sessions -> 200 and clears sessions
    const adminRevoke = await callJsonApi(
      'POST',
      `/api/users/${String(sessionUser.id)}/revoke-sessions`,
      {
        token: adminToken,
      },
    )
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

  it('refuses deleting or demoting the last admin user, while allowing deleting a second admin (R-2)', async () => {
    // 1. Refuse demoting the last admin via REST API
    const demoteRes = await callJsonApi('PATCH', `/api/users/${String(adminId)}`, {
      token: adminToken,
      body: {
        role: 'editor',
      },
    })
    expect(demoteRes.status).toBe(400)
    expect(JSON.stringify(demoteRes.json)).toContain('Cannot demote the last admin user')

    // 2. Refuse deleting the last admin via REST API
    const deleteRes = await callJsonApi('DELETE', `/api/users/${String(adminId)}`, {
      token: adminToken,
    })
    expect(deleteRes.status).toBe(400)
    expect(JSON.stringify(deleteRes.json)).toContain('Cannot delete the last admin user')

    // Verify the admin still exists with role === 'admin'
    const adminStillExists = await payload.findByID({
      collection: 'users',
      id: adminId,
    })
    expect(adminStillExists.role).toBe('admin')

    // 3. Create a second admin, verify demoting and deleting the second admin succeeds while 1 admin remains
    const secondAdminRes = await callJsonApi('POST', '/api/users', {
      token: adminToken,
      body: {
        name: 'Second Admin',
        email: 'second-admin@aljazira.co',
        password: 'Strong!SecondAdmin#2026',
        role: 'admin',
      },
    })
    expect(secondAdminRes.status).toBe(201)
    const secondAdminId = (secondAdminRes.json.doc as { id: number | string }).id

    const deleteSecondAdminRes = await callJsonApi(
      'DELETE',
      `/api/users/${String(secondAdminId)}`,
      {
        token: adminToken,
      },
    )
    expect(deleteSecondAdminRes.status).toBe(200)
  })

  it('returns identical forgot-password responses for known and unknown emails with <= 1h token expiry, < 100ms median timing difference over 20+20 requests, and delivers email to Mailpit (A5, R-1)', async () => {
    const mailpitBase = `http://${process.env.SMTP_HOST ?? '127.0.0.1'}:${process.env.MAILPIT_UI_PORT ?? '8025'}`
    try {
      await fetch(`${mailpitBase}/api/v1/messages`, { method: 'DELETE' })
    } catch {
      // ignore if Mailpit is unreachable
    }

    const knownTimingsMs: number[] = []
    const unknownTimingsMs: number[] = []

    let lastKnownRes: { status: number; json: Record<string, unknown> } | undefined
    let lastUnknownRes: { status: number; json: Record<string, unknown> } | undefined

    for (let i = 0; i < 20; i++) {
      // Clear resetPasswordRequestedAt before each known-email request so all 20 iterations
      // execute the full DB update + email dispatch path rather than hitting the 15s cooldown early return
      await payload.db.updateOne({
        collection: 'users',
        where: {
          email: { equals: 'editor@aljazira.co' },
        },
        data: {
          resetPasswordRequestedAt: null,
        },
      })

      const t0Known = performance.now()
      const knownRes = await callJsonApi('POST', '/api/users/forgot-password', {
        body: {
          email: 'editor@aljazira.co',
        },
      })
      knownTimingsMs.push(performance.now() - t0Known)
      lastKnownRes = knownRes

      const t0Unknown = performance.now()
      const unknownRes = await callJsonApi('POST', '/api/users/forgot-password', {
        body: {
          email: `unknown-nobody-${String(i)}@aljazira.co`,
        },
      })
      unknownTimingsMs.push(performance.now() - t0Unknown)
      lastUnknownRes = unknownRes
    }

    expect(lastKnownRes?.status).toBe(200)
    expect(lastUnknownRes?.status).toBe(200)
    expect(lastKnownRes?.json).toEqual(lastUnknownRes?.json)

    const computeStats = (samples: number[]) => {
      const sorted = [...samples].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      const median =
        sorted.length % 2 === 0
          ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
          : (sorted[mid] ?? 0)
      const max = sorted[sorted.length - 1] ?? 0
      return {
        median: Number(median.toFixed(2)),
        max: Number(max.toFixed(2)),
      }
    }

    const knownStats = computeStats(knownTimingsMs)
    const unknownStats = computeStats(unknownTimingsMs)
    const medianDiffMs = Number(Math.abs(knownStats.median - unknownStats.median).toFixed(2))

    console.info(
      `[A5/R-1 Timing 20+20] known(median=${String(knownStats.median)}ms, max=${String(knownStats.max)}ms) vs unknown(median=${String(unknownStats.median)}ms, max=${String(unknownStats.max)}ms) | diff=${String(medianDiffMs)}ms`,
    )

    expect(medianDiffMs).toBeLessThan(100)

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

    // Wait for background SMTP tasks and verify Mailpit received the reset email
    await waitForPendingEmails()
    const mailpitRes = await fetch(`${mailpitBase}/api/v1/messages`)
    expect(mailpitRes.status).toBe(200)
    const mailpitData = (await mailpitRes.json()) as {
      total?: number
      messages?: Array<{ To?: Array<{ Address?: string }> }>
    }
    expect(mailpitData.total ?? 0).toBeGreaterThanOrEqual(1)
    const recipients = (mailpitData.messages ?? []).flatMap((m) =>
      (m.To ?? []).map((t) => t.Address),
    )
    expect(recipients).toContain('editor@aljazira.co')
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

    // 5. Verify file is written to env.MEDIA_DIR on disk and served via GET /api/media/file/:filename (R-4)
    const diskStat = await fs.stat(path.join(env.MEDIA_DIR, doc.filename))
    expect(diskStat.size).toBeGreaterThan(0)

    const fileGetReq = new Request(
      `${BASE_URL}/api/media/file/${encodeURIComponent(doc.filename)}`,
      {
        method: 'GET',
      },
    )
    const fileGetRes = await getHandler(
      fileGetReq,
      makeRouteContext(`/api/media/file/${doc.filename}`),
    )
    expect(fileGetRes.status).toBe(200)
    expect(fileGetRes.headers.get('content-type')).toContain('image/webp')
    const servedBytes = await fileGetRes.arrayBuffer()
    expect(servedBytes.byteLength).toBe(diskStat.size)
  })
})
