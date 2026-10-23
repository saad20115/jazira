import type { GlobalConfig } from 'payload'

import { collapsibleSection } from '../fields/groups/collapsibleSection'
import { ctaGroup } from '../fields/groups/cta'
import { pageHeaderGroup } from '../fields/groups/pageHeader'
import { pillarFields } from '../fields/groups/pillar'
import { sectionIntroGroup } from '../fields/groups/sectionIntro'
import { seoGroupField } from '../fields/seo'
import { createRevalidateGlobalAfterChangeHook } from '../hooks/revalidate'
import { PAGES_ADMIN_GROUP, withPublishableGlobal } from './_shared/publishableGlobal'

export const ServicesPage: GlobalConfig = withPublishableGlobal({
  slug: 'services-page',
  dbName: 'services_page',
  label: {
    ar: 'صفحة الخدمات (Services Page)',
    en: 'Services Page',
  },
  admin: {
    group: PAGES_ADMIN_GROUP,
    description: {
      ar: 'محتوى وأقسام صفحة الخدمات مرتبة حسب تصميم Figma (ترويسة الصفحة، مقدمة الخدمات، الخدمات التخصصية، المواد المعتمدة، منهجية العمل، والدعوة للتواصل).',
      en: 'Services page sections in Figma order (Page Header, Services Intro, Specialist Services, Approved Materials, How We Work Process, CTA, and SEO).',
    },
  },
  hooks: {
    afterChange: [
      createRevalidateGlobalAfterChangeHook({
        globalSlug: 'services-page',
        localizedPaths: ['/services'],
      }),
    ],
  },
  fields: [
    // 1. Page Header (24:1478)
    collapsibleSection(
      pageHeaderGroup({
        name: 'pageHeader',
        label: {
          ar: 'ترويسة صفحة الخدمات (Page Header)',
          en: 'Page Header Section',
        },
      }),
    ),

    // 2. Services Intro (24:1490)
    collapsibleSection(
      sectionIntroGroup({
        name: 'servicesIntro',
        label: {
          ar: 'قسم مقدمة الخدمات الأساسية (Services Intro)',
          en: 'Main Services Intro Section',
        },
      }),
    ),

    // 3. Specialist Services (126:1887)
    collapsibleSection(
      sectionIntroGroup({
        name: 'specialist',
        label: {
          ar: 'قسم الخدمات التخصصية الإضافية (Specialist Services)',
          en: 'Specialist Services Section',
        },
      }),
    ),

    // 4. Approved Materials & Brands (157:3293)
    collapsibleSection(
      sectionIntroGroup({
        name: 'materials',
        label: {
          ar: 'قسم المواد والعلامات التجارية المعتمدة (Approved Materials & Brands)',
          en: 'Approved Materials & Brands Section',
        },
      }),
    ),

    // 5. How We Work / Process (24:1646)
    collapsibleSection(
      sectionIntroGroup({
        name: 'process',
        label: {
          ar: 'قسم منهجية العمل — كيف نعمل (How We Work / Process)',
          en: 'How We Work Process Section',
        },
        extraFields: [
          {
            name: 'steps',
            type: 'array',
            dbName: 'sp_proc_steps',
            maxRows: 8,
            label: {
              ar: 'خطوات منهجية العمل (حتى 8 خطوات — الرقم يُشتق تلقائياً من الترتيب)',
              en: 'Process Steps (Up to 8 Pillars — step number derived from array order)',
            },
            labels: {
              singular: {
                ar: 'خطوة عمل',
                en: 'Process Step',
              },
              plural: {
                ar: 'خطوات منهجية العمل',
                en: 'Process Steps',
              },
            },
            validate: (val: unknown) => {
              if (Array.isArray(val) && val.length > 8) {
                return 'الحد الأقصى لخطوات منهجية العمل هو 8 خطوات. / Maximum 8 process steps allowed.'
              }
              return true
            },
            fields: pillarFields(),
          },
        ],
      }),
    ),

    // 6. CTA (24:1677)
    collapsibleSection(
      ctaGroup({
        name: 'cta',
        label: {
          ar: 'قسم الدعوة للتواصل وطلب عرض سعر (CTA)',
          en: 'Call to Action Section (CTA)',
        },
      }),
    ),

    // 7. SEO Meta
    collapsibleSection(seoGroupField()),
  ],
})
