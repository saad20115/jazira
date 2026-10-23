import { spawn, type ChildProcess } from 'child_process'
import crypto from 'crypto'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import payloadConfig from '../src/payload.config'

/**
 * Production login timing & message-oracle verification script (`P2-T9`).
 *
 * Against a running `next start` production server (or spawns one automatically when
 * `--url` is not provided):
 * 1. Seeds temporary staff accounts in PostgreSQL:
 *    - 6 unlocked accounts (`timing-unlocked-1..6@aljazira.co`, max 4 wrong-password tries
 *      each during the 20 measured rounds so none crosses `maxLoginAttempts = 5`), plus
 *      1 warmup unlocked account (`timing-warmup@aljazira.co`).
 *    - 1 locked account (`timing-locked@aljazira.co`), locked via 5 failed login attempts
 *      before measurement starts.
 * 2. Executes 3 interleaved warmup rounds followed by `SAMPLES = 20` interleaved rounds of:
 *    - `unknown_email`: `POST /api/users/login` with a non-existent email
 *    - `existing_wrong_password`: `POST /api/users/login` with an existing unlocked email + wrong password
 *    - `locked_account`: `POST /api/users/login` with the locked email + wrong/correct password
 * 3. Verifies all 60 measured responses return HTTP `401` and byte-identical JSON bodies,
 *    prints all 20 sample timings per category plus min / p25 / median (p50) / p75 / IQR /
 *    mean / max, and asserts that the maximum pairwise median difference is `< 15%` of the
 *    overall median.
 * 4. Cleans up all temporary `timing-*@aljazira.co` rows from PostgreSQL before exiting.
 */

const SAMPLES = 20
const WARMUP_ROUNDS = 3
const THRESHOLD_PERCENT = 15.0

type Category = 'existing_wrong_password' | 'locked_account' | 'unknown_email'

interface TimingSample {
  bodyText: string
  category: Category
  durationMs: number
  round: number
  status: number
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  const weight = idx - lo
  return sorted[lo] * (1 - weight) + sorted[hi] * weight
}

function computeStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0] ?? 0
  const max = sorted[sorted.length - 1] ?? 0
  const p25 = percentile(sorted, 0.25)
  const median = percentile(sorted, 0.5)
  const p75 = percentile(sorted, 0.75)
  const iqr = p75 - p25
  const mean = sorted.reduce((acc, v) => acc + v, 0) / (sorted.length || 1)
  return { iqr, max, mean, median, min, p25, p75 }
}

function generatePayloadSaltAndHash(password: string): Promise<{ hash: string; salt: string }> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString('hex')
    crypto.pbkdf2(password, salt, 600_000, 32, 'sha256', (err, hashBuffer) => {
      if (err) {
        reject(err)
        return
      }
      resolve({
        hash: `pbkdf2-sha256-v1:${hashBuffer.toString('hex')}`,
        salt,
      })
    })
  })
}

