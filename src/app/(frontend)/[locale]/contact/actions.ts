'use server'

import { getDictionary, isSupportedLocale, type SupportedLocale } from '@/i18n'
import {
  type QuoteFieldErrorKey,
  type QuoteSubmissionPayload,
  quoteSubmissionSchema,
} from '@/lib/quote/schema'

export interface SubmitQuoteStubResult {
  ok: boolean
  fieldErrors?: Partial<Record<QuoteFieldErrorKey, string>>
  data?: QuoteSubmissionPayload
}

const VALID_FIELD_ERROR_KEYS = new Set<QuoteFieldErrorKey>([
  'projectType',
  'projectStage',
  'servicesNeeded',
  'projectLocation',
  'name',
  'company',
  'phone',
  'email',
  'preferredContact',
  'message',
  'consent',
])

/**
 * Stub server action for `P3-T9` (`handoff/tasks/P3-T9.md` Scope 2).
 * Validates the 3-step Quote Form payload with the shared `quoteSubmissionSchema`
 * (`src/lib/quote/schema.ts`) and returns localized field errors on invalid input
 * or `{ ok: true }` on valid input. Real database persistence + email notification
 * are wired in Phase 5 (`P5-T1`).
 */
export async function submitQuoteRequestStubAction(
  rawInput: unknown,
): Promise<SubmitQuoteStubResult> {
  await Promise.resolve()
  const inputRecord =
    typeof rawInput === 'object' && rawInput !== null
      ? (rawInput as Record<string, unknown>)
      : ({} as Record<string, unknown>)
  const locale: SupportedLocale = isSupportedLocale(inputRecord.locale) ? inputRecord.locale : 'en'
  const dict = getDictionary(locale)

  const parsed = quoteSubmissionSchema.safeParse(rawInput)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<QuoteFieldErrorKey, string>> = {}
    for (const issue of parsed.error.issues) {
      const firstPath = issue.path[0]
      if (
        typeof firstPath === 'string' &&
        VALID_FIELD_ERROR_KEYS.has(firstPath as QuoteFieldErrorKey)
      ) {
        const key = firstPath as QuoteFieldErrorKey
        if (!fieldErrors[key]) {
          fieldErrors[key] = dict.quoteForm.errors[key]
        }
      }
    }
    return {
      ok: false,
      fieldErrors,
    }
  }

  return {
    ok: true,
    data: parsed.data,
  }
}
