import type { GlobalConfig } from 'payload'

import { collapsibleSection } from '../fields/groups/collapsibleSection'
import { pageHeaderGroup } from '../fields/groups/pageHeader'
import { bodyMediaField, limitedRichTextField } from '../fields/richText'
import { seoGroupField } from '../fields/seo'
import { createRevalidateGlobalAfterChangeHook } from '../hooks/revalidate'
import { PAGES_ADMIN_GROUP, withPublishableGlobal } from './_shared/publishableGlobal'

export const PrivacyPage: GlobalConfig = withPublishableGlobal({
  slug: 'privacy-page',
  dbName: 'privacy_page',
  label: {
    ar: 'صفحة سياسة الخصوصية (Privacy Page)',
    en: 'Privacy Policy Page',
  },
  admin: {
    group: PAGES_ADMIN_GROUP,
    description: {
      ar: 'محتوى صفحة سياسة الخصوصية والشروط (تبقى في حالة المسودة حتى اعتماد النص النهائي من العميل).',
      en: 'Privacy Policy page header, rich-text body, and SEO metadata (placeholder remains in draft until client legal text is approved).',
    },
  },
  hooks: {
    afterChange: [
      createRevalidateGlobalAfterChangeHook({
        globalSlug: 'privacy-page',
        localizedPaths: ['/privacy'],
      }),
    ],
  },
  fields: [
    // 1. Page Header
    collapsibleSection(
      pageHeaderGroup({
        name: 'pageHeader',
        label: {
          ar: 'ترويسة صفحة سياسة الخصوصية (Page Header)',
          en: 'Page Header Section',
        },
      }),
    ),

    // 2. Body Section (collapsible layout wrapper keeping `enabled` and `body` at root of `privacy-page` per Addendum line 238)
    {
      type: 'collapsible',
      label: {
        ar: 'قسم نص سياسة الخصوصية (Privacy Policy Body)',
        en: 'Privacy Policy Body Section',
      },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: {
            ar: 'تفعيل وإظهار محتوى سياسة الخصوصية',
            en: 'Enable and display privacy policy body',
          },
        },
        limitedRichTextField({
          name: 'body',
          localized: true,
          required: false,
          label: {
            ar: 'النص التفصيلي لسياسة الخصوصية',
            en: 'Privacy Policy Body Content',
          },
        }),
      ],
    },

    // 3. SEO Meta
    collapsibleSection(seoGroupField()),

    bodyMediaField('body'),
  ],
})
