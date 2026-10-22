import type { Field, GlobalConfig } from 'payload'

import { collapsibleSection } from '../fields/groups/collapsibleSection'
import { pageHeaderGroup } from '../fields/groups/pageHeader'
import { pillarFields } from '../fields/groups/pillar'
import { sectionIntroGroup } from '../fields/groups/sectionIntro'
import { paragraphRichTextField } from '../fields/richText'
import { seoGroupField } from '../fields/seo'
import { createRevalidateGlobalAfterChangeHook } from '../hooks/revalidate'
import { PAGES_ADMIN_GROUP, withPublishableGlobal } from './_shared/publishableGlobal'

function buildMissionOrVisionSubgroup(options: {
  label: { ar: string; en: string }
  name: 'mission' | 'vision'
  pillarsDbName: string
}): Field {
  const { label, name, pillarsDbName } = options
  return {
    name,
    type: 'group',
    label,
    fields: [
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
          ar: 'العنوان الفرعي للكتلة',
          en: 'Block Title',
        },
      },
      {
        name: 'text',
        type: 'textarea',
        localized: true,
        required: false,
        maxLength: 800,
        label: {
          ar: 'النص الرئيسي',
          en: 'Main Statement Text',
        },
      },
      {
        name: 'pillars',
        type: 'array',
        dbName: pillarsDbName,
        maxRows: 8,
        label: {
          ar: 'الركائز والمحاور (حتى 8 عناصر)',
          en: 'Pillars (Up to 8 items)',
        },
        labels: {
          singular: {
            ar: 'ركيزة',
            en: 'Pillar',
          },
          plural: {
            ar: 'الركائز',
            en: 'Pillars',
          },
        },
        validate: (val: unknown) => {
          if (Array.isArray(val) && val.length > 8) {
            return 'الحد الأقصى للركائز هو 8 عناصر. / Maximum 8 pillars allowed.'
          }
          return true
        },
        fields: pillarFields(),
      },
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        required: false,
        filterOptions: () => true,
        label: {
          ar: 'الصورة المرافقة (اختيارية)',
          en: 'Block Image (Optional)',
        },
      },
    ],
  }
}

export const AboutPage: GlobalConfig = withPublishableGlobal({
  slug: 'about-page',
  dbName: 'about_page',
  label: {
    ar: 'صفحة من نحن (About Page)',
    en: 'About Us Page',
  },
  admin: {
    group: PAGES_ADMIN_GROUP,
    description: {
      ar: 'محتوى وأقسام صفحة من نحن مرتبة حسب تصميم Figma (ترويسة الصفحة، قصتنا، نقاط القوة، الرسالة والرؤية، وفريق العمل).',
      en: 'About Us page sections in Figma order (Page Header, Our Story, Core Strengths, Mission & Vision, Meet Our Team, and SEO).',
    },
  },
  hooks: {
    afterChange: [
      createRevalidateGlobalAfterChangeHook({
        globalSlug: 'about-page',
        localizedPaths: ['/about'],
      }),
    ],
  },
  fields: [
    // 1. Page Header (21:1034)
    collapsibleSection(
      pageHeaderGroup({
        name: 'pageHeader',
        label: {
          ar: 'ترويسة صفحة من نحن (Page Header)',
          en: 'Page Header Section',
        },
      }),
    ),

    // 2. Our Story (21:1046)
    collapsibleSection({
      name: 'story',
      type: 'group',
      label: {
        ar: 'قسم قصتنا وتاريخ الشركة (Our Story)',
        en: 'Our Story Section',
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
          name: 'eyebrow',
          type: 'text',
          localized: true,
          required: false,
          maxLength: 120,
          label: {
            ar: 'الوسم العلوي الصغير (Eyebrow — قصتنا)',
            en: 'Eyebrow Label (Our Story)',
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
            ar: 'نص القصة (فقرات نصية فقط)',
            en: 'Story Text (Paragraphs Only)',
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
            en: 'Founder Quote',
          },
        },
        {
          name: 'quoteAuthor',
          type: 'text',
          localized: true,
          required: false,
          maxLength: 200,
          label: {
            ar: 'قائل الاقتباس وصفته (Quote Author)',
            en: 'Quote Author',
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
            en: 'Story Image',
          },
        },
      ],
    }),

    // 3. Core Strengths (21:1068)
    collapsibleSection(
      sectionIntroGroup({
        name: 'strengths',
        label: {
          ar: 'قسم نقاط القوة والمزايا التنافسية (Core Strengths)',
          en: 'Core Strengths Section',
        },
        extraFields: [
          {
            name: 'items',
            type: 'array',
            dbName: 'ap_str_items',
            maxRows: 6,
            label: {
              ar: 'بطاقات نقاط القوة (حتى 6 عناصر)',
              en: 'Strength Pillars (Up to 6 items)',
            },
            labels: {
              singular: {
                ar: 'نقطة قوة',
                en: 'Strength Item',
              },
              plural: {
                ar: 'نقاط القوة',
                en: 'Strength Items',
              },
            },
            validate: (val: unknown) => {
              if (Array.isArray(val) && val.length > 6) {
                return 'الحد الأقصى لنقاط القوة هو 6 عناصر. / Maximum 6 strength items allowed.'
              }
              return true
            },
            fields: pillarFields(),
          },
        ],
      }),
    ),

    // 4. Mission & Vision (108:1576)
    collapsibleSection(
      sectionIntroGroup({
        name: 'missionVision',
        label: {
          ar: 'قسم الرسالة والرؤية (Mission & Vision)',
          en: 'Mission & Vision Section',
        },
        extraFields: [
          buildMissionOrVisionSubgroup({
            name: 'mission',
            pillarsDbName: 'ap_miss_pil',
            label: {
              ar: 'أولاً: رسالتنا (Our Mission)',
              en: 'Our Mission',
            },
          }),
          buildMissionOrVisionSubgroup({
            name: 'vision',
            pillarsDbName: 'ap_vis_pil',
            label: {
              ar: 'ثانياً: رؤيتنا (Our Vision)',
              en: 'Our Vision',
            },
          }),
          {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
            required: false,
            filterOptions: () => true,
            label: {
              ar: 'الصورة الرئيسية للقسم',
              en: 'Section Image',
            },
          },
        ],
      }),
    ),

    // 5. Meet Our Team (21:1162)
    collapsibleSection(
      sectionIntroGroup({
        name: 'team',
        label: {
          ar: 'قسم فريق القيادة والكفاءات الهندسية (Meet Our Team)',
          en: 'Meet Our Team Section',
        },
        extraFields: [
          {
            name: 'staffTitle',
            type: 'text',
            localized: true,
            required: false,
            maxLength: 200,
            label: {
              ar: 'عنوان شريط فريق المهندسين والمختصين (Staff Marquee Title)',
              en: 'In-House Staff Section Title',
            },
          },
          {
            name: 'staffText',
            type: 'textarea',
            localized: true,
            required: false,
            maxLength: 500,
            label: {
              ar: 'وصف شريط فريق المهندسين والمختصين (Staff Marquee Text)',
              en: 'In-House Staff Section Description',
            },
          },
        ],
      }),
    ),

    // 6. SEO Meta
    collapsibleSection(seoGroupField()),
  ],
})
