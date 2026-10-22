import type { Access, CollectionConfig, UploadFieldSingleValidation } from 'payload'

import { isAdminOrEditor } from '../access/isAdminOrEditor'
import { validateExternalUrl } from '../fields/link'
import { orderField } from '../fields/order'
import {
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
} from '../hooks/revalidate'

export const activeOrLoggedIn: Access = ({ req }) => {
  if (isAdminOrEditor({ req })) {
    return true
  }
  return {
    active: {
      equals: true,
    },
  }
}

export function validateLinkedInUrl(value: unknown): true | string {
  if (value === null || value === undefined || value === '') {
    return true
  }
  const baseCheck = validateExternalUrl(value, {
    allowedProtocols: ['https:', 'http:'],
    required: false,
  })
  if (baseCheck !== true) {
    return baseCheck
  }
  const parsed = new URL((value as string).trim())
  const host = parsed.hostname.toLowerCase()
  if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) {
    return 'يجب أن يكون رابط لينكدإن تابعاً للنطاق linkedin.com. / LinkedIn URL must belong to linkedin.com.'
  }
  return true
}

export const Team: CollectionConfig = {
  slug: 'team',
  labels: {
    singular: {
      ar: 'عضو فريق',
      en: 'Team Member',
    },
    plural: {
      ar: 'فريق العمل',
      en: 'Team',
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'position', 'tier', 'active', 'order', 'updatedAt'],
    listSearchableFields: ['name', 'position', 'bio'],
    group: {
      ar: 'الشركة',
      en: 'Company',
    },
    description: {
      ar: 'أعضاء القيادة التنفيذية وفريق العمل المعروضون في صفحة من نحن والصفحة الرئيسية.',
      en: 'Executive leadership cards and staff marquee members displayed on the About and Home pages.',
    },
  },
  defaultSort: 'order',
  timestamps: true,
  access: {
    read: activeOrLoggedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    afterChange: [
      createRevalidateAfterChangeHook({
        collection: 'team',
        paths: ['/ar/about', '/en/about', '/ar', '/en'],
      }),
    ],
    afterDelete: [
      createRevalidateAfterDeleteHook({
        collection: 'team',
        paths: ['/ar/about', '/en/about', '/ar', '/en'],
      }),
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: {
        ar: 'الاسم الكامل',
        en: 'Full Name',
      },
      required: true,
      localized: true,
      maxLength: 160,
    },
    {
      name: 'position',
      type: 'text',
      label: {
        ar: 'المسمى الوظيفي',
        en: 'Position / Role',
      },
      required: true,
      localized: true,
      maxLength: 160,
      admin: {
        description: {
          ar: 'مثال: رئيس مجلس الإدارة، الرئيس التنفيذي، المدير التجاري، مدير الهندسة، مدير مشروع.',
          en: 'e.g. Chairman, Chief Executive Officer, Commercial Director, Engineering Manager, Project Manager.',
        },
      },
    },
    {
      name: 'tier',
      type: 'select',
      label: {
        ar: 'الفئة',
        en: 'Tier',
      },
      required: true,
      index: true,
      defaultValue: 'leadership',
      options: [
        {
          value: 'leadership',
          label: {
            ar: 'القيادة التنفيذية (Leadership — بطاقات مصورة)',
            en: 'Leadership (Animated photo cards)',
          },
        },
        {
          value: 'staff',
          label: {
            ar: 'فريق العمل (Staff — شريط متحرك)',
            en: 'Staff (Moving marquee)',
          },
        },
      ],
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: {
        ar: 'الصورة الشخصية',
        en: 'Photo',
      },
      validate: (async (value, options) => {
        const siblingRecord = options.siblingData as Record<string, unknown> | undefined
        const dataRecord = options.data as Record<string, unknown> | undefined
        const effectiveTier = siblingRecord?.tier ?? dataRecord?.tier ?? 'leadership'
        if (effectiveTier === 'leadership') {
          if (value === null || value === undefined || value === '') {
            return 'الصورة الشخصية مطلوبة لأعضاء القيادة التنفيذية. / Photo is required for leadership team members.'
          }
        }
        if (value !== null && value !== undefined && value !== '') {
          const rawId = typeof value === 'object' ? (value as { id?: unknown }).id : value
          const numId = typeof rawId === 'number' ? rawId : Number(rawId)
          if (!Number.isInteger(numId) || numId < 1) {
            return 'معرّف الصورة الشخصية غير صالح. / Invalid photo media ID.'
          }
          const payloadObj = options.req.payload as unknown as {
            findByID?: (args: Record<string, unknown>) => Promise<unknown>
          }
          if (typeof payloadObj.findByID === 'function') {
            const mediaDoc = await payloadObj.findByID({
              collection: 'media',
              depth: 0,
              disableErrors: true,
              id: numId,
              overrideAccess: true,
            })
            if (!mediaDoc) {
              return 'الصورة المحددة غير موجودة في مكتبة الوسائط. / Selected photo does not exist in media.'
            }
          }
        }
        return true
      }) as UploadFieldSingleValidation,
      admin: {
        description: {
          ar: 'مطلوبة لأعضاء القيادة التنفيذية، واختيارية لأعضاء فريق العمل (يظهر الحرف الأول عند عدم توفرها).',
          en: 'Required for leadership members; optional for staff (renders an initials avatar when omitted).',
        },
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      label: {
        ar: 'النبذة التعريفية',
        en: 'Short Bio',
      },
      localized: true,
      maxLength: 400,
      admin: {
        condition: (data, siblingData) => {
          const siblingRecord = siblingData as Record<string, unknown> | undefined
          const dataRecord = data as Record<string, unknown> | undefined
          const tier = siblingRecord?.tier ?? dataRecord?.tier
          return tier === 'leadership'
        },
        description: {
          ar: 'نبذة مختصرة تظهر في بطاقة عضو القيادة التنفيذية (بحد أقصى 400 حرف).',
          en: 'Brief biography shown on the leadership card (max 400 characters).',
        },
      },
    },
    {
      name: 'linkedin',
      type: 'text',
      label: {
        ar: 'رابط لينكدإن (LinkedIn)',
        en: 'LinkedIn URL',
      },
      validate: (value: unknown) => validateLinkedInUrl(value),
      admin: {
        placeholder: 'https://www.linkedin.com/in/...',
        description: {
          ar: 'رابط الملف الشخصي على موقع linkedin.com (اختياري).',
          en: 'Profile URL on linkedin.com (optional).',
        },
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: {
        ar: 'نشط (يظهر في الموقع)',
        en: 'Active (visible on website)',
      },
      defaultValue: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: {
          ar: 'إلغاء التفعيل يخفي العضو من الموقع العام دون حذف بياناته.',
          en: 'Unchecking hides this member from the public website without deleting the record.',
        },
      },
    },
    orderField(),
  ],
}
