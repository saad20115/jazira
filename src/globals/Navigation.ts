import type { Field, GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access/isAdminOrEditor'
import { buttonGroup } from '../fields/groups/button'
import { linkField } from '../fields/link'
import { createRevalidateGlobalAfterChangeHook } from '../hooks/revalidate'
import {
  createValidateGlobalDataBeforeValidateHook,
  SETTINGS_ADMIN_GROUP,
} from './_shared/publishableGlobal'

const ALL_PUBLIC_LOCALIZED_PATHS = [
  '/',
  '/services',
  '/about',
  '/projects',
  '/contact',
  '/privacy',
] as const

const navigationFields: Field[] = [
  {
    name: 'header',
    type: 'array',
    dbName: 'nav_header',
    maxRows: 8,
    label: {
      ar: 'روابط شريط التنقل العلوي (Header Links)',
      en: 'Header Navigation Links',
    },
    labels: {
      singular: {
        ar: 'رابط علوي',
        en: 'Header Link',
      },
      plural: {
        ar: 'روابط شريط التنقل العلوي',
        en: 'Header Links',
      },
    },
    admin: {
      description: {
        ar: 'تظهر الروابط في شريط التنقل العلوي بنفس ترتيبها هنا (حتى 8 روابط كحد أقصى).',
        en: 'Links are rendered in the top navbar in array order (up to 8 links).',
      },
    },
    validate: (val: unknown) => {
      if (Array.isArray(val) && val.length > 8) {
        return 'الحد الأقصى لروابط شريط التنقل العلوي هو 8 روابط. / Maximum 8 header links allowed.'
      }
      return true
    },
    fields: [
      {
        name: 'label',
        type: 'text',
        localized: true,
        required: true,
        maxLength: 80,
        label: {
          ar: 'عنوان الرابط',
          en: 'Link Label',
        },
      },
      linkField({
        name: 'link',
        includeLabel: false,
        required: true,
        internalRelations: ['services', 'projects'],
      }),
    ],
  },
  buttonGroup({
    name: 'headerCta',
    required: false,
    label: {
      ar: 'زر طلب عرض السعر في شريط التنقل العلوي (Navbar CTA)',
      en: 'Navbar CTA Button (Get a Quote)',
    },
  }),
  {
    name: 'footer',
    type: 'array',
    dbName: 'nav_footer',
    maxRows: 4,
    label: {
      ar: 'أعمدة روابط الفوتر (Footer Columns)',
      en: 'Footer Link Columns',
    },
    labels: {
      singular: {
        ar: 'عمود فوتر',
        en: 'Footer Column',
      },
      plural: {
        ar: 'أعمدة الفوتر',
        en: 'Footer Columns',
      },
    },
    admin: {
      description: {
        ar: 'أعمدة الروابط السريعة في أسفل الصفحة مرتبة حسب ترتيبها في القائمة (حتى 4 أعمدة).',
        en: 'Footer navigation columns ordered by array position (up to 4 columns).',
      },
    },
    validate: (val: unknown) => {
      if (Array.isArray(val) && val.length > 4) {
        return 'الحد الأقصى لأعمدة الفوتر هو 4 أعمدة. / Maximum 4 footer columns allowed.'
      }
      return true
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        localized: true,
        required: true,
        maxLength: 100,
        label: {
          ar: 'عنوان العمود',
          en: 'Column Title',
        },
      },
      {
        name: 'links',
        type: 'array',
        dbName: 'nav_ft_links',
        maxRows: 10,
        label: {
          ar: 'روابط العمود',
          en: 'Column Links',
        },
        labels: {
          singular: {
            ar: 'رابط فوتر',
            en: 'Footer Link',
          },
          plural: {
            ar: 'روابط العمود',
            en: 'Column Links',
          },
        },
        validate: (val: unknown) => {
          if (Array.isArray(val) && val.length > 10) {
            return 'الحد الأقصى للروابط داخل العمود الواحد هو 10 روابط. / Maximum 10 links per footer column.'
          }
          return true
        },
        fields: [
          {
            name: 'label',
            type: 'text',
            localized: true,
            required: true,
            maxLength: 80,
            label: {
              ar: 'عنوان الرابط',
              en: 'Link Label',
            },
          },
          linkField({
            name: 'link',
            includeLabel: false,
            required: true,
            internalRelations: ['services', 'projects'],
          }),
        ],
      },
    ],
  },
  {
    name: 'footerCta',
    type: 'group',
    label: {
      ar: 'بطاقة طلب عرض السعر في الفوتر (Footer CTA Card)',
      en: 'Footer CTA Card',
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        localized: true,
        required: false,
        maxLength: 160,
        label: {
          ar: 'عنوان البطاقة (مثال: هل لديك مشروع؟)',
          en: 'Card Heading (e.g. Have a project in mind?)',
        },
      },
      {
        name: 'text',
        type: 'textarea',
        localized: true,
        required: false,
        maxLength: 320,
        label: {
          ar: 'النص التوضيحي للبطاقة',
          en: 'Card Description',
        },
      },
      buttonGroup({
        name: 'button',
        required: false,
        label: {
          ar: 'زر البطاقة (اطلب عرض سعر)',
          en: 'Card Button (Get a Quote)',
        },
      }),
      {
        name: 'whatsappLabel',
        type: 'text',
        localized: true,
        required: false,
        maxLength: 120,
        label: {
          ar: 'نص رابط واتساب في البطاقة (مثال: تحدث عبر واتساب)',
          en: 'WhatsApp Link Text (e.g. Chat on WhatsApp)',
        },
      },
    ],
  },
]

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: {
    ar: 'قوائم التنقل والفوتر',
    en: 'Navigation & Footer Menus',
  },
  admin: {
    group: SETTINGS_ADMIN_GROUP,
    description: {
      ar: 'روابط شريط التنقل العلوي (Header) وأعمدة الروابط في الفوتر (Footer) مرتبة حسب ترتيبها في القائمة.',
      en: 'Header navigation links and footer link columns ordered by array position.',
    },
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  hooks: {
    beforeValidate: [createValidateGlobalDataBeforeValidateHook('navigation', navigationFields)],
    afterChange: [
      createRevalidateGlobalAfterChangeHook({
        globalSlug: 'navigation',
        localizedPaths: ALL_PUBLIC_LOCALIZED_PATHS,
        layoutPaths: ['/'],
      }),
    ],
  },
  fields: navigationFields,
}
