import {
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  ValidationError,
} from 'payload'

import { isAdminOrEditor } from '../access/isAdminOrEditor'
import { publishedOrLoggedIn } from '../access/publishedOrLoggedIn'
import { pillarFields } from '../fields/groups/pillar'
import { validateVideoEmbedUrl } from '../fields/link'
import { orderField } from '../fields/order'
import { limitedRichTextField } from '../fields/richText'
import { seoGroupField } from '../fields/seo'
import { slugFields } from '../fields/slug'
import {
  createRevalidateAfterChangeHook,
  createRevalidateAfterDeleteHook,
  REVALIDATE_LOCALES,
  safeRevalidatePath,
  safeRevalidateTag,
} from '../hooks/revalidate'
import { publishableVersions } from './_shared/publishable'

export const PROJECT_CATEGORY_VALUES = [
  'mep',
  'fire-fighting',
  'low-current',
  'data-center',
  'civil-mep',
] as const

export type ProjectCategory = (typeof PROJECT_CATEGORY_VALUES)[number]

export const PROJECT_SCOPE_VALUES = [
  'mep',
  'hvac',
  'fire-fighting',
  'plumbing',
  'electrical',
  'low-current',
  'data-center',
  'civil',
] as const

export type ProjectScope = (typeof PROJECT_SCOPE_VALUES)[number]

export const PROJECT_STATUS_VALUES = ['completed', 'in-progress'] as const

export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number]

const extractRelationshipId = (raw: unknown): number | string | null => {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw
  }
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim()
  }
  if (typeof raw === 'object' && raw !== null && 'id' in raw) {
    const nested = (raw as { id?: unknown }).id
    if (typeof nested === 'number' && Number.isFinite(nested)) {
      return nested
    }
    if (typeof nested === 'string' && nested.trim().length > 0) {
      return nested.trim()
    }
  }
  return null
}

const hasNonEmptyVideoRef = (val: unknown): boolean => extractRelationshipId(val) !== null

const hasNonEmptyVideoUrl = (val: unknown): boolean =>
  typeof val === 'string' && val.trim().length > 0

const validateProjectBeforeValidate: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data || typeof data !== 'object') {
    return data
  }

  const mutable = data as Record<string, unknown>
  const orig = (originalDoc ?? {}) as Record<string, unknown>

  const effectiveVideo = 'video' in mutable ? mutable.video : orig.video
  const effectiveVideoUrl = 'videoUrl' in mutable ? mutable.videoUrl : orig.videoUrl

  // Normalize empty string videoUrl to null
  if (typeof mutable.videoUrl === 'string' && mutable.videoUrl.trim().length === 0) {
    mutable.videoUrl = null
  }

  // Enforce mutual exclusion: video xor videoUrl (both on draft and published saves)
  if (hasNonEmptyVideoRef(effectiveVideo) && hasNonEmptyVideoUrl(effectiveVideoUrl)) {
    throw new ValidationError({
      collection: 'projects',
      errors: [
        {
          path: 'videoUrl',
          message:
            'لا يمكن تحديد ملف فيديو مرفوع ورابط فيديو خارجي في نفس الوقت — يرجى اختيار أحدهما فقط. / Cannot set both an uploaded video and an external video URL at the same time — choose only one.',
        },
      ],
      req,
    })
  }

  // Always validate videoUrl host (YouTube / Vimeo https:// only) even on draft saves
  if (hasNonEmptyVideoUrl(mutable.videoUrl)) {
    const verdict = validateVideoEmbedUrl(mutable.videoUrl, { required: false })
    if (verdict !== true) {
      throw new ValidationError({
        collection: 'projects',
        errors: [
          {
            path: 'videoUrl',
            message: verdict,
          },
        ],
        req,
      })
    }
  }

  // Verify referenced coverImage exists when provided so invalid IDs fail with 400 instead of 500 FK error
  const coverId = extractRelationshipId(mutable.coverImage)
  if (coverId !== null) {
    try {
      await req.payload.findByID({
        collection: 'media',
        id: coverId,
        depth: 0,
        overrideAccess: true,
        req,
      })
    } catch {
      throw new ValidationError({
        collection: 'projects',
        errors: [
          {
            path: 'coverImage',
            message:
              'صورة الغلاف المحددة غير موجودة في مكتبة الوسائط. / The selected cover image does not exist in the media library.',
          },
        ],
        req,
      })
    }
  }

  // Verify referenced video exists when provided
  const videoId = extractRelationshipId(mutable.video)
  if (videoId !== null) {
    try {
      await req.payload.findByID({
        collection: 'videos',
        id: videoId,
        depth: 0,
        overrideAccess: true,
        req,
      })
    } catch {
      throw new ValidationError({
        collection: 'projects',
        errors: [
          {
            path: 'video',
            message:
              'ملف الفيديو المحدد غير موجود في مكتبة الفيديوهات. / The selected video does not exist in the videos library.',
          },
        ],
        req,
      })
    }
  }

  return mutable
}

