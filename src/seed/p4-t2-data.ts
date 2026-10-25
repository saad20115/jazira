import 'server-only'

import type { ProjectCategory, ProjectScope } from '../collections/Projects'
import type { Service } from '../payload-types'

type ServiceIconName = NonNullable<Service['icon']>

export const P4_T2_DATA_SERVER_ONLY_SENTINEL =
  '__ALJAZIRA_SERVER_ONLY_MODULE_SENTINEL_S4_P4_T2_DATA__' as const

export interface RawProjectRow {
  ref: string
  name: string
  printed: string
  location: string
  company: string
  scope: string
  status: string
  source: string
}

export interface RawProjectsJsonFile {
  _about: string
  count: number
  projects: RawProjectRow[]
}

export interface RawProjectPhotoEntry {
  file: string
  project: string
  captionAsPrinted: string
  width: number
  height: number
  question: string | null
}

export interface RawProjectPhotosManifest {
  _about: string
  photos: RawProjectPhotoEntry[]
}

export interface MarqueeBrandSpec {
  order: number
  name: string
  matchExistingNames: readonly string[]
  originEn: string
  originAr: string
}

/**
 * Scope 4b (`handoff/tasks/P4-T2.md` lines 66–75):
 * The 20 owner-approved marquee brands (2026-10-24) in exact order (`1..20`),
 * with their well-known HQ countries in English and Arabic.
 */
export const OWNER_MARQUEE_BRANDS_20: readonly MarqueeBrandSpec[] = [
  {
    order: 1,
    name: 'Schneider Electric',
    matchExistingNames: ['Schneider Electric'],
    originEn: 'France',
    originAr: 'فرنسا',
  },
  {
    order: 2,
    name: 'ABB',
    matchExistingNames: ['ABB'],
    originEn: 'Switzerland',
    originAr: 'سويسرا',
  },
  {
    order: 3,
    name: 'Siemens',
    matchExistingNames: ['Siemens'],
    originEn: 'Germany',
    originAr: 'ألمانيا',
  },
  {
    order: 4,
    name: 'Carrier',
    matchExistingNames: ['Carrier'],
    originEn: 'USA',
    originAr: 'الولايات المتحدة الأمريكية',
  },
  {
    order: 5,
    name: 'Trane',
    matchExistingNames: ['Trane'],
    originEn: 'USA',
    originAr: 'الولايات المتحدة الأمريكية',
  },
  {
    order: 6,
    name: 'Daikin',
    matchExistingNames: ['Daikin'],
    originEn: 'Japan',
    originAr: 'اليابان',
  },
  {
    order: 7,
    name: 'York',
    matchExistingNames: ['York'],
    originEn: 'USA',
    originAr: 'الولايات المتحدة الأمريكية',
  },
  {
    order: 8,
    name: 'Zamil Air Conditioners',
    matchExistingNames: ['Zamil Air Conditioners'],
    originEn: 'Saudi Arabia',
    originAr: 'المملكة العربية السعودية',
  },
  {
    order: 9,
    name: 'Grundfos',
    matchExistingNames: ['Grundfos'],
    originEn: 'Denmark',
    originAr: 'الدنمارك',
  },
  {
    order: 10,
    name: 'KSB',
    matchExistingNames: ['KSB'],
    originEn: 'Germany',
    originAr: 'ألمانيا',
  },
  {
    order: 11,
    name: 'NAFFCO',
    matchExistingNames: ['NAFFCO'],
    originEn: 'UAE',
    originAr: 'الإمارات العربية المتحدة',
  },
  {
    order: 12,
    name: 'Honeywell',
    matchExistingNames: ['Honeywell'],
    originEn: 'USA',
    originAr: 'الولايات المتحدة الأمريكية',
  },
  {
    order: 13,
    name: 'Legrand',
    matchExistingNames: ['Legrand'],
    originEn: 'France',
    originAr: 'فرنسا',
  },
  {
    order: 14,
    name: 'alfanar',
    matchExistingNames: ['alfanar', 'Alfanar'],
    originEn: 'Saudi Arabia',
    originAr: 'المملكة العربية السعودية',
  },
  {
    order: 15,
    name: 'Elsewedy Electric',
    matchExistingNames: ['Elsewedy Electric'],
    originEn: 'Egypt',
    originAr: 'مصر',
  },
  {
    order: 16,
    name: 'Riyadh Cables',
    matchExistingNames: ['Riyadh Cables'],
    originEn: 'Saudi Arabia',
    originAr: 'المملكة العربية السعودية',
  },
  {
    order: 17,
    name: 'Belden',
    matchExistingNames: ['Belden'],
    originEn: 'USA',
    originAr: 'الولايات المتحدة الأمريكية',
  },
  {
    order: 18,
    name: 'Cisco',
    matchExistingNames: ['Cisco'],
    originEn: 'USA',
    originAr: 'الولايات المتحدة الأمريكية',
  },
  {
    order: 19,
    name: 'Bosch',
    matchExistingNames: ['Bosch'],
    originEn: 'Germany',
    originAr: 'ألمانيا',
  },
  {
    order: 20,
    name: 'Crestron',
    matchExistingNames: ['Crestron'],
    originEn: 'USA',
    originAr: 'الولايات المتحدة الأمريكية',
  },
] as const

