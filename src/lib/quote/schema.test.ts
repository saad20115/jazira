import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  formatPhoneForDisplay,
  isValidKsaOrInternationalPhone,
  normalizeQuotePhone,
  quotePhoneSchema,
} from './schema'

describe('src/lib/quote/schema.ts pure phone validator & E.164 normalizer (R-6, R-12)', () => {
  it('is a pure module that imports only zod (never payload, env, or ipHash) so it is safe in client bundles (R-6)', () => {
    const schemaSource = fs.readFileSync(path.resolve(__dirname, 'schema.ts'), 'utf8')
    const importLines = schemaSource.split(/\r?\n/).filter((line) => /^\s*import\b/.test(line))

    expect(importLines).toEqual(["import { z } from 'zod'"])
    expect(importLines.join('\n')).not.toContain('payload')
    expect(importLines.join('\n')).not.toContain('ipHash')
    expect(importLines.join('\n')).not.toContain('env')
  })

  it('normalizes KSA local (05/01) and international (00/+) phone inputs to canonical E.164, including +966 05... and 00 966 ... (R-12, R-16)', () => {
    expect(normalizeQuotePhone('0573534185')).toBe('+966573534185')
    expect(normalizeQuotePhone('057 353 4185')).toBe('+966573534185')
    expect(normalizeQuotePhone('00966 57 353 4185')).toBe('+966573534185')
    expect(normalizeQuotePhone('00 966 57 353 4185')).toBe('+966573534185')
    expect(normalizeQuotePhone('+966 57 353 4185')).toBe('+966573534185')
    expect(normalizeQuotePhone('+966 0573534185')).toBe('+966573534185')
    expect(normalizeQuotePhone('00 966 0573534185')).toBe('+966573534185')
    expect(normalizeQuotePhone('  +966 (57) 353-4185  ')).toBe('+966573534185')
    expect(normalizeQuotePhone('011 234 5678')).toBe('+966112345678')
    expect(normalizeQuotePhone('+966 0112345678')).toBe('+966112345678')
    expect(normalizeQuotePhone('+971 50 123 4567')).toBe('+971501234567')
    expect(normalizeQuotePhone('00971-50-123-4567')).toBe('+971501234567')
  })

  it('formats stored E.164 phone numbers for UI display via formatPhoneForDisplay (R-12)', () => {
    expect(formatPhoneForDisplay('+966573534185')).toBe('+966 57 353 4185')
    expect(formatPhoneForDisplay('0573534185')).toBe('+966 57 353 4185')
    expect(formatPhoneForDisplay('+966112345678')).toBe('+966 11 234 5678')
    expect(formatPhoneForDisplay('+971501234567')).toBe('+971501234567')
  })

  it('validates and transforms phones to E.164 via quotePhoneSchema while rejecting invalid inputs (R-3, R-6, R-12, R-16)', () => {
    expect(quotePhoneSchema.parse('0573534185')).toBe('+966573534185')
    expect(quotePhoneSchema.parse('057 353 4185')).toBe('+966573534185')
    expect(quotePhoneSchema.parse('00966 57 353 4185')).toBe('+966573534185')
    expect(quotePhoneSchema.parse('00 966 57 353 4185')).toBe('+966573534185')
    expect(quotePhoneSchema.parse('+966 57 353 4185')).toBe('+966573534185')
    expect(quotePhoneSchema.parse('+966 0573534185')).toBe('+966573534185')
    expect(quotePhoneSchema.parse('+971 50 123 4567')).toBe('+971501234567')

    expect(isValidKsaOrInternationalPhone('966573534185')).toBe(false)
    expect(isValidKsaOrInternationalPhone('009665735341')).toBe(false)
    expect(isValidKsaOrInternationalPhone('009665735341859')).toBe(false)
    expect(isValidKsaOrInternationalPhone('+111111111111111')).toBe(false)
    expect(quotePhoneSchema.safeParse('966573534185').success).toBe(false)
    expect(quotePhoneSchema.safeParse('009665735341').success).toBe(false)
    expect(quotePhoneSchema.safeParse('+111111111111111').success).toBe(false)
  })
})
