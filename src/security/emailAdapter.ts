import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { EmailAdapter, SendEmailOptions } from 'payload'

const pendingEmailTasks = new Set<Promise<unknown>>()

export async function waitForPendingEmails(): Promise<void> {
  while (pendingEmailTasks.size > 0) {
    await Promise.allSettled([...pendingEmailTasks])
  }
}

export async function buildNonBlockingEmailAdapter(): Promise<EmailAdapter> {
  const innerAdapterFactory = await nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_ADDRESS ?? 'no-reply@aljazira.co',
    defaultFromName: process.env.SMTP_FROM_NAME ?? 'Al Jazira for Imdad Smart Co.',
    skipVerify: true,
    transportOptions: {
      host: process.env.SMTP_HOST ?? '127.0.0.1',
      port: Number(process.env.SMTP_PORT ?? '1025'),
      pool: true,
      secure: false,
    },
  })

  return ({ payload }) => {
    const inner = innerAdapterFactory({ payload })
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