export interface SeedStatSpec {
  key: 'years' | 'projects' | 'selfPerformed' | 'disciplines' | 'countries'
  order: number
  value: string
  labelEn: string
  labelAr: string
}

/**
 * Scope 2 (`handoff/tasks/P4-T2.md` lines 34–36):
 * The 5 design stats from `design/copy/01-home.md` & `design/copy/04-projects.md`.
 */
export const SEED_STATS_5: readonly SeedStatSpec[] = [
  {
    key: 'years',
    order: 1,
    value: '45+',
    labelEn: 'Years of Experience',
    labelAr: 'عاماً من الخبرة',
  },
  {
    key: 'projects',
    order: 2,
    value: '100+',
    labelEn: 'Completed Projects',
    labelAr: 'مشروعاً منجزاً',
  },
  {
    key: 'selfPerformed',
    order: 3,
    value: '85%',
    labelEn: 'Self-Performed Work',
    labelAr: 'تنفيذ ذاتي بكوادرنا',
  },
  {
    key: 'disciplines',
    order: 4,
    value: '21+',
    labelEn: 'MEP Disciplines',
    labelAr: 'تخصصاً في أعمال الكهروميكانيك',
  },
  {
    key: 'countries',
    order: 5,
    value: '3',
    labelEn: 'Countries Served',
    labelAr: 'دول نخدمها في الخليج',
  },
] as const

export interface SeedServiceSpec {
  order: number
  slug: string
  tier: 'main' | 'additional'
  featured: boolean
  icon: ServiceIconName
  titleEn: string
  titleAr: string
  shortDescriptionEn: string
  shortDescriptionAr: string
  highlightsEn: readonly string[]
  highlightsAr: readonly string[]
  designImageKey?: 'about-team' | 'svc-mep' | 'svc-fire' | 'svc-smart'
}

/**
 * Scope 3 (`handoff/tasks/P4-T2.md` lines 37–39, `design/copy/02-services.md` lines 15–78):
 * The 4 main + 6 specialist services, seeded as `_status: 'draft'`.
 */
