import { arDictionary } from '../i18n/ar'
import { enDictionary } from '../i18n/en'
import { formatPhoneForDisplay } from '../lib/quote/schema'

/**
 * P5-T1 §4 — the sales-inbox notification for a new quote request, in Arabic and English.
 *
 * Pure: no Payload, no env, no network. P5-T2's job renders it and sends it to `SALES_INBOX`
 * only, never to the visitor (Q1). It carries only the fields staff need to act, plus a link to
 * the request in `/admin`; never the IP hash or the user agent. Every CMS/visitor value is
 * HTML-escaped.
 */
export interface QuoteNotificationInput {
  id: number
  name: string
  company?: string | null
  email: string
  phone: string
  preferredContact?: string | null
  projectType?: string | null
  projectStage?: string | null
  projectLocation?: string | null
  servicesNeeded?: string[] | null
  message?: string | null
  locale?: string | null
}

export interface QuoteNotificationEmail {
  subject: string
  text: string
  html: string
}

type Dictionary = typeof enDictionary

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Single-line header-safe text: no CR/LF, so a visitor's name cannot inject mail headers. */
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function optionLabel(labels: Record<string, string>, value: string | null | undefined): string {
  if (!value) return ''
  return labels[value] ?? value
}

/** Values that must always read left to right, even inside the Arabic block (phone, email). */
const LTR_VALUE = '‎'

function rowsFor(input: QuoteNotificationInput, dict: Dictionary): Array<[string, string]> {
  const form = dict.quoteForm
  const services = (input.servicesNeeded ?? [])
    .map((value) => optionLabel(form.services as Record<string, string>, value))
    .join(', ')
  const rows: Array<[string, string]> = [
    [form.fullNameLabel, input.name],
    [form.companyLabel, input.company ?? ''],
    [form.mobileWhatsappLabel, `${LTR_VALUE}${formatPhoneForDisplay(input.phone)}`],
    [form.emailLabel, `${LTR_VALUE}${input.email}`],
    [form.preferredContactLabel, optionLabel(form.preferredChannels, input.preferredContact)],
    [form.projectTypeLabel, optionLabel(form.projectTypes, input.projectType)],
    [form.projectStageLabel, optionLabel(form.projectStages, input.projectStage)],
    [form.servicesNeededLabel, services],
    [form.projectLocationLabel, optionLabel(form.locations, input.projectLocation)],
    [form.messageOptionalLabel, input.message ?? ''],
  ]
  return rows.filter(([, value]) => value.trim().length > 0)
}

const EMAIL_COPY = {
  en: {
    heading: 'New quote request',
    intro: 'A visitor sent a quote request from the website.',
    open: 'Open the request in the dashboard',
    language: 'Form language',
  },
  ar: {
    heading: 'طلب عرض سعر جديد',
    intro: 'أرسل زائر طلب عرض سعر من الموقع.',
    open: 'افتح الطلب في لوحة التحكم',
    language: 'لغة النموذج',
  },
} as const

/**
 * Each value is isolated (<bdi>) so mixed Arabic/Latin text keeps its own direction; values marked
 * with LTR_VALUE (phone, email) are forced left to right, so "+966 …" never shows reversed.
 */
function cellHtml(value: string): string {
  if (value.startsWith(LTR_VALUE)) {
    return `<bdi dir="ltr">${escapeHtml(value.slice(LTR_VALUE.length))}</bdi>`
  }
  return `<bdi>${escapeHtml(value)}</bdi>`
}

export function buildQuoteNotificationEmail(
  input: QuoteNotificationInput,
  adminBaseUrl: string,
): QuoteNotificationEmail {
  const adminUrl = `${adminBaseUrl.replace(/\/+$/, '')}/admin/collections/quote-requests/${String(input.id)}`
  const formLanguage = input.locale === 'ar' ? 'العربية / Arabic' : 'English / الإنجليزية'
  const subject = headerSafe(
    `${EMAIL_COPY.ar.heading} / ${EMAIL_COPY.en.heading} #${String(input.id)} — ${input.name}`,
  ).slice(0, 200)

  const blocks = (['ar', 'en'] as const).map((lang) => {
    const dict = lang === 'ar' ? arDictionary : enDictionary
    const copy = EMAIL_COPY[lang]
    const rows = [...rowsFor(input, dict), [copy.language, formLanguage] as [string, string]]
    return { lang, copy, rows }
  })

  const text = blocks
    .map(({ copy, rows }) =>
      [
        `${copy.heading} #${String(input.id)}`,
        copy.intro,
        '',
        ...rows.map(([label, value]) => `${label}: ${value.replace(LTR_VALUE, '')}`),
        '',
        `${copy.open}: ${adminUrl}`,
      ].join('\n'),
    )
    .join('\n\n----------------------------------------\n\n')

  const html = [
    '<!doctype html><html><body style="margin:0;padding:24px;background:#f6f8fb;font-family:Arial,Tahoma,sans-serif;color:#011025">',
    ...blocks.map(({ lang, copy, rows }) =>
      [
        `<div lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}" style="max-width:640px;margin:0 auto 24px;background:#ffffff;border-radius:12px;padding:24px">`,
        `<h1 style="font-size:20px;margin:0 0 8px">${escapeHtml(copy.heading)} <bdi dir="ltr">#${String(input.id)}</bdi></h1>`,
        `<p style="margin:0 0 16px;color:#5b6475">${escapeHtml(copy.intro)}</p>`,
        '<table role="presentation" style="width:100%;border-collapse:collapse">',
        ...rows.map(
          ([label, value]) =>
            `<tr><th style="text-align:${lang === 'ar' ? 'right' : 'left'};vertical-align:top;padding:6px 8px;color:#5b6475;font-weight:normal;white-space:nowrap">${escapeHtml(label)}</th><td style="padding:6px 8px;white-space:pre-wrap">${cellHtml(value)}</td></tr>`,
        ),
        '</table>',
        `<p style="margin:20px 0 0"><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#011025;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px">${escapeHtml(copy.open)}</a></p>`,
        '</div>',
      ].join(''),
    ),
    '</body></html>',
  ].join('')

  return { subject, text, html }
}
