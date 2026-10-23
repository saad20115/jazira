import { type GlobalBeforeValidateHook, type GlobalConfig, ValidationError } from 'payload'

import { PROJECT_SCOPE_OPTIONS, type ProjectScope } from '../collections/Projects'
import { buttonGroup } from '../fields/groups/button'
import { collapsibleSection } from '../fields/groups/collapsibleSection'
import { ctaGroup } from '../fields/groups/cta'
import { sectionIntroGroup } from '../fields/groups/sectionIntro'
import { paragraphRichTextField } from '../fields/richText'
import { seoGroupField } from '../fields/seo'
import { createRevalidateGlobalAfterChangeHook } from '../hooks/revalidate'
import { PAGES_ADMIN_GROUP, withPublishableGlobal } from './_shared/publishableGlobal'

export const INTERACTIVE_SYSTEM_SHOT_VALUES = [
  'hvac',
  'fire',
  'plumbing',
  'power',
  'smart',
] as const

export type InteractiveSystemShot = (typeof INTERACTIVE_SYSTEM_SHOT_VALUES)[number]

export interface DefaultInteractiveSystemItem {
  title: string
  text: string
  shot: InteractiveSystemShot
  disciplines: ProjectScope[]
}

export const DEFAULT_INTERACTIVE_SYSTEMS_AR: readonly DefaultInteractiveSystemItem[] = [
  {
    title: 'التكييف والمياه المبردة (HVAC)',
    text: 'المبردات (Chillers)، وحدات مناولة الهواء (AHUs)، وحدات ملف ومروحة (FCUs)، أنظمة VRF، مجاري الهواء، سحب الدخان، تضغيط السلالم وغرف التبريد — مع الفحص والضبط والموازنة (TAB) قبل التسليم.',
    shot: 'hvac',
    disciplines: ['hvac'],
  },
  {
    title: 'مكافحة الحريق والإنذار المبكر',
    text: 'مضخات الحريق، أنظمة الرش الآلي وصناديق الإطفاء، الإطفاء بالغازات النظيفة، وأنظمة الكشف والإنذار المبكر — وفق اشتراطات NFPA والدفاع المدني.',
    shot: 'fire',
    disciplines: ['fire-fighting'],
  },
  {
    title: 'السباكة والصرف وتغذية المياه',
    text: 'مضخات الرفع، خزانات المياه، شبكات التغذية، شبكات الصرف والتهوية، وكافة التركيبات الصحية المتكاملة.',
    shot: 'plumbing',
    disciplines: ['plumbing'],
  },
  {
    title: 'توزيع الطاقة والإنارة',
    text: 'لوحات الجهد المتوسط والمنخفض (MV/LV)، قضبان التوزيع (Busways)، القوى الكهربائية، الإنارة، وتوزيع مولدات الطوارئ.',
    shot: 'power',
    disciplines: ['electrical'],
  },
  {
    title: 'الأنظمة الذكية والتيار الخفيف (ELV & BMS)',
    text: 'الشبكات الهيكلية، كاميرات المراقبة (CCTV)، التحكم في الدخول، الأنظمة الصوتية والمرئية، غرف البيانات وربط أنظمة إدارة المباني (BMS).',
    shot: 'smart',
    disciplines: ['low-current', 'data-center'],
  },
] as const

export const DEFAULT_INTERACTIVE_SYSTEMS_EN: readonly DefaultInteractiveSystemItem[] = [
  {
    title: 'HVAC & Chilled Water',
    text: 'Chillers, AHUs, FCUs, VRF, ductwork, smoke management, staircase pressurization and cold rooms — tested, adjusted and balanced (TAB) before handover.',
    shot: 'hvac',
    disciplines: ['hvac'],
  },
  {
    title: 'Fire Fighting & Fire Alarm',
    text: 'Fire pumps, sprinkler and hose systems, clean-agent suppression, detection and alarm — to NFPA and Civil Defense requirements.',
    shot: 'fire',
    disciplines: ['fire-fighting'],
  },
  {
    title: 'Plumbing, Drainage & Water Supply',
    text: 'Booster sets, water tanks, domestic water, drainage and vent networks, and complete sanitary installations.',
    shot: 'plumbing',
    disciplines: ['plumbing'],
  },
  {
    title: 'Power Distribution & Lighting',
    text: 'MV/LV panels, busways, small power, lighting and emergency generator distribution.',
    shot: 'power',
    disciplines: ['electrical'],
  },
  {
    title: 'Smart Systems, ELV & BMS',
    text: 'Structured cabling, CCTV, access control, sound & AV, data rooms and BMS integration.',
    shot: 'smart',
    disciplines: ['low-current', 'data-center'],
  },
] as const