export const SEED_SERVICES_10: readonly SeedServiceSpec[] = [
  {
    order: 1,
    slug: 'general-contracting',
    tier: 'main',
    featured: false,
    icon: 'contracting',
    titleEn: 'General Contracting',
    titleAr: 'المقاولات العامة',
    shortDescriptionEn:
      'Execution of new construction projects adhering to the highest quality standards, with comprehensive project management from design to delivery.',
    shortDescriptionAr:
      'تنفيذ مشاريع الإنشاءات الجديدة وفق أعلى معايير الجودة، مع إدارة شاملة للمشاريع من مرحلة التصميم وحتى التسليم.',
    highlightsEn: [
      'New construction projects',
      'Project management from design to delivery',
      'Maintenance & upgrading of existing buildings',
      'Civil & MEP works with sister companies',
    ],
    highlightsAr: [
      'مشاريع الإنشاءات الجديدة',
      'إدارة المشاريع من التصميم إلى التسليم',
      'صيانة وتحديث المباني القائمة',
      'الأعمال المدنية والكهروميكانيكية بالتعاون مع الشركات الشقيقة',
    ],
    designImageKey: 'about-team',
  },
  {
    order: 2,
    slug: 'mep-works',
    tier: 'main',
    featured: false,
    icon: 'mep',
    titleEn: 'MEP Works',
    titleAr: 'أعمال الكهروميكانيك (MEP)',
    shortDescriptionEn:
      'Complete mechanical, electrical, and plumbing engineering services delivered by our in-house engineers, with innovative solutions to improve energy efficiency and reduce operating costs.',
    shortDescriptionAr:
      'خدمات هندسية متكاملة للأعمال الميكانيكية والكهربائية والصحية ينفذها مهندسونا الداخليون، مع حلول مبتكرة لرفع كفاءة الطاقة وخفض تكاليف التشغيل.',
    highlightsEn: [
      'HVAC, chilled water & ventilation',
      'Power distribution, lighting & MV',
      'Plumbing, water supply & drainage',
      'BMS, data networks & low current',
    ],
    highlightsAr: [
      'التكييف والمياه المبردة والتهوية (HVAC)',
      'توزيع الطاقة والإنارة والجهد المتوسط (MV)',
      'السباكة وتغذية المياه وشبكات الصرف',
      'أنظمة إدارة المباني (BMS) وشبكات البيانات والتيار الخفيف',
    ],
    designImageKey: 'svc-mep',
  },
  {
    order: 3,
    slug: 'firefighting-systems',
    tier: 'main',
    featured: false,
    icon: 'fire',
    titleEn: 'Firefighting Systems',
    titleAr: 'أنظمة مكافحة الحريق',
    shortDescriptionEn:
      'Design and implementation of firefighting systems according to international standards, with integrated safety solutions to protect lives and property.',
    shortDescriptionAr:
      'تصميم وتنفيذ أنظمة مكافحة الحريق وفق المعايير العالمية، مع حلول سلامة متكاملة لحماية الأرواح والممتلكات.',
    highlightsEn: [
      'Fire pumps & sprinkler networks',
      'Fire detection & alarm systems',
      'Clean-agent suppression',
      'Installation & maintenance of safety equipment',
    ],
    highlightsAr: [
      'مضخات الحريق وشبكات الرش الآلي',
      'أنظمة الكشف والإنذار عن الحريق',
      'أنظمة الإطفاء بالغازات النظيفة',
      'تركيب وصيانة معدات السلامة',
    ],
    designImageKey: 'svc-fire',
  },
  {
    order: 4,
    slug: 'smart-systems',
    tier: 'main',
    featured: false,
    icon: 'smart',
    titleEn: 'Smart Systems',
    titleAr: 'الأنظمة الذكية',
    shortDescriptionEn:
      'Audio visual, smart automation, security, IT networking, and building management system integration for modern intelligent buildings.',
    shortDescriptionAr:
      'الأنظمة الصوتية والمرئية، الأتمتة الذكية، الأنظمة الأمنية، شبكات تقنية المعلومات، وتكامل أنظمة إدارة المباني للمنشآت الذكية الحديثة.',
    highlightsEn: [
      'Audio visual & meeting rooms',
      'CCTV, access control & security',
      'IT networks, data centers & NOC',
      'Queue management & smart automation',
    ],
    highlightsAr: [
      'الأنظمة الصوتية والمرئية وتجهيز قاعات الاجتماعات',
      'كاميرات المراقبة (CCTV) والتحكم في الدخول والأمن',
      'شبكات تقنية المعلومات ومراكز البيانات وغرف التحكم (NOC)',
      'أنظمة إدارة الحشود والأتمتة الذكية',
    ],
    designImageKey: 'svc-smart',
  },
  {
    order: 5,
    slug: 'hvac-ventilation-refrigeration',
    tier: 'additional',
    featured: true,
    icon: 'hvac',
    titleEn: 'HVAC, Ventilation & Refrigeration',
    titleAr: 'التكييف والتهوية والتبريد',
    shortDescriptionEn:
      'Chilled water and VRF systems, AHUs and FCUs, ventilation, smoke management, staircase pressurization and cold rooms.',
    shortDescriptionAr:
      'أنظمة المياه المبردة وVRF، وحدات مناولة الهواء (AHUs) ووحدات الملف والمروحة (FCUs)، التهوية، إدارة الدخان، تضغيط السلالم وغرف التبريد.',
    highlightsEn: [],
    highlightsAr: [],
  },
  {
    order: 6,
    slug: 'plumbing-water-drainage',
    tier: 'additional',
    featured: false,
    icon: 'plumbing',
    titleEn: 'Plumbing, Water & Drainage',
    titleAr: 'السباكة والمياه والصرف الصحي',
    shortDescriptionEn:
      'Water supply and booster sets, tanks, drainage and vent networks, and complete sanitary installations.',
    shortDescriptionAr:
      'شبكات تغذية المياه ومجموعات مضخات الرفع، الخزانات، شبكات الصرف والتهوية، وكافة التركيبات الصحية المتكاملة.',
    highlightsEn: [],
    highlightsAr: [],
  },
  {
    order: 7,
    slug: 'electrical-power-distribution',
    tier: 'additional',
    featured: false,
    icon: 'electrical',
    titleEn: 'Electrical & Power Distribution',
    titleAr: 'الكهرباء وتوزيع الطاقة',
    shortDescriptionEn:
      'MV/LV panels, busways, small power, lighting and emergency generator distribution.',
    shortDescriptionAr:
      'لوحات الجهد المتوسط والمنخفض (MV/LV)، قضبان التوزيع (Busways)، القوى الكهربائية، الإنارة وتوزيع مولدات الطوارئ.',
    highlightsEn: [],
    highlightsAr: [],
  },
  {
    order: 8,
    slug: 'mep-equipment-supply',
    tier: 'additional',
    featured: false,
    icon: 'supply',
    titleEn: 'MEP Equipment Supply',
    titleAr: 'توريد معدات الكهروميكانيك',
    shortDescriptionEn:
      'Genuine equipment from our partner brands, with brand pricing, submittals and delivery to site.',
    shortDescriptionAr:
      'توريد معدات أصلية من العلامات التجارية الشريكة لنا، مع تسعير المصانع والاعتمادات الفنية والتوصيل إلى الموقع.',
    highlightsEn: [],
    highlightsAr: [],
  },
  {
    order: 9,
    slug: 'testing-commissioning-tab',
    tier: 'additional',
    featured: false,
    icon: 'testing',
    titleEn: 'Testing, Commissioning & TAB',
    titleAr: 'الاختبار والتشغيل التجريبي والموازنة (TAB)',
    shortDescriptionEn:
      'Testing, adjusting and balancing, commissioning and handover with as-built drawings and O&M manuals.',
    shortDescriptionAr:
      'الاختبار والضبط والموازنة (TAB)، التشغيل التجريبي والتسليم مع مخططات التنفيذ النهائية (As-Built) وأدلة التشغيل والصيانة.',
    highlightsEn: [],
    highlightsAr: [],
  },
  {
    order: 10,
    slug: 'maintenance-upgrades',
    tier: 'additional',
    featured: false,
    icon: 'maintenance',
    titleEn: 'Maintenance & Upgrades',
    titleAr: 'الصيانة والتحديث',
    shortDescriptionEn:
      'Planned maintenance contracts and upgrades of existing buildings to keep systems efficient and compliant.',
    shortDescriptionAr:
      'عقود الصيانة الدورية المخططة وتحديث المباني القائمة للحفاظ على كفاءة الأنظمة وامتثالها للمعايير.',
    highlightsEn: [],
    highlightsAr: [],
  },
] as const

