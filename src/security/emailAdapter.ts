import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { EmailAdapter, SendEmailOptions } from 'payload'

const pendingEmailTasks = new Set<Promise<unknown>>()

/**
 * P5-T2 (Q2): the blocking sender for each initialised Payload instance. The adapter Payload uses
 * (auth emails, previews) stays non-blocking; the sales-inbox job needs to know whether the SMTP
 * server accepted the message, so it calls `sendEmailAndWait`, which rejects when sending fails.
 */
const blockingSenders = new WeakMap<object, (message: SendEmailOptions) => Promise<unknown>>()

export async function sendEmailAndWait(payload: object, message: SendEmailOptions): Promise<void> {
  const send = blockingSenders.get(payload)
  if (!send) {
    throw new Error('sendEmailAndWait: the email adapter is not initialised for this instance')
  }
  await send(message)
}

export async function waitForPendingEmails(): Promise<void> {
  while (pendingEmailTasks.size > 0) {
    await Promise.allSettled([...pendingEmailTasks])
  }
}

export function resolveSmtpTransportConfig(rawEnv: NodeJS.ProcessEnv = process.env): {
  host: string
  port: number
} {
  const isProductionRuntime =
    rawEnv.NODE_ENV === 'production' &&
    rawEnv.NEXT_PHASE !== 'phase-production-build' &&
    rawEnv.NEXT_PHASE !== 'phase-export' &&
    rawEnv.NEXT_PHASE !== 'phase-production-compile'

  const rawHost = rawEnv.SMTP_HOST?.trim()
  const rawPort = rawEnv.SMTP_PORT?.trim()

  if (isProductionRuntime) {
    if (!rawHost || rawHost.toUpperCase().includes('CHANGE_ME')) {
      throw new Error(
        'SMTP_HOST must be explicitly set in production (silent fallback to 127.0.0.1 is forbidden).',
      )
    }
    if (!rawPort || !/^\d+$/.test(rawPort)) {
      throw new Error(
        'SMTP_PORT must be explicitly set to a valid port (1-65535) in production (silent fallback to 1025 is forbidden).',
      )
    }
    const parsedPort = Number.parseInt(rawPort, 10)
    if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      throw new Error(
        'SMTP_PORT must be explicitly set to a valid port (1-65535) in production (silent fallback to 1025 is forbidden).',
      )
    }
    return {
      host: rawHost,
      port: parsedPort,
    }
  }

  return {
    host: rawHost || '127.0.0.1',
    port: rawPort ? Number(rawPort) : 1025,
  }
}

/** P5-T2: SMTP login, only when both SMTP_USER and SMTP_PASS are set (src/env.ts enforces the pair). */
export function resolveSmtpAuth(
  rawEnv: NodeJS.ProcessEnv = process.env,
): { user: string; pass: string } | undefined {
  const user = rawEnv.SMTP_USER?.trim()
  const pass = rawEnv.SMTP_PASS
  return user && pass ? { user, pass } : undefined
}

export async function buildNonBlockingEmailAdapter(): Promise<EmailAdapter> {
  const { host, port } = resolveSmtpTransportConfig(process.env)
  const auth = resolveSmtpAuth(process.env)
  const innerAdapterFactory = await nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_ADDRESS ?? 'no-reply@aljazira.co',
    defaultFromName: process.env.SMTP_FROM_NAME ?? 'Al Jazira for Imdad Smart Co.',
    skipVerify: true,
    transportOptions: {
      host,
      port,
      pool: true,
      secure: false,
      ...(auth ? { auth } : {}),
      // P5-T2: a dead SMTP server must fail the job attempt quickly (it is retried with backoff),
      // not hold it for nodemailer's two-minute default.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    },
  })

  return ({ payload }) => {
    const inner = innerAdapterFactory({ payload })
    blockingSenders.set(payload, (message) => inner.sendEmail(message))
    return {
      name: inner.name,
      defaultFromAddress: inner.defaultFromAddress,
      defaultFromName: inner.defaultFromName,
      sendEmail: (message: SendEmailOptions): Promise<unknown> => {
        const task = Promise.resolve()
          .then(() => inner.sendEmail(message))
          .catch((err: unknown) => {
            const errorCode =
              err && typeof err === 'object' && 'code' in err ? String(err.code) : 'UNKNOWN'
            // Log error code without PII (never log recipient email address — D2)
            payload.logger.error({
              code: errorCode,
              msg: 'Background email delivery failed',
            })
          })
          .finally(() => {
            pendingEmailTasks.delete(task)
          })

        pendingEmailTasks.add(task)
        return Promise.resolve({ queued: true })
      },
    }
  }
}
