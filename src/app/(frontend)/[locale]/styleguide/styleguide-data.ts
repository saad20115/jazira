import type { CarouselServiceItem } from '@/components/ServicesCarousel'
import {
  buildDefaultFooterQuickLinks,
  type FooterProps,
  type FooterSocialItem,
} from '@/components/Footer'
import type { MarqueeBrandItem } from '@/components/LogoMarquee'
import type { MarqueeTeamItem } from '@/components/TeamMarquee'
import type { SupportedLocale } from '@/i18n'
import type { Brand, Project, Service, Team } from '@/payload-types'

/* ============================================================================
 * DEV-ONLY STYLEGUIDE MOCK DATA (`handoff/tasks/P3-T3.md` §6)
 * Clearly marked as mock data for `/[locale]/styleguide` visual verification only.
 * Never imported by any production page (`/[locale]/styleguide` is 404 in prod).
 * ============================================================================ */

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
  sectionServiceTile: string
  sectionServiceCard: string
  sectionProjectCard: string
  sectionPartnerAndBrandTile: string
  sectionLogoMarquee: string
  sectionAvatarPortraitMember: string
  sectionTeamCard: string
  sectionTeamMarquee: string
  sectionServicesCarousel: string
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
  footerTwoColumnsPreview: Omit<FooterProps, 'locale'>
  whatsappPreviewNumber: string
  mockServiceTile: Pick<Service, 'title' | 'slug' | 'icon' | 'shortDescription' | 'featured'>
  mockServiceCard: Pick<Service, 'title' | 'slug' | 'icon' | 'shortDescription' | 'image' | 'order'>
  mockProjectCompleted: Pick<
    Project,
    'title' | 'slug' | 'category' | 'location' | 'status' | 'coverImage'
  >
  mockProjectInProgress: Pick<
    Project,
    'title' | 'slug' | 'category' | 'location' | 'status' | 'coverImage'
  >
  mockPartnerBrand: Pick<Brand, 'name' | 'origin' | 'logo' | 'website'>
  mockPartnerSubtitle: string
  mockBrandTile: Pick<Brand, 'name' | 'origin' | 'logo' | 'website'>
  mockMarqueeRow1Brands: readonly MarqueeBrandItem[]
  mockMarqueeRow2Brands: readonly MarqueeBrandItem[]
  mockTeamCardMember: Pick<Team, 'name' | 'position' | 'photo' | 'linkedin' | 'bio'>
  mockTeamRowMembers: readonly Pick<
    Team,
    'id' | 'name' | 'position' | 'photo' | 'linkedin' | 'bio'
  >[]
  mockTeamMember: Pick<Team, 'name' | 'position' | 'photo'>
  mockTeamMarqueeRow1: readonly MarqueeTeamItem[]
  mockTeamMarqueeRow2: readonly MarqueeTeamItem[]
  mockCarouselServices: readonly CarouselServiceItem[]
  mockCarouselServices12: readonly CarouselServiceItem[]
  mockCarouselServices20: readonly CarouselServiceItem[]
}

const PREVIEW_SOCIAL_LINKS: readonly FooterSocialItem[] = [
  { platform: 'linkedin', url: 'https://www.linkedin.com' },
  { platform: 'x', url: 'https://x.com' },
  { platform: 'instagram', url: 'https://www.instagram.com' },
  { platform: 'facebook', url: 'https://www.facebook.com' },
  { platform: 'whatsapp', url: 'https://wa.me/966500000000' },
]

const MOCK_MARQUEE_ROW1_BRANDS_EN: readonly MarqueeBrandItem[] = [
  { id: 1, name: 'Saudi Cable', origin: 'KSA', logo: null, website: null },
  { id: 2, name: 'Riyadh Cables', origin: 'KSA', logo: null, website: null },
  { id: 3, name: 'Alfanar', origin: 'KSA', logo: null, website: null },
  { id: 4, name: 'Schneider Electric', origin: 'France', logo: null, website: null },
  { id: 5, name: 'ABB', origin: 'Switzerland', logo: null, website: null },
  { id: 6, name: 'Legrand', origin: 'France', logo: null, website: null },
  { id: 7, name: '3M', origin: 'USA', logo: null, website: null },
  { id: 8, name: 'Philips', origin: 'Netherlands', logo: null, website: null },
  { id: 9, name: 'Osram', origin: 'Germany', logo: null, website: null },
  { id: 10, name: 'Simplex', origin: 'USA', logo: null, website: null },
  { id: 11, name: 'Notifier', origin: 'USA', logo: null, website: null },
  { id: 12, name: 'Honeywell', origin: 'USA', logo: null, website: null },
]

