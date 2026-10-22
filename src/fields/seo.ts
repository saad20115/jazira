import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { type Field, type GroupField, ValidationError } from 'payload'

/**
 * Builds the SEO plugin fields with bilingual Arabic + English labels (P2-T3 R-5)
 * and existence validation (`filterOptions: () => true`) on `meta.image`.
 */
export function buildLocalizedSeoFields(): Field[] {
  return [
    OverviewField({
      overrides: {
        label: {
          ar: 'نظرة عامة على تحسين محركات البحث (SEO Overview)',
          en: 'SEO Overview',
        },
      },
    }),
    MetaTitleField({
      hasGenerateFn: true,
      overrides: {
        label: {
          ar: 'عنوان الصفحة في محركات البحث (Meta Title)',
          en: 'Meta Title',
        },
      },
    }),
    MetaDescriptionField({
      hasGenerateFn: true,
      overrides: {
        label: {
          ar: 'وصف الصفحة في محركات البحث (Meta Description)',
          en: 'Meta Description',
        },
      },
    }),
    MetaImageField({
      hasGenerateFn: false,
      relationTo: 'media',
      overrides: {
        filterOptions: () => true,
        label: {
          ar: 'صورة المشاركة الاجتماعية (Meta Image)',
          en: 'Meta Image',
        },
        admin: {
          description: {
            ar: 'الصورة التي تظهر عند مشاركة الرابط في منصات التواصل (المقاس الموصى به 1200×630 بكسل، بحد أقصى 10 ميجابايت).',
            en: 'Social sharing preview image (recommended 1200×630 px, max 10 MB).',
          },
        },
      },
    }),
    PreviewField({
      hasGenerateFn: false,
      overrides: {
        label: {
          ar: 'معاينة نتيجة البحث (Search Preview)',
          en: 'Search Preview',
        },
      },
    }),
  ]
}

export function seoGroupField(): GroupField {
  return {
    name: 'meta',
    type: 'group',
    label: {
      ar: 'تحسين محركات البحث (SEO)',
      en: 'SEO',
    },
    hooks: {
      beforeValidate: [
        ({ collection, global, req, value }): Record<string, unknown> | null | undefined => {
          if (value === undefined) {
            return undefined
          }
          if (value === null) {
            return null
          }
          if (typeof value !== 'object' || Array.isArray(value)) {
            const globalSlug = (global as { slug?: string } | undefined)?.slug
            throw new ValidationError(
              {
                collection: collection?.slug,
                errors: [
                  {
                    path: 'meta',
                    message:
                      'يجب أن تكون بيانات تحسين محركات البحث (meta) كائناً صالحاً. / SEO metadata (meta) must be a valid object.',
                  },
                ],
                global: globalSlug,
                req,
              },
              req.t,
            )
          }
          return value as Record<string, unknown>
        },
      ],
    },
    fields: buildLocalizedSeoFields(),
  }
}