async function waitForServerReady(baseUrl: string, timeoutMs = 45_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/api/users/me`, { method: 'GET' })
      if (res.status === 200 || res.status === 401 || res.status === 403) {
        return
      }
    } catch {
      // Server still starting
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`Timed out waiting for next start server at ${baseUrl}`)
}

async function postLogin(
  baseUrl: string,
  email: string,
  password: string,
): Promise<{ bodyText: string; durationMs: number; status: number }> {
  const start = performance.now()
  const res = await fetch(`${baseUrl}/api/users/login`, {
    body: JSON.stringify({ email, password }),
    headers: {
      'Accept-Language': 'ar',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  const bodyText = await res.text()
  const durationMs = performance.now() - start
  return {
    bodyText,
    durationMs,
    status: res.status,
  }
}

async function main() {
  const args = process.argv.slice(2)
  const urlFlagIdx = args.indexOf('--url')
  const providedUrl = urlFlagIdx >= 0 ? args[urlFlagIdx + 1] : undefined
  const port = Number(process.env.TIMING_PORT ?? 3419)
  const baseUrl = providedUrl ?? `http://127.0.0.1:${String(port)}`

  const payload = await getPayload({ config: payloadConfig })
  const drizzleDb = (
    payload.db as unknown as {
      drizzle: { execute: (q: unknown) => Promise<{ rows?: Array<Record<string, unknown>> }> }
    }
  ).drizzle

  let serverProc: ChildProcess | null = null

  const testEmails: string[] = [
    'timing-warmup@aljazira.co',
    'timing-locked@aljazira.co',
    ...Array.from({ length: 6 }, (_, i) => `timing-unlocked-${String(i + 1)}@aljazira.co`),
  ]

  try {
    // Clean any leftover timing probe users
    await drizzleDb.execute(sql`DELETE FROM "users" WHERE "email" LIKE 'timing-%@aljazira.co'`)

    const realPassword = 'Str0ng!Timing#RealPass2026'
    const { hash, salt } = await generatePayloadSaltAndHash(realPassword)
    const nowIso = new Date().toISOString()

    for (const email of testEmails) {
      const displayName = `Timing Probe (${email})`
      await drizzleDb.execute(
        sql`INSERT INTO "users" ("name", "email", "role", "salt", "hash", "login_attempts", "lock_until", "updated_at", "created_at")
            VALUES (${displayName}, ${email}, 'editor', ${salt}, ${hash}, 0, NULL, ${nowIso}, ${nowIso})`,
      )
    }

    if (!providedUrl) {
      serverProc = spawn(
        process.platform === 'win32' ? 'cmd.exe' : 'pnpm',
        process.platform === 'win32'
          ? ['/c', `pnpm exec next start -p ${String(port)}`]
          : ['exec', 'next', 'start', '-p', String(port)],
        {
          env: { ...process.env, NODE_ENV: 'production' },
          stdio: 'ignore',
        },
      )
      await waitForServerReady(baseUrl)
    } else {
      await waitForServerReady(baseUrl)
    }

    // Lock `timing-locked@aljazira.co` via 5 failed login attempts over HTTP
    for (let attempt = 1; attempt <= 5; attempt++) {
      const lockSetupRes = await postLogin(
        baseUrl,
        'timing-locked@aljazira.co',
        `Wrong!LockSetup#${String(attempt)}`,
      )
      if (lockSetupRes.status !== 401) {
        throw new Error(
          `Expected 401 while locking timing-locked@aljazira.co on attempt ${String(attempt)}, got ${String(lockSetupRes.status)}`,
        )
      }
    }

    const lockedUserDoc = await payload.db.findOne<{
      id: number | string
      lockUntil?: null | string
      loginAttempts?: number
    }>({
      collection: 'users',
      where: { email: { equals: 'timing-locked@aljazira.co' } },
    })
    if (
      !lockedUserDoc?.lockUntil ||
      new Date(lockedUserDoc.lockUntil).getTime() <= Date.now() ||
      lockedUserDoc.loginAttempts !== 5
    ) {
      throw new Error(
        `Expected timing-locked@aljazira.co to have active lockUntil and loginAttempts=5 after 5 failed attempts, got ${JSON.stringify(lockedUserDoc)}`,
      )
    }

    // 3 interleaved warmup rounds so JIT + connection pools are warm
    for (let w = 1; w <= WARMUP_ROUNDS; w++) {
      await postLogin(baseUrl, `timing-warmup-unknown-${String(w)}@aljazira.co`, 'Warmup!Wrong#123')
      await postLogin(baseUrl, 'timing-warmup@aljazira.co', `Warmup!Wrong#${String(w)}`)
      await postLogin(baseUrl, 'timing-locked@aljazira.co', `Warmup!Wrong#${String(w)}`)
    }

    const samplesByCategory: Record<Category, TimingSample[]> = {
      existing_wrong_password: [],
      locked_account: [],
      unknown_email: [],
    }

    // 20 interleaved measurement rounds.
    // Rotate through the 6 unlocked accounts (at most 4 tries each -> max 3 or 4 attempts < 5)
    // so every `existing_wrong_password` sample hits an active, unlocked account.
    for (let round = 1; round <= SAMPLES; round++) {
      const unlockedIdx = Math.floor((round - 1) / 4) + 1
      const unlockedEmail = `timing-unlocked-${String(unlockedIdx)}@aljazira.co`
      const unknownEmail = `timing-unknown-round-${String(round)}@aljazira.co`
      const probePassword = `Wrong!TimingProbe#Round${String(round)}_2026`

      const uRes = await postLogin(baseUrl, unknownEmail, probePassword)
      samplesByCategory.unknown_email.push({
        bodyText: uRes.bodyText,
        category: 'unknown_email',
        durationMs: uRes.durationMs,
        round,
        status: uRes.status,
      })

      const eRes = await postLogin(baseUrl, unlockedEmail, probePassword)
      samplesByCategory.existing_wrong_password.push({
        bodyText: eRes.bodyText,
        category: 'existing_wrong_password',
        durationMs: eRes.durationMs,
        round,
        status: eRes.status,
      })

      // Alternate between wrong password and real password on the locked account
      const lockedPassword = round % 2 === 0 ? realPassword : probePassword
      const lRes = await postLogin(baseUrl, 'timing-locked@aljazira.co', lockedPassword)
      samplesByCategory.locked_account.push({
        bodyText: lRes.bodyText,
        category: 'locked_account',
        durationMs: lRes.durationMs,
        round,
        status: lRes.status,
      })
    }

    const allSamples = [
      ...samplesByCategory.unknown_email,
      ...samplesByCategory.existing_wrong_password,
      ...samplesByCategory.locked_account,
    ]
    const referenceBody = allSamples[0]?.bodyText ?? ''

    for (const s of allSamples) {
      if (s.status !== 401) {
        throw new Error(
          `Expected HTTP 401 on ${s.category} round ${String(s.round)}, got ${String(s.status)}`,
        )
      }
      if (s.bodyText !== referenceBody) {
        throw new Error(
          `Body mismatch on ${s.category} round ${String(s.round)}: got ${s.bodyText}, expected ${referenceBody}`,
        )
      }
    }

    const unknownStats = computeStats(samplesByCategory.unknown_email.map((s) => s.durationMs))
    const existingStats = computeStats(
      samplesByCategory.existing_wrong_password.map((s) => s.durationMs),
    )
    const lockedStats = computeStats(samplesByCategory.locked_account.map((s) => s.durationMs))

    const medians = [unknownStats.median, existingStats.median, lockedStats.median]
    const overallMedian = computeStats(allSamples.map((s) => s.durationMs)).median
    const maxMedian = Math.max(...medians)
    const minMedian = Math.min(...medians)
    const maxPairwiseDiffMs = maxMedian - minMedian
    const maxPairwiseDiffPct = (maxPairwiseDiffMs / overallMedian) * 100

    console.log('=== P2-T9 Production Login Timing & Enumeration Verification (next start) ===')
    console.log(`Server URL            : ${baseUrl}`)
    console.log(`Warmup rounds         : ${String(WARMUP_ROUNDS)}`)
    console.log(`Measured samples/case : ${String(SAMPLES)} (interleaved, 60 total requests)`)
    console.log(`HTTP status (all 60)  : 401`)
    console.log(`Identical JSON body   : ${referenceBody}`)
    console.log('')
    console.log(
      '| Round | unknown_email (ms) | existing_wrong_password (ms) | locked_account (ms) |',
    )
    console.log(
      '|-------|--------------------|------------------------------|---------------------|',
    )
    for (let i = 0; i < SAMPLES; i++) {
      const u = samplesByCategory.unknown_email[i].durationMs.toFixed(2).padStart(18)
      const e = samplesByCategory.existing_wrong_password[i].durationMs.toFixed(2).padStart(28)
      const l = samplesByCategory.locked_account[i].durationMs.toFixed(2).padStart(19)
      console.log(`| ${String(i + 1).padStart(5)} | ${u} | ${e} | ${l} |`)
    }
    console.log('')
    console.log(
      '| Category                | Min (ms) | P25 (ms) | Median (ms) | P75 (ms) | IQR (ms) | Mean (ms) | Max (ms) |',
    )
    console.log(
      '|-------------------------|----------|----------|-------------|----------|----------|-----------|----------|',
    )
    for (const [label, st] of [
      ['unknown_email          ', unknownStats],
      ['existing_wrong_password', existingStats],
      ['locked_account         ', lockedStats],
    ] as const) {
      console.log(
        `| ${label} | ${st.min.toFixed(2).padStart(8)} | ${st.p25.toFixed(2).padStart(8)} | ${st.median.toFixed(2).padStart(11)} | ${st.p75.toFixed(2).padStart(8)} | ${st.iqr.toFixed(2).padStart(8)} | ${st.mean.toFixed(2).padStart(9)} | ${st.max.toFixed(2).padStart(8)} |`,
      )
    }
    console.log('')
    console.log(`Overall median (60 samples)       : ${overallMedian.toFixed(2)} ms`)
    console.log(
      `Max pairwise median difference    : ${maxPairwiseDiffMs.toFixed(2)} ms (${maxPairwiseDiffPct.toFixed(2)}%)`,
    )
    console.log(
      `Noise threshold                   : < ${THRESHOLD_PERCENT.toFixed(1)}% of overall median`,
    )
    console.log(
      `Result                            : ${maxPairwiseDiffPct < THRESHOLD_PERCENT ? 'PASS' : 'FAIL'}`,
    )

    if (maxPairwiseDiffPct >= THRESHOLD_PERCENT) {
      throw new Error(
        `Max pairwise median difference ${maxPairwiseDiffPct.toFixed(2)}% exceeded threshold ${THRESHOLD_PERCENT.toFixed(1)}%`,
      )
    }
  } finally {
    await drizzleDb.execute(sql`DELETE FROM "users" WHERE "email" LIKE 'timing-%@aljazira.co'`)
    if (serverProc?.pid) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/T', '/F', '/PID', String(serverProc.pid)], { stdio: 'ignore' })
      } else {
        serverProc.kill('SIGTERM')
      }
    }
    process.exit(0)
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
