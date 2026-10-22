import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  isAdminOrEditorFieldLevel,
  isValidEmailAddress,
  isValidKsaOrInternationalPhone,
  QUOTE_EMAIL_STATUS_VALUES,
  QUOTE_LOCALE_VALUES,
  QUOTE_REQUEST_STATUS_VALUES,
  QuoteRequests,
  readOnlyFieldAccess,
  validateQuoteConsent,
  validateQuoteEmail,
  validateQuotePhone,
  workflowFieldAccess,
} from './QuoteRequests'

describe('QuoteRequests collection configuration & validators (P2-T6)', () => {
  it('configures slug, Sales admin group, defaultColumns, defaultSort -createdAt, and Z1/Z4 collection access', () => {
    expect(QuoteRequests.slug).toBe('quote-requests')
    expect(QuoteRequests.defaultSort).toBe('-createdAt')
    expect(QuoteRequests.timestamps).toBe(true)
    expect(QuoteRequests.admin?.useAsTitle).toBe('name')
    expect(QuoteRequests.admin?.group).toEqual({
      ar: 'المبيعات',
      en: 'Sales',
    })
    expect(QuoteRequests.admin?.defaultColumns).toEqual([
      'name',
      'company',
      'service',
      'status',
      'assignedTo',
      'emailStatus',
      'createdAt',
    ])
    expect(QuoteRequests.admin?.components?.beforeListTable).toEqual([
      '/components/admin/QuoteRequestsFilterBar#QuoteRequestsFilterBar',
    ])

    // Z4: create is unconditionally false
    expect(
      QuoteRequests.access?.create?.({
        req: { user: { id: 1, role: 'admin' } } as never,
      }),
    ).toBe(false)
  })

  it('contains all customer, staff workflow, and system fields and has zero odoo* fields (M-066)', () => {
    const fieldNames = QuoteRequests.fields
      .filter((f): f is Field & { name: string } => 'name' in f && typeof f.name === 'string')
      .map((f) => f.name)

    expect(fieldNames).toEqual([
      'name',
      'company',
      'email',
      'phone',
      'service',
      'message',
      'locale',
      'sourcePage',
      'consent',
      'status',
      'assignedTo',
      'internalNotes',
      'emailStatus',
      'emailAttempts',
      'emailLastError',
      'ipHash',
      'userAgent',
    ])
    expect(fieldNames.some((n) => n.toLowerCase().includes('odoo'))).toBe(false)
    expect(QUOTE_REQUEST_STATUS_VALUES).toEqual(['new', 'contacted', 'quoted', 'closed', 'spam'])
    expect(QUOTE_EMAIL_STATUS_VALUES).toEqual(['pending', 'sent', 'failed'])
    expect(QUOTE_LOCALE_VALUES).toEqual(['ar', 'en'])
  })

  it('enforces field-level readOnlyFieldAccess on customer/system fields and workflowFieldAccess on workflow fields', () => {
    const adminReq = { req: { user: { id: 1, role: 'admin' } } } as never
    const editorReq = { req: { user: { id: 2, role: 'editor' } } } as never
    const anonReq = { req: { user: null } } as never

    expect(readOnlyFieldAccess.create()).toBe(false)
    expect(readOnlyFieldAccess.update()).toBe(false)
    expect(readOnlyFieldAccess.read(adminReq)).toBe(true)
    expect(readOnlyFieldAccess.read(editorReq)).toBe(true)
    expect(readOnlyFieldAccess.read(anonReq)).toBe(false)

    expect(workflowFieldAccess.create()).toBe(false)
    expect(workflowFieldAccess.update(adminReq)).toBe(true)
    expect(workflowFieldAccess.update(editorReq)).toBe(true)
    expect(workflowFieldAccess.update(anonReq)).toBe(false)
    expect(isAdminOrEditorFieldLevel(adminReq)).toBe(true)
    expect(isAdminOrEditorFieldLevel(editorReq)).toBe(true)
    expect(isAdminOrEditorFieldLevel(anonReq)).toBe(false)
  })

  it('validates KSA and international phone numbers, email addresses, and consent === true', () => {
    // Valid KSA & international phones
    expect(isValidKsaOrInternationalPhone('+966 57 353 4185')).toBe(true)
    expect(isValidKsaOrInternationalPhone('+966573534185')).toBe(true)
    expect(isValidKsaOrInternationalPhone('0573534185')).toBe(true)
    expect(isValidKsaOrInternationalPhone('+971 50 123 4567')).toBe(true)
    expect(isValidKsaOrInternationalPhone('+1 (555) 234-5678')).toBe(true)
    expect(validateQuotePhone('+966 57 353 4185')).toBe(true)

    // Invalid phones
    expect(isValidKsaOrInternationalPhone('')).toBe(false)
    expect(isValidKsaOrInternationalPhone('12345')).toBe(false)
    expect(isValidKsaOrInternationalPhone('05123456')).toBe(false) // KSA 05 must be 10 digits
    expect(isValidKsaOrInternationalPhone('+966 57 123')).toBe(false)
    expect(isValidKsaOrInternationalPhone('abc-def-ghij')).toBe(false)
    expect(typeof validateQuotePhone('invalid')).toBe('string')

    // Valid & invalid emails
    expect(isValidEmailAddress('client@aljazira.co')).toBe(true)
    expect(isValidEmailAddress('bad-email')).toBe(false)
    expect(validateQuoteEmail('client@aljazira.co')).toBe(true)
    expect(typeof validateQuoteEmail('not-an-email')).toBe('string')

    // Consent must be strictly true
    expect(validateQuoteConsent(true)).toBe(true)
    expect(typeof validateQuoteConsent(false)).toBe('string')
    expect(typeof validateQuoteConsent(undefined)).toBe('string')
  })
})
