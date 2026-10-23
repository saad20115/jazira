import type { GlobalConfig } from 'payload'

import { collapsibleSection } from '../fields/groups/collapsibleSection'
import { pageHeaderGroup } from '../fields/groups/pageHeader'
import { sectionIntroGroup } from '../fields/groups/sectionIntro'
import { seoGroupField } from '../fields/seo'
import { createRevalidateGlobalAfterChangeHook } from '../hooks/revalidate'
import { PAGES_ADMIN_GROUP, withPublishableGlobal } from './_shared/publishableGlobal'

export const ContactPage: GlobalConfig = withPublishableGlobal({
  slug: 'contact-page',
  dbName: 'contact_page',
  label: {
    ar: 'صفحة تواصل معنا (Contact Page)',
    en: 'Contact Us Page',
  },
  admin: {
    group: PAGES_ADMIN_GROUP,
    description: {
      ar: 'محتوى وأقسام صفحة تواصل معنا مرتبة حسب تصميم Figma (ترويسة الصفحة، قسم تواصل معنا، وقسم موقع المقر الرئيسي). تفاصيل الهاتف والبريد والعنوان تأتي من إعدادات الموقع العامة.',
      en: 'Contact Us page sections in Figma order (Page Header, Get in Touch, Find Our Office, and SEO). Contact details come from Site Settings.',
    },
  },
  hooks: {
    afterChange: [
      createRevalidateGlobalAfterChangeHook({
        globalSlug: 'contact-page',
        localizedPaths: ['/contact'],
      }),
    ],
  },
  fields: [
    // 1. Page Header (23:1366)
    collapsibleSection(
      pageHeaderGroup({
        name: 'pageHeader',
        label: {
          ar: 'ترويسة صفحة تواصل معنا (Page Header)',
          en: 'Page Header Section',
        },
      }),
    ),

    // 2. Get in Touch (23:1378)
    collapsibleSection(
      sectionIntroGroup({
        name: 'getInTouch',
        label: {
          ar: 'قسم تواصل معنا ونموذج طلب عرض السعر (Get in Touch)',
          en: 'Get in Touch Section',
        },
      }),
    ),

    // 3. Find Our Office (23:1441)
    collapsibleSection(
      sectionIntroGroup({
        name: 'findOffice',
        label: {
          ar: 'قسم موقع المكتب الرئيسي والخريطة (Find Our Office)',
          en: 'Find Our Office Section',
        },
      }),
    ),

    // 4. SEO Meta
    collapsibleSection(seoGroupField()),
  ],
})
