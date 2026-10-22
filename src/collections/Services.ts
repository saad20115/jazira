import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access/isAdminOrEditor'
import { publishedOrLoggedIn } from '../access/publishedOrLoggedIn'
import { SERVICE_ICON_OPTIONS } from '../components/icons/ServiceIcon'
import { orderField } from '../fields/order'
import { limitedRichTextField } from '../fields/richText'
import { slugFields } from '../fields/slug'
import {
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
} from '../hooks/revalidate'
import { publishableVersions } from './_shared/publishable'

export const Services: CollectionConfig = {
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
      defaultValue: 'main',
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
      defaultValue: 'mep',
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
  ],
}
