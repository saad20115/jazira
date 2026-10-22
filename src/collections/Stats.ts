import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access/index'
import { orderField } from '../fields/order'
import {
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
} from '../hooks/revalidate'

export const Stats: CollectionConfig = {
  slug: 'stats',
  timestamps: true,
  defaultSort: 'order',
  labels: {
    singular: {
      ar: 'إحصائية',
      en: 'Stat',
    },
    plural: {
      ar: 'الإحصائيات والأرقام',
      en: 'Stats',
    },
  },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['value', 'label', 'order', 'updatedAt'],
    group: {
      ar: 'الشركة',
      en: 'Company',
    },
    description: {
      ar: 'المصدر الموحّد لأرقام وإحصائيات الشركة (مثل: +45 عاماً من الخبرة، +100 مشروع، 85% تنفيذ ذاتي). تُختار هذه الأرقام في الصفحات دون الحاجة لتكرار كتابتها.',
      en: 'Single source of truth for company metrics (e.g., 45+ years, 100+ projects, 85% self-performed). Referenced across pages so numbers are never typed twice.',
    },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    afterChange: [
      createRevalidateAfterChangeHook({
        collection: 'stats',
        paths: ['/ar', '/en', '/ar/about', '/en/about', '/ar/projects', '/en/projects'],
      }),
    ],
    afterDelete: [
      createRevalidateAfterDeleteHook({
        collection: 'stats',
        paths: ['/ar', '/en', '/ar/about', '/en/about', '/ar/projects', '/en/projects'],
      }),
    ],
  },
  fields: [
    {
      name: 'value',
      type: 'text',
      required: true,
      maxLength: 40,
      label: {
        ar: 'القيمة الرقمية',
        en: 'Value',
      },
      admin: {
        description: {
          ar: 'الرقم أو النسبة المعروضة (مثال: 45+ أو 100+ أو 85%).',
          en: 'Displayed numeric figure or percentage (e.g., 45+, 100+, or 85%).',
        },
      },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 160,
      label: {
        ar: 'الوصف',
        en: 'Label',
      },
      admin: {
        description: {
          ar: 'وصف الإحصائية باللغتين العربية والإنجليزية (مثال: عاماً من الخبرة الهندسية / Years of Engineering Excellence).',
          en: 'Metric caption in Arabic and English (e.g., Years of Engineering Excellence).',
        },
      },
    },
    orderField(),
  ],
}
