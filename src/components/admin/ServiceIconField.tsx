'use client'

import { FieldDescription, FieldError, FieldLabel, useField, useTranslation } from '@payloadcms/ui'

import { SERVICE_ICON_OPTIONS, ServiceIcon } from '../icons/ServiceIcon'

export interface ServiceIconFieldProps {
  field: {
    label?: Record<string, string> | string
    required?: boolean
    admin?: {
      description?: Record<string, string> | string
    }
  }
  path: string
  readOnly?: boolean
}

export const ServiceIconField: React.FC<ServiceIconFieldProps> = ({ field, path, readOnly }) => {
  const { setValue, showError, value } = useField<string>({ path })
  const { i18n } = useTranslation()
  const isEnglish = i18n.language === 'en'

  return (
    <div className="field-type select" style={{ marginBottom: '1.5rem' }}>
      <FieldLabel label={field.label} path={path} required={field.required} />
      <FieldError path={path} showError={showError} />
      <div
        role="radiogroup"
        aria-label={isEnglish ? 'Service Icon Picker' : 'اختيار أيقونة الخدمة'}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '0.625rem',
          marginTop: '0.5rem',
        }}
      >
        {SERVICE_ICON_OPTIONS.map((opt) => {
          const isSelected = value === opt.value
          const optionLabel = isEnglish ? opt.label.en : opt.label.ar
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={Boolean(readOnly)}
              onClick={() => {
                if (!readOnly) {
                  setValue(opt.value)
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.5rem',
                border: isSelected
                  ? '2px solid var(--theme-elevation-600)'
                  : '1px solid var(--theme-elevation-200)',
                background: isSelected
                  ? 'var(--theme-elevation-150)'
                  : 'var(--theme-elevation-50, transparent)',
                color: 'var(--theme-text, inherit)',
                cursor: readOnly ? 'not-allowed' : 'pointer',
                textAlign: 'start',
                transition: 'border-color 150ms ease, background-color 150ms ease',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '0.375rem',
                  background: isSelected
                    ? 'var(--theme-elevation-800)'
                    : 'var(--theme-elevation-150)',
                  color: isSelected ? 'var(--theme-bg)' : 'var(--theme-text)',
                  flexShrink: 0,
                }}
              >
                <ServiceIcon name={opt.value} size={20} />
              </span>
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.125rem',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 600 : 500,
                    lineHeight: 1.3,
                  }}
                >
                  {optionLabel}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    opacity: 0.7,
                    fontFamily: 'monospace',
                  }}
                >
                  {opt.value}
                </span>
              </span>
            </button>
          )
        })}
      </div>
      {field.admin?.description ? (
        <FieldDescription description={field.admin.description} path={path} />
      ) : null}
    </div>
  )
}

export default ServiceIconField