const MOCK_MARQUEE_ROW2_BRANDS_EN: readonly MarqueeBrandItem[] = [
  { id: 13, name: 'Siemens', origin: 'Germany', logo: null, website: null },
  { id: 14, name: 'Bosch', origin: 'Germany', logo: null, website: null },
  { id: 15, name: 'Hikvision', origin: 'Global', logo: null, website: null },
  { id: 16, name: 'Pelco', origin: 'USA', logo: null, website: null },
  { id: 17, name: 'Grundfos', origin: 'Denmark', logo: null, website: null },
  { id: 18, name: 'Xylem', origin: 'USA', logo: null, website: null },
  { id: 19, name: 'KSB', origin: 'Germany', logo: null, website: null },
  { id: 20, name: 'Viking', origin: 'USA', logo: null, website: null },
  { id: 21, name: 'Tyco', origin: 'USA', logo: null, website: null },
  { id: 22, name: 'Potter', origin: 'USA', logo: null, website: null },
  { id: 23, name: 'NAFFCO', origin: 'UAE', logo: null, website: null },
  { id: 24, name: 'Carrier', origin: 'USA', logo: null, website: null },
]

const MOCK_MARQUEE_ROW1_BRANDS_AR: readonly MarqueeBrandItem[] = [
  { id: 1, name: 'الكابلات السعودية', origin: 'السعودية', logo: null, website: null },
  { id: 2, name: 'كابلات الرياض', origin: 'السعودية', logo: null, website: null },
  { id: 3, name: 'الفنار', origin: 'السعودية', logo: null, website: null },
  { id: 4, name: 'شنايدر إلكتريك', origin: 'فرنسا', logo: null, website: null },
  { id: 5, name: 'ABB', origin: 'سويسرا', logo: null, website: null },
  { id: 6, name: 'ليجراند', origin: 'فرنسا', logo: null, website: null },
  { id: 7, name: '3M', origin: 'أمريكا', logo: null, website: null },
  { id: 8, name: 'فيليبس', origin: 'هولندا', logo: null, website: null },
  { id: 9, name: 'أوسرام', origin: 'ألمانيا', logo: null, website: null },
  { id: 10, name: 'سيمبلكس', origin: 'أمريكا', logo: null, website: null },
  { id: 11, name: 'نوتيفاير', origin: 'أمريكا', logo: null, website: null },
  { id: 12, name: 'هانيويل', origin: 'أمريكا', logo: null, website: null },
]

const MOCK_MARQUEE_ROW2_BRANDS_AR: readonly MarqueeBrandItem[] = [
  { id: 13, name: 'سيمنز', origin: 'ألمانيا', logo: null, website: null },
  { id: 14, name: 'بوش', origin: 'ألمانيا', logo: null, website: null },
  { id: 15, name: 'هيكفيجن', origin: 'عالمي', logo: null, website: null },
  { id: 16, name: 'بيلكو', origin: 'أمريكا', logo: null, website: null },
  { id: 17, name: 'غروندفوس', origin: 'الدنمارك', logo: null, website: null },
  { id: 18, name: 'زايلم', origin: 'أمريكا', logo: null, website: null },
  { id: 19, name: 'KSB', origin: 'ألمانيا', logo: null, website: null },
  { id: 20, name: 'فايكنج', origin: 'أمريكا', logo: null, website: null },
  { id: 21, name: 'تايكو', origin: 'أمريكا', logo: null, website: null },
  { id: 22, name: 'بوتر', origin: 'أمريكا', logo: null, website: null },
  { id: 23, name: 'نافكو', origin: 'الإمارات', logo: null, website: null },
  { id: 24, name: 'كارير', origin: 'أمريكا', logo: null, website: null },
]

