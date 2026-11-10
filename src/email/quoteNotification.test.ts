import { describe, expect, it } from 'vitest'

import { buildQuoteNotificationEmail, escapeHtml } from './quoteNotification'

const BASE = {
  id: 42,
  name: 'Test Visitor',
  company: 'Test Company',
  email: 'visitor@example.test',
  phone: '+966573534185',
  preferredContact: 'whatsapp',
  projectType: 'hotel-tower',
  projectStage: 'design',
  projectLocation: 'makkah',
  servicesNeeded: ['hvac', 'electrical'],
  message: 'Please send a proposal.',
  locale: 'en',
}

describe('P5-T1 §4 — sales-inbox notification template (ar + en)', () => {
  it('has an Arabic and an English block, the needed fields and a link to the request in /admin', () => {
    const email = buildQuoteNotificationEmail(BASE, 'http://localhost:3000/')
    expect(email.html).toContain('lang="ar" dir="rtl"')
    expect(email.html).toContain('lang="en" dir="ltr"')
    expect(email.html).toContain('http://localhost:3000/admin/collections/quote-requests/42')
    expect(email.text).toContain('http://localhost:3000/admin/collections/quote-requests/42')
    for (const value of [
      'Test Visitor',
      'Test Company',
      'visitor@example.test',
      '+966 57 353 4185',
      'HVAC, Electrical',
      'Hotel / Tower',
    ]) {
      expect(email.text).toContain(value)
    }
    expect(email.subject).toContain('#42')
    expect(email.subject).toContain('طلب عرض سعر جديد')
    expect(email.subject).toContain('New quote request')
  })

  it('keeps phone and email left to right inside the Arabic block, and the text part clean', () => {
    const email = buildQuoteNotificationEmail(BASE, 'http://localhost:3000')
    expect(email.html).toContain('<bdi dir="ltr">+966 57 353 4185</bdi>')
    expect(email.html).toContain('<bdi dir="ltr">visitor@example.test</bdi>')
    expect(email.text).not.toContain('‎')
  })

  it('escapes visitor text in HTML and keeps the subject on one line', () => {
    const email = buildQuoteNotificationEmail(
      {
        ...BASE,
        name: 'Eve\r\nBcc: victim@example.test <script>alert(1)</script>',
        message: '<img src=x onerror=alert(1)> & "quotes"',
      },
      'https://example.test',
    )
    expect(email.html).not.toContain('<script>')
    expect(email.html).not.toContain('<img src=x')
    expect(email.html).toContain('&lt;script&gt;')
    expect(email.html).toContain('&amp; &quot;quotes&quot;')
    expect(email.subject).not.toMatch(/[\r\n]/)
  })

  it('leaves empty answers out and never includes system fields', () => {
    const email = buildQuoteNotificationEmail(
      {
        id: 7,
        name: 'A',
        email: 'a@example.test',
        phone: '+966573534185',
        company: '',
        message: null,
      },
      'https://example.test',
    )
    expect(email.text).not.toMatch(/ipHash|userAgent|emailStatus/i)
    expect(email.text).not.toContain('Company:')
  })

  it('escapeHtml covers the five HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    )
  })
})
