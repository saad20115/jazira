import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  neverUpdateFieldAccess,
  preserveCreatedAtBeforeChange,
  preserveCreatedAtBeforeValidate,
  stripCreatedAtOnUpdateBeforeOperation,
} from './_shared/immutableTimestamps'
import { Brands } from './Brands'
import { Materials } from './Materials'
import { Media } from './Media'
import { Projects } from './Projects'
import {
  isAdminOrEditorFieldLevel,
  isValidEmailAddress,
  isValidKsaOrInternationalPhone,
  normalizeQuotePhone,
  QUOTE_EMAIL_STATUS_VALUES,
  QUOTE_LOCALE_VALUES,
  QUOTE_REQUEST_STATUS_VALUES,
  quotePhoneSchema,
  QuoteRequests,
  readOnlyFieldAccess,
  validateQuoteConsent,
  validateQuoteEmail,
  validateQuotePhone,
  workflowFieldAccess,
} from './QuoteRequests'
import { Services } from './Services'
import { Stats } from './Stats'
import { Team } from './Team'
import {
  resolveUserDisplayNameAfterRead,
  resolveUserDisplayNameBeforeValidate,
  Users,
} from './Users'
import { Videos } from './Videos'

const ALL_COLLECTIONS = [
  Users,
  Media,
  Videos,
  Brands,
  Stats,
  Materials,
  Services,
  Team,
  Projects,
  QuoteRequests,
] as const

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

  it('contains all customer, staff workflow, and system fields including serviceTitle and createdAt, and has zero odoo* fields (M-066, R-2, R-4)', () => {
    const fieldNames = QuoteRequests.fields
      .filter((f): f is Field & { name: string } => 'name' in f && typeof f.name === 'string')
      .map((f) => f.name)

    expect(fieldNames).toEqual([
      'name',
      'company',
      'email',
      'phone',
      'service',
      'serviceTitle',
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
      'createdAt',
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

  it('validates and normalizes KSA and international phone numbers (including 00966, requiring + for international, rejecting repeated-digit junk), email addresses, and consent === true (R-3)', () => {
    // Normalization of leading 00 to +
    expect(normalizeQuotePhone('00966 57 353 4185')).toBe('+966 57 353 4185')
    expect(normalizeQuotePhone('  00966573534185  ')).toBe('+966573534185')
    expect(normalizeQuotePhone('0573534185')).toBe('0573534185')

    // Valid KSA & international phones
    expect(isValidKsaOrInternationalPhone('+966 57 353 4185')).toBe(true)
    expect(isValidKsaOrInternationalPhone('+966573534185')).toBe(true)
    expect(isValidKsaOrInternationalPhone('00966 57 353 4185')).toBe(true)
    expect(isValidKsaOrInternationalPhone('00966573534185')).toBe(true)
    expect(isValidKsaOrInternationalPhone('0573534185')).toBe(true)
    expect(isValidKsaOrInternationalPhone('0112345678')).toBe(true)
    expect(isValidKsaOrInternationalPhone('+971 50 123 4567')).toBe(true)
    expect(isValidKsaOrInternationalPhone('+1 (555) 234-5678')).toBe(true)
    expect(validateQuotePhone('+966 57 353 4185')).toBe(true)
    expect(quotePhoneSchema.parse('00966 57 353 4185')).toBe('+966 57 353 4185')

    // Invalid phones (R-3 edge cases)
    expect(isValidKsaOrInternationalPhone('')).toBe(false)
    expect(isValidKsaOrInternationalPhone('12345')).toBe(false)
    expect(isValidKsaOrInternationalPhone('05123456')).toBe(false) // KSA 05 must be 10 digits
    expect(isValidKsaOrInternationalPhone('+966 57 123')).toBe(false)
    expect(isValidKsaOrInternationalPhone('00966 57 123')).toBe(false) // 00966 must also pass 9-digit national check
    expect(isValidKsaOrInternationalPhone('009665735341')).toBe(false) // 8 national digits
    expect(isValidKsaOrInternationalPhone('009665735341859')).toBe(false) // 10 national digits
    expect(isValidKsaOrInternationalPhone('966573534185')).toBe(false) // missing + on international number
    expect(isValidKsaOrInternationalPhone('+111111111111111')).toBe(false) // repeated-digit junk
    expect(isValidKsaOrInternationalPhone('abc-def-ghij')).toBe(false)
    expect(typeof validateQuotePhone('invalid')).toBe('string')
    expect(quotePhoneSchema.safeParse('966573534185').success).toBe(false)
    expect(quotePhoneSchema.safeParse('+111111111111111').success).toBe(false)

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

  it('walks all 10 collections and verifies that every collection enforces immutable createdAt via shared field access and hooks (R-2)', () => {
    expect(ALL_COLLECTIONS).toHaveLength(10)
    expect(neverUpdateFieldAccess({ req: { user: { id: 1, role: 'admin' } } } as never)).toBe(false)

    for (const col of ALL_COLLECTIONS) {
      const createdAtField = col.fields.find(
        (f): f is Field & { name: string; type: string } =>
          'name' in f && f.name === 'createdAt' && 'type' in f,
      )
      expect(createdAtField, `collection ${col.slug} must define createdAt`).toBeDefined()
      expect(createdAtField?.type).toBe('date')
      const updateAccess = (
        createdAtField as { access?: { update?: (...args: never[]) => boolean } } | undefined
      )?.access?.update
      expect(typeof updateAccess, `collection ${col.slug} createdAt.access.update`).toBe('function')
      expect(updateAccess?.()).toBe(false)

      expect(col.hooks?.beforeOperation).toContain(stripCreatedAtOnUpdateBeforeOperation)
      expect(col.hooks?.beforeValidate).toContain(preserveCreatedAtBeforeValidate)
      expect(col.hooks?.beforeChange).toContain(preserveCreatedAtBeforeChange)
    }
  })

  it('configures Users.admin.useAsTitle = name with email fallback so assignees never render as Untitled (R-5)', () => {
    expect(Users.admin?.useAsTitle).toBe('name')
    expect(Users.forceSelect).toEqual({
      name: true,
      email: true,
    })

    expect(
      resolveUserDisplayNameBeforeValidate({
        value: '  م. أحمد الحربي  ',
        data: { email: 'admin@aljazira.co' },
        siblingData: {},
      } as never),
    ).toBe('م. أحمد الحربي')

    expect(
      resolveUserDisplayNameBeforeValidate({
        value: '   ',
        data: { email: 'Editor@AlJazira.co ' },
        siblingData: {},
      } as never),
    ).toBe('editor@aljazira.co')

    expect(
      resolveUserDisplayNameAfterRead({
        value: null,
        data: { email: 'staff@aljazira.co' },
        siblingData: {},
      } as never),
    ).toBe('staff@aljazira.co')
  })
})