const MOCK_TEAM_MARQUEE_ROW1_EN: readonly MarqueeTeamItem[] = [
  { id: 1, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 2, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 3, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 4, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 5, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 6, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 7, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 8, name: 'Full Name', position: 'Role / Position', photo: null },
]

const MOCK_TEAM_MARQUEE_ROW2_EN: readonly MarqueeTeamItem[] = [
  { id: 9, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 10, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 11, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 12, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 13, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 14, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 15, name: 'Full Name', position: 'Role / Position', photo: null },
  { id: 16, name: 'Full Name', position: 'Role / Position', photo: null },
]

const MOCK_TEAM_MARQUEE_ROW1_AR: readonly MarqueeTeamItem[] = [
  { id: 1, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 2, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 3, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 4, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 5, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 6, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 7, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 8, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
]

const MOCK_TEAM_MARQUEE_ROW2_AR: readonly MarqueeTeamItem[] = [
  { id: 9, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 10, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 11, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 12, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 13, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 14, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 15, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
  { id: 16, name: 'الاسم الكامل', position: 'المسمى الوظيفي', photo: null },
]

const MOCK_CAROUSEL_SERVICES_EN: readonly CarouselServiceItem[] = [
  {
    id: 1,
    title: 'General Contracting',
    slug: 'general-contracting',
    icon: 'contracting',
    shortDescription:
      'Turn-key civil, structural and architectural execution for commercial, hospitality and industrial developments.',
    featured: true,
  },
  {
    id: 2,
    title: 'Electrical Systems',
    slug: 'electrical-systems',
    icon: 'electrical',
    shortDescription:
      'MV/LV distribution, switchgear, panels, transformers, cabling and lighting engineered to SEC & IEC standards.',
    featured: false,
  },
  {
    id: 3,
    title: 'HVAC & Mechanical',
    slug: 'hvac-mechanical',
    icon: 'hvac',
    shortDescription:
      'Chilled-water plants, VRF/DX, AHUs, ductwork and district cooling integration for critical environments.',
    featured: false,
  },
  {
    id: 4,
    title: 'Firefighting & Life Safety',
    slug: 'firefighting-life-safety',
    icon: 'fire',
    shortDescription:
      'UL/FM sprinkler networks, FM-200/Novec clean-agent suppression, fire pumps and Civil Defense compliance.',
    featured: false,
  },
  {
    id: 5,
    title: 'Plumbing & Drainage',
    slug: 'plumbing-drainage',
    icon: 'plumbing',
    shortDescription:
      'Domestic water, booster sets, drainage, greywater treatment and high-rise risers.',
    featured: false,
  },
  {
    id: 6,
    title: 'Smart & Low-Current',
    slug: 'smart-low-current',
    icon: 'smart',
    shortDescription:
      'BMS, addressable fire alarm, CCTV, access control, structured cabling, IPTV and AV integration.',
    featured: false,
  },
  {
    id: 7,
    title: 'Testing & Commissioning',
    slug: 'testing-commissioning',
    icon: 'testing',
    shortDescription:
      'TAB, authority witness testing, Civil Defense handover and O&M documentation.',
    featured: false,
  },
  {
    id: 8,
    title: 'Approved Material Supply',
    slug: 'approved-material-supply',
    icon: 'supply',
    shortDescription:
      'Direct supply from 45+ vendor-approved global manufacturers with warranty backing.',
    featured: false,
  },
]

const MOCK_CAROUSEL_SERVICES_AR: readonly CarouselServiceItem[] = [
  {
    id: 1,
    title: 'المقاولات العامة',
    slug: 'general-contracting',
    icon: 'contracting',
    shortDescription:
      'تنفيذ متكامل للأعمال المدنية والإنشائية والمعمارية للمشاريع التجارية والفندقية والصناعية.',
    featured: true,
  },
  {
    id: 2,
    title: 'الأنظمة الكهربائية',
    slug: 'electrical-systems',
    icon: 'electrical',
    shortDescription:
      'شبكات الجهد المتوسط والمنخفض، اللوحات، المحولات، الكابلات والإنارة وفق معايير SEC وIEC.',
    featured: false,
  },
  {
    id: 3,
    title: 'التكييف والميكانيكا',
    slug: 'hvac-mechanical',
    icon: 'hvac',
    shortDescription:
      'محطات المياه المبردة، أنظمة VRF/DX، وحدات مناولة الهواء ومجاري الهواء للبيئات الحرجة.',
    featured: false,
  },
  {
    id: 4,
    title: 'مكافحة الحريق والسلامة',
    slug: 'firefighting-life-safety',
    icon: 'fire',
    shortDescription:
      'شبكات الرش الآلي UL/FM، أنظمة الإطفاء بالغاز النظيف FM-200/Novec ومضخات الحريق المعتمدة.',
    featured: false,
  },
  {
    id: 5,
    title: 'السباكة والصرف الصحي',
    slug: 'plumbing-drainage',
    icon: 'plumbing',
    shortDescription:
      'شبكات المياه، مضخات الرفع، الصرف الصحي، معالجة المياه الرمادية وشبكات الأبراج العالية.',
    featured: false,
  },
  {
    id: 6,
    title: 'الأنظمة الذكية والتيار الخفيف',
    slug: 'smart-low-current',
    icon: 'smart',
    shortDescription:
      'إدارة المباني BMS، إنذار الحريق المعنون، المراقبة الأمنية، التحكم بالدخول، والشبكات.',
    featured: false,
  },
  {
    id: 7,
    title: 'الاختبار والتشغيل التجريبي',
    slug: 'testing-commissioning',
    icon: 'testing',
    shortDescription:
      'الاختبار والموازنة TAB، اختبارات الجهات المعتمدة، وتسليم الدفاع المدني والتوثيق.',
    featured: false,
  },
  {
    id: 8,
    title: 'توريد المواد المعتمدة',
    slug: 'approved-material-supply',
    icon: 'supply',
    shortDescription: 'توريد مباشر من المصنّعين العالميين المعتمدين مع ضمان المصنع والدعم الفني.',
    featured: false,
  },
]

const STYLEGUIDE_AR: StyleguideStrings = {
  badge: 'P3-T2 & P3-T3 · دليل المكونات والأنماط التفاعلية (خاص ببيئة التطوير — بيانات تجريبية)',
  eyebrow: 'مكتبة المكونات والبطاقات والحركة · P3-T2 & P3-T3',
  title: 'مكونات الواجهة الأساسية والبطاقات والحركة التفاعلية',
  subtitle:
    'جميع المتغيرات والحالات التفاعلية مطابقة لملفات Figma المرجعية مع دعم كامل للغة العربية (RTL) والخصائص المنطقية (بيانات تجريبية خاصة بدليل المكونات فقط).',
  sectionLogo:
    '1. الشعار (Logo — Full / Compact / Icon × Primary / Reversed / Dark / Navy / White)',
  sectionButton:
    '2. الأزرار (Button — Gold / Dark / Glass / Outline × Default / Hover / Focus-Visible / Disabled)',
  sectionEyebrow: '3. شارة القسم (Eyebrow — Light / Dark)',
  sectionNavLink: '4. روابط التنقل (NavLink — Light / Dark × Default / Hover / Active)',
  sectionNavbar: '5. شريط التنقل العلوي (Navbar — Light & Dark × 5 Active Pages + Mobile Drawer)',
  sectionFooter: '6. تذييل الصفحة (Footer — 4 Columns + Icon-Only Socials + Bottom Bar)',
  sectionWhatsappFab: '7. زر واتساب العائم (WhatsAppFab — Idle / Pulse / Hover)',
  sectionAccordion: '8. الأكورديون (Accordion — Collapsed & Expanded)',
  sectionIcons: '9. الأيقونات (Service Icons 10 + Social Icons 5 + Directional RTL Flip)',
  sectionServiceTile: '10. بطاقة الخدمة المختصرة (ServiceTile — Default & Featured · Mock Data)',
  sectionServiceCard: '11. بطاقة الخدمة المصورة (ServiceCard — Default & Hover · Mock Data)',
  sectionProjectCard:
    '12. بطاقة المشروع (ProjectCard — Completed & In Progress × Default & Hover · Mock Data)',
  sectionPartnerAndBrandTile:
    '13. بطاقة الشريك والعلامة التجارية (PartnerTile & BrandTile · Mock Data)',
  sectionLogoMarquee:
    '14. شريط العلامات التجارية المتحرك (LogoMarquee — Position A, Position B & Live · Mock Data)',
  sectionAvatarPortraitMember:
    '15. الصور الرمزية وبطاقة عضو الفريق (Avatar, Portrait & TeamMember · Mock Data)',
  sectionTeamCard:
    '16. بطاقة القيادة التنفيذية (TeamCard — Default, Hover & Enter 1..5 · Mock Data)',
  sectionTeamMarquee:
    '17. شريط الفريق الهندسي المتحرك (TeamMarquee — Position A, Position B & Live · Mock Data)',
  sectionServicesCarousel:
    '18. معرض الخدمات التفاعلي (ServicesCarousel — Position 1..5 & Live · Mock Data)',
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
    description:
      'شركة رائدة في المقاولات الكهروميكانيكية والمدنية وتوريد المواد الهندسية المعتمدة في المملكة العربية السعودية.',
    quickLinks: buildDefaultFooterQuickLinks('ar'),
    phones: ['+966 57 353 4185'],
    emails: ['info@aljazira.co'],
    address: '7676 بطحاء قريش، مكة المكرمة، المملكة العربية السعودية',
    whatsapp: '+966573534185',
    socialLinks: PREVIEW_SOCIAL_LINKS,
    ctaTitle: 'هل لديك مشروع قيد الدراسة؟',
    ctaBody: 'أرسل لنا المخططات أو جداول الكميات وسيقوم مهندسونا بالتواصل معك خلال يوم عمل واحد.',
    ctaButtonLabel: 'اطلب عرض سعر',
    ctaButtonHref: '/ar/contact#quote',
    copyright: '© 2026 شركة الجزيرة للإمداد الذكي. جميع الحقوق محفوظة.',
  },
  footerTwoColumnsPreview: {
    siteName: 'شركة الجزيرة للإمداد الذكي',
    description:
      'شركة رائدة في المقاولات الكهروميكانيكية والمدنية وتوريد المواد الهندسية المعتمدة في المملكة العربية السعودية.',
    footerColumns: [
      {
        id: 'ar-col-1',
        title: 'روابط سريعة',
        links: buildDefaultFooterQuickLinks('ar'),
      },
      {
        id: 'ar-col-2',
        title: 'خدماتنا',
        links: [
          { id: 'ar-s1', label: 'المقاولات العامة', href: '/ar/services' },
          { id: 'ar-s2', label: 'الأنظمة الكهربائية', href: '/ar/services' },
          { id: 'ar-s3', label: 'التكييف والميكانيكا', href: '/ar/services' },
          { id: 'ar-s4', label: 'مكافحة الحريق', href: '/ar/services' },
        ],
      },
    ],
    phones: ['+966 57 353 4185'],
    emails: ['info@aljazira.co'],
    address: '7676 بطحاء قريش، مكة المكرمة، المملكة العربية السعودية',
    whatsapp: '+966573534185',
    socialLinks: PREVIEW_SOCIAL_LINKS,
    ctaTitle: 'هل لديك مشروع قيد الدراسة؟',
    ctaBody: 'أرسل لنا المخططات أو جداول الكميات وسيقوم مهندسونا بالتواصل معك خلال يوم عمل واحد.',
    ctaButtonLabel: 'اطلب عرض سعر',
    ctaButtonHref: '/ar/contact#quote',
    copyright: '© 2026 شركة الجزيرة للإمداد الذكي. جميع الحقوق محفوظة.',
  },
  whatsappPreviewNumber: '+966500000000',
  mockServiceTile: {
    title: 'المقاولات العامة',
    slug: 'general-contracting',
    icon: 'contracting',
    shortDescription: 'تنفيذ متكامل للأعمال المدنية والإنشائية والمعمارية للمشاريع الكبرى.',
    featured: false,
  },
  mockServiceCard: {
    title: 'المقاولات العامة',
    slug: 'general-contracting',
    icon: 'contracting',
    shortDescription: 'حلول متكاملة للأعمال المدنية والإنشائية والمعمارية تسليم مفتاح',
    image: null,
    order: 0,
  },
  mockProjectCompleted: {
    title: 'فندق وأبراج سوفيتيل — مكة',
    slug: 'sofitel-hotel-makkah',
    category: 'mep',
    location: 'مكة المكرمة',
    status: 'completed',
    coverImage: 0,
  },
  mockProjectInProgress: {
    title: 'فندق وأبراج سوفيتيل — مكة',
    slug: 'sofitel-hotel-makkah',
    category: 'mep',
    location: 'مكة المكرمة',
    status: 'in-progress',
    coverImage: 0,
  },
  mockPartnerBrand: {
    name: 'Schneider Electric',
    origin: 'الأنظمة الكهربائية والتحكم',
    logo: null,
    website: null,
  },
  mockPartnerSubtitle: 'الأنظمة الكهربائية والتحكم',
  mockBrandTile: {
    name: 'Schneider Electric',
    origin: 'فرنسا',
    logo: null,
    website: null,
  },
  mockMarqueeRow1Brands: MOCK_MARQUEE_ROW1_BRANDS_AR,
  mockMarqueeRow2Brands: MOCK_MARQUEE_ROW2_BRANDS_AR,
  mockTeamCardMember: {
    name: 'الاسم الكامل',
    position: 'المسمى الوظيفي',
    photo: null,
    linkedin: 'https://www.linkedin.com',
    bio: null,
  },
  mockTeamRowMembers: [
    {
      id: 1,
      name: 'الاسم الكامل',
      position: 'المسمى الوظيفي',
      photo: null,
      linkedin: 'https://www.linkedin.com',
      bio: null,
    },
    {
      id: 2,
      name: 'الاسم الكامل',
      position: 'المسمى الوظيفي',
      photo: null,
      linkedin: 'https://www.linkedin.com',
      bio: null,
    },
    {
      id: 3,
      name: 'الاسم الكامل',
      position: 'المسمى الوظيفي',
      photo: null,
      linkedin: 'https://www.linkedin.com',
      bio: null,
    },
    {
      id: 4,
      name: 'الاسم الكامل',
      position: 'المسمى الوظيفي',
      photo: null,
      linkedin: 'https://www.linkedin.com',
      bio: null,
    },
    {
      id: 5,
      name: 'الاسم الكامل',
      position: 'المسمى الوظيفي',
      photo: null,
      linkedin: 'https://www.linkedin.com',
      bio: null,
    },
    {
      id: 6,
      name: 'الاسم الكامل',
      position: 'المسمى الوظيفي',
      photo: null,
      linkedin: 'https://www.linkedin.com',
      bio: null,
    },
  ],
  mockTeamMember: {
    name: 'الاسم الكامل',
    position: 'المسمى الوظيفي',
    photo: null,
  },
  mockTeamMarqueeRow1: MOCK_TEAM_MARQUEE_ROW1_AR,
  mockTeamMarqueeRow2: MOCK_TEAM_MARQUEE_ROW2_AR,
  mockCarouselServices: MOCK_CAROUSEL_SERVICES_AR,
  mockCarouselServices12: Array.from({ length: 12 }, (_, idx) => {
    const base = MOCK_CAROUSEL_SERVICES_AR[idx % MOCK_CAROUSEL_SERVICES_AR.length]
    return {
      ...base,
      id: idx + 1,
      slug: `${base.slug}-${String(idx + 1)}`,
    }
  }),
  mockCarouselServices20: Array.from({ length: 20 }, (_, idx) => {
    const base = MOCK_CAROUSEL_SERVICES_AR[idx % MOCK_CAROUSEL_SERVICES_AR.length]
    return {
      ...base,
      id: idx + 1,
      slug: `${base.slug}-${String(idx + 1)}`,
    }
  }),
}

const STYLEGUIDE_EN: StyleguideStrings = {
  badge: 'P3-T2 & P3-T3 · Shell, Cards & Motion Styleguide (Development Only — Mock Data)',
  eyebrow: 'DESIGN SYSTEM & MOTION · P3-T2 & P3-T3',
  title: 'Shell, Cards & Motion Components Styleguide',
  subtitle:
    'Every Figma component variant and interactive state built with design tokens, CSS logical properties, and keyboard accessibility (using styleguide-only mock data).',
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
  sectionServiceTile: '10. ServiceTile (Default & Featured · Mock Data)',
  sectionServiceCard: '11. ServiceCard (Default & Hover · Mock Data)',
  sectionProjectCard: '12. ProjectCard (Completed & In Progress × Default & Hover · Mock Data)',
  sectionPartnerAndBrandTile: '13. PartnerTile & BrandTile (Default & Hover · Mock Data)',
  sectionLogoMarquee: '14. LogoMarquee (Position A, Position B & Live · Mock Data)',
  sectionAvatarPortraitMember: '15. Avatar, Portrait & TeamMember (Placeholders · Mock Data)',
  sectionTeamCard: '16. TeamCard (Default, Hover & Enter 1..5 · Mock Data)',
  sectionTeamMarquee: '17. TeamMarquee (Position A, Position B & Live · Mock Data)',
  sectionServicesCarousel: '18. ServicesCarousel (Position 1..5 & Live · Mock Data)',
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
    description:
      'A leading MEP construction company in the Gulf region, delivering world-class mechanical, electrical, and plumbing solutions with over 45 years of experience.',
    quickLinks: buildDefaultFooterQuickLinks('en'),
    phones: ['+966 57 353 4185'],
    emails: ['info@aljazira.co'],
    address: '7676 Bathaa Quraish, Makkah Al-Mukarramah, KSA',
    whatsapp: '+966573534185',
    socialLinks: PREVIEW_SOCIAL_LINKS,
    ctaTitle: 'Have a project in mind?',
    ctaBody:
      'Send us your drawings or BOQ and our engineers will get back to you within one working day.',
    ctaButtonLabel: 'Get a Quote',
    ctaButtonHref: '/en/contact#quote',
    copyright: '© 2026 Al Jazira for Imdad Smart Company. All rights reserved.',
  },
  footerTwoColumnsPreview: {
    siteName: 'Al Jazira for Imdad Smart Co.',
    description:
      'A leading MEP construction company in the Gulf region, delivering world-class mechanical, electrical, and plumbing solutions with over 45 years of experience.',
    footerColumns: [
      {
        id: 'en-col-1',
        title: 'Quick Links',
        links: buildDefaultFooterQuickLinks('en'),
      },
      {
        id: 'en-col-2',
        title: 'Our Services',
        links: [
          { id: 'en-s1', label: 'General Contracting', href: '/en/services' },
          { id: 'en-s2', label: 'Electrical Systems', href: '/en/services' },
          { id: 'en-s3', label: 'HVAC & Mechanical', href: '/en/services' },
          { id: 'en-s4', label: 'Firefighting & Safety', href: '/en/services' },
        ],
      },
    ],
    phones: ['+966 57 353 4185'],
    emails: ['info@aljazira.co'],
    address: '7676 Bathaa Quraish, Makkah Al-Mukarramah, KSA',
    whatsapp: '+966573534185',
    socialLinks: PREVIEW_SOCIAL_LINKS,
    ctaTitle: 'Have a project in mind?',
    ctaBody:
      'Send us your drawings or BOQ and our engineers will get back to you within one working day.',
    ctaButtonLabel: 'Get a Quote',
    ctaButtonHref: '/en/contact#quote',
    copyright: '© 2026 Al Jazira for Imdad Smart Company. All rights reserved.',
  },
  whatsappPreviewNumber: '+966500000000',
  mockServiceTile: {
    title: 'General Contracting',
    slug: 'general-contracting',
    icon: 'contracting',
    shortDescription: 'Turn-key civil, structural & architectural delivery for major facilities.',
    featured: false,
  },
  mockServiceCard: {
    title: 'General Contracting',
    slug: 'general-contracting',
    icon: 'contracting',
    shortDescription: 'Civil, structural & architectural turn-key solutions',
    image: null,
    order: 0,
  },
  mockProjectCompleted: {
    title: 'Sofitel Hotel & Towers — Makkah',
    slug: 'sofitel-hotel-makkah',
    category: 'mep',
    location: 'Makkah',
    status: 'completed',
    coverImage: 0,
  },
  mockProjectInProgress: {
    title: 'Sofitel Hotel & Towers — Makkah',
    slug: 'sofitel-hotel-makkah',
    category: 'mep',
    location: 'Makkah',
    status: 'in-progress',
    coverImage: 0,
  },
  mockPartnerBrand: {
    name: 'Schneider Electric',
    origin: 'Electrical & Automation',
    logo: null,
    website: null,
  },
  mockPartnerSubtitle: 'Electrical & Automation',
  mockBrandTile: {
    name: 'Schneider Electric',
    origin: 'France',
    logo: null,
    website: null,
  },
  mockMarqueeRow1Brands: MOCK_MARQUEE_ROW1_BRANDS_EN,
  mockMarqueeRow2Brands: MOCK_MARQUEE_ROW2_BRANDS_EN,
  mockTeamCardMember: {
    name: 'Full Name',
    position: 'ROLE / POSITION',
    photo: null,
    linkedin: 'https://www.linkedin.com',
    bio: null,
  },
  mockTeamRowMembers: [
    {
      id: 1,
      name: 'Full Name',
      position: 'ROLE / POSITION',
      photo: null,
      linkedin: 'https://www.linkedin.com',
      bio: null,
    },
    {
      id: 2,
      name: 'Full Name',
      position: 'ROLE / POSITION',
      photo: null,
      linkedin: 'https://www.linkedin.com',
      bio: null,
    },
    {
      id: 3,
      name: 'Full Name',
      position: 'ROLE / POSITION',
      photo: null,
      linkedin: 'https://www.linkedin.com',
      bio: null,
    },
    {
      id: 4,
      name: 'Full Name',
      position: 'ROLE / POSITION',
      photo: null,
      linkedin: 'https://www.linkedin.com',
      bio: null,
    },
    {
      id: 5,
      name: 'Full Name',
      position: 'ROLE / POSITION',
      photo: null,
      linkedin: 'https://www.linkedin.com',
      bio: null,
    },
    {
      id: 6,
      name: 'Full Name',
      position: 'ROLE / POSITION',
      photo: null,
      linkedin: 'https://www.linkedin.com',
      bio: null,
    },
  ],
  mockTeamMember: {
    name: 'Full Name',
    position: 'Role / Position',
    photo: null,
  },
  mockTeamMarqueeRow1: MOCK_TEAM_MARQUEE_ROW1_EN,
  mockTeamMarqueeRow2: MOCK_TEAM_MARQUEE_ROW2_EN,
  mockCarouselServices: MOCK_CAROUSEL_SERVICES_EN,
  mockCarouselServices12: Array.from({ length: 12 }, (_, idx) => {
    const base = MOCK_CAROUSEL_SERVICES_EN[idx % MOCK_CAROUSEL_SERVICES_EN.length]
    return {
      ...base,
      id: idx + 1,
      slug: `${base.slug}-${String(idx + 1)}`,
    }
  }),
  mockCarouselServices20: Array.from({ length: 20 }, (_, idx) => {
    const base = MOCK_CAROUSEL_SERVICES_EN[idx % MOCK_CAROUSEL_SERVICES_EN.length]
    return {
      ...base,
      id: idx + 1,
      slug: `${base.slug}-${String(idx + 1)}`,
    }
  }),
}

export function getStyleguideStrings(locale: SupportedLocale): StyleguideStrings {
  return locale === 'ar' ? STYLEGUIDE_AR : STYLEGUIDE_EN
}
