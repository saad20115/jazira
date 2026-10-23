import { APIError, type Config, type ErrorResult } from 'payload'

type RootAfterErrorHook = NonNullable<NonNullable<Config['hooks']>['afterError']>[number]

/**
 * Constructs a public Payload `APIError` whose `.name` is explicitly pinned to `'APIError'`.
 *
 * Why (`P2-T4 R-13`): Under Next.js production builds (Turbopack minification), Payload's
 * `export class APIError extends ExtendableError` is bundled as an anonymous class expression,
 * making `this.constructor.name === ""` inside `ExtendableError`. Because `formatErrors()` in
 * `payload/dist/utilities/formatErrors.js` falls through to `if (incoming.name)` when `incoming.data`
 * is nullish, an empty `incoming.name` causes every custom `APIError` to be serialized as
 * `{ errors: [{ message: "An unknown error occurred." }] }` in production (`next start`).
 */
export function createPublicAPIError(
  message: string,
  status = 400,
  data?: Record<string, unknown>,
): APIError {
  const err = new APIError(message, status, data, true)
  err.name = 'APIError'
  return err
}

/**
 * Root Payload `afterError` hook (`P2-T4 R-13`) that guarantees any public operational error
 * (including internal Payload `APIError` instances whose constructor name was minified in a
 * production build) preserves its `error.message` instead of falling back to
 * `"An unknown error occurred."`.
 */
export const ensurePublicErrorMessageAfterError: RootAfterErrorHook = ({ error, result }) => {
  if (typeof error !== 'object') {
    return
  }

  const errRecord = error as {
    data?: unknown
    isPublic?: boolean
    message?: unknown
    status?: unknown
  }

  const status = typeof errRecord.status === 'number' ? errRecord.status : 500
  const isPublic =
    errRecord.isPublic === true || (errRecord.isPublic !== false && status >= 400 && status < 500)

  if (!isPublic) {
    return
  }

  const message = typeof errRecord.message === 'string' ? errRecord.message.trim() : ''
  if (!message) {
    return
  }

  const currentErrors = Array.isArray(result?.errors) ? result.errors : []
  const isGenericUnknown =
    currentErrors.length === 0 ||
    (currentErrors.length === 1 && currentErrors[0]?.message === 'An unknown error occurred.')

  if (!isGenericUnknown) {
    return
  }

  const rawData =
    typeof errRecord.data === 'object' && errRecord.data !== null && !Array.isArray(errRecord.data)
      ? (errRecord.data as Record<string, unknown>)
      : undefined

  const updatedResponse: ErrorResult = {
    ...result,
    errors: [
      {
        ...(rawData !== undefined ? { data: rawData } : {}),
        message,
      },
    ],
  }

  return {
    response: updatedResponse,
    status,
  }
}
