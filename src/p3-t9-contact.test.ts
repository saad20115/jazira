import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { QuoteForm, resolvePhoneCandidate } from './components/QuoteForm'
import {
  quoteStep1Schema,
  quoteStep2Schema,
  quoteStep3Schema,
  quoteSubmissionSchema,
} from './lib/quote/schema'

describe('P3-T9 — Shared Quote Form Zod Schema & Stub Server Action', () => {
  it('validates Step 1, Step 2, Step 3, and full QuoteSubmissionPayload via shared zod schemas', () => {
    const step1Ok = quoteStep1Schema.safeParse({
      projectType: 'hotel-tower',
      projectStage: 'design',
      servicesNeeded: ['hvac', 'fire-fighting'],
      projectLocation: 'makkah',
      attachmentFileName: 'boq.pdf',
    })
    expect(step1Ok.success).toBe(true)

    const step1Fail = quoteStep1Schema.safeParse({
      projectType: 'hotel-tower',
      projectStage: 'design',
      servicesNeeded: [],
      projectLocation: 'makkah',
    })
    expect(step1Fail.success).toBe(false)

    const step2Ok = quoteStep2Schema.safeParse({
      name: 'Eng. Tariq Al-Harbi',
      company: 'Al-Kholoud Contracting',
      phone: resolvePhoneCandidate('57 353 4185'),
      email: 'tariq@alkholoud.sa',
      preferredContact: 'whatsapp',
    })
    expect(step2Ok.success).toBe(true)
    if (step2Ok.success) {
      expect(step2Ok.data.phone).toBe('+966573534185')
    }

    const step2Fail = quoteStep2Schema.safeParse({
      name: '',
      company: '',
      phone: '123',
      email: 'not-an-email',
      preferredContact: 'whatsapp',
    })
    expect(step2Fail.success).toBe(false)

    const step3Ok = quoteStep3Schema.safeParse({
      message: '32-floor hotel tower MEP package.',
      consent: true,
    })
    expect(step3Ok.success).toBe(true)

    const step3Fail = quoteStep3Schema.safeParse({
      message: 'Missing consent',
      consent: false,
    })
    expect(step3Fail.success).toBe(false)

    const fullOk = quoteSubmissionSchema.safeParse({
      projectType: 'hotel-tower',
      projectStage: 'design',
      servicesNeeded: ['hvac', 'fire-fighting'],
      projectLocation: 'makkah',
      attachmentFileName: '',
      name: 'Eng. Tariq Al-Harbi',
      company: 'Al-Kholoud Contracting',
      phone: '0573534185',
      email: 'tariq@alkholoud.sa',
      preferredContact: 'whatsapp',
      message: 'Requesting technical and commercial proposal.',
      consent: true,
      locale: 'en',
      sourcePage: '/en/contact',
      honeypot: '',
      startedAtMs: Date.now() - 5000,
    })
    expect(fullOk.success).toBe(true)
  })

  // The stub action's field-error checks moved to
  // src/app/(frontend)/[locale]/contact/quote-handler.test.ts when P5-T1 replaced the stub.
})

describe('P3-T9 — <QuoteForm> 3-step UI, Honeypot, Consent Link, and Message Sent Dialog', () => {
  it('renders Step 1, Step 2, Step 3, and the Message Sent dialog in English and Arabic', () => {
    const step1Html = renderToStaticMarkup(
      React.createElement(QuoteForm, { locale: 'en', initialStep: 1 }),
    )
    expect(step1Html).toContain('STEP 1 OF 3')
    expect(step1Html).toContain('Your project')
    expect(step1Html).toContain('Upload drawings or BOQ')
    expect(step1Html).toContain('Continue to contact details')
    // Honeypot + timestamp (I6)
    expect(step1Html).toContain('name="companyWebsite"')
    expect(step1Html).toContain('tabindex="-1"')
    expect(step1Html).toContain('autoComplete="off"')
    expect(step1Html).toContain('name="startedAtMs"')

    const step2Html = renderToStaticMarkup(
      React.createElement(QuoteForm, { locale: 'en', initialStep: 2 }),
    )
    expect(step2Html).toContain('STEP 2 OF 3')
    expect(step2Html).toContain('Contact details')
    expect(step2Html).toContain('So the right engineer can reach you.')
    expect(step2Html).toContain('Continue to review')

    const step3Html = renderToStaticMarkup(
      React.createElement(QuoteForm, { locale: 'en', initialStep: 3 }),
    )
    expect(step3Html).toContain('STEP 3 OF 3')
    expect(step3Html).toContain('Review &amp; send')
    expect(step3Html).toContain('Hotel / Tower · Design stage')
    expect(step3Html).toContain('HVAC, Fire Fighting')
    expect(step3Html).toContain('An engineer will review your inquiry and get back to you.')
    expect(step3Html).not.toMatch(/within|working day|hours/i)
    expect(step3Html).toContain('href="/en/privacy"')
    expect(step3Html).toContain('Send request')

    const modalHtml = renderToStaticMarkup(
      React.createElement(QuoteForm, {
        locale: 'en',
        initialStep: 3,
        initialSuccessOpen: true,
      }),
    )
    expect(modalHtml).toContain('role="dialog"')
    expect(modalHtml).toContain('aria-modal="true"')
    expect(modalHtml).toContain('Message Sent Successfully')
    expect(modalHtml).toContain('Back to Website')

    const step1ArHtml = renderToStaticMarkup(
      React.createElement(QuoteForm, { locale: 'ar', initialStep: 1 }),
    )
    expect(step1ArHtml).toContain('الخطوة 1 من 3')
    expect(step1ArHtml).toContain('مشروعك')
  })
})
