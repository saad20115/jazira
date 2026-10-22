import type { GlobalConfig } from 'payload'

import { collapsibleSection } from '../fields/groups/collapsibleSection'
import { ctaGroup } from '../fields/groups/cta'
import { pageHeaderGroup } from '../fields/groups/pageHeader'
import { paragraphRichTextField } from '../fields/richText'
import { seoGroupField } from '../fields/seo'
import { createRevalidateGlobalAfterChangeHook } from '../hooks/revalidate'
import { PAGES_ADMIN_GROUP, withPublishableGlobal } from './_shared/publishableGlobal'

export const ProjectsPage: GlobalConfig = withPublishableGlobal({
  slug: 'projects-page',
  dbName: 'projects_page',
  label: {
    ar: 'صفحة المشاريع (Projects Page)',
    en: 'Projects Page',
  },
  admin: {
    group: PAGES_ADMIN_GROUP,
    description: {
      ar: 'محتوى وأقسام صفحة المشاريع مرتبة حسب تصميم Figma (ترويسة الصفحة، أثرنا بالأرقام، سجل الإنجازات، والدعوة للتواصل المشتركة مع صفحات تفاصيل المشاريع).',
      en: 'Projects page sections in Figma order (Page Header, Impact in Numbers, Portfolio, CTA shared with project detail pages, and SEO).',
    },
  },
  hooks: {
    afterChange: [
      createRevalidateGlobalAfterChangeHook({
        globalSlug: 'projects-page',
        localizedPaths: ['/projects'],
        layoutPaths: ['/projects'],
        extraTags: ['collection:projects'],
      }),
    ],
  },
  fields: [
    // 1. Page Header (19:556)
    collapsibleSection(
      pageHeaderGroup({
        name: 'pageHeader',
        label: {
          ar: 'ترويسة صفحة المشاريع (Page Header)',
          en: 'Page Header Section',
        },
      }),
    ),

    // 2. Impact in Numbers (19:884)
    collapsibleSection({
      name: 'impact',
      type: 'group',
      label: {
        ar: 'قسم أثرنا بالأرقام (Impact in Numbers)',
        en: 'Impact in Numbers Section',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: {
            ar: 'تفعيل وإظهار هذا القسم في الصفحة',
            en: 'Enable and display this section on the page',
          },
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
          required: false,
          maxLength: 200,
          label: {
            ar: 'عنوان القسم',
            en: 'Section Title',
          },
        },
        {
          name: 'text',
          type: 'textarea',
          localized: true,
          required: false,
          maxLength: 500,
          label: {
            ar: 'النص التمهيدي للقسم',
            en: 'Section Description',
          },
        },
        {
          name: 'stats',
          type: 'relationship',
          relationTo: 'stats',
          hasMany: true,
          maxRows: 4,
          required: false,
          label: {
            ar: 'الإحصائيات المعروضة (حتى 4 أرقام من مجموعة الأرقام)',
            en: 'Displayed Stats (Up to 4 items from Stats collection)',
          },
          validate: (val: unknown) => {
            if (Array.isArray(val) && val.length > 4) {
              return 'الحد الأقصى للإحصائيات المعروضة في هذا القسم هو 4 أرقام. / Maximum 4 stats allowed in this section.'
            }
            return true
          },
        },
      ],
    }),

    // 3. Portfolio (19:904)
    collapsibleSection({
      name: 'portfolio',
      type: 'group',
      label: {
        ar: 'قسم سجل الإنجازات والمحفظة الهندسية (Portfolio)',
        en: 'Portfolio Overview Section',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: {
            ar: 'تفعيل وإظهار هذا القسم في الصفحة',
            en: 'Enable and display this section on the page',
          },
        },
        {
          name: 'eyebrow',
          type: 'text',
          localized: true,
          required: false,
          maxLength: 120,
          label: {
            ar: 'الوسم العلوي الصغير (Eyebrow)',
            en: 'Eyebrow Label',
          },
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
          required: false,
          maxLength: 200,
          label: {
            ar: 'عنوان القسم',
            en: 'Section Title',
          },
        },
        paragraphRichTextField({
          name: 'text',
          localized: true,
          required: false,
          label: {
            ar: 'النص الوصفي للمحفظة (فقرات نصية فقط)',
            en: 'Portfolio Description (Paragraphs Only)',
          },
        }),
        {
          name: 'quote',
          type: 'textarea',
          localized: true,
          required: false,
          maxLength: 500,
          label: {
            ar: 'الاقتباس البارز (Quote)',
            en: 'Portfolio Quote',
          },
        },
        {
          name: 'quoteAuthor',
          type: 'text',
          localized: true,
          required: false,
          maxLength: 200,
          label: {
            ar: 'جهة أو قائل الاقتباس (Quote Author)',
            en: 'Quote Attribution',
          },
        },
        {
          name: 'badgeStat',
          type: 'relationship',
          relationTo: 'stats',
          required: false,
          label: {
            ar: 'الرقم البارز على الصورة (Badge Stat — من مجموعة الأرقام)',
            en: 'Badge Stat (Relationship to Stats)',
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: false,
          filterOptions: () => true,
          label: {
            ar: 'صورة القسم',
            en: 'Portfolio Section Image',
          },
        },
      ],
    }),

    // 4. CTA (19:926 & 20:995 — also used on Project Detail page)
    collapsibleSection(
      ctaGroup({
        name: 'cta',
        label: {
          ar: 'قسم الدعوة للتواصل وطلب عرض سعر (CTA — صفحة المشاريع وتفاصيل المشروع)',
          en: 'Call to Action Section (CTA — Projects & Project Detail)',
        },
      }),
    ),

    // 5. SEO Meta
    collapsibleSection(seoGroupField()),
  ],
})
