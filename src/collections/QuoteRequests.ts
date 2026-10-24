import {
  ValidationError,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  type FieldAccess,
  type PayloadRequest,
} from 'payload'

import { isAdmin } from '../access/isAdmin'
import { isAdminOrEditor } from '../access/isAdminOrEditor'
import { DEFAULT_LOCALE } from '../i18n'
import { isValidIpHash } from '../lib/ipHash'
import {
  E164_GENERAL_PHONE_REGEX,
  E164_KSA_PHONE_REGEX,
  formatPhoneForDisplay,
  INTERNATIONAL_PHONE_CHARS_REGEX,
  isValidKsaOrInternationalPhone,
  KSA_LOCAL_PHONE_CHARS_REGEX,
  normalizeQuotePhone,
  QUOTE_PHONE_ERROR_MESSAGE,
  quotePhoneSchema,
} from '../lib/quote/schema'
import { withImmutableCreatedAt } from './_shared/immutableTimestamps'

export {
  E164_GENERAL_PHONE_REGEX,
  E164_KSA_PHONE_REGEX,
  formatPhoneForDisplay,
  INTERNATIONAL_PHONE_CHARS_REGEX,
  isValidKsaOrInternationalPhone,
  KSA_LOCAL_PHONE_CHARS_REGEX,
  normalizeQuotePhone,
  QUOTE_PHONE_ERROR_MESSAGE,
  quotePhoneSchema,
}

export const QUOTE_REQUEST_STATUS_VALUES = ['new', 'contacted', 'quoted', 'closed', 'spam'] as const
export type QuoteRequestStatus = (typeof QUOTE_REQUEST_STATUS_VALUES)[number]

export const QUOTE_EMAIL_STATUS_VALUES = ['pending', 'sent', 'failed'] as const
export type QuoteEmailStatus = (typeof QUOTE_EMAIL_STATUS_VALUES)[number]

export const QUOTE_LOCALE_VALUES = ['ar', 'en'] as const
export type QuoteLocale = (typeof QUOTE_LOCALE_VALUES)[number]

/**
 * Field-level access helper for staff workflow fields (`status`, `assignedTo`, `internalNotes`).
 */
export const isAdminOrEditorFieldLevel: FieldAccess = ({ req }) => {
  const user = req.user as { role?: string } | null | undefined
  return user?.role === 'admin' || user?.role === 'editor'
}

/**
 * Field-level access helper for customer and system fields (`Z1`, `Z4`, `Scope 3`):
 * readable by `admin` and `editor`, never writable via public/authenticated REST or
 * Local API with `overrideAccess: false`.
 */
export const readOnlyFieldAccess = {
  read: isAdminOrEditorFieldLevel,
  create: (): boolean => false,
  update: (): boolean => false,
}

export const workflowFieldAccess = {
  read: isAdminOrEditorFieldLevel,
  create: (): boolean => false,
  update: isAdminOrEditorFieldLevel,
}

export const validateQuotePhone = (value: unknown): true | string => {
  if (!isValidKsaOrInternationalPhone(value)) {
    return QUOTE_PHONE_ERROR_MESSAGE
  }
  return true
}

const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmailAddress(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false
  }
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= 254 && SIMPLE_EMAIL_REGEX.test(trimmed)
}

export const validateQuoteEmail = (value: unknown): true | string => {
  if (!isValidEmailAddress(value)) {
    return 'يرجى إدخال بريد إلكتروني صالح. / Please provide a valid email address.'
  }
  return true
}

export const validateQuoteConsent = (value: unknown): true | string => {
  if (value !== true) {
    return 'يجب الموافقة على سياسة الخصوصية ومعالجة البيانات. / Consent to the privacy policy is required.'
  }
  return true
}

const isNonEmptyInput = (val: unknown): boolean => val !== null && val !== undefined && val !== ''