/**
 * Scope 4a (`handoff/tasks/P4-T2.md` lines 63–64):
 * The 6 Figma featured projects in exact Figma order (`1..6`), with their Figma card scope badge text.
 */
export interface FeaturedProjectSpec {
  ref: string
  order: number
  figmaCardTitleEn: string
  scopeSummaryEn: string
  scopeSummaryAr: string
}

export const FIGMA_FEATURED_PROJECTS_6: readonly FeaturedProjectSpec[] = [
  {
    ref: 'A-p11-1',
    order: 1,
    figmaCardTitleEn: 'Princess Noura University (PNU)',
    scopeSummaryEn: 'LOW CURRENT SCS',
    scopeSummaryAr: 'أنظمة التيار الخفيف والكابلات الهيكلية',
  },
  {
    ref: 'XLSX-13',
    order: 2,
    figmaCardTitleEn: 'Sofitel Makkah Hotel',
    scopeSummaryEn: 'FULL MEP WORKS',
    scopeSummaryAr: 'أعمال الكهروميكانيك المتكاملة',
  },
  {
    ref: 'A-p11-8',
    order: 3,
    figmaCardTitleEn: 'Stella Hotel (32 Floors)',
    scopeSummaryEn: 'FULL MEP WORKS',
    scopeSummaryAr: 'أعمال الكهروميكانيك المتكاملة',
  },
  {
    ref: 'A-p11-4',
    order: 4,
    figmaCardTitleEn: 'Roads & Transport Authority (RTA)',
    scopeSummaryEn: 'DATA CENTER MEP',
    scopeSummaryAr: 'أعمال الكهروميكانيك لمراكز البيانات',
  },
  {
    ref: 'A-p11-25',
    order: 5,
    figmaCardTitleEn: 'King Salman Oasis of Science',
    scopeSummaryEn: 'FULL MEP WORKS',
    scopeSummaryAr: 'أعمال الكهروميكانيك المتكاملة',
  },
  {
    ref: 'XLSX-27',
    order: 6,
    figmaCardTitleEn: 'Al Maqam Towers (A, B, C, D)',
    scopeSummaryEn: 'FULL MEP WORKS',
    scopeSummaryAr: 'أعمال الكهروميكانيك المتكاملة',
  },
] as const

/**
 * Exact Arabic translations of the 91 project names from `seed/projects.raw.json`
 * (`docs/02-content-model.md` line 161: "Arabic drafts translate exactly what the English says, with no added specs").
 */
