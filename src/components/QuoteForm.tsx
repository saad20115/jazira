'use client'

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Button } from '@/components/Button'
import { CmsLink } from '@/components/CmsLink'
import { formatStepCounter, getDictionary, type SupportedLocale } from '@/i18n'
import {
  formatPhoneForDisplay,
  QUOTE_PREFERRED_CONTACT_VALUES,
  QUOTE_PROJECT_LOCATION_VALUES,
  QUOTE_PROJECT_STAGE_VALUES,
  QUOTE_PROJECT_TYPE_VALUES,
  QUOTE_SERVICE_NEEDED_VALUES,
  type QuoteFieldErrorKey,
  type QuotePreferredContact,
  type QuoteProjectLocation,
  type QuoteProjectStage,
  type QuoteProjectType,
  type QuoteServiceNeeded,
  type QuoteSubmissionPayload,
  quoteStep1Schema,
  quoteStep2Schema,
  quoteStep3Schema,
} from '@/lib/quote/schema'

import styles from './QuoteForm.module.css'

export interface QuoteFormSubmitResult {
  ok: boolean
  fieldErrors?: Partial<Record<QuoteFieldErrorKey, string>>
}

export interface QuoteFormProps {
  locale: SupportedLocale
  sourcePage?: string
  initialStep?: 1 | 2 | 3
  initialSuccessOpen?: boolean
  onSubmitAction?: (payload: QuoteSubmissionPayload) => Promise<QuoteFormSubmitResult>
}

export function resolvePhoneCandidate(rawPhone: string): string {
  const trimmed = rawPhone.trim()
  if (!trimmed) return ''
  if (
    trimmed.startsWith('+') ||
    trimmed.startsWith('00') ||
    trimmed.startsWith('05') ||
    trimmed.startsWith('01')
  ) {
    return trimmed
  }
  if (/^[15]/.test(trimmed)) {
    return `+966${trimmed}`
  }
  return trimmed
}