const revalidateProjectRelatedAndHomeAfterChange: CollectionAfterChangeHook = ({
  context,
  doc,
  previousDoc,
  req,
}) => {
  const safeDoc = doc as Record<string, unknown>
  try {
    if ((context as { disableRevalidate?: boolean } | undefined)?.disableRevalidate === true) {
      return safeDoc
    }

    const currentStatus = (doc as { _status?: unknown } | undefined)?._status
    const previousStatus = (previousDoc as { _status?: unknown } | undefined)?._status
    if (currentStatus !== 'published' && previousStatus !== 'published') {
      return safeDoc
    }

    const logger = req.payload.logger
    const categories = new Set<string>()
    const currentCategory = (doc as { category?: unknown } | undefined)?.category
    const prevCategory = (previousDoc as { category?: unknown } | undefined)?.category
    if (typeof currentCategory === 'string' && currentCategory.trim().length > 0) {
      categories.add(currentCategory.trim())
    }
    if (typeof prevCategory === 'string' && prevCategory.trim().length > 0) {
      categories.add(prevCategory.trim())
    }

    for (const cat of categories) {
      safeRevalidateTag(`projects:category:${cat}`, logger)
      for (const locale of REVALIDATE_LOCALES) {
        safeRevalidateTag(`projects:category:${cat}:${locale}`, logger)
      }
    }

    const scopes = new Set<string>()
    const currentScope = (doc as { scope?: unknown } | undefined)?.scope
    const prevScope = (previousDoc as { scope?: unknown } | undefined)?.scope
    if (Array.isArray(currentScope)) {
      for (const item of currentScope) {
        if (typeof item === 'string' && item.trim().length > 0) {
          scopes.add(item.trim())
        }
      }
    }
    if (Array.isArray(prevScope)) {
      for (const item of prevScope) {
        if (typeof item === 'string' && item.trim().length > 0) {
          scopes.add(item.trim())
        }
      }
    }
    for (const discipline of scopes) {
      safeRevalidateTag(`projects:scope:${discipline}`, logger)
      for (const locale of REVALIDATE_LOCALES) {
        safeRevalidateTag(`projects:scope:${discipline}:${locale}`, logger)
      }
    }

    const isFeaturedNow = (doc as { featured?: unknown } | undefined)?.featured === true
    const wasFeaturedBefore = (previousDoc as { featured?: unknown } | undefined)?.featured === true
    if (isFeaturedNow || wasFeaturedBefore) {
      safeRevalidateTag('projects:featured', logger)
      for (const locale of REVALIDATE_LOCALES) {
        safeRevalidateTag(`projects:featured:${locale}`, logger)
        safeRevalidatePath(`/${locale}`, undefined, logger)
      }
    }
  } catch {
    // Never throw into the editor's save
  }

  return safeDoc
}

const revalidateProjectRelatedAndHomeAfterDelete: CollectionAfterDeleteHook = ({
  context,
  doc,
  req,
}) => {
  const safeDoc = doc as Record<string, unknown>
  try {
    if ((context as { disableRevalidate?: boolean } | undefined)?.disableRevalidate === true) {
      return safeDoc
    }

    const logger = req.payload.logger
    const category = (doc as { category?: unknown } | undefined)?.category
    if (typeof category === 'string' && category.trim().length > 0) {
      const trimmed = category.trim()
      safeRevalidateTag(`projects:category:${trimmed}`, logger)
      for (const locale of REVALIDATE_LOCALES) {
        safeRevalidateTag(`projects:category:${trimmed}:${locale}`, logger)
      }
    }

    const scopeList = (doc as { scope?: unknown } | undefined)?.scope
    if (Array.isArray(scopeList)) {
      for (const item of scopeList) {
        if (typeof item === 'string' && item.trim().length > 0) {
          const trimmedScope = item.trim()
          safeRevalidateTag(`projects:scope:${trimmedScope}`, logger)
          for (const locale of REVALIDATE_LOCALES) {
            safeRevalidateTag(`projects:scope:${trimmedScope}:${locale}`, logger)
          }
        }
      }
    }

    if ((doc as { featured?: unknown } | undefined)?.featured === true) {
      safeRevalidateTag('projects:featured', logger)
      for (const locale of REVALIDATE_LOCALES) {
        safeRevalidateTag(`projects:featured:${locale}`, logger)
        safeRevalidatePath(`/${locale}`, undefined, logger)
      }
    }
  } catch {
    // Never throw into the editor's delete
  }

  return safeDoc
}