const extractRelationshipId = (val: unknown): number | string | null => {
  if (typeof val === 'number' && Number.isInteger(val) && val > 0) {
    return val
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    const trimmed = val.trim()
    if (/^\d+$/.test(trimmed)) {
      const parsed = Number(trimmed)
      if (Number.isSafeInteger(parsed) && parsed > 0) {
        return parsed
      }
    }
    return trimmed
  }
  if (typeof val === 'object' && val !== null && 'id' in val) {
    return extractRelationshipId((val as { id?: unknown }).id)
  }
  return null
}

async function verifyRelatedDocExists(
  collection: 'services' | 'users',
  rawVal: unknown,
  fieldPath: string,
  req: PayloadRequest,
  locale?: QuoteLocale,
): Promise<Record<string, unknown>> {
  const relId = extractRelationshipId(rawVal)
  if (relId === null || typeof relId !== 'number') {
    throw new ValidationError({
      collection: 'quote-requests',
      errors: [
        {
          path: fieldPath,
          message: 'معرّف السجل المرتبط غير صالح. / Invalid related record ID.',
        },
      ],
      req,
    })
  }

  const found = await req.payload.find({
    collection,
    where: { id: { equals: relId } },
    limit: 1,
    depth: 0,
    locale: locale ?? DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    overrideAccess: true,
    req,
  })
  if (found.totalDocs === 0 || !found.docs[0]) {
    throw new ValidationError({
      collection: 'quote-requests',
      errors: [
        {
          path: fieldPath,
          message: 'السجل المرتبط غير موجود. / Referenced record does not exist.',
        },
      ],
      req,
    })
  }

  return found.docs[0] as unknown as Record<string, unknown>
}