function SelectChevronSvg(): ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={styles.selectChevron}
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChipCheckSvg(): ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M11.6667 3.5L5.25 9.91667L2.33333 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ReplyNoteCheckSvg(): ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M15 4.5L6.75 12.75L3 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UploadSvg(): ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 13V3M10 3L6 7M10 3L14 7M3 14V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SuccessCheckEmblemSvg(): ReactElement {
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none" aria-hidden="true">
      <circle cx="38" cy="38" r="38" fill="var(--gold-50)" />
      <circle cx="38" cy="38" r="26" fill="var(--gold-500)" />
      <path
        d="M27 38.5L34.5 46L50 30.5"
        stroke="var(--navy-950)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Figma component `103:422` (`Quote Form` — Step 1 `103:372`, Step 2 `103:391`, Step 3 `103:406`)
 * and overlay `28:1686` (`Message Sent` dialog).
 *
 * Implements all `P3-T9` Scope 2 & Scope 3 requirements:
 * - Shared `zod` validation (`src/lib/quote/schema.ts`) on client and server action
 * - Step progress bar (`1..3`), Back/Next controls, localized error messages (`aria-describedby`)
 * - Keyboard focus automatically moves to the first invalid field on validation error
 * - Consent checkbox linking to `/[locale]/privacy` (`D4`)
 * - Visually hidden honeypot (`tabIndex={-1}`, `autoComplete="off"`) and `startedAtMs` timestamp (`I6`)
 * - Accessible focus-trapped "Message Sent" modal (`role="dialog"`, `aria-modal="true"`, `Escape` closes)
 */
export function QuoteForm({
  locale,
  sourcePage,
  initialStep = 1,
  initialSuccessOpen = false,
  onSubmitAction,
}: QuoteFormProps): ReactElement {
  const dict = getDictionary(locale)
  const resolvedSourcePage = sourcePage ?? `/${locale}/contact`

  const [step, setStep] = useState<1 | 2 | 3>(initialStep)
  const [projectType, setProjectType] = useState<QuoteProjectType>('hotel-tower')
  const [projectStage, setProjectStage] = useState<QuoteProjectStage>('design')
  const [servicesNeeded, setServicesNeeded] = useState<QuoteServiceNeeded[]>([
    'hvac',
    'fire-fighting',
  ])
  const [projectLocation, setProjectLocation] = useState<QuoteProjectLocation>('makkah')
  const [attachmentFileName, setAttachmentFileName] = useState<string>('')

  const [name, setName] = useState<string>('')
  const [company, setCompany] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [preferredContact, setPreferredContact] = useState<QuotePreferredContact>('whatsapp')

  const [message, setMessage] = useState<string>('')
  const [consent, setConsent] = useState<boolean>(false)
  const [honeypot, setHoneypot] = useState<string>('')
  const [startedAtMs] = useState<number>(() => Date.now())

  const [errors, setErrors] = useState<Partial<Record<QuoteFieldErrorKey, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState<boolean>(initialSuccessOpen)

  // Refs for moving focus to the first invalid control (`P3-T9` acceptance criterion #4)
  const firstServiceChipRef = useRef<HTMLButtonElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const companyInputRef = useRef<HTMLInputElement | null>(null)
  const phoneInputRef = useRef<HTMLInputElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null)
  const consentInputRef = useRef<HTMLInputElement | null>(null)
  const formContainerRef = useRef<HTMLDivElement | null>(null)
  const modalCloseBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!isSuccessOpen) return
    modalCloseBtnRef.current?.focus()

    const handleGlobalKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsSuccessOpen(false)
        requestAnimationFrame(() => {
          formContainerRef.current?.querySelector<HTMLButtonElement>('[data-quote-submit]')?.focus()
        })
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isSuccessOpen])

  const toggleService = (service: QuoteServiceNeeded): void => {
    setServicesNeeded((prev) => {
      const next = prev.includes(service)
        ? prev.filter((item) => item !== service)
        : [...prev, service]
      if (next.length > 0 && errors.servicesNeeded) {
        setErrors((curr) => ({ ...curr, servicesNeeded: undefined }))
      }
      return next
    })
  }

  const handleNextFromStep1 = (): void => {
    const parsed = quoteStep1Schema.safeParse({
      projectType,
      projectStage,
      servicesNeeded,
      projectLocation,
      attachmentFileName,
    })

    if (!parsed.success) {
      const nextErrors: Partial<Record<QuoteFieldErrorKey, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as QuoteFieldErrorKey | undefined
        if (key && key in dict.quoteForm.errors && !nextErrors[key]) {
          nextErrors[key] = dict.quoteForm.errors[key]
        }
      }
      setErrors(nextErrors)
      if (nextErrors.servicesNeeded) {
        firstServiceChipRef.current?.focus()
      }
      return
    }

    setErrors({})
    setStep(2)
  }

  const handleNextFromStep2 = (): void => {
    const candidatePhone = resolvePhoneCandidate(phone)
    const parsed = quoteStep2Schema.safeParse({
      name,
      company,
      phone: candidatePhone,
      email,
      preferredContact,
    })

    if (!parsed.success) {
      const nextErrors: Partial<Record<QuoteFieldErrorKey, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as QuoteFieldErrorKey | undefined
        if (key && key in dict.quoteForm.errors && !nextErrors[key]) {
          nextErrors[key] = dict.quoteForm.errors[key]
        }
      }
      setErrors(nextErrors)

      if (nextErrors.name) {
        nameInputRef.current?.focus()
      } else if (nextErrors.company) {
        companyInputRef.current?.focus()
      } else if (nextErrors.phone) {
        phoneInputRef.current?.focus()
      } else if (nextErrors.email) {
        emailInputRef.current?.focus()
      }
      return
    }

    setErrors({})
    setStep(3)
  }

  const handleSubmitStep3 = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    const step3Parsed = quoteStep3Schema.safeParse({
      message,
      consent,
    })

    if (!step3Parsed.success) {
      const nextErrors: Partial<Record<QuoteFieldErrorKey, string>> = {}
      for (const issue of step3Parsed.error.issues) {
        const key = issue.path[0] as QuoteFieldErrorKey | undefined
        if (key && key in dict.quoteForm.errors && !nextErrors[key]) {
          nextErrors[key] = dict.quoteForm.errors[key]
        }
      }
      setErrors(nextErrors)

      if (nextErrors.message) {
        messageInputRef.current?.focus()
      } else if (nextErrors.consent) {
        consentInputRef.current?.focus()
      }
      return
    }

    const candidatePhone = resolvePhoneCandidate(phone)
    const step2Parsed = quoteStep2Schema.safeParse({
      name,
      company,
      phone: candidatePhone,
      email,
      preferredContact,
    })

    if (!step2Parsed.success) {
      const nextErrors: Partial<Record<QuoteFieldErrorKey, string>> = {}
      for (const issue of step2Parsed.error.issues) {
        const key = issue.path[0] as QuoteFieldErrorKey | undefined
        if (key && key in dict.quoteForm.errors && !nextErrors[key]) {
          nextErrors[key] = dict.quoteForm.errors[key]
        }
      }
      setErrors(nextErrors)
      setStep(2)
      return
    }

    const payload: QuoteSubmissionPayload = {
      projectType,
      projectStage,
      servicesNeeded,
      projectLocation,
      attachmentFileName,
      name: step2Parsed.data.name,
      company: step2Parsed.data.company,
      phone: step2Parsed.data.phone,
      email: step2Parsed.data.email,
      preferredContact: step2Parsed.data.preferredContact,
      message: step3Parsed.data.message,
      consent: true,
      locale,
      sourcePage: resolvedSourcePage,
      honeypot,
      startedAtMs,
    }

    setErrors({})
    setIsSubmitting(true)
    try {
      if (onSubmitAction) {
        const result = await onSubmitAction(payload)
        if (!result.ok && result.fieldErrors) {
          setErrors(result.fieldErrors)
          if (result.fieldErrors.consent) {
            consentInputRef.current?.focus()
          }
          return
        }
      }
      setIsSuccessOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseSuccessModal = (): void => {
    setIsSuccessOpen(false)
    requestAnimationFrame(() => {
      formContainerRef.current?.querySelector<HTMLButtonElement>('[data-quote-submit]')?.focus()
    })
  }

  const handleModalKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Tab') {
      event.preventDefault()
      modalCloseBtnRef.current?.focus()
    }
  }

  const stepCounterText = formatStepCounter(dict.quoteForm.stepHeaderTemplate, step, 3)

  const summaryServicesText = servicesNeeded.map((svc) => dict.quoteForm.services[svc]).join(', ')
  const displayPhone = phone.trim()
    ? formatPhoneForDisplay(resolvePhoneCandidate(phone))
    : `${dict.quoteForm.mobilePrefix} ${dict.quoteForm.mobilePlaceholder}`
  const displayContactSummary = `${name.trim() || dict.quoteForm.fullNameLabel} · ${displayPhone}`
  const displayFilesSummary =
    attachmentFileName || (initialStep === 3 && !name.trim())
      ? dict.quoteForm.summaryOneFileAttached
      : dict.quoteForm.summaryNoFiles

  return (
    <>
      <div
        ref={formContainerRef}
        id="quote"
        className={styles.card}
        data-component="quote-form"
        data-step={step}
      >
        {/* 3-Step Progress Indicator (`103:373`) */}
        <div className={styles.progressBar} aria-hidden="true">
          <div
            className={`${styles.progressSegment} ${step >= 1 ? styles.progressSegmentActive : ''}`}
          />
          <div
            className={`${styles.progressSegment} ${step >= 2 ? styles.progressSegmentActive : ''}`}
          />
          <div
            className={`${styles.progressSegment} ${step >= 3 ? styles.progressSegmentActive : ''}`}
          />
        </div>

        {/* Step Header */}
        <div className={styles.stepHeader}>
          <p className={`${styles.stepCounter} t-label-caps`} aria-live="polite" data-step-counter>
            {stepCounterText}
          </p>
          <h3 className={`${styles.stepTitle} t-h4`}>
            {step === 1
              ? dict.quoteForm.step1Title
              : step === 2
                ? dict.quoteForm.step2Title
                : dict.quoteForm.step3Title}
          </h3>
          {step === 2 ? (
            <p className={`${styles.stepSubtitle} t-body-s`}>{dict.quoteForm.step2Subtitle}</p>
          ) : step === 3 ? (
            <p className={`${styles.stepSubtitle} t-body-s`}>{dict.quoteForm.step3Subtitle}</p>
          ) : null}
        </div>

        <form
          className={styles.form}
          noValidate
          onSubmit={(event) => {
            void handleSubmitStep3(event)
          }}
        >
          {/* Visually hidden Honeypot + timestamp (`I6`) */}
          <div className={styles.honeypotWrap} aria-hidden="true">
            <label htmlFor="quote-company-website">{dict.quoteForm.honeypotLabel}</label>
            <input
              id="quote-company-website"
              name="companyWebsite"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(event) => {
                setHoneypot(event.target.value)
              }}
            />
            <input type="hidden" name="startedAtMs" value={String(startedAtMs)} />
          </div>

          {/* ================================================================
              STEP 1: Your project (`103:372`)
              ================================================================ */}
          {step === 1 ? (
            <div className={styles.stepBody} data-quote-step="1">
              <div className={styles.twoColRow}>
                <div className={styles.fieldGroup}>
                  <label
                    htmlFor="quote-project-type"
                    className={`${styles.fieldLabel} t-label-caps`}
                  >
                    {dict.quoteForm.projectTypeLabel}
                  </label>
                  <div className={styles.selectWrap}>
                    <select
                      id="quote-project-type"
                      name="projectType"
                      value={projectType}
                      onChange={(event) => {
                        setProjectType(event.target.value as QuoteProjectType)
                      }}
                      className={`${styles.selectControl} t-body-s`}
                      data-field="projectType"
                    >
                      {QUOTE_PROJECT_TYPE_VALUES.map((val) => (
                        <option key={val} value={val}>
                          {dict.quoteForm.projectTypes[val]}
                        </option>
                      ))}
                    </select>
                    <SelectChevronSvg />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label
                    htmlFor="quote-project-stage"
                    className={`${styles.fieldLabel} t-label-caps`}
                  >
                    {dict.quoteForm.projectStageLabel}
                  </label>
                  <div className={styles.selectWrap}>
                    <select
                      id="quote-project-stage"
                      name="projectStage"
                      value={projectStage}
                      onChange={(event) => {
                        setProjectStage(event.target.value as QuoteProjectStage)
                      }}
                      className={`${styles.selectControl} t-body-s`}
                      data-field="projectStage"
                    >
                      {QUOTE_PROJECT_STAGE_VALUES.map((val) => (
                        <option key={val} value={val}>
                          {dict.quoteForm.projectStages[val]}
                        </option>
                      ))}
                    </select>
                    <SelectChevronSvg />
                  </div>
                </div>
              </div>

              {/* Services Needed Chips (`103:378`) */}
              <fieldset
                className={styles.fieldset}
                aria-describedby={errors.servicesNeeded ? 'quote-services-error' : undefined}
              >
                <legend className={`${styles.fieldLabel} t-label-caps`}>
                  {dict.quoteForm.servicesNeededLabel}
                </legend>
                <div className={styles.chipsRow}>
                  {QUOTE_SERVICE_NEEDED_VALUES.map((service, idx) => {
                    const isSelected = servicesNeeded.includes(service)
                    return (
                      <button
                        key={service}
                        ref={idx === 0 ? firstServiceChipRef : undefined}
                        type="button"
                        aria-pressed={isSelected}
                        data-service-chip={service}
                        onClick={() => {
                          toggleService(service)
                        }}
                        className={`${styles.chipBtn} ${isSelected ? styles.chipBtnSelected : ''} t-body-s`}
                      >
                        {isSelected ? (
                          <span className={styles.chipCheckIcon}>
                            <ChipCheckSvg />
                          </span>
                        ) : null}
                        <span>{dict.quoteForm.services[service]}</span>
                      </button>
                    )
                  })}
                </div>
                {errors.servicesNeeded ? (
                  <p
                    id="quote-services-error"
                    role="alert"
                    className={`${styles.errorText} t-caption`}
                    data-error-for="servicesNeeded"
                  >
                    {errors.servicesNeeded}
                  </p>
                ) : null}
              </fieldset>

              {/* Project Location (`103:386`) */}
              <div className={styles.fieldGroup}>
                <label
                  htmlFor="quote-project-location"
                  className={`${styles.fieldLabel} t-label-caps`}
                >
                  {dict.quoteForm.projectLocationLabel}
                </label>
                <div className={styles.selectWrap}>
                  <select
                    id="quote-project-location"
                    name="projectLocation"
                    value={projectLocation}
                    onChange={(event) => {
                      setProjectLocation(event.target.value as QuoteProjectLocation)
                    }}
                    className={`${styles.selectControl} t-body-s`}
                    data-field="projectLocation"
                  >
                    {QUOTE_PROJECT_LOCATION_VALUES.map((val) => (
                      <option key={val} value={val}>
                        {dict.quoteForm.locations[val]}
                      </option>
                    ))}
                  </select>
                  <SelectChevronSvg />
                </div>
              </div>

              {/* Upload Drawings or BOQ (`103:387`) */}
              <div className={styles.uploadBox}>
                <input
                  ref={fileInputRef}
                  id="quote-attachment"
                  type="file"
                  accept=".pdf,.dwg,.xlsx,.xls"
                  className={styles.hiddenFileInput}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    setAttachmentFileName(file ? file.name : '')
                  }}
                />
                <label htmlFor="quote-attachment" className={styles.uploadLabel}>
                  <span className={styles.uploadIcon}>
                    <UploadSvg />
                  </span>
                  <span className={styles.uploadTextCol}>
                    <span className={`${styles.uploadTitle} t-body-s`}>
                      {dict.quoteForm.uploadTitle}
                    </span>
                    <span className={`${styles.uploadSubtitle} t-caption-s`}>
                      {attachmentFileName
                        ? `${dict.quoteForm.uploadSelectedPrefix} ${attachmentFileName}`
                        : dict.quoteForm.uploadSubtitle}
                    </span>
                  </span>
                </label>
              </div>

              <Button
                type="button"
                variant="Dark"
                size="lg"
                showArrow
                fullWidth
                onClick={handleNextFromStep1}
                data-quote-next="step-1"
              >
                {dict.quoteForm.continueToContact}
              </Button>
            </div>
          ) : null}

          {/* ================================================================
              STEP 2: Contact details (`103:391`)
              ================================================================ */}
          {step === 2 ? (
            <div className={styles.stepBody} data-quote-step="2">
              <div className={styles.twoColRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="quote-name" className={`${styles.fieldLabel} t-label-caps`}>
                    {dict.quoteForm.fullNameLabel}
                  </label>
                  <input
                    ref={nameInputRef}
                    id="quote-name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    placeholder={dict.quoteForm.fullNamePlaceholder}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'quote-name-error' : undefined}
                    onChange={(event) => {
                      setName(event.target.value)
                      if (errors.name) {
                        setErrors((curr) => ({ ...curr, name: undefined }))
                      }
                    }}
                    className={`${styles.inputControl} ${errors.name ? styles.inputError : ''} t-body-s`}
                    data-field="name"
                  />
                  {errors.name ? (
                    <p
                      id="quote-name-error"
                      role="alert"
                      className={`${styles.errorText} t-caption`}
                      data-error-for="name"
                    >
                      {errors.name}
                    </p>
                  ) : null}
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="quote-company" className={`${styles.fieldLabel} t-label-caps`}>
                    {dict.quoteForm.companyLabel}
                  </label>
                  <input
                    ref={companyInputRef}
                    id="quote-company"
                    name="company"
                    type="text"
                    value={company}
                    placeholder={dict.quoteForm.companyPlaceholder}
                    aria-invalid={Boolean(errors.company)}
                    aria-describedby={errors.company ? 'quote-company-error' : undefined}
                    onChange={(event) => {
                      setCompany(event.target.value)
                      if (errors.company) {
                        setErrors((curr) => ({ ...curr, company: undefined }))
                      }
                    }}
                    className={`${styles.inputControl} ${errors.company ? styles.inputError : ''} t-body-s`}
                    data-field="company"
                  />
                  {errors.company ? (
                    <p
                      id="quote-company-error"
                      role="alert"
                      className={`${styles.errorText} t-caption`}
                      data-error-for="company"
                    >
                      {errors.company}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className={styles.twoColRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="quote-phone" className={`${styles.fieldLabel} t-label-caps`}>
                    {dict.quoteForm.mobileWhatsappLabel}
                  </label>
                  <div
                    className={`${styles.phoneInputWrap} ${errors.phone ? styles.inputError : ''}`}
                    dir="ltr"
                  >
                    <span className={`${styles.phonePrefix} t-body-s`}>
                      {dict.quoteForm.mobilePrefix}
                    </span>
                    <input
                      ref={phoneInputRef}
                      id="quote-phone"
                      name="phone"
                      type="tel"
                      dir="ltr"
                      required
                      value={phone}
                      placeholder={dict.quoteForm.mobilePlaceholder}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? 'quote-phone-error' : undefined}
                      onChange={(event) => {
                        setPhone(event.target.value)
                        if (errors.phone) {
                          setErrors((curr) => ({ ...curr, phone: undefined }))
                        }
                      }}
                      className={`${styles.phoneBareInput} t-body-s`}
                      data-field="phone"
                    />
                  </div>
                  {errors.phone ? (
                    <p
                      id="quote-phone-error"
                      role="alert"
                      className={`${styles.errorText} t-caption`}
                      data-error-for="phone"
                    >
                      {errors.phone}
                    </p>
                  ) : null}
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="quote-email" className={`${styles.fieldLabel} t-label-caps`}>
                    {dict.quoteForm.emailLabel}
                  </label>
                  <input
                    ref={emailInputRef}
                    id="quote-email"
                    name="email"
                    type="email"
                    dir="ltr"
                    required
                    value={email}
                    placeholder={dict.quoteForm.emailPlaceholder}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'quote-email-error' : undefined}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (errors.email) {
                        setErrors((curr) => ({ ...curr, email: undefined }))
                      }
                    }}
                    className={`${styles.inputControl} ${errors.email ? styles.inputError : ''} t-body-s`}
                    data-field="email"
                  />
                  {errors.email ? (
                    <p
                      id="quote-email-error"
                      role="alert"
                      className={`${styles.errorText} t-caption`}
                      data-error-for="email"
                    >
                      {errors.email}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Preferred way to reach you (`103:399`) */}
              <fieldset className={styles.fieldset}>
                <legend className={`${styles.fieldLabel} t-label-caps`}>
                  {dict.quoteForm.preferredContactLabel}
                </legend>
                <div className={styles.chipsRow}>
                  {QUOTE_PREFERRED_CONTACT_VALUES.map((channel) => {
                    const isSelected = preferredContact === channel
                    return (
                      <button
                        key={channel}
                        type="button"
                        aria-pressed={isSelected}
                        data-preferred-chip={channel}
                        onClick={() => {
                          setPreferredContact(channel)
                        }}
                        className={`${styles.chipBtn} ${isSelected ? styles.chipBtnSelected : ''} t-body-s`}
                      >
                        {isSelected ? (
                          <span className={styles.chipCheckIcon}>
                            <ChipCheckSvg />
                          </span>
                        ) : null}
                        <span>{dict.quoteForm.preferredChannels[channel]}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={() => {
                    setErrors({})
                    setStep(1)
                  }}
                  className={`${styles.backBtn} t-label-button`}
                  data-quote-back="step-2"
                >
                  {dict.quoteForm.backButton}
                </button>
                <Button
                  type="button"
                  variant="Dark"
                  size="lg"
                  showArrow
                  onClick={handleNextFromStep2}
                  className={styles.flexSubmitBtn}
                  data-quote-next="step-2"
                >
                  {dict.quoteForm.continueToReview}
                </Button>
              </div>
            </div>
          ) : null}

          {/* ================================================================
              STEP 3: Review & send (`103:406`)
              ================================================================ */}
          {step === 3 ? (
            <div className={styles.stepBody} data-quote-step="3">
              {/* Review Summary Box (`103:411`) */}
              <div className={styles.summaryBox} data-quote-summary>
                <div className={styles.summaryRow}>
                  <span className={`${styles.summaryLabel} t-body-s`}>
                    {dict.quoteForm.summaryProjectLabel}
                  </span>
                  <span className={`${styles.summaryValue} t-body-s`}>
                    {`${dict.quoteForm.projectTypes[projectType]} · ${dict.quoteForm.projectStages[projectStage]}`}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={`${styles.summaryLabel} t-body-s`}>
                    {dict.quoteForm.summaryServicesLabel}
                  </span>
                  <span className={`${styles.summaryValue} t-body-s`}>{summaryServicesText}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={`${styles.summaryLabel} t-body-s`}>
                    {dict.quoteForm.summaryLocationLabel}
                  </span>
                  <span className={`${styles.summaryValue} t-body-s`}>
                    {dict.quoteForm.locations[projectLocation]}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={`${styles.summaryLabel} t-body-s`}>
                    {dict.quoteForm.summaryFilesLabel}
                  </span>
                  <span className={`${styles.summaryValue} t-body-s`}>{displayFilesSummary}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={`${styles.summaryLabel} t-body-s`}>
                    {dict.quoteForm.summaryContactLabel}
                  </span>
                  <span className={`${styles.summaryValue} t-body-s`}>{displayContactSummary}</span>
                </div>
              </div>

              {/* Optional Message (`103:417`) */}
              <div className={styles.fieldGroup}>
                <label htmlFor="quote-message" className={`${styles.fieldLabel} t-label-caps`}>
                  {dict.quoteForm.messageOptionalLabel}
                </label>
                <textarea
                  ref={messageInputRef}
                  id="quote-message"
                  name="message"
                  rows={3}
                  value={message}
                  placeholder={dict.quoteForm.messagePlaceholder}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'quote-message-error' : undefined}
                  onChange={(event) => {
                    setMessage(event.target.value)
                    if (errors.message) {
                      setErrors((curr) => ({ ...curr, message: undefined }))
                    }
                  }}
                  className={`${styles.textareaControl} ${errors.message ? styles.inputError : ''} t-body-s`}
                  data-field="message"
                />
                {errors.message ? (
                  <p
                    id="quote-message-error"
                    role="alert"
                    className={`${styles.errorText} t-caption`}
                    data-error-for="message"
                  >
                    {errors.message}
                  </p>
                ) : null}
              </div>

              {/* Reply note (`103:418`) */}
              <div className={styles.replyNoteRow}>
                <span className={styles.replyNoteCheck}>
                  <ReplyNoteCheckSvg />
                </span>
                <span className={`${styles.replyNoteText} t-body-s`}>
                  {dict.quoteForm.replyNote}
                </span>
              </div>

              {/* Consent Checkbox (`D4`) */}
              <div className={styles.consentBlock}>
                <label htmlFor="quote-consent" className={styles.consentLabel}>
                  <input
                    ref={consentInputRef}
                    id="quote-consent"
                    name="consent"
                    type="checkbox"
                    checked={consent}
                    aria-invalid={Boolean(errors.consent)}
                    aria-describedby={errors.consent ? 'quote-consent-error' : undefined}
                    onChange={(event) => {
                      setConsent(event.target.checked)
                      if (errors.consent) {
                        setErrors((curr) => ({ ...curr, consent: undefined }))
                      }
                    }}
                    className={styles.consentCheckbox}
                    data-field="consent"
                  />
                  <span className={`${styles.consentText} t-caption-s`}>
                    <span>{dict.quoteForm.consentPrefix}</span>{' '}
                    <CmsLink
                      href={`/${locale}/privacy`}
                      className={styles.privacyLink}
                      data-privacy-link
                    >
                      {dict.quoteForm.consentPrivacyLinkLabel}
                    </CmsLink>
                  </span>
                </label>
                {errors.consent ? (
                  <p
                    id="quote-consent-error"
                    role="alert"
                    className={`${styles.errorText} t-caption`}
                    data-error-for="consent"
                  >
                    {errors.consent}
                  </p>
                ) : null}
              </div>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={() => {
                    setErrors({})
                    setStep(2)
                  }}
                  className={`${styles.backBtn} t-label-button`}
                  data-quote-back="step-3"
                >
                  {dict.quoteForm.backButton}
                </button>
                <Button
                  type="submit"
                  variant="Gold"
                  size="lg"
                  showArrow
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className={styles.flexSubmitBtn}
                  data-quote-submit
                >
                  {isSubmitting ? dict.quoteForm.sendingButton : dict.quoteForm.sendRequestButton}
                </Button>
              </div>
            </div>
          ) : null}
        </form>
      </div>

      {/* ====================================================================
          Overlay: Message Sent Successfully (`28:1686`)
          ==================================================================== */}
      {isSuccessOpen ? (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quote-message-sent-title"
          data-component="message-sent-dialog"
          onKeyDown={handleModalKeyDown}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseSuccessModal()
            }
          }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalEmblemOuter} aria-hidden="true">
              <SuccessCheckEmblemSvg />
            </div>

            <h3 id="quote-message-sent-title" className={`${styles.modalTitle} t-h3`}>
              {dict.overlays.messageSentTitle}
            </h3>

            <p className={`${styles.modalBody} t-body-m`}>{dict.overlays.messageSentBody}</p>

            <button
              ref={modalCloseBtnRef}
              type="button"
              onClick={handleCloseSuccessModal}
              className={`${styles.modalCloseBtn} t-label-button`}
              data-modal-close
            >
              {dict.overlays.backToWebsite}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
