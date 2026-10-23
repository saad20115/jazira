import { type CollectionBeforeValidateHook, type CollectionConfig, ValidationError } from 'payload'

import { isAdminOrEditor } from '../access/isAdminOrEditor'
import { publishedOrLoggedIn } from '../access/publishedOrLoggedIn'
import { SERVICE_ICON_OPTIONS } from '../components/icons/ServiceIcon'
import { orderField } from '../fields/order'
import { bodyMediaField, limitedRichTextField } from '../fields/richText'
import { seoGroupField } from '../fields/seo'
import { slugFields } from '../fields/slug'
import {
  captureMainPublishedDocBeforeChange,
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
} from '../hooks/revalidate'
import { withImmutableCreatedAt } from './_shared/immutableTimestamps'
import { publishableVersions } from './_shared/publishable'

const SERVICE_TIER_VALUES = ['main', 'additional'] as const
const SERVICE_ICON_VALUES = SERVICE_ICON_OPTIONS.map((opt) => opt.value)

const extractPositiveIntId = (raw: unknown): number | null => {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) {
    return raw
  }
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
    const parsed = Number.parseInt(raw.trim(), 10)
    return parsed > 0 ? parsed : null
  }
  if (typeof raw === 'object' && raw !== null && 'id' in raw) {
    return extractPositiveIntId((raw as { id?: unknown }).id)
  }
  return null
}

const isNonEmptyInput = (raw: unknown): boolean => raw !== null && raw !== undefined && raw !== ''

const verifySingleMediaId = async (
  raw: unknown,
  fieldPath: string,
  req: Parameters<CollectionBeforeValidateHook>[0]['req'],
): Promise<void> => {
  const id = extractPositiveIntId(raw)
  if (id === null) {
    throw new ValidationError({
      collection: 'services',
      errors: [
        {
          path: fieldPath,
          message: 'معرّف ملف الوسائط غير صالح. / Invalid media reference ID.',
        },
      ],
      req,
    })
  }
  try {
    await req.payload.findByID({
      collection: 'media',
      id,
      depth: 0,
      overrideAccess: true,
      req,
    })
  } catch {
    throw new ValidationError({
      collection: 'services',
      errors: [
        {
          path: fieldPath,
          message:
            'ملف الوسائط المحدد غير موجود في مكتبة الوسائط. / The selected media item does not exist in the media library.',
        },
      ],
      req,
    })
  }
}

const validateServiceBeforeValidate: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!data || typeof data !== 'object') {
    return data
  }
  const mutable = data as Record<string, unknown>

  if ('tier' in mutable && isNonEmptyInput(mutable.tier)) {
    if (
      typeof mutable.tier !== 'string' ||
      !(SERVICE_TIER_VALUES as readonly string[]).includes(mutable.tier)
    ) {
      throw new ValidationError({
        collection: 'services',
        errors: [
          {
            path: 'tier',
            message: 'قيمة تصنيف الخدمة غير صالحة. / Invalid service tier value.',
          },
        ],
        req,
      })
    }
  }

  if ('icon' in mutable && isNonEmptyInput(mutable.icon)) {
    if (
      typeof mutable.icon !== 'string' ||
      !(SERVICE_ICON_VALUES as readonly string[]).includes(mutable.icon)
    ) {
      throw new ValidationError({
        collection: 'services',
        errors: [
          {
            path: 'icon',
            message: 'قيمة أيقونة الخدمة غير صالحة. / Invalid service icon value.',
          },
        ],
        req,
      })
    }
  }

  if ('image' in mutable && isNonEmptyInput(mutable.image)) {
    await verifySingleMediaId(mutable.image, 'image', req)
  }

  if ('meta' in mutable && typeof mutable.meta === 'object' && mutable.meta !== null) {
    const metaRecord = mutable.meta as Record<string, unknown>
    if ('image' in metaRecord && isNonEmptyInput(metaRecord.image)) {
      await verifySingleMediaId(metaRecord.image, 'meta.image', req)
    }
  }

  return mutable
}