export const PROJECT_TITLE_AR_BY_REF: Readonly<Record<string, string>> = {
  'A-p11-1': 'جامعة الأميرة نورة بنت عبدالرحمن (PNU)',
  'A-p11-2': 'بنك نومورا للاستثمار (الشرق الأوسط)',
  'A-p11-3': 'بنك أوف أمريكا (ميريل لينش)',
  'A-p11-4': 'هيئة الطرق والمواصلات (RTA)',
  'A-p11-5': 'سكن الطلاب، جامعة تبوك',
  'A-p11-6': 'كلية العلوم الطبية، جامعة الطائف',
  'A-p11-7': 'معرض كاديلاك — الجميح',
  'A-p11-8': 'فندق ستيلا (32 طابقاً)',
  'A-p11-9': 'معهد تدريب الشرطة',
  'A-p11-10': 'مستشفى الهدا للقوات المسلحة',
  'A-p11-11': 'البريد السعودي (جدة)',
  'A-p11-12': 'مبنى زمزم الصحي 3',
  'A-p11-13': 'مصنع أسمنت الجوف',
  'A-p11-14': '7 مدارس (جازان)',
  'A-p11-15': 'مستشفى الملك فهد الطبي',
  'A-p11-16': 'معرض إيكيا، الرياض',
  'A-p11-17': 'إيكيا، فرع الهفوف',
  'A-p11-18': 'مشروع KAP1 (5 مشاريع)',
  'A-p11-19': 'جامعة شقراء',
  'A-p11-20': 'قاعة المؤتمرات بوزارة الشؤون البلدية',
  'A-p11-21': 'مبنى محطة موبايلي',
  'A-p11-22': 'فندق الأندلس إنتركونتيننتال',
  'A-p11-23': 'فندق العيسى',
  'A-p11-24': 'منتزه الثمامة',
  'A-p11-25': 'واحة الملك سلمان للعلوم',
  'XLSX-1': 'فندق قصر الجنادرية',
  'XLSX-2': 'قصر الجنادرية الفندقي',
  'XLSX-3': 'فندق رحاب الجنادرية',
  'XLSX-4': 'برج الزاهر (1)',
  'XLSX-5': 'برج الزاهر (2)',
  'XLSX-6': 'برج جبل سودان',
  'XLSX-7': 'برج الدحلة',
  'XLSX-8': 'فندق صفوة الشروق',
  'XLSX-9': 'فندق منار الشروق',
  'XLSX-10': 'فندق روضة الشروق',
  'XLSX-11': 'فندق دار الشروق',
  'XLSX-12': 'برج بافيل خياط',
  'XLSX-13': 'فندق سوفيتيل مكة',
  'XLSX-14': 'فندق ميريديان مكة',
  'XLSX-15': 'فندق مواكب الروضة',
  'XLSX-16': 'المقر الرئيسي لشركة بيوت مكة',
  'XLSX-17': 'سوق العتيبية المركزي',
  'XLSX-18': 'فندق رمادا دار الفائزين',
  'XLSX-19': 'فندق رمادا عشقي',
  'XLSX-20': 'فندق إيلاف الملتقى',
  'XLSX-21': 'فندق إيوان',
  'XLSX-22': 'فندق قصر جدة',
  'XLSX-23': 'فندق درة الخليل',
  'XLSX-24': 'فندق حبيبة مكة',
  'XLSX-25': 'فندق الشهداء',
  'XLSX-26': 'الوطني مول',
  'XLSX-27': 'أبراج المقام (أ، ب، ج، د)',
  'XLSX-28': 'برج النسيم (91 إلى 99)',
  'XLSX-29': 'برج العزيزية',
  'XLSX-30': 'برج العليان كدي',
  'XLSX-31': 'برج غدير كدي',
  'XLSX-32': 'المركز الثقافي كدي',
  'XLSX-33': 'برج العليان العزيزية',
  'XLSX-34': 'فندق العليان الذهبي',
  'XLSX-35': 'فندق نائب الحرم',
  'XLSX-36': 'مشروع الشيخ صالح العويد',
  'XLSX-37': 'هايبر أبراج',
  'XLSX-38': 'مصنع الزيدي للخرسانة',
  'XLSX-39': 'فندق المنى أجياد',
  'XLSX-40': 'فندق اللواء',
  'XLSX-41': 'مطبخ أبو الجدايل',
  'XLSX-42': 'فندق عبدالله بخاري',
  'XLSX-43': 'فندق عبداللطيف سندي',
  'XLSX-44': 'المقر الرئيسي لاستشارات أبو غالية',
  'XLSX-45': 'مدرسة رياض أطفال',
  'XLSX-46': 'المحكمة العمالية ببطحاء قريش',
  'XLSX-47': 'مبنى شركة المياه الوطنية',
  'XLSX-48': 'فندق أوقاف المفتي الجميزة',
  'XLSX-49': 'فندق أوقاف المفتي العزيزية',
  'XLSX-50': 'فندق أوقاف المفتي إبراهيم الخليل',
  'XLSX-51': 'شبكة الصرف الصحي بمنى',
  'XLSX-52': 'مجمع المؤسسة الخيرية بمكة',
  'XLSX-53': 'مجمع المؤسسة الخيرية بجدة',
  'XLSX-54': 'المقر الرئيسي لعيسى بن لادن',
  'XLSX-55': 'مواقف المقر الرئيسي لعيسى بن لادن',
  'XLSX-56': 'مستشفى الحمراء بجدة',
  'XLSX-57': 'معارض عيسى بن لادن (1 إلى 9)',
  'XLSX-58': 'فندق بوابة منى',
  'XLSX-59': 'العوالي مول مكة',
  'XLSX-60': 'فندق أفواج التوبة (1 إلى 15)',
  'XLSX-61': 'مستودع مجموعة أفواج التوبة',
  'XLSX-62': 'مطبخ الزيدي',
  'XLSX-63': 'معارض الفراج',
  'XLSX-64': 'سوق قوافل مكة',
  'XLSX-65': 'مستشفى الولادة والأطفال بمكة',
  'XLSX-66': 'سوق العائلة بمكة',
} as const

