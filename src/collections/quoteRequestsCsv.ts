import { arDictionary } from '../i18n/ar'
import { enDictionary } from '../i18n/en'

/**
 * P5-T2 §4 (Q3) — the CSV export of quote requests, as pure functions.
 *
 * - UTF-8 with a byte-order mark and CRLF line ends, so Excel opens Arabic text correctly.
 * - RFC 4180 quoting (every cell quoted, `"` doubled).
 * - Formula-safe: a cell whose text starts with `=`, `+`, `-`, `@`, a tab or a CR gets a leading
 *   single quote, so a spreadsheet shows it as text instead of running it (Q3).
 * - Only customer fields, status, assignee and the creation time are exported: never `ipHash`,
 *   `userAgent`, `internalNotes` or the e-mail pipeline fields.
 */

const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r']

export function formulaSafe(value: string): string {
  return FORMULA_TRIGGERS.some((trigger) => value.startsWith(trigger)) ? `'${value}` : value
}

export function csvCell(value: string): string {
  return `"${formulaSafe(value).replace(/"/g, '""')}"`
}

export const CSV_BOM = '﻿'

export function toCsv(rows: readonly (readonly string[])[]): string {
  return CSV_BOM + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

export type QuoteCsvSource = {
  id: number | string
  createdAt: string
  status?: string | null
  assignedTo?: number | { email?: string | null; name?: string | null } | null
  name: string
  company?: string | null
  email: string
  phone: string
  serviceTitle?: string | null
  projectType?: string | null
  projectStage?: string | null
  servicesNeeded?: string[] | null
  projectLocation?: string | null
  preferredContact?: string | null
  message?: string | null
  locale?: string | null
  sourcePage?: string | null
}

type CsvLanguage = 'ar' | 'en'

const HEADERS: Record<CsvLanguage, readonly string[]> = {
  ar: [
    'رقم الطلب',
    'تاريخ الإنشاء',
    'حالة المتابعة',
    'المسؤول',
    'اسم العميل',
    'الشركة',
    'البريد الإلكتروني',
    'الهاتف',
    'الخدمة',
    'نوع المشروع',
    'مرحلة المشروع',
    'الخدمات المطلوبة',
    'موقع المشروع',
    'طريقة التواصل المفضلة',
    'الرسالة',
    'لغة الطلب',
    'صفحة المصدر',
  ],
  en: [
    'Request ID',
    'Created at',
    'Status',
    'Assigned to',
    'Name',
    'Company',
    'Email',
    'Phone',
    'Service',
    'Project type',
    'Project stage',
    'Services needed',
    'Project location',
    'Preferred contact',
    'Message',
    'Form language',
    'Source page',
  ],
}

const STATUS_LABELS: Record<CsvLanguage, Record<string, string>> = {
  ar: {
    new: 'جديد',
    contacted: 'تم التواصل',
    quoted: 'تم إرسال العرض',
    closed: 'مغلق',
    spam: 'غير مرغوب',
  },
  en: { new: 'New', contacted: 'Contacted', quoted: 'Quoted', closed: 'Closed', spam: 'Spam' },
}

function optionLabel(
  language: CsvLanguage,
  key: 'projectTypes' | 'projectStages' | 'services' | 'locations' | 'preferredChannels',
  value: string | null | undefined,
): string {
  if (!value) {
    return ''
  }
  const dictionary = language === 'ar' ? arDictionary : enDictionary
  const labels = dictionary.quoteForm[key] as Record<string, string>
  return labels[value] ?? value
}

function assigneeLabel(assignedTo: QuoteCsvSource['assignedTo']): string {
  if (assignedTo === null || assignedTo === undefined) {
    return ''
  }
  if (typeof assignedTo === 'number') {
    return String(assignedTo)
  }
  return assignedTo.name?.trim() || assignedTo.email?.trim() || ''
}

export function quoteRequestsToCsv(docs: readonly QuoteCsvSource[], language: CsvLanguage): string {
  const rows: string[][] = [[...HEADERS[language]]]
  for (const doc of docs) {
    rows.push([
      String(doc.id),
      doc.createdAt,
      doc.status ? (STATUS_LABELS[language][doc.status] ?? doc.status) : '',
      assigneeLabel(doc.assignedTo),
      doc.name,
      doc.company ?? '',
      doc.email,
      doc.phone,
      doc.serviceTitle ?? '',
      optionLabel(language, 'projectTypes', doc.projectType),
      optionLabel(language, 'projectStages', doc.projectStage),
      (doc.servicesNeeded ?? [])
        .map((value) => optionLabel(language, 'services', value))
        .join(', '),
      optionLabel(language, 'locations', doc.projectLocation),
      optionLabel(language, 'preferredChannels', doc.preferredContact),
      doc.message ?? '',
      doc.locale ?? '',
      doc.sourcePage ?? '',
    ])
  }
  return toCsv(rows)
}