export const Services: CollectionConfig = withImmutableCreatedAt({
  slug: 'services',
  labels: {
    singular: {
      ar: 'خدمة',
      en: 'Service',
    },
    plural: {
      ar: 'الخدمات',
      en: 'Services',
    },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tier', 'featured', 'icon', 'order', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'shortDescription', 'slug'],
    enableRichTextLink: true,
    group: {
      ar: 'المحتوى',
      en: 'Content',
    },
    description: {
      ar: 'الخدمات الرئيسية والتخصصية المعروضة في الصفحة الرئيسية وصفحة الخدمات.',
      en: 'Main and specialist services displayed on the Home and Services pages.',
    },
  },
  defaultSort: 'order',
  timestamps: true,
  versions: publishableVersions,
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeValidate: [validateServiceBeforeValidate],
    beforeChange: [captureMainPublishedDocBeforeChange],
    afterChange: [
      createRevalidateAfterChangeHook({
        collection: 'services',
        routePrefix: '/services',
        paths: ['/ar', '/en', '/ar/services', '/en/services'],
      }),
    ],
    afterDelete: [
      createRevalidateAfterDeleteHook({
        collection: 'services',
        routePrefix: '/services',
        paths: ['/ar', '/en', '/ar/services', '/en/services'],
      }),
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: {
        ar: 'اسم الخدمة',
        en: 'Service Title',
      },
      required: true,
      localized: true,
      maxLength: 200,
    },
    ...slugFields({ from: 'title' }),
    {
      name: 'tier',
      type: 'select',
      label: {
        ar: 'تصنيف الخدمة',
        en: 'Service Tier',
      },
      required: true,
      index: true,
      options: [
        {
          value: 'main',
          label: {
            ar: 'خدمة رئيسية (Main)',
            en: 'Main Service',
          },
        },
        {
          value: 'additional',
          label: {
            ar: 'خدمة تخصصية إضافية (Additional / Specialist)',
            en: 'Additional / Specialist Service',
          },
        },
      ],
      admin: {
        description: {
          ar: 'الخدمات الرئيسية تظهر كبطاقات تفصيلية؛ الخدمات الإضافية تظهر في شبكة الخدمات التخصصية.',
          en: 'Main services appear as primary feature sections; additional services appear in the specialist tiles grid.',
        },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: {
        ar: 'خدمة مميزة (Featured)',
        en: 'Featured',
      },
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: {
          ar: 'تمييز بطاقة الخدمة في شبكة الخدمات التخصصية (حالة Featured).',
          en: 'Highlights this service tile in the Featured state.',
        },
      },
    },
    {
      name: 'icon',
      type: 'select',
      label: {
        ar: 'أيقونة الخدمة',
        en: 'Service Icon',
      },
      required: true,
      options: SERVICE_ICON_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
      admin: {
        components: {
          Field: '/components/admin/ServiceIconField#ServiceIconField',
        },
        description: {
          ar: 'اختر أيقونة الخدمة من مجموعة الأيقونات المعتمدة (10 أيقونات).',
          en: 'Pick an icon from the 10 approved Figma service icons.',
        },
      },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      label: {
        ar: 'وصف مختصر',
        en: 'Short Description',
      },
      localized: true,
      maxLength: 200,
      admin: {
        description: {
          ar: 'ملخص موجز للخدمة يظهر في البطاقات (بحد أقصى 200 حرف).',
          en: 'Brief summary displayed on service cards (max 200 characters).',
        },
      },
    },
    {
      name: 'highlights',
      type: 'array',
      label: {
        ar: 'أبرز النقاط (Highlights)',
        en: 'Highlights',
      },
      labels: {
        singular: {
          ar: 'نقطة بارزة',
          en: 'Highlight',
        },
        plural: {
          ar: 'أبرز النقاط',
          en: 'Highlights',
        },
      },
      maxRows: 6,
      admin: {
        description: {
          ar: 'قائمة النقاط المختصرة للخدمة في صفحة الخدمات (بحد أقصى 6 نقاط).',
          en: 'Bullet highlights displayed on the Services page (up to 6 items).',
        },
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          label: {
            ar: 'النص',
            en: 'Text',
          },
          localized: true,
          required: true,
          maxLength: 240,
        },
      ],
    },
    limitedRichTextField({
      name: 'body',
      localized: true,
      label: {
        ar: 'الوصف التفصيلي للخدمة',
        en: 'Detailed Service Description',
      },
      overrides: {
        admin: {
          description: {
            ar: 'محتوى الخدمة التفصيلي (العناوين h2–h4، عريض، مائل، قوائم، اقتباس، روابط آمنة، وصور الوسائط فقط).',
            en: 'Detailed service content (h2–h4, bold, italic, lists, blockquote, safe links, and media uploads only).',
          },
        },
      },
    }),
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      filterOptions: () => true,
      label: {
        ar: 'صورة الخدمة',
        en: 'Service Image',
      },
      admin: {
        description: {
          ar: 'الصورة التوضيحية للخدمة في الصفحة الرئيسية وصفحة الخدمات.',
          en: 'Illustrative image for this service on the Home and Services pages.',
        },
      },
    },
    orderField(),
    seoGroupField(),
    bodyMediaField('body'),
  ],
})
