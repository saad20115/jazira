import type { FooterProps, FooterSocialItem } from '@/components/Footer'
import type { SupportedLocale } from '@/i18n'

export interface StyleguideStrings {
  badge: string
  eyebrow: string
  title: string
  subtitle: string
  sectionLogo: string
  sectionButton: string
  sectionEyebrow: string
  sectionNavLink: string
  sectionNavbar: string
  sectionFooter: string
  sectionWhatsappFab: string
  sectionAccordion: string
  sectionIcons: string
  sampleEyebrow: string
  serviceIconsTitle: string
  socialIconsTitle: string
  directionalIconsTitle: string
  accordionSampleNumber1: string
  accordionSampleTitle1: string
  accordionSampleBody1: string
  accordionSampleNumber2: string
  accordionSampleTitle2: string
  accordionSampleBody2: string
  footerPreview: Omit<FooterProps, 'locale'>
  whatsappPreviewNumber: string
}

const PREVIEW_SOCIAL_LINKS: readonly FooterSocialItem[] = [
  { platform: 'linkedin', url: 'https://www.linkedin.com' },
  { platform: 'x', url: 'https://x.com' },
  { platform: 'instagram', url: 'https://www.instagram.com' },
  { platform: 'facebook', url: 'https://www.facebook.com' },
  { platform: 'whatsapp', url: 'https://wa.me/966500000000' },
]

const STYLEGUIDE_AR: StyleguideStrings = {
  badge: 'P3-T2 · دليل المكونات والأنماط التفاعلية (خاص ببيئة التطوير)',
  eyebrow: 'مكتبة المكونات الأساسية · P3-T2',
  title: 'مكونات الواجهة الأساسية وهيكل التصفح',
  subtitle:
    'جميع المتغيرات والحالات التفاعلية مطابقة لملفات Figma المرجعية مع دعم كامل للغة العربية (RTL) والخصائص المنطقية.',
  sectionLogo: '1. الشعار (Logo — Full / Compact / Icon × Primary / Reversed / Dark / Navy / White)',
  sectionButton:
    '2. الأزرار (Button — Gold / Dark / Glass / Outline × Default / Hover / Focus-Visible / Disabled)',
  sectionEyebrow: '3. شارة القسم (Eyebrow — Light / Dark)',
  sectionNavLink: '4. روابط التنقل (NavLink — Light / Dark × Default / Hover / Active)',
  sectionNavbar:
    '5. شريط التنقل العلوي (Navbar — Light & Dark × 5 Active Pages + Mobile Drawer)',
  sectionFooter: '6. تذييل الصفحة (Footer — 4 Columns + Icon-Only Socials + Bottom Bar)',
  sectionWhatsappFab: '7. زر واتساب العائم (WhatsAppFab — Idle / Pulse / Hover)',
  sectionAccordion: '8. الأكورديون (Accordion — Collapsed & Expanded)',
  sectionIcons: '9. الأيقونات (Service Icons 10 + Social Icons 5 + Directional RTL Flip)',
  sampleEyebrow: 'عنوان فرعي تجريبي (Eyebrow)',
  serviceIconsTitle: 'أيقونات الخدمات الهندسية (10)',
  socialIconsTitle: 'أيقونات التواصل الاجتماعي (5)',
  directionalIconsTitle: 'أيقونات الاتجاه (تنعكس تلقائياً في RTL)',
  accordionSampleNumber1: '01',
  accordionSampleTitle1: 'عنصر أكورديون مطوي (Collapsed State)',
  accordionSampleBody1: 'محتوى تجريبي لعنصر الأكورديون المطوي في صفحة دليل المكونات.',
  accordionSampleNumber2: '02',
  accordionSampleTitle2: 'عنصر أكورديون مفتوح (Expanded State)',
  accordionSampleBody2: 'محتوى تجريبي لعنصر الأكورديون المفتوح في صفحة دليل المكونات.',
  footerPreview: {
    siteName: 'شركة الجزيرة للإمداد الذكي',
    description: 'نص تعريفي تجريبي لتذييل الصفحة في بيئة التطوير لمعاينة تخطيط الأعمدة الأربعة.',
    phones: ['+966 50 000 0000'],
    emails: ['example@example.com'],
    address: 'المملكة العربية السعودية (معاينة دليل الأنماط)',
    whatsapp: '+966500000000',
    socialLinks: PREVIEW_SOCIAL_LINKS,
    ctaEyebrow: 'اطلب عرض سعر',
    ctaTitle: 'عنوان بطاقة الدعوة لاتخاذ إجراء (معاينة)',
    ctaBody: 'وصف تجريبي لبطاقة الدعوة لاتخاذ إجراء داخل تذييل الصفحة.',
    ctaButtonLabel: 'اطلب عرض سعر',
    copyright: '© نص حقوق النشر التجريبي لمعاينة دليل المكونات.',
  },
  whatsappPreviewNumber: '+966500000000',
}