export const PROJECT_CLIENT_AR_MAP: Readonly<Record<string, string>> = {
  'Postech Co.': 'شركة بوستك (Postech Co.)',
  'Target Co.': 'شركة تارجت (Target Co.)',
  'Somit Co.': 'شركة سوميت (Somit Co.)',
  'Honeywell Co.': 'شركة هانيويل (Honeywell Co.)',
  'MERCO Co.': 'شركة ميركو (MERCO Co.)',
  'SVC Co.': 'شركة SVC',
  'MERCO Sister Company': 'شركة شقيقة لشركة ميركو (MERCO)',
  MERCO: 'شركة ميركو (MERCO)',
  'Sister company': 'شركة شقيقة',
  Petrojet: 'شركة بتروجيت (Petrojet)',
  AKNAN: 'شركة أكنان (AKNAN)',
  'Omar Saeed Bafel Co.': 'شركة عمر سعيد بافيل',
  'Beyout Makkah Co.': 'شركة بيوت مكة',
  'AL Masa Co.': 'شركة الماسة',
  'AL Jazera Co.': 'شركة الجزيرة',
  'BAL Jazera Co.': 'شركة بالجزيرة (BAL Jazera Co.)',
  'Nouh Maraq': 'نوح مرق',
  'ATTAMEER CO.': 'شركة التعمير',
  'Olayan Group': 'مجموعة العليان',
  'AL Zaydi Group': 'مجموعة الزيدي',
  'Awqaf AL Moufty': 'أوقاف المفتي',
  'Issa Bin Laden': 'عيسى بن لادن',
  'Afwaj AL Tawba Group': 'مجموعة أفواج التوبة',
} as const

export function normalizeProjectLocation(rawLocation: string): {
  locationEn: string
  locationAr: string
  fromMakkahSectionHeader: boolean
} {
  const trimmed = rawLocation.trim()
  if (trimmed === "Makkah region, KSA (profile section header 'Makkah')") {
    return {
      locationEn: 'Makkah, KSA',
      locationAr: 'مكة المكرمة، المملكة العربية السعودية',
      fromMakkahSectionHeader: true,
    }
  }
  const map: Record<string, { en: string; ar: string } | undefined> = {
    KSA: { en: 'KSA', ar: 'المملكة العربية السعودية' },
    'Dubai, UAE': { en: 'Dubai, UAE', ar: 'دبي، الإمارات العربية المتحدة' },
    Qatar: { en: 'Qatar', ar: 'قطر' },
    'Jeddah, KSA': { en: 'Jeddah, KSA', ar: 'جدة، المملكة العربية السعودية' },
    'Makkah, KSA': { en: 'Makkah, KSA', ar: 'مكة المكرمة، المملكة العربية السعودية' },
    'Jazan, KSA': { en: 'Jazan, KSA', ar: 'جازان، المملكة العربية السعودية' },
    'Riyadh, KSA': { en: 'Riyadh, KSA', ar: 'الرياض، المملكة العربية السعودية' },
    'Hofuf, KSA': { en: 'Hofuf, KSA', ar: 'الهفوف، المملكة العربية السعودية' },
  }
  const found = map[trimmed]
  if (found) {
    return {
      locationEn: found.en,
      locationAr: found.ar,
      fromMakkahSectionHeader: false,
    }
  }
  return {
    locationEn: trimmed,
    locationAr: trimmed,
    fromMakkahSectionHeader: false,
  }
}

export function mapRawProjectScope(rawScope: string): {
  category: ProjectCategory
  scope: ProjectScope[]
  scopeSummaryEn: string
  scopeSummaryAr: string
} {
  const trimmed = rawScope.trim()
  switch (trimmed) {
    case 'MEP':
      return {
        category: 'mep',
        scope: ['mep', 'hvac', 'electrical', 'plumbing', 'fire-fighting'],
        scopeSummaryEn: 'Full MEP Works',
        scopeSummaryAr: 'أعمال الكهروميكانيك المتكاملة (MEP)',
      }
    case 'MEP Upgrade':
    case 'MEP- Upgrad':
      return {
        category: 'mep',
        scope: ['mep', 'hvac', 'electrical', 'plumbing'],
        scopeSummaryEn: 'MEP Upgrade',
        scopeSummaryAr: 'تحديث أنظمة الكهروميكانيك (MEP)',
      }
    case 'Low Current SCS':
      return {
        category: 'low-current',
        scope: ['low-current'],
        scopeSummaryEn: 'Low Current SCS',
        scopeSummaryAr: 'أنظمة التيار الخفيف والكابلات الهيكلية (SCS)',
      }
    case 'Low Current Systems':
      return {
        category: 'low-current',
        scope: ['low-current'],
        scopeSummaryEn: 'Low Current Systems',
        scopeSummaryAr: 'أنظمة التيار الخفيف',
      }
    case 'Structured Cabling':
      return {
        category: 'low-current',
        scope: ['low-current'],
        scopeSummaryEn: 'Structured Cabling',
        scopeSummaryAr: 'شبكات الكابلات الهيكلية',
      }
    case 'Video Wall':
      return {
        category: 'low-current',
        scope: ['low-current'],
        scopeSummaryEn: 'Video Wall',
        scopeSummaryAr: 'شاشات العرض الجدارية (Video Wall)',
      }
    case 'Data & Low Current Systems':
      return {
        category: 'low-current',
        scope: ['low-current', 'data-center'],
        scopeSummaryEn: 'Data & Low Current Systems',
        scopeSummaryAr: 'أنظمة البيانات والتيار الخفيف',
      }
    case 'Data Center MEP':
      return {
        category: 'data-center',
        scope: ['data-center', 'mep', 'hvac', 'electrical', 'fire-fighting', 'low-current'],
        scopeSummaryEn: 'Data Center MEP',
        scopeSummaryAr: 'أعمال الكهروميكانيك لمراكز البيانات',
      }
    case 'Fire Fighting':
      return {
        category: 'fire-fighting',
        scope: ['fire-fighting'],
        scopeSummaryEn: 'Fire Fighting Systems',
        scopeSummaryAr: 'أنظمة مكافحة الحريق',
      }
    case 'Fire Alarm System':
      return {
        category: 'fire-fighting',
        scope: ['fire-fighting'],
        scopeSummaryEn: 'Fire Alarm System',
        scopeSummaryAr: 'نظام إنذار الحريق',
      }
    case 'Fire Alarm & CCTV':
      return {
        category: 'fire-fighting',
        scope: ['fire-fighting', 'low-current'],
        scopeSummaryEn: 'Fire Alarm & CCTV',
        scopeSummaryAr: 'إنذار الحريق وكاميرات المراقبة (CCTV)',
      }
    case 'Civil & MEP':
      return {
        category: 'civil-mep',
        scope: ['civil', 'mep', 'hvac', 'electrical', 'plumbing'],
        scopeSummaryEn: 'Civil & MEP Works',
        scopeSummaryAr: 'الأعمال المدنية والكهروميكانيكية',
      }
    default:
      return {
        category: 'mep',
        scope: ['mep'],
        scopeSummaryEn: trimmed || 'MEP Works',
        scopeSummaryAr: 'أعمال الكهروميكانيك (MEP)',
      }
  }
}

