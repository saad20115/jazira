import type { Field, GlobalConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'
import { validateExternalUrl } from '../fields/link'
import { createRevalidateGlobalAfterChangeHook } from '../hooks/revalidate'
import {
  createValidateGlobalDataBeforeValidateHook,
  SETTINGS_ADMIN_GROUP,
} from './_shared/publishableGlobal'

export const SOCIAL_PLATFORM_VALUES = [
  'linkedin',
  'x',
  'instagram',
  'facebook',
  'youtube',
  'tiktok',
  'snapchat',
  'whatsapp',
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORM_VALUES)[number]

const ALL_PUBLIC_LOCALIZED_PATHS = [
  '/',
  '/services',
  '/about',
  '/projects',
  '/contact',
  '/privacy',
] as const

const siteSettingsFields: Field[] = [
  {
    name: 'companyName',
    type: 'text',
    localized: true,
    required: true,
    maxLength: 200,
    defaultValue: 'Al Jazira for Imdad Smart Co.',
    label: {
      ar: 'الاسم الرسمي للشركة',
      en: 'Company Name',
    },
    admin: {
      description: {
        ar: 'اسم الشركة باللغتين العربية والإنجليزية كما يظهر في الترويسة والفوتر وحقوق النشر.',
        en: 'Official company name in Arabic and English used across header, footer, and metadata.',
      },
    },
  },
  {
    name: 'tagline',
    type: 'text',
    localized: true,
    required: false,
    maxLength: 280,
    label: {
      ar: 'الشعار اللفظي (Tagline — شاشة الترحيب والفوتر)',
      en: 'Company Tagline (Intro Splash & Footer)',
    },
    admin: {
      description: {
        ar: 'العبارة التعريفية المختصرة التي تظهر في شاشة الترحيب الافتتاحية (Intro) والفوتر (مثال: MEP CONTRACTING · FIREFIGHTING · SMART SYSTEMS).',
        en: 'Short tagline displayed on the intro splash screen and footer.',
      },
    },
  },
  {
    name: 'email',
    type: 'email',
    required: true,
    defaultValue: 'info@aljazira.co',
    label: {
      ar: 'البريد الإلكتروني الرسمي',
      en: 'Official Email',
    },
  },
  {
    name: 'phone',
    type: 'text',
    required: true,
    maxLength: 60,
    defaultValue: '+966 57 353 4185',
    label: {
      ar: 'رقم الهاتف الرسمي',
      en: 'Official Phone Number',
    },
  },
  {
    name: 'whatsapp',
    type: 'text',
    required: true,
    maxLength: 40,
    defaultValue: '966573534185',
    label: {
      ar: 'رقم واتساب (بصيغة دولية بدون +)',
      en: 'WhatsApp Number (International digits)',
    },
  },
  {
    name: 'whatsappLabel',
    type: 'text',
    localized: true,
    required: false,
    maxLength: 160,
    label: {
      ar: 'نص زر واتساب العائم وبطاقة التواصل',
      en: 'WhatsApp Button Label',
    },
    admin: {
      description: {
        ar: 'النص الظاهر بجانب أيقونة واتساب (مثال: تحدث مع مهندس مختص / Chat with an engineer).',
        en: 'Label displayed on the WhatsApp contact card and floating action button.',
      },
    },
  },
  {
    name: 'address',
    type: 'textarea',
    localized: true,
    required: false,
    maxLength: 400,
    label: {
      ar: 'العنوان المختصر (للفوتر وبطاقة التواصل)',
      en: 'Short Address (Footer & Contact Card)',
    },
  },
  {
    name: 'mapUrl',
    type: 'text',
    required: false,
    maxLength: 2048,
    label: {
      ar: 'رابط الموقع على خرائط Google (Map URL)',
      en: 'Google Maps URL',
    },
    validate: (val: unknown) =>
      validateExternalUrl(val, {
        allowedProtocols: ['http:', 'https:'],
        required: false,
      }),
  },
  {
    name: 'workingHours',
    type: 'text',
    localized: true,
    required: false,
    maxLength: 200,
    label: {
      ar: 'ساعات العمل الرسمية',
      en: 'Working Hours',
    },
    admin: {
      description: {
        ar: 'مثال: الأحد – الخميس، 8:00 صباحاً – 5:00 مساءً.',
        en: 'Example: Sunday – Thursday, 8:00 AM – 5:00 PM.',
      },
    },
  },
  {
    name: 'office',
    type: 'group',
    label: {
      ar: 'بيانات المقر الرئيسي والخريطة (Head Office)',
      en: 'Head Office & Map Details',
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        localized: true,
        required: false,
        maxLength: 200,
        label: {
          ar: 'عنوان بطاقة المقر الرئيسي',
          en: 'Office Card Title',
        },
      },
      {
        name: 'address',
        type: 'textarea',
        localized: true,
        required: false,
        maxLength: 400,
        label: {
          ar: 'عنوان المقر الرئيسي بالتفصيل',
          en: 'Full Office Address',
        },
      },
      {
        name: 'mapImage',
        type: 'upload',
        relationTo: 'media',
        required: false,
        filterOptions: () => true,
        label: {
          ar: 'صورة الخريطة (Map Image)',
          en: 'Office Map Image',
        },
      },
      {
        name: 'mapUrl',
        type: 'text',
        required: false,
        maxLength: 2048,
        label: {
          ar: 'رابط الاتجاهات على الخريطة (Get Directions URL)',
          en: 'Map Directions URL',
        },
        validate: (val: unknown) =>
          validateExternalUrl(val, {
            allowedProtocols: ['http:', 'https:'],
            required: false,
          }),
      },
    ],
  },
  {
    name: 'socials',
    type: 'array',
    dbName: 'site_socials',
    maxRows: 10,
    label: {
      ar: 'روابط الشبكات الاجتماعية',
      en: 'Social Media Links',
    },
    labels: {
      singular: {
        ar: 'حساب تواصل اجتماعي',
        en: 'Social Link',
      },
      plural: {
        ar: 'حسابات التواصل الاجتماعي',
        en: 'Social Links',
      },
    },
    validate: (val: unknown) => {
      if (Array.isArray(val) && val.length > 10) {
        return 'الحد الأقصى لحسابات التواصل الاجتماعي هو 10 روابط. / Maximum 10 social links allowed.'
      }
      return true
    },
    fields: [
      {
        name: 'platform',
        type: 'select',
        enumName: 'enum_site_settings_social_platform',
        required: true,
        label: {
          ar: 'المنصة',
          en: 'Platform',
        },
        options: [
          { label: { ar: 'لينكدإن (LinkedIn)', en: 'LinkedIn' }, value: 'linkedin' },
          { label: { ar: 'إكس (X / Twitter)', en: 'X (Twitter)' }, value: 'x' },
          { label: { ar: 'إنستغرام (Instagram)', en: 'Instagram' }, value: 'instagram' },
          { label: { ar: 'فيسبوك (Facebook)', en: 'Facebook' }, value: 'facebook' },
          { label: { ar: 'يوتيوب (YouTube)', en: 'YouTube' }, value: 'youtube' },
          { label: { ar: 'تيك توك (TikTok)', en: 'TikTok' }, value: 'tiktok' },
          { label: { ar: 'سناب شات (Snapchat)', en: 'Snapchat' }, value: 'snapchat' },
          { label: { ar: 'واتساب (WhatsApp)', en: 'WhatsApp' }, value: 'whatsapp' },
        ],
      },
      {
        name: 'url',
        type: 'text',
        required: true,
        maxLength: 2048,
        label: {
          ar: 'رابط الحساب',
          en: 'Profile URL',
        },
        validate: (val: unknown) =>
          validateExternalUrl(val, {
            allowedProtocols: ['http:', 'https:'],
            required: true,
          }),
      },
    ],
  },
  {
    name: 'footerText',
    type: 'textarea',
    localized: true,
    required: false,
    maxLength: 600,
    label: {
      ar: 'النص التعريفي في أسفل الموقع (Footer Text)',
      en: 'Footer Description Text',
    },
  },
  {
    name: 'copyright',
    type: 'text',
    localized: true,
    required: false,
    maxLength: 280,
    label: {
      ar: 'نص حقوق النشر (Copyright)',
      en: 'Copyright Notice',
    },
  },
  {
    name: 'defaultSeo',
    type: 'group',
    label: {
      ar: 'الإعدادات الافتراضية لمحركات البحث (Default SEO)',
      en: 'Default SEO Settings',
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        localized: true,
        required: false,
        maxLength: 160,
        label: {
          ar: 'عنوان الميتا الافتراضي (Default Meta Title)',
          en: 'Default Meta Title',
        },
      },
      {
        name: 'description',
        type: 'textarea',
        localized: true,
        required: false,
        maxLength: 320,
        label: {
          ar: 'وصف الميتا الافتراضي (Default Meta Description)',
          en: 'Default Meta Description',
        },
      },
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        required: false,
        filterOptions: () => true,
        label: {
          ar: 'صورة المشاركة الافتراضية (Default OG Image)',
          en: 'Default OpenGraph Image',
        },
      },
    ],
  },
]

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: {
    ar: 'إعدادات الموقع العامة',
    en: 'Site Settings',
  },
  admin: {
    group: SETTINGS_ADMIN_GROUP,
    description: {
      ar: 'البيانات الرسمية للشركة ومعلومات التواصل وساعات العمل وروابط الشبكات الاجتماعية وإعدادات SEO الافتراضية (تعديلها متاح لمدير النظام فقط).',
      en: 'Official company identity, contact details, office location, working hours, social links, and default SEO (editable by Admins only).',
    },
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  hooks: {
    beforeValidate: [
      createValidateGlobalDataBeforeValidateHook('site-settings', siteSettingsFields),
    ],
    afterChange: [
      createRevalidateGlobalAfterChangeHook({
        globalSlug: 'site-settings',
        localizedPaths: ALL_PUBLIC_LOCALIZED_PATHS,
        layoutPaths: ['/'],
      }),
    ],
  },
  fields: siteSettingsFields,
}