export const Projects: CollectionConfig = {
  slug: 'projects',
  timestamps: true,
  defaultSort: 'order',
  versions: publishableVersions,
  labels: {
    singular: {
      ar: 'مشروع',
      en: 'Project',
    },
    plural: {
      ar: 'المشاريع',
      en: 'Projects',
    },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'featured', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'client', 'location', 'summary', 'slug'],
    enableRichTextLink: true,
    group: {
      ar: 'المحتوى',
      en: 'Content',
    },
    description: {
      ar: 'سجل المشاريع المنفذة والجارية لشركة الجزيرة الإمداد الذكي، شاملاً نطاق الأعمال والصور والفيديوهات والمخرجات.',
      en: 'Completed and in-progress engineering projects delivered by Al Jazira for Imdad Smart Co., including scope, media gallery, videos, and deliverables.',
    },
  },
  access: {
    read: publishedOrLoggedIn,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeValidate: [validateProjectBeforeValidate],
    afterChange: [
      createRevalidateAfterChangeHook({
        collection: 'projects',
        routePrefix: '/projects',
        localizedPaths: ['/projects'],
      }),
      revalidateProjectRelatedAndHomeAfterChange,
    ],
    afterDelete: [
      createRevalidateAfterDeleteHook({
        collection: 'projects',
        routePrefix: '/projects',
        localizedPaths: ['/projects'],
      }),
      revalidateProjectRelatedAndHomeAfterDelete,
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: {
            ar: 'المحتوى (Content)',
            en: 'Content',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
              required: true,
              maxLength: 200,
              label: {
                ar: 'اسم المشروع',
                en: 'Project Title',
              },
              admin: {
                description: {
                  ar: 'الاسم الرسمي للمشروع باللغتين العربية والإنجليزية.',
                  en: 'Official project title in Arabic and English.',
                },
              },
            },
            {
              name: 'category',
              type: 'select',
              required: true,
              index: true,
              options: [
                {
                  label: {
                    ar: 'الأعمال الكهروميكانيكية (MEP)',
                    en: 'MEP Contracting',
                  },
                  value: 'mep',
                },
                {
                  label: {
                    ar: 'أنظمة مكافحة الحريق (Fire-Fighting)',
                    en: 'Fire-Fighting Systems',
                  },
                  value: 'fire-fighting',
                },
                {
                  label: {
                    ar: 'أنظمة التيار الخفيف (Low-Current / ELV)',
                    en: 'Low-Current (ELV) Systems',
                  },
                  value: 'low-current',
                },
                {
                  label: {
                    ar: 'مراكز البيانات (Data Center)',
                    en: 'Data Center Infrastructure',
                  },
                  value: 'data-center',
                },
                {
                  label: {
                    ar: 'الأعمال المدنية والكهروميكانيكية (Civil & MEP)',
                    en: 'Civil & MEP Works',
                  },
                  value: 'civil-mep',
                },
              ],
              label: {
                ar: 'التصنيف الرئيسي',
                en: 'Primary Category',
              },
              admin: {
                description: {
                  ar: 'التصنيف الهندسي الرئيسي للمشروع (يُستخدم في التصفية والمشاريع المشابهة).',
                  en: 'Primary engineering category used for filtering and related projects.',
                },
              },
            },
            {
              name: 'client',
              type: 'text',
              localized: true,
              required: false,
              maxLength: 200,
              label: {
                ar: 'العميل / الجهة المالكة',
                en: 'Client',
              },
              admin: {
                description: {
                  ar: 'اختياري — العديد من عملاء القطاع الخاص سريون (يمكن تركه فارغاً أو كتابة "خاص").',
                  en: 'Optional — many private-sector clients are confidential.',
                },
              },
            },
            {
              name: 'location',
              type: 'text',
              localized: true,
              required: true,
              maxLength: 200,
              label: {
                ar: 'الموقع / المدينة',
                en: 'Location',
              },
              admin: {
                description: {
                  ar: 'موقع المشروع (مثال: الرياض، جدة، الدمام).',
                  en: 'Project city or location (e.g., Riyadh, Jeddah, Dammam).',
                },
              },
            },
            {
              name: 'year',
              type: 'number',
              required: false,
              min: 1990,
              max: new Date().getFullYear() + 2,
              label: {
                ar: 'سنة الإنجاز',
                en: 'Completion Year',
              },
              admin: {
                step: 1,
                description: {
                  ar: 'سنة تسليم أو تنفيذ المشروع (بين 1990 والسنة الحالية + 2).',
                  en: 'Project delivery or execution year (between 1990 and current year + 2).',
                },
              },
              validate: (val: unknown) => {
                if (val === null || val === undefined || val === '') {
                  return true
                }
                const maxYear = new Date().getFullYear() + 2
                if (
                  typeof val !== 'number' ||
                  !Number.isInteger(val) ||
                  val < 1990 ||
                  val > maxYear
                ) {
                  return `يجب أن تكون سنة الإنجاز عدداً صحيحاً بين 1990 و ${String(maxYear)}. / Year must be an integer between 1990 and ${String(maxYear)}.`
                }
                return true
              },
            },
            {
              name: 'scope',
              type: 'select',
              hasMany: true,
              required: false,
              options: [
                {
                  label: {
                    ar: 'الأعمال الكهروميكانيكية (MEP)',
                    en: 'MEP Works',
                  },
                  value: 'mep',
                },
                {
                  label: {
                    ar: 'التكييف والتهوية (HVAC)',
                    en: 'HVAC & Ventilation',
                  },
                  value: 'hvac',
                },
                {
                  label: {
                    ar: 'مكافحة الحريق (Fire-Fighting)',
                    en: 'Fire-Fighting',
                  },
                  value: 'fire-fighting',
                },
                {
                  label: {
                    ar: 'الأعمال الصحية والسباكة (Plumbing)',
                    en: 'Plumbing & Sanitary',
                  },
                  value: 'plumbing',
                },
                {
                  label: {
                    ar: 'الأعمال الكهربائية (Electrical)',
                    en: 'Electrical Works',
                  },
                  value: 'electrical',
                },
                {
                  label: {
                    ar: 'التيار الخفيف (Low-Current / ELV)',
                    en: 'Low-Current (ELV)',
                  },
                  value: 'low-current',
                },
                {
                  label: {
                    ar: 'مراكز البيانات (Data Center)',
                    en: 'Data Center',
                  },
                  value: 'data-center',
                },
                {
                  label: {
                    ar: 'الأعمال المدنية (Civil)',
                    en: 'Civil Works',
                  },
                  value: 'civil',
                },
              ],
              label: {
                ar: 'نطاق الأعمال الهندسية (وسوم)',
                en: 'Engineering Scope Tags',
              },
              admin: {
                description: {
                  ar: 'اختر تخصصاً واحداً أو أكثر من التخصصات الهندسية المنفذة في المشروع.',
                  en: 'Select one or more engineering disciplines executed in this project.',
                },
              },
            },
            {
              name: 'scopeSummary',
              type: 'text',
              localized: true,
              required: false,
              maxLength: 280,
              label: {
                ar: 'ملخص نطاق الأعمال (سطر واحد)',
                en: 'Scope Summary (1-line)',
              },
              admin: {
                description: {
                  ar: 'صياغة مختصرة لنطاق الأعمال تُعرض في جدول معلومات المشروع (مثال: أعمال التكييف ومكافحة الحريق والكهرباء).',
                  en: 'Short 1-line scope phrasing shown in the project info table.',
                },
              },
            },
            {
              name: 'deliveredBy',
              type: 'text',
              localized: true,
              required: false,
              maxLength: 200,
              label: {
                ar: 'جهة التنفيذ / عن طريق',
                en: 'Delivered By (Partner / Sister Entity)',
              },
              admin: {
                description: {
                  ar: 'يُملأ عند تنفيذ المشروع عبر شريك أو كيان شقيق (مثال: عن طريق …). اتركه فارغاً عند التنفيذ المباشر.',
                  en: 'Attribution when the project was delivered via a partner or sister entity. Leave empty when delivered directly.',
                },
              },
            },
            {
              name: 'summary',
              type: 'textarea',
              localized: true,
              required: false,
              maxLength: 280,
              label: {
                ar: 'نبذة مختصرة عن المشروع',
                en: 'Project Summary',
              },
              admin: {
                description: {
                  ar: 'وصف موجز للمشروع يظهر في بطاقات المشاريع وأعلى صفحة تفاصيل المشروع (بحد أقصى 280 حرفاً).',
                  en: 'Concise summary displayed on project cards and the project detail header (up to 280 characters).',
                },
              },
              validate: (val: unknown) => {
                if (typeof val === 'string' && val.length > 280) {
                  return 'يجب ألا تتجاوز النبذة المختصرة 280 حرفاً. / Summary must not exceed 280 characters.'
                }
                return true
              },
            },
            limitedRichTextField({
              name: 'body',
              localized: true,
              required: false,
              label: {
                ar: 'تفاصيل المشروع ودراسة الحالة',
                en: 'Project Case Study / Body',
              },
              overrides: {
                admin: {
                  description: {
                    ar: 'الشرح التفصيلي للمشروع والتحديات الهندسية والحلول المنفذة (العناوين h2–h4، القوائم، الاقتباسات، الروابط الآمنة، والصور).',
                    en: 'Detailed case study covering engineering challenges and executed solutions (h2–h4, lists, blockquotes, safe links, and media uploads).',
                  },
                },
              },
            }),
          ],
        },
        {
          label: {
            ar: 'الوسائط (Media)',
            en: 'Media',
          },
          fields: [
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              filterOptions: () => true,
              label: {
                ar: 'صورة الغلاف الرئيسية',
                en: 'Cover Image',
              },
              admin: {
                description: {
                  ar: 'الصورة الرئيسية للمشروع (مطلوبة) وتظهر في بطاقات المشاريع ورأس صفحة المشروع.',
                  en: 'Primary project cover image (required), displayed on project cards and the project detail hero.',
                },
              },
            },
            {
              name: 'gallery',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              maxRows: 30,
              required: false,
              filterOptions: () => true,
              label: {
                ar: 'معرض صور المشروع',
                en: 'Project Image Gallery',
              },
              admin: {
                description: {
                  ar: 'صور إضافية لتوثيق مراحل ومخرجات المشروع (حتى 30 صورة كحد أقصى).',
                  en: 'Additional project photos documenting execution and results (up to 30 images).',
                },
              },
              validate: (val: unknown) => {
                if (Array.isArray(val) && val.length > 30) {
                  return 'الحد الأقصى لمعرض صور المشروع هو 30 صورة. / Maximum 30 gallery images allowed.'
                }
                return true
              },
            },
            {
              name: 'video',
              type: 'upload',
              relationTo: 'videos',
              required: false,
              filterOptions: () => true,
              label: {
                ar: 'فيديو المشروع (ملف مرفوع)',
                en: 'Project Video (Self-Hosted Upload)',
              },
              admin: {
                description: {
                  ar: 'اختر ملف فيديو مرفوعاً من مكتبة الفيديوهات، أو استخدم حقل رابط الفيديو الخارجي أدناه (لا يمكن الجمع بينهما).',
                  en: 'Select a self-hosted video from the Videos library, OR provide an external video URL below (mutually exclusive).',
                },
              },
              validate: (
                val: unknown,
                { siblingData }: { siblingData?: Record<string, unknown> },
              ) => {
                if (hasNonEmptyVideoRef(val) && hasNonEmptyVideoUrl(siblingData?.videoUrl)) {
                  return 'لا يمكن تحديد ملف فيديو مرفوع ورابط فيديو خارجي في نفس الوقت — يرجى اختيار أحدهما فقط. / Cannot set both an uploaded video and an external video URL at the same time — choose only one.'
                }
                return true
              },
            },
            {
              name: 'videoUrl',
              type: 'text',
              required: false,
              maxLength: 2048,
              label: {
                ar: 'رابط فيديو خارجي (YouTube / Vimeo)',
                en: 'External Video URL (YouTube / Vimeo)',
              },
              admin: {
                description: {
                  ar: 'رابط فيديو خارجي عبر HTTPS من YouTube أو Vimeo فقط (يتعارض مع رفع ملف فيديو داخلي أعلاه).',
                  en: 'External HTTPS video URL from YouTube or Vimeo only (mutually exclusive with self-hosted video above).',
                },
              },
              validate: (
                val: unknown,
                { siblingData }: { siblingData?: Record<string, unknown> },
              ) => {
                if (val === null || val === undefined || val === '') {
                  return true
                }
                if (hasNonEmptyVideoUrl(val) && hasNonEmptyVideoRef(siblingData?.video)) {
                  return 'لا يمكن تحديد ملف فيديو مرفوع ورابط فيديو خارجي في نفس الوقت — يرجى اختيار أحدهما فقط. / Cannot set both an uploaded video and an external video URL at the same time — choose only one.'
                }
                return validateVideoEmbedUrl(val, { required: false })
              },
            },
          ],
        },
        {
          label: {
            ar: 'التفاصيل والمخرجات (Details)',
            en: 'Details',
          },
          fields: [
            {
              name: 'details',
              type: 'array',
              maxRows: 8,
              label: {
                ar: 'الركائز والتفاصيل الفنية للمشروع',
                en: 'Project Details & Pillars',
              },
              labels: {
                singular: {
                  ar: 'تفصيل فني',
                  en: 'Detail Pillar',
                },
                plural: {
                  ar: 'التفاصيل الفنية',
                  en: 'Detail Pillars',
                },
              },
              admin: {
                description: {
                  ar: 'بطاقات تفصيلية توضح الجوانب الهندسية والفنية للمشروع (بحد أقصى 8 عناصر).',
                  en: 'Structured detail cards highlighting engineering aspects of the project (up to 8 items).',
                },
              },
              validate: (val: unknown) => {
                if (Array.isArray(val) && val.length > 8) {
                  return 'الحد الأقصى للتفاصيل الفنية هو 8 عناصر. / Maximum 8 detail items allowed.'
                }
                return true
              },
              fields: pillarFields(),
            },
            {
              name: 'deliverables',
              type: 'array',
              maxRows: 10,
              label: {
                ar: 'المخرجات والبنود المسلمة',
                en: 'Project Deliverables',
              },
              labels: {
                singular: {
                  ar: 'مخرج مشروع',
                  en: 'Deliverable',
                },
                plural: {
                  ar: 'المخرجات المسلمة',
                  en: 'Deliverables',
                },
              },
              admin: {
                description: {
                  ar: 'قائمة بالمخرجات والأنظمة الرئيسية المسلمة في المشروع (حتى 10 بنود كحد أقصى).',
                  en: 'Bullet list of key systems and deliverables completed in the project (up to 10 items).',
                },
              },
              validate: (val: unknown) => {
                if (Array.isArray(val) && val.length > 10) {
                  return 'الحد الأقصى لقائمة المخرجات هو 10 بنود. / Maximum 10 deliverable items allowed.'
                }
                return true
              },
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  localized: true,
                  required: true,
                  maxLength: 280,
                  label: {
                    ar: 'نص المخرج / البند',
                    en: 'Deliverable Text',
                  },
                },
              ],
            },
          ],
        },
        {
          label: {
            ar: 'تحسين محركات البحث (SEO)',
            en: 'SEO',
          },
          fields: [seoGroupField()],
        },
      ],
    },
    ...slugFields({ from: 'title' }),
    {
      name: 'status',
      type: 'select',
      enumName: 'enum_projects_execution_status',
      required: true,
      defaultValue: 'completed',
      index: true,
      options: [
        {
          label: {
            ar: 'مكتمل (Completed)',
            en: 'Completed',
          },
          value: 'completed',
        },
        {
          label: {
            ar: 'قيد التنفيذ (In Progress)',
            en: 'In Progress',
          },
          value: 'in-progress',
        },
      ],
      label: {
        ar: 'حالة تنفيذ المشروع',
        en: 'Project Execution Status',
      },
      admin: {
        position: 'sidebar',
        description: {
          ar: 'حالة الإنجاز الهندسي للمشروع (مكتمل أو قيد التنفيذ).',
          en: 'Engineering execution status of the project (completed or in-progress).',
        },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      label: {
        ar: 'مشروع مميز (يظهر في الصفحة الرئيسية)',
        en: 'Featured Project (Show on Home Page)',
      },
      admin: {
        position: 'sidebar',
        description: {
          ar: 'فعّل هذا الخيار لإبراز هذا المشروع في قسم المشاريع المختارة بالصفحة الرئيسية.',
          en: 'Enable to highlight this project in the featured projects section on the Home page.',
        },
      },
    },
    orderField(),
  ],
}