export interface PlaceholderTeamMemberSpec {
  order: number
  tier: 'leadership' | 'staff'
  nameEn: string
  nameAr: string
  positionEn: string
  positionAr: string
  bioEn?: string
  bioAr?: string
}

/**
 * Scope 5 (`handoff/tasks/P4-T2.md` lines 78–80, `design/context/03-about-us/05-meet-our-team.md` lines 67–199):
 * Placeholder team members marked `[placeholder]` with `active: false` so anonymous visitors never see them,
 * while editors in draft preview see the 5 leadership cards and 16 staff marquee roles.
 */
export const PLACEHOLDER_TEAM_MEMBERS_13: readonly PlaceholderTeamMemberSpec[] = [
  {
    order: 1,
    tier: 'leadership',
    nameEn: '[placeholder] Chairman',
    nameAr: '[placeholder] رئيس مجلس الإدارة',
    positionEn: 'Chairman',
    positionAr: 'رئيس مجلس الإدارة',
    bioEn: '[placeholder] Executive leadership profile pending client confirmation.',
    bioAr: '[placeholder] الملف التعريفي لعضو القيادة التنفيذية قيد تأكيد العميل.',
  },
  {
    order: 2,
    tier: 'leadership',
    nameEn: '[placeholder] Chief Executive Officer',
    nameAr: '[placeholder] الرئيس التنفيذي',
    positionEn: 'Chief Executive Officer',
    positionAr: 'الرئيس التنفيذي',
    bioEn: '[placeholder] Executive leadership profile pending client confirmation.',
    bioAr: '[placeholder] الملف التعريفي لعضو القيادة التنفيذية قيد تأكيد العميل.',
  },
  {
    order: 3,
    tier: 'leadership',
    nameEn: '[placeholder] Commercial Director',
    nameAr: '[placeholder] المدير التجاري',
    positionEn: 'Commercial Director',
    positionAr: 'المدير التجاري',
    bioEn: '[placeholder] Executive leadership profile pending client confirmation.',
    bioAr: '[placeholder] الملف التعريفي لعضو القيادة التنفيذية قيد تأكيد العميل.',
  },
  {
    order: 4,
    tier: 'leadership',
    nameEn: '[placeholder] Engineering Manager',
    nameAr: '[placeholder] مدير الهندسة',
    positionEn: 'Engineering Manager',
    positionAr: 'مدير الهندسة',
    bioEn: '[placeholder] Executive leadership profile pending client confirmation.',
    bioAr: '[placeholder] الملف التعريفي لعضو القيادة التنفيذية قيد تأكيد العميل.',
  },
  {
    order: 5,
    tier: 'leadership',
    nameEn: '[placeholder] Project Manager',
    nameAr: '[placeholder] مدير المشاريع',
    positionEn: 'Project Manager',
    positionAr: 'مدير المشاريع',
    bioEn: '[placeholder] Executive leadership profile pending client confirmation.',
    bioAr: '[placeholder] الملف التعريفي لعضو القيادة التنفيذية قيد تأكيد العميل.',
  },
  {
    order: 6,
    tier: 'staff',
    nameEn: '[placeholder] Project Engineer',
    nameAr: '[placeholder] مهندس مشروع',
    positionEn: 'Project Engineer',
    positionAr: 'مهندس مشروع',
  },
  {
    order: 7,
    tier: 'staff',
    nameEn: '[placeholder] Site Engineer',
    nameAr: '[placeholder] مهندس موقع',
    positionEn: 'Site Engineer',
    positionAr: 'مهندس موقع',
  },
  {
    order: 8,
    tier: 'staff',
    nameEn: '[placeholder] Mechanical Engineer',
    nameAr: '[placeholder] مهندس ميكانيكا',
    positionEn: 'Mechanical Engineer',
    positionAr: 'مهندس ميكانيكا',
  },
  {
    order: 9,
    tier: 'staff',
    nameEn: '[placeholder] Electrical Engineer',
    nameAr: '[placeholder] مهندس كهرباء',
    positionEn: 'Electrical Engineer',
    positionAr: 'مهندس كهرباء',
  },
  {
    order: 10,
    tier: 'staff',
    nameEn: '[placeholder] Planning Engineer',
    nameAr: '[placeholder] مهندس تخطيط',
    positionEn: 'Planning Engineer',
    positionAr: 'مهندس تخطيط',
  },
  {
    order: 11,
    tier: 'staff',
    nameEn: '[placeholder] Quantity Surveyor',
    nameAr: '[placeholder] حاسب كميات',
    positionEn: 'Quantity Surveyor',
    positionAr: 'حاسب كميات',
  },
  {
    order: 12,
    tier: 'staff',
    nameEn: '[placeholder] Safety Officer',
    nameAr: '[placeholder] مسؤول سلامة',
    positionEn: 'Safety Officer',
    positionAr: 'مسؤول سلامة',
  },
  {
    order: 13,
    tier: 'staff',
    nameEn: '[placeholder] MEP Supervisor',
    nameAr: '[placeholder] مشرف كهروميكانيك (MEP)',
    positionEn: 'MEP Supervisor',
    positionAr: 'مشرف كهروميكانيك (MEP)',
  },
] as const

