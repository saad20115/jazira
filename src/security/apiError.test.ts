import { formatErrors } from 'payload'
import { describe, expect, it } from 'vitest'

import { createPublicAPIError, ensurePublicErrorMessageAfterError } from './apiError'

describe('createPublicAPIError & ensurePublicErrorMessageAfterError (P2-T4 R-13)', () => {
  it('sets err.name to APIError so formatErrors preserves the message even when constructor.name is minified', () => {
    const msg = 'لا يمكن حذف هذه العلامة التجارية / Cannot delete this brand'
    const err = createPublicAPIError(msg, 400)
    expect(err.name).toBe('APIError')
    expect(err.status).toBe(400)
    expect(err.isPublic).toBe(true)

    const formatted = formatErrors(err)
    expect(formatted).toEqual({
      errors: [{ message: msg }],
    })
  })

  it('replaces "An unknown error occurred." for public errors in afterError while keeping 500 internal errors masked', () => {
    const minifiedPublicErr = Object.assign(new Error('Custom public guard message'), {
      name: '',
      status: 400,
      isPublic: true,
    })

    const fixed = ensurePublicErrorMessageAfterError({
      context: {},
      error: minifiedPublicErr,
      req: {} as never,
      result: { errors: [{ message: 'An unknown error occurred.' }] },
    })

    expect(fixed).toEqual({
      response: {
        errors: [{ message: 'Custom public guard message' }],
      },
      status: 400,
    })

    const internalErr = Object.assign(new Error('sensitive SQL error'), {
      name: '',
      status: 500,
      isPublic: false,
    })

    const untouched = ensurePublicErrorMessageAfterError({
      context: {},
      error: internalErr,
      req: {} as never,
      result: { errors: [{ message: 'An unknown error occurred.' }] },
    })

    expect(untouched).toBeUndefined()
  })
})
