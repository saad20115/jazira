import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { buildQuoteNotificationEmail } from '../src/email/quoteNotification'
import { waitForPendingEmails } from '../src/security/emailAdapter'

/**
 * P5-T1 §4 evidence tool: sends ONE sample of the quote notification template (made-up sample
 * data, never a real request) to `SALES_INBOX` through the configured SMTP, so the template can be
 * checked in the local Mailpit UI. Refuses anything but a loopback SMTP host, so it can never mail
 * a real inbox. Real sending is P5-T2's job, not this script's.
 *
 * Usage: pnpm payload run scripts/quote-email-preview.ts
 */
async function main(): Promise<void> {
  const smtpHost = (process.env.SMTP_HOST ?? '127.0.0.1').trim()
  if (!['127.0.0.1', 'localhost', '::1'].includes(smtpHost)) {
    throw new Error('quote-email-preview: only a local SMTP catcher (loopback host) is allowed')
  }
  const to = process.env.SALES_INBOX?.trim()
  if (!to) throw new Error('quote-email-preview: set SALES_INBOX (a local test address)')

  const email = buildQuoteNotificationEmail(
    {
      id: 1001,
      name: 'Sample Visitor (preview)',
      company: 'Sample Company',
      email: 'sample-visitor@example.test',
      phone: '+966573534185',
      preferredContact: 'whatsapp',
      projectType: 'hotel-tower',
      projectStage: 'tender',
      projectLocation: 'makkah',
      servicesNeeded: ['hvac', 'fire-fighting', 'electrical'],
      message: 'Sample message for the template preview.\nSecond line.',
      locale: 'ar',
    },
    process.env.SERVER_URL ?? 'http://localhost:3000',
  )

  const payload = await getPayload({ config: configPromise })
  try {
    await payload.sendEmail({ to, subject: email.subject, html: email.html, text: email.text })
    await waitForPendingEmails()
    process.stdout.write('quote-email-preview: sample sent to the local catcher\n')
  } finally {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  }
}

await main()
