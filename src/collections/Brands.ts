import { APIError, type CollectionBeforeDeleteHook, type CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../access/index'
import { validateExternalUrl } from '../fields/link'
import { orderField } from '../fields/order'
import {
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
} from '../hooks/revalidate'

const preventBrandDeletionWhenUsedByMaterials: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const referencingMaterials = await req.payload.find({
    collection: 'materials',
    where: {
      brands: {
        equals: id,
      },
    },
    limit: 10,
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (referencingMaterials.totalDocs > 0) {
    const itemNumbers = referencingMaterials.docs
      .map((doc) => {
        const record = doc as unknown as { itemNo?: number }
        return typeof record.itemNo === 'number' ? `#${String(record.itemNo)}` : String(doc.id)
      })
      .join(', ')

    throw new APIError(
      `لا يمكن حذف هذه العلامة التجارية لأنها مستخدمة في ${String(referencingMaterials.totalDocs)} مادة معتمدة (البنود: ${itemNumbers}). يرجى إزالتها من تلك المواد أولاً. / Cannot delete this brand because it is referenced by ${String(referencingMaterials.totalDocs)} approved material(s) (items: ${itemNumbers}). Remove it from those materials first.`,
      400,
      undefined,
      true,
    )
  }
}

export const Brands: CollectionConfig = {
  slug: 'brands',
  timestamps: true,
  defaultSort: 'order',
  labels: {
    singular: {
      ar: 'علامة تجارية',
      en: 'Brand',
    },
    plural: {
      ar: 'العلامات التجارية',
      en: 'Brands',
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'origin', 'showInMarquee', 'order', 'updatedAt'],
    group: {
      ar: 'الشركة',
      en: 'Company',
    },
    description: {
      ar: 'العلامات التجارية والمصنّعون المعتمدون المرتبطون بجدول المواد المعتمدة في صفحة الخدمات وشريط الشركاء في الصفحة الرئيسية.',
      en: 'Approved manufacturers and partner brands linked to the approved materials schedule on the Services page and the partner marquee on the Home page.',
    },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeDelete: [preventBrandDeletionWhenUsedByMaterials],
    afterChange: [
      createRevalidateAfterChangeHook({
        collection: 'brands',
        paths: ['/ar', '/en', '/ar/services', '/en/services'],
      }),
    ],
    afterDelete: [
      createRevalidateAfterDeleteHook({
        collection: 'brands',
        paths: ['/ar', '/en', '/ar/services', '/en/services'],
      }),
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 160,
      label: {
        ar: 'اسم العلامة التجارية',
        en: 'Brand Name',
      },
      admin: {
        description: {
          ar: 'الاسم الرسمي للمصنّع أو العلامة التجارية (فريد وغير مكرر).',
          en: 'Unique official manufacturer or brand name.',
        },
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: {
        ar: 'الشعار',
        en: 'Logo',
      },
      admin: {
        description: {
          ar: 'اختياري — في حال عدم رفع شعار، يُعرض اسم العلامة التجارية نصياً في بطاقة الشركاء.',
          en: 'Optional — falls back to a styled wordmark tile when no logo image is uploaded.',
        },
      },
    },
    {
      name: 'origin',
      type: 'text',
      localized: true,
      required: false,
      maxLength: 120,
      label: {
        ar: 'بلد المنشأ',
        en: 'Country of Origin',
      },
      admin: {
        description: {
          ar: 'بلد أو منطقة منشأ العلامة التجارية (مثل: المملكة العربية السعودية، ألمانيا، الولايات المتحدة).',
          en: 'Country or region of origin (e.g., KSA, Germany, USA).',
        },
      },
    },
    {
      name: 'website',
      type: 'text',
      required: false,
      maxLength: 2048,
      label: {
        ar: 'الموقع الإلكتروني',
        en: 'Website URL',
      },
      admin: {
        description: {
          ar: 'رابط الموقع الرسمي للعلامة التجارية (يجب أن يبدأ بـ https:// أو http://).',
          en: 'Official website URL (must start with https:// or http://).',
        },
      },
      validate: (val: unknown) => {
        if (val === null || val === undefined || val === '') {
          return true
        }
        return validateExternalUrl(val, {
          allowedSchemes: ['http:', 'https:'],
          required: false,
        })
      },
    },
    {
      name: 'showInMarquee',
      type: 'checkbox',
      defaultValue: false,
      label: {
        ar: 'إظهار في شريط الشركاء بالصفحة الرئيسية',
        en: 'Show in Home Page Marquee',
      },
      admin: {
        position: 'sidebar',
        description: {
          ar: 'فعّل هذا الخيار لإظهار هذه العلامة التجارية في شريط الشركاء المتحرك بالصفحة الرئيسية.',
          en: 'Enable to display this brand in the scrolling partner marquee on the Home page.',
        },
      },
    },
    orderField(),
  ],
}