const validateQuoteRequestBeforeValidate: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
}) => {
  if (!data || typeof data !== 'object') {
    return data
  }
  const mutable = data as Record<string, unknown>

  // Truncate userAgent to 300 characters per docs/02-content-model.md line 104
  if (typeof mutable.userAgent === 'string') {
    mutable.userAgent = mutable.userAgent.trim().slice(0, 300)
  }

  if (typeof mutable.name === 'string') {
    mutable.name = mutable.name.trim()
  }
  if (typeof mutable.company === 'string') {
    mutable.company = mutable.company.trim()
  }
  if (typeof mutable.email === 'string') {
    mutable.email = mutable.email.trim().toLowerCase()
  }
  if (typeof mutable.serviceTitle === 'string') {
    mutable.serviceTitle = mutable.serviceTitle.trim().slice(0, 200)
  }
  if (typeof mutable.sourcePage === 'string') {
    mutable.sourcePage = mutable.sourcePage.trim()
  }
  if (typeof mutable.emailLastError === 'string') {
    mutable.emailLastError = mutable.emailLastError.trim().slice(0, 500)
  }

  const errors: Array<{ path: string; message: string }> = []

  if (operation === 'create') {
    if (
      typeof mutable.name !== 'string' ||
      mutable.name.length === 0 ||
      mutable.name.length > 120
    ) {
      errors.push({
        path: 'name',
        message: 'الاسم الكامل مطلوب وبحد أقصى 120 حرفاً. / Name is required (max 120 chars).',
      })
    }
    if (!isValidEmailAddress(mutable.email)) {
      errors.push({
        path: 'email',
        message: 'يرجى إدخال بريد إلكتروني صالح. / Please provide a valid email address.',
      })
    }
    if (!isValidKsaOrInternationalPhone(mutable.phone)) {
      errors.push({
        path: 'phone',
        message:
          'يرجى إدخال رقم هاتف سعودي أو دولي صالح. / Please provide a valid KSA or international phone number.',
      })
    } else if (typeof mutable.phone === 'string') {
      mutable.phone = normalizeQuotePhone(mutable.phone)
    }
    if (mutable.consent !== true) {
      errors.push({
        path: 'consent',
        message:
          'يجب الموافقة على سياسة الخصوصية ومعالجة البيانات. / Consent to the privacy policy is required.',
      })
    }
  } else if (typeof mutable.phone === 'string' && isValidKsaOrInternationalPhone(mutable.phone)) {
    mutable.phone = normalizeQuotePhone(mutable.phone)
  }

  if ('status' in mutable && isNonEmptyInput(mutable.status)) {
    if (
      typeof mutable.status !== 'string' ||
      !(QUOTE_REQUEST_STATUS_VALUES as readonly string[]).includes(mutable.status)
    ) {
      errors.push({
        path: 'status',
        message: 'قيمة حالة الطلب غير صالحة. / Invalid quote request status value.',
      })
    }
  }

  if ('emailStatus' in mutable && isNonEmptyInput(mutable.emailStatus)) {
    if (
      typeof mutable.emailStatus !== 'string' ||
      !(QUOTE_EMAIL_STATUS_VALUES as readonly string[]).includes(mutable.emailStatus)
    ) {
      errors.push({
        path: 'emailStatus',
        message: 'قيمة حالة الإشعار البريدي غير صالحة. / Invalid email status value.',
      })
    }
  }

  if ('locale' in mutable && isNonEmptyInput(mutable.locale)) {
    if (
      typeof mutable.locale !== 'string' ||
      !(QUOTE_LOCALE_VALUES as readonly string[]).includes(mutable.locale)
    ) {
      errors.push({
        path: 'locale',
        message: 'قيمة اللغة غير صالحة (ar أو en). / Invalid locale value (ar or en).',
      })
    }
  }

  if ('ipHash' in mutable && isNonEmptyInput(mutable.ipHash)) {
    if (!isValidIpHash(mutable.ipHash)) {
      errors.push({
        path: 'ipHash',
        message:
          'يجب أن يكون ipHash تجزئة SHA-256 سداسية عشرية بطول 64 حرفاً (يُمنع تخزين عنوان IP الخام — D2). / ipHash must be a 64-character SHA-256 hex digest (raw IP storage is prohibited — D2).',
      })
    }
  }

  if (errors.length > 0) {
    throw new ValidationError({
      collection: 'quote-requests',
      errors,
      req,
    })
  }

  if ('service' in mutable && isNonEmptyInput(mutable.service)) {
    const requestLocale: QuoteLocale = mutable.locale === 'ar' ? 'ar' : DEFAULT_LOCALE
    const serviceDoc = await verifyRelatedDocExists(
      'services',
      mutable.service,
      'service',
      req,
      requestLocale,
    )
    if (operation === 'create' && !isNonEmptyInput(mutable.serviceTitle)) {
      const resolvedTitle = serviceDoc.title
      if (typeof resolvedTitle === 'string' && resolvedTitle.trim().length > 0) {
        mutable.serviceTitle = resolvedTitle.trim().slice(0, 200)
      }
    }
  }

  if ('assignedTo' in mutable && isNonEmptyInput(mutable.assignedTo)) {
    await verifyRelatedDocExists('users', mutable.assignedTo, 'assignedTo', req)
  }

  return mutable
}