export interface DesignAssetImageSpec {
  key:
    | 'about-team'
    | 'bg-pipes'
    | 'header-office'
    | 'hero-city'
    | 'proj-tower'
    | 'svc-fire'
    | 'svc-mep'
    | 'svc-smart'
    | 'tower-render'
  file: string
  altEn: string
  altAr: string
}

/**
 * Scope 5 & 6 (`handoff/tasks/P4-T2.md` lines 78–82, `design/INDEX.md` lines 145–168):
 * The 9 Figma website photos in `design/assets/images/`, marked `[placeholder]` in both `en` and `ar` alt text.
 */
export const DESIGN_ASSET_IMAGES_9: readonly DesignAssetImageSpec[] = [
  {
    key: 'hero-city',
    file: 'design/assets/images/hero-city.png',
    altEn: '[placeholder] Modern Gulf city skyline at dusk — Al Jazira MEP engineering',
    altAr: '[placeholder] أفق مدينة خليجية حديثة عند الغسق — الجزيرة الإمداد الذكي للكهروميكانيك',
  },
  {
    key: 'about-team',
    file: 'design/assets/images/about-team.png',
    altEn: '[placeholder] Al Jazira engineering team reviewing MEP drawings on site',
    altAr: '[placeholder] فريق مهندسي الجزيرة يراجع مخططات الكهروميكانيك في الموقع',
  },
  {
    key: 'bg-pipes',
    file: 'design/assets/images/bg-pipes.png',
    altEn: '[placeholder] Industrial chilled-water piping and mechanical plant room',
    altAr: '[placeholder] شبكات أنابيب المياه المبردة وغرفة المضخات الميكانيكية',
  },
  {
    key: 'header-office',
    file: 'design/assets/images/header-office.png',
    altEn: '[placeholder] Corporate engineering office interior',
    altAr: '[placeholder] المكتب الهندسي والإداري للشركة',
  },
  {
    key: 'proj-tower',
    file: 'design/assets/images/proj-tower.png',
    altEn: '[placeholder] High-rise commercial and hospitality tower development',
    altAr: '[placeholder] برج فندقي وتجاري متعدد الطوابق',
  },
  {
    key: 'svc-fire',
    file: 'design/assets/images/svc-fire.png',
    altEn: '[placeholder] NFPA-compliant fire pump room and sprinkler manifold installation',
    altAr: '[placeholder] غرفة مضخات الحريق وشبكة صمامات الرش الآلي المعتمدة وفق NFPA',
  },
  {
    key: 'svc-mep',
    file: 'design/assets/images/svc-mep.png',
    altEn: '[placeholder] MEP ductwork, cable trays and piping coordination in ceiling plenum',
    altAr: '[placeholder] تنسيق مجاري التكييف وحوامل الكابلات والأنابيب الميكانيكية',
  },
  {
    key: 'svc-smart',
    file: 'design/assets/images/svc-smart.png',
    altEn: '[placeholder] Smart building management system (BMS) and data center racks',
    altAr: '[placeholder] أنظمة إدارة المباني الذكية (BMS) وكبائن مركز البيانات',
  },
  {
    key: 'tower-render',
    file: 'design/assets/images/tower-render.png',
    altEn: '[placeholder] Interactive 3D building MEP systems cut-away render',
    altAr: '[placeholder] مجسم ثلاثي الأبعاد يوضح الأنظمة الكهروميكانيكية داخل المبنى',
  },
] as const