export function getDefaultInteractiveSystems(locale?: string): DefaultInteractiveSystemItem[] {
  const source = locale === 'en' ? DEFAULT_INTERACTIVE_SYSTEMS_EN : DEFAULT_INTERACTIVE_SYSTEMS_AR
  return source.map((item) => ({
    title: item.title,
    text: item.text,
    shot: item.shot,
    disciplines: [...item.disciplines],
  }))
}

const extractRelId = (raw: unknown): number | string | null => {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw
  }
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim()
  }
  if (typeof raw === 'object' && raw !== null && 'id' in raw) {
    const id = (raw as { id?: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) {
      return id
    }
    if (typeof id === 'string' && id.trim().length > 0) {
      return id.trim()
    }
  }
  return null
}

const validateHomePageBeforeValidate: GlobalBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!data || typeof data !== 'object') {
    return data as unknown
  }

  const mutable = data as Record<string, unknown>
  const orig = (originalDoc ?? {}) as Record<string, unknown>

  const heroData =
    typeof mutable.hero === 'object' && mutable.hero !== null
      ? (mutable.hero as Record<string, unknown>)
      : undefined
  const origHero =
    typeof orig.hero === 'object' && orig.hero !== null
      ? (orig.hero as Record<string, unknown>)
      : undefined

  if (heroData) {
    const effectiveBackground =
      'background' in heroData ? heroData.background : origHero?.background
    const effectiveBackgroundVideo =
      'backgroundVideo' in heroData ? heroData.backgroundVideo : origHero?.backgroundVideo

    if (
      extractRelId(effectiveBackground) !== null &&
      extractRelId(effectiveBackgroundVideo) !== null
    ) {
      throw new ValidationError({
        global: 'home-page',
        errors: [
          {
            path: 'hero.backgroundVideo',
            message:
              'لا يمكن تحديد صورة خلفية وفيديو خلفية في قسم الواجهة الرئيسية في نفس الوقت — يرجى اختيار أحدهما فقط. / Cannot set both a hero background image and a hero background video at the same time — choose only one.',
          },
        ],
        req,
      })
    }
  }

  const interactiveData =
    typeof mutable.interactiveSystems === 'object' && mutable.interactiveSystems !== null
      ? (mutable.interactiveSystems as Record<string, unknown>)
      : undefined
  const origInteractive =
    typeof orig.interactiveSystems === 'object' && orig.interactiveSystems !== null
      ? (orig.interactiveSystems as Record<string, unknown>)
      : undefined

  // Seed default 5 interactive systems when interactiveSystems.systems has not been set yet
  if (
    (!interactiveData ||
      !('systems' in interactiveData) ||
      interactiveData.systems === undefined) &&
    (!origInteractive ||
      !Array.isArray(origInteractive.systems) ||
      origInteractive.systems.length === 0)
  ) {
    const reqLocale = typeof req.locale === 'string' ? req.locale : 'ar'
    if (interactiveData) {
      interactiveData.systems = getDefaultInteractiveSystems(reqLocale)
    } else {
      mutable.interactiveSystems = {
        ...(origInteractive ?? {}),
        systems: getDefaultInteractiveSystems(reqLocale),
      }
    }
  }

  const effectiveInteractiveData =
    typeof mutable.interactiveSystems === 'object' && mutable.interactiveSystems !== null
      ? (mutable.interactiveSystems as Record<string, unknown>)
      : undefined

  if (effectiveInteractiveData && Array.isArray(effectiveInteractiveData.systems)) {
    const seenShots = new Set<string>()
    for (const item of effectiveInteractiveData.systems) {
      if (typeof item === 'object' && item !== null && 'shot' in item) {
        const shot = (item as { shot?: unknown }).shot
        if (typeof shot === 'string' && shot.trim().length > 0) {
          if (seenShots.has(shot)) {
            throw new ValidationError({
              global: 'home-page',
              errors: [
                {
                  path: 'interactiveSystems.systems',
                  message: `اللقطة السينمائية "${shot}" مكررة في الأنظمة التفاعلية؛ يجب أن تكون كل لقطة (shot) فريدة. / Duplicate interactive system shot "${shot}"; each system must have a unique shot.`,
                },
              ],
              req,
            })
          }
          seenShots.add(shot)
        }
      }
    }
  }

  return mutable
}