export const QuoteRequests: CollectionConfig = withImmutableCreatedAt({
  slug: 'quote-requests',
  labels: {
    singular: {
      ar: 'طلب عرض سعر',
      en: 'Quote Request',
    },
    plural: {
      ar: 'طلبات عروض الأسعار',
      en: 'Quote Requests',
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'company',
      'service',
      'status',
      'assignedTo',
      'emailStatus',
      'createdAt',
    ],
    listSearchableFields: ['name', 'company', 'email', 'phone'],
    group: {
      ar: 'المبيعات',
      en: 'Sales',
    },
    description: {
      ar: 'طلبات عروض الأسعار الواردة من الموقع الإلكتروني (تُنشأ عبر الخادم فقط؛ يمكن للموظفين تحديث حالة المتابعة والملاحظات الداخلية).',
      en: 'Quote requests submitted via the website form (created server-side only; staff may update workflow status, assignee, and internal notes).',
    },
    components: {
      beforeListTable: ['/components/admin/QuoteRequestsFilterBar#QuoteRequestsFilterBar'],
    },
  },
  defaultSort: '-createdAt',
  timestamps: true,
  access: {
    // Z4: Never creatable through REST or Local API with overrideAccess: false.
    // Only the server-side quote handler creates records via Local API after validation.
    create: () => false,
    // Z1: Staff (admin + editor) can read and update workflow fields; only admin can delete.
    read: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [validateQuoteRequestBeforeValidate],
  },
  fields: [
    // =========================================================================
    // 1. Customer Submission Fields (read-only in admin and via API — Scope 1 & 3)
    // =========================================================================
    {
      name: 'name',
      type: 'text',
      label: {
        ar: 'اسم العميل',
        en: 'Customer Name',
      },
      required: true,
      maxLength: 120,
      access: readOnlyFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'company',
      type: 'text',
      label: {
        ar: 'اسم الشركة / الجهة',
        en: 'Company',
      },
      maxLength: 160,
      access: readOnlyFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'email',
      type: 'email',
      label: {
        ar: 'البريد الإلكتروني',
        en: 'Email Address',
      },
      required: true,
      access: readOnlyFieldAccess,
      validate: validateQuoteEmail,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'phone',
      type: 'text',
      label: {
        ar: 'رقم الهاتف / الجوال',
        en: 'Phone Number',
      },
      required: true,
      maxLength: 30,
      access: readOnlyFieldAccess,
      validate: validateQuotePhone,
      admin: {
        readOnly: true,
        description: {
          ar: 'رقم جوال سعودي أو دولي (مثال: +966 57 353 4185).',
          en: 'KSA or international phone number (e.g. +966 57 353 4185).',
        },
      },
    },
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      label: {
        ar: 'الخدمة المطلوبة',
        en: 'Requested Service',
      },
      index: true,
      access: readOnlyFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'serviceTitle',
      type: 'text',
      label: {
        ar: 'عنوان الخدمة وقت الطلب (نسخة محفوظة)',
        en: 'Service Title Snapshot',
      },
      maxLength: 200,
      access: readOnlyFieldAccess,
      admin: {
        readOnly: true,
        description: {
          ar: 'نسخة نصية لعنوان الخدمة بلغة الطلب لضمان بقاء السجل مقروءاً حتى لو حُذفت الخدمة لاحقاً (R-4).',
          en: 'Snapshot of the requested service title in the submission locale so history remains readable if the service is later deleted (R-4).',
        },
      },
    },
    {
      name: 'message',
      type: 'textarea',
      label: {
        ar: 'تفاصيل المشروع والرسالة',
        en: 'Project Details & Message',
      },
      maxLength: 3000,
      access: readOnlyFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'locale',
      type: 'select',
      label: {
        ar: 'لغة إرسال الطلب',
        en: 'Submission Locale',
      },
      required: true,
      defaultValue: DEFAULT_LOCALE,
      options: [
        {
          value: 'ar',
          label: {
            ar: 'العربية (ar)',
            en: 'Arabic (ar)',
          },
        },
        {
          value: 'en',
          label: {
            ar: 'الإنجليزية (en)',
            en: 'English (en)',
          },
        },
      ],
      access: readOnlyFieldAccess,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'sourcePage',
      type: 'text',
      label: {
        ar: 'صفحة المصدر (Source Page)',
        en: 'Source Page',
      },
      maxLength: 300,
      access: readOnlyFieldAccess,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'consent',
      type: 'checkbox',
      label: {
        ar: 'الموافقة على سياسة الخصوصية (PDPL)',
        en: 'Privacy Policy Consent (PDPL)',
      },
      required: true,
      defaultValue: false,
      access: readOnlyFieldAccess,
      validate: validateQuoteConsent,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },

    // =========================================================================
    // 2. Staff Workflow Fields (updatable by admin + editor — Scope 2 & 3)
    // =========================================================================
    {
      name: 'status',
      type: 'select',
      label: {
        ar: 'حالة المتابعة',
        en: 'Workflow Status',
      },
      required: true,
      defaultValue: 'new',
      index: true,
      access: workflowFieldAccess,
      options: [
        {
          value: 'new',
          label: {
            ar: 'جديد',
            en: 'New',
          },
        },
        {
          value: 'contacted',
          label: {
            ar: 'تم التواصل',
            en: 'Contacted',
          },
        },
        {
          value: 'quoted',
          label: {
            ar: 'تم إرسال العرض',
            en: 'Quoted',
          },
        },
        {
          value: 'closed',
          label: {
            ar: 'مغلق',
            en: 'Closed',
          },
        },
        {
          value: 'spam',
          label: {
            ar: 'غير مرغوب (Spam)',
            en: 'Spam',
          },
        },
      ],
      admin: {
        position: 'sidebar',
        components: {
          Cell: '/components/admin/QuoteStatusPillCell#QuoteStatusPillCell',
        },
      },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      label: {
        ar: 'المسؤول المعيّن للمتابعة',
        en: 'Assigned To',
      },
      index: true,
      access: workflowFieldAccess,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      label: {
        ar: 'ملاحظات المبيعات الداخلية (للموظفين فقط)',
        en: 'Internal Staff Notes (Staff Only)',
      },
      maxLength: 3000,
      access: workflowFieldAccess,
      admin: {
        description: {
          ar: 'ملاحظات داخلية لفريق المبيعات والمهندسين (لا تظهر للعميل أبداً — Q4).',
          en: 'Internal notes for sales and engineering staff (never exposed publicly — Q4).',
        },
      },
    },

    // =========================================================================
    // 3. System / Pipeline Fields (read-only in admin & via API — Scope 2 & 3)
    // =========================================================================
    {
      name: 'emailStatus',
      type: 'select',
      label: {
        ar: 'حالة إشعار البريد الإلكتروني',
        en: 'Email Notification Status',
      },
      required: true,
      defaultValue: 'pending',
      index: true,
      access: readOnlyFieldAccess,
      options: [
        {
          value: 'pending',
          label: {
            ar: 'قيد الإرسال',
            en: 'Pending',
          },
        },
        {
          value: 'sent',
          label: {
            ar: 'تم الإرسال',
            en: 'Sent',
          },
        },
        {
          value: 'failed',
          label: {
            ar: 'فشل الإرسال',
            en: 'Failed',
          },
        },
      ],
      admin: {
        readOnly: true,
        position: 'sidebar',
        components: {
          Cell: '/components/admin/EmailStatusPillCell#EmailStatusPillCell',
        },
      },
    },
    {
      name: 'emailAttempts',
      type: 'number',
      label: {
        ar: 'عدد محاولات إرسال البريد',
        en: 'Email Delivery Attempts',
      },
      defaultValue: 0,
      min: 0,
      access: readOnlyFieldAccess,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'emailLastError',
      type: 'textarea',
      label: {
        ar: 'آخر خطأ في إرسال البريد (مُعقّم)',
        en: 'Last Email Error (Sanitized)',
      },
      maxLength: 500,
      access: readOnlyFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'ipHash',
      type: 'text',
      label: {
        ar: 'تجزئة عنوان IP المملحة (SHA-256)',
        en: 'Salted IP Hash (SHA-256)',
      },
      maxLength: 64,
      index: true,
      access: readOnlyFieldAccess,
      admin: {
        readOnly: true,
        description: {
          ar: 'تجزئة SHA-256(IP + IP_HASH_SALT) — لا يتم تخزين عنوان IP الخام أبداً (D2).',
          en: 'SHA-256(IP + IP_HASH_SALT) — raw IP address is never stored (D2).',
        },
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      label: {
        ar: 'معرّف المتصفح (User-Agent)',
        en: 'User-Agent (Truncated 300)',
      },
      maxLength: 300,
      access: readOnlyFieldAccess,
      admin: {
        readOnly: true,
      },
    },
  ],
})