const STYLEGUIDE_EN: StyleguideStrings = {
  badge: 'P3-T2 · Shell & Primitives Styleguide (Development Only)',
  eyebrow: 'DESIGN SYSTEM PRIMITIVES · P3-T2',
  title: 'Shell & Design-System Primitives Styleguide',
  subtitle:
    'Every Figma component variant and interactive state built with design tokens, CSS logical properties, and keyboard accessibility.',
  sectionLogo: '1. Logo (Full / Compact / Icon × Primary / Reversed / Dark / Navy / White)',
  sectionButton:
    '2. Button (Gold / Dark / Glass / Outline × Default / Hover / Focus-Visible / Disabled)',
  sectionEyebrow: '3. Eyebrow (Light / Dark)',
  sectionNavLink: '4. NavLink (Light / Dark × Default / Hover / Active)',
  sectionNavbar: '5. Navbar (Light & Dark × 5 Active Pages + Mobile Drawer)',
  sectionFooter: '6. Footer (4 Columns + Icon-Only Socials + Bottom Bar)',
  sectionWhatsappFab: '7. WhatsAppFab (Idle / Pulse / Hover)',
  sectionAccordion: '8. Accordion (Collapsed & Expanded)',
  sectionIcons: '9. Icons (10 Service Icons + 5 Social Icons + Directional RTL Flip)',
  sampleEyebrow: 'EYEBROW SPECIMEN LABEL',
  serviceIconsTitle: 'Service Icons (10)',
  socialIconsTitle: 'Social Icons (5)',
  directionalIconsTitle: 'Directional Icons (Auto-Flipped in RTL)',
  accordionSampleNumber1: '01',
  accordionSampleTitle1: 'Collapsed Accordion Item Specimen',
  accordionSampleBody1: 'Development styleguide preview content for the collapsed accordion panel.',
  accordionSampleNumber2: '02',
  accordionSampleTitle2: 'Expanded Accordion Item Specimen',
  accordionSampleBody2: 'Development styleguide preview content for the expanded accordion panel.',
  footerPreview: {
    siteName: 'Al Jazira for Imdad Smart Co.',
    description: 'Styleguide preview description demonstrating the 4-column dark footer layout.',
    phones: ['+966 50 000 0000'],
    emails: ['example@example.com'],
    address: 'Kingdom of Saudi Arabia (Styleguide Preview)',
    whatsapp: '+966500000000',
    socialLinks: PREVIEW_SOCIAL_LINKS,
    ctaEyebrow: 'GET A QUOTE',
    ctaTitle: 'Footer CTA Card Title Specimen',
    ctaBody: 'Styleguide preview copy for the footer call-to-action card.',
    ctaButtonLabel: 'Get a Quote',
    copyright: '© Styleguide preview copyright notice.',
  },
  whatsappPreviewNumber: '+966500000000',
}

export function getStyleguideStrings(locale: SupportedLocale): StyleguideStrings {
  return locale === 'ar' ? STYLEGUIDE_AR : STYLEGUIDE_EN
}
