import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access/index'
import {
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
} from '../hooks/revalidate'

export const MATERIAL_SYSTEM_OPTIONS = [
  {
    value: 'electrical',
    label: {
      ar: 'الأنظمة الكهربائية (Electrical)',
      en: 'Electrical',
    },
  },
  {
    value: 'mechanical',
    label: {
      ar: 'الأنظمة الميكانيكية (Mechanical)',
      en: 'Mechanical',
    },
  },
  {
    value: 'structural',
    label: {
      ar: 'الأعمال الإنشائية (Structural)',
      en: 'Structural',
    },
  },
  {
    value: 'architectural',
    label: {
      ar: 'الأعمال المعمارية (Architectural)',
      en: 'Architectural',
    },
  },
] as const

export type MaterialSystem = (typeof MATERIAL_SYSTEM_OPTIONS)[number]['value']

export const Materials: CollectionConfig = {
  slug: 'materials',
  timestamps: true,
  defaultSort: 'itemNo',
  labels: {
    singular: {
      ar: 'مادة معتمدة',
      en: 'Approved Material',
    },
    plural: {
      ar: 'المواد المعتمدة',
      en: 'Approved Materials',
    },
  },
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['itemNo', 'description', 'system', 'brands'],
    listSearchableFields: ['description', 'notes'],
    group: {
      ar: 'الشركة',
      en: 'Company',
    },
    description: {
      ar: 'جدول المواد والعلامات التجارية المعتمدة المعروض في صفحة الخدمات، مصنّفاً حسب النظام الهندسي (كهربائي، ميكانيكي، إنشائي، معماري). يمكنك تصفية القائمة حسب النظام من شريط التصفية.',
      en: 'Approved materials and manufacturers schedule displayed on the Services page, categorized by engineering system (Electrical, Mechanical, Structural, Architectural). Use the filter bar to filter by system.',
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
        collection: 'materials',
        paths: ['/ar/services', '/en/services'],
      }),
    ],
    afterDelete: [
      createRevalidateAfterDeleteHook({
        collection: 'materials',
        paths: ['/ar/services', '/en/services'],
      }),
    ],
  },
  fields: [
    {
      name: 'itemNo',
      type: 'number',
      required: true,
      unique: true,
      index: true,
      min: 1,
      label: {
        ar: 'رقم البند',
        en: 'Item No.',
      },
      admin: {
        step: 1,
        description: {
          ar: 'رقم البند التسلسلي الفريد في جدول المواد المعتمدة (تُرتب القائمة تصاعدياً حسب هذا الرقم).',
          en: 'Unique sequential item number in the approved materials schedule (default ascending sort).',
        },
      },
    },
    {
      name: 'system',
      type: 'select',
      required: true,
      index: true,
      label: {
        ar: 'النظام الهندسي',
        en: 'System',
      },
      options: [...MATERIAL_SYSTEM_OPTIONS],
      admin: {
        description: {
          ar: 'التصنيف الهندسي للمادة (يحدد علامة التبويب التي تظهر تحتها المادة في صفحة الخدمات).',
          en: 'Engineering discipline category (determines the filter tab on the Services page).',
        },
      },
    },
    {
      name: 'description',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 500,
      label: {
        ar: 'وصف المادة / الصنف',
        en: 'Material Description',
      },
      admin: {
        description: {
          ar: 'اسم أو وصف المادة الهندسية المعتمدة باللغتين العربية والإنجليزية.',
          en: 'Name or specification of the approved engineering material in Arabic and English.',
        },
      },
    },
    {
      name: 'brands',
      type: 'relationship',
      relationTo: 'brands',
      hasMany: true,
      required: true,
      minRows: 1,
      label: {
        ar: 'العلامات التجارية المعتمدة',
        en: 'Approved Brands',
      },
      admin: {
        description: {
          ar: 'اختر علامة تجارية واحدة أو أكثر من قائمة العلامات التجارية المعتمدة لهذا البند.',
          en: 'Select one or more approved brands/manufacturers for this material item.',
        },
      },
    },
    {
      name: 'notes',
      type: 'text',
      localized: true,
      required: false,
      maxLength: 500,
      label: {
        ar: 'ملاحظات',
        en: 'Notes',
      },
      admin: {
        description: {
          ar: 'ملاحظات إضافية اختيارية حول الاعتماد أو المواصفات.',
          en: 'Optional remarks regarding approval scope or specification notes.',
        },
      },
    },
  ],
}