export const HomePage: GlobalConfig = withPublishableGlobal({
  slug: 'home-page',
  dbName: 'home_page',
  label: {
    ar: 'الصفحة الرئيسية (Home Page)',
    en: 'Home Page',
  },
  admin: {
    group: PAGES_ADMIN_GROUP,
    description: {
      ar: 'محتوى وأقسام الصفحة الرئيسية مرتبة حسب تصميم Figma، مع إمكانية إظهار أو إخفاء كل قسم.',
      en: 'Home page sections in Figma order, each with an enable/disable toggle and draft/publish workflow.',
    },
  },
  hooks: {
    beforeValidate: [validateHomePageBeforeValidate],
    afterChange: [
      createRevalidateGlobalAfterChangeHook({
        globalSlug: 'home-page',
        localizedPaths: ['/'],
      }),
    ],
  },
  fields: [
    // 1. Hero (17:199)
    collapsibleSection({
      name: 'hero',
      type: 'group',
      label: {
        ar: 'قسم الواجهة الرئيسية (Hero)',
        en: 'Hero Section',
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
            ar: 'العنوان الرئيسي (Hero Title)',
            en: 'Hero Title',
          },
        },
        {
          name: 'subtitle',
          type: 'textarea',
          localized: true,
          required: false,
          maxLength: 500,
          label: {
            ar: 'الوصف التمهيدي للواجهة (Subtitle)',
            en: 'Hero Subtitle',
          },
        },
        {
          name: 'background',
          type: 'upload',
          relationTo: 'media',
          required: false,
          filterOptions: () => true,
          label: {
            ar: 'صورة الخلفية (تتعارض مع فيديو الخلفية)',
            en: 'Background Image (mutually exclusive with Background Video)',
          },
          validate: (val: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
            if (extractRelId(val) !== null && extractRelId(siblingData?.backgroundVideo) !== null) {
              return 'لا يمكن تحديد صورة خلفية وفيديو خلفية في نفس الوقت — اختر أحدهما فقط. / Cannot set both background image and background video.'
            }
            return true
          },
        },
        {
          name: 'backgroundVideo',
          type: 'upload',
          relationTo: 'videos',
          required: false,
          filterOptions: () => true,
          label: {
            ar: 'فيديو الخلفية (يتعارض مع صورة الخلفية)',
            en: 'Background Video (mutually exclusive with Background Image)',
          },
          validate: (val: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
            if (extractRelId(val) !== null && extractRelId(siblingData?.background) !== null) {
              return 'لا يمكن تحديد صورة خلفية وفيديو خلفية في نفس الوقت — اختر أحدهما فقط. / Cannot set both background image and background video.'
            }
            return true
          },
        },
        buttonGroup({
          name: 'primaryCta',
          required: false,
          label: {
            ar: 'الزر الرئيسي (استكشف خدماتنا)',
            en: 'Primary CTA Button (Explore Our Services)',
          },
        }),
        buttonGroup({
          name: 'secondaryCta',
          required: false,
          label: {
            ar: 'الزر الثانوي (استعرض المشاريع)',
            en: 'Secondary CTA Button (View Projects)',
          },
        }),
      ],
    }),

    // 2. Who We Are (17:222)
    collapsibleSection({
      name: 'whoWeAre',
      type: 'group',
      label: {
        ar: 'قسم من نحن (Who We Are)',
        en: 'Who We Are Section',
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
            ar: 'الوسم العلوي الصغير (Eyebrow — من نحن)',
            en: 'Eyebrow Label (Who We Are)',
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
          maxParagraphs: 2,
          label: {
            ar: 'النص التعريفي (فقرات نصية فقط — بحد أقصى فقرتين)',
            en: 'Description Text (Paragraphs Only — Max 2 Paragraphs)',
          },
        }),
        buttonGroup({
          name: 'button',
          required: false,
          label: {
            ar: 'زر القسم (تعرف علينا أكثر)',
            en: 'Section Button (Learn More About Us)',
          },
        }),
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: false,
          filterOptions: () => true,
          label: {
            ar: 'صورة القسم',
            en: 'Section Image',
          },
        },
      ],
    }),

    // 3. Core Services (17:254)
    collapsibleSection(
      sectionIntroGroup({
        name: 'coreServices',
        label: {
          ar: 'قسم خدماتنا الأساسية (Core Services)',
          en: 'Core Services Section',
        },
        extraFields: [
          buttonGroup({
            name: 'button',
            required: false,
            label: {
              ar: 'زر عرض جميع الخدمات (View All Services)',
              en: 'View All Services Button',
            },
          }),
        ],
      }),
    ),

    // 4. Interactive Systems (111:1608)
    collapsibleSection(
      sectionIntroGroup({
        name: 'interactiveSystems',
        label: {
          ar: 'قسم الأنظمة الهندسية التفاعلية والمجسم ثلاثي الأبعاد (Interactive Systems)',
          en: 'Interactive Systems & 3D Model Section',
        },
        extraFields: [
          {
            name: 'systems',
            type: 'array',
            dbName: 'hp_int_sys',
            minRows: 5,
            maxRows: 5,
            defaultValue: ({ locale }: { locale?: string }) => getDefaultInteractiveSystems(locale),
            label: {
              ar: 'الأنظمة الهندسية التفاعلية (5 أنظمة بالضبط)',
              en: 'Interactive Systems (Exactly 5 Design Items)',
            },
            labels: {
              singular: {
                ar: 'نظام تفاعلي',
                en: 'Interactive System',
              },
              plural: {
                ar: 'الأنظمة التفاعلية',
                en: 'Interactive Systems',
              },
            },
            validate: (val: unknown) => {
              if (!Array.isArray(val) || val.length !== 5) {
                return 'يجب أن يحتوي قسم الأنظمة التفاعلية على 5 أنظمة بالضبط. / Interactive systems must contain exactly 5 items.'
              }
              const seen = new Set<string>()
              for (const row of val) {
                if (typeof row === 'object' && row !== null && 'shot' in row) {
                  const shot = (row as { shot?: unknown }).shot
                  if (typeof shot === 'string' && shot.trim().length > 0) {
                    if (seen.has(shot)) {
                      return `اللقطة السينمائية "${shot}" مكررة؛ يجب أن تكون كل لقطة فريدة. / Shot "${shot}" is duplicated; each system must have a unique shot.`
                    }
                    seen.add(shot)
                  }
                }
              }
              return true
            },
            fields: [
              {
                name: 'title',
                type: 'text',
                localized: true,
                required: true,
                maxLength: 160,
                label: {
                  ar: 'اسم النظام الهندسي',
                  en: 'System Title',
                },
              },
              {
                name: 'text',
                type: 'textarea',
                localized: true,
                required: true,
                maxLength: 600,
                label: {
                  ar: 'وصف النظام الهندسي',
                  en: 'System Description',
                },
              },
              {
                name: 'shot',
                type: 'select',
                enumName: 'enum_hp_int_sys_shot',
                required: true,
                label: {
                  ar: 'اللقطة السينمائية في المجسم (Shot — فريدة لكل نظام)',
                  en: 'Cinematic Shot (Unique per System)',
                },
                options: [
                  {
                    label: { ar: 'التكييف والمياه المبردة (HVAC)', en: 'HVAC (hvac)' },
                    value: 'hvac',
                  },
                  {
                    label: { ar: 'مكافحة الحريق والإنذار (Fire)', en: 'Fire Fighting (fire)' },
                    value: 'fire',
                  },
                  {
                    label: { ar: 'السباكة والصرف والمياه (Plumbing)', en: 'Plumbing (plumbing)' },
                    value: 'plumbing',
                  },
                  {
                    label: { ar: 'توزيع الطاقة والإنارة (Power)', en: 'Power & Lighting (power)' },
                    value: 'power',
                  },
                  {
                    label: {
                      ar: 'الأنظمة الذكية والتيار الخفيف (Smart)',
                      en: 'Smart & ELV (smart)',
                    },
                    value: 'smart',
                  },
                ],
              },
              {
                name: 'disciplines',
                type: 'select',
                dbName: 'hp_int_sys_disc',
                enumName: 'enum_hp_int_sys_disc',
                hasMany: true,
                required: true,
                label: {
                  ar: 'التخصصات المرتبطة من المشاريع (Disciplines -> Related Projects)',
                  en: 'Linked Project Scope Disciplines',
                },
                options: [...PROJECT_SCOPE_OPTIONS],
              },
            ],
          },
          {
            name: 'heroImage',
            type: 'upload',
            relationTo: 'media',
            required: false,
            filterOptions: () => true,
            label: {
              ar: 'الصورة الثابتة للمبنى (Hero Image — بديل عند عدم تفعيل العرض الحي)',
              en: 'Overview Hero Render Image (Fallback Still)',
            },
          },
          {
            name: 'relatedProjectsLabel',
            type: 'text',
            localized: true,
            required: false,
            maxLength: 120,
            label: {
              ar: 'عنوان المشاريع المرتبطة بالنظام',
              en: 'Related Projects Label',
            },
          },
          {
            name: 'liveModelLabel',
            type: 'text',
            localized: true,
            required: false,
            maxLength: 120,
            label: {
              ar: 'نص زر فتح المجسم التفاعلي ثلاثي الأبعاد (Live 3D Model Label)',
              en: 'Live 3D Model Button Label',
            },
          },
        ],
      }),
    ),

    // 5. Stats Section ("Trusted by Industry Leaders" — 18:285)
    collapsibleSection({
      name: 'statsSection',
      type: 'group',
      label: {
        ar: 'قسم أرقامنا وإنجازاتنا — ثقة رواد الصناعة (Stats Section)',
        en: 'Trusted by Industry Leaders (Stats Section)',
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
            ar: 'الأرقام والإحصائيات المعروضة (حتى 4 أرقام من مجموعة الأرقام)',
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

    // 6. Featured Projects (18:308)
    collapsibleSection(
      sectionIntroGroup({
        name: 'featuredProjects',
        label: {
          ar: 'قسم المشاريع المميزة (Featured Projects)',
          en: 'Featured Projects Section',
        },
        extraFields: [
          buttonGroup({
            name: 'button',
            required: false,
            label: {
              ar: 'زر استعراض جميع المشاريع (View All Projects)',
              en: 'View All Projects Button',
            },
          }),
        ],
      }),
    ),

    // 7. Partners (18:579)
    collapsibleSection(
      sectionIntroGroup({
        name: 'partners',
        label: {
          ar: 'قسم شركاء النجاح والعلامات المعتمدة (Trusted Partners)',
          en: 'Trusted Partners Section',
        },
      }),
    ),

    // 8. CTA (18:660)
    collapsibleSection(
      ctaGroup({
        name: 'cta',
        label: {
          ar: 'قسم الدعوة للتواصل وطلب عرض سعر (CTA)',
          en: 'Call to Action Section (CTA)',
        },
      }),
    ),

    // 9. SEO Meta
    collapsibleSection(seoGroupField()),
  ],
})
