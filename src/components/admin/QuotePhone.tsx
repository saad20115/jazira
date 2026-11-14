'use client'

import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import React from 'react'

import { formatPhoneForDisplay } from '../../lib/quote/schema'

/**
 * P2-T7 §5b — a quote request's phone, shown grouped for reading (`+966 57 353 4185`). The stored
 * value stays E.164; a number that is not a KSA one shows as stored. Numbers always read left to
 * right, in the Arabic dashboard too.
 */
function displayPhone(value: unknown): string {
  return typeof value === 'string' && value.length > 0 ? formatPhoneForDisplay(value) : ''
}

export const QuotePhoneCell: React.FC<{ cellData?: unknown }> = ({ cellData }) => (
  <span dir="ltr" data-testid="quote-phone-cell">
    {displayPhone(cellData)}
  </span>
)

/** The edit view: the phone is read-only there (the visitor's data), so this only displays it. */
export const QuotePhoneField: TextFieldClientComponent = ({ field, path }) => {
  const { value } = useField<string>({ path })
  return (
    <div className="field-type text read-only">
      <FieldLabel label={field.label} path={path} required={field.required} />
      <div className="field-type__wrap">
        <input
          id={`field-${path.replace(/\./g, '__')}`}
          data-testid="quote-phone-field"
          dir="ltr"
          type="text"
          disabled
          readOnly
          value={displayPhone(value)}
        />
      </div>
      <FieldDescription description={field.admin?.description} path={path} />
    </div>
  )
}
