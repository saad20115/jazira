import {
  type CollectionSlug,
  type Field,
  type GlobalBeforeOperationHook,
  type GlobalBeforeValidateHook,
  type GlobalConfig,
  type PayloadRequest,
  ValidationError,
} from 'payload'

import { isAdminOrEditor } from '../../access/isAdminOrEditor'
import { publishedOrLoggedIn } from '../../access/publishedOrLoggedIn'
import { captureMainPublishedGlobalBeforeChange } from '../../hooks/revalidate'

export type PublishableGlobalVersions = NonNullable<GlobalConfig['versions']>

/**
 * Shared versions configuration for all publishable page globals
 * (`home-page`, `services-page`, `about-page`, `projects-page`, `contact-page`, `privacy-page`)
 * per `docs/02-content-model.md` and `handoff/tasks/P2-T5.md` Scope 2.
 */
export const publishableGlobalVersions: PublishableGlobalVersions = {
  drafts: {
    autosave: {
      interval: 800,
    },
    schedulePublish: true,
  },
  max: 25,
}

export const PAGES_ADMIN_GROUP = {
  ar: 'الصفحات',
  en: 'Pages',
} as const

export const SETTINGS_ADMIN_GROUP = {
  ar: 'الإعدادات',
  en: 'Settings',
} as const

/**
 * Defense-in-depth `beforeOperation` hook for publishable page globals (`Z2`):
 * When an unauthenticated caller reads a global (`!req.user && !overrideAccess`),
 * force `args.draft = false` even if `?draft=true` was passed on the request URL.
 */
export const enforcePublishedReadOnGlobalBeforeOperation: GlobalBeforeOperationHook = ({
  args,
  operation,
  overrideAccess,
  req,
}) => {
  if (operation === 'read' && !overrideAccess && !req.user && args && typeof args === 'object') {
    ;(args as { draft?: boolean }).draft = false
  }
  return args as unknown
}

const parsePositiveIntId = (raw: unknown): number | null => {
  if (typeof raw === 'number') {
    return Number.isInteger(raw) && raw > 0 ? raw : null
  }
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
    const parsed = Number.parseInt(raw.trim(), 10)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  }
  if (typeof raw === 'object' && raw !== null && 'id' in raw) {
    return parsePositiveIntId((raw as { id?: unknown }).id)
  }
  return null
}

const docExists = async (
  req: PayloadRequest,
  collection: CollectionSlug,
  id: number,
): Promise<boolean> => {
  try {
    const doc = await req.payload.findByID({
      collection,
      id,
      depth: 0,
      disableErrors: true,
      overrideAccess: true,
      req,
    })
    return Boolean(doc)
  } catch {
    return false
  }
}

const collectRichTextMediaUploadValues = (node: unknown, out: unknown[] = []): unknown[] => {
  if (!node || typeof node !== 'object') {
    return out
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      collectRichTextMediaUploadValues(child, out)
    }
    return out
  }
  const record = node as Record<string, unknown>
  if (record.type === 'upload' && record.relationTo === 'media' && 'value' in record) {
    out.push(record.value)
  }
  for (const val of Object.values(record)) {
    if (typeof val === 'object' && val !== null) {
      collectRichTextMediaUploadValues(val, out)
    }
  }
  return out
}

const joinFieldPath = (prefix: string, name: string): string =>
  prefix.length > 0 ? `${prefix}.${name}` : name

async function validateFieldsRecursively(
  fields: Field[],
  currentData: Record<string, unknown>,
  pathPrefix: string,
  req: PayloadRequest,
  errors: Array<{ message: string; path: string }>,
): Promise<void> {
  for (const field of fields) {
    if (field.type === 'collapsible' || field.type === 'row') {
      await validateFieldsRecursively(field.fields, currentData, pathPrefix, req, errors)
      continue
    }

    if (!('name' in field) || typeof field.name !== 'string') {
      continue
    }

    const fieldPath = joinFieldPath(pathPrefix, field.name)
    if (!(field.name in currentData)) {
      continue
    }

    const rawValue = currentData[field.name]
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      continue
    }

    if (field.type === 'group') {
      if (typeof rawValue === 'object' && !Array.isArray(rawValue)) {
        await validateFieldsRecursively(
          field.fields,
          rawValue as Record<string, unknown>,
          fieldPath,
          req,
          errors,
        )
      }
      continue
    }

    if (field.type === 'array') {
      if (Array.isArray(rawValue)) {
        const items = rawValue as unknown[]
        for (let i = 0; i < items.length; i += 1) {
          const item = items[i]
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            await validateFieldsRecursively(
              field.fields,
              item as Record<string, unknown>,
              `${fieldPath}.${String(i)}`,
              req,
              errors,
            )
          }
        }
      }
      continue
    }

    if (field.type === 'upload' && typeof field.relationTo === 'string') {
      const targetCollection = field.relationTo
      const parsedId = parsePositiveIntId(rawValue)
      if (parsedId === null || !(await docExists(req, targetCollection, parsedId))) {
        errors.push({
          path: fieldPath,
          message: `معرّف ملف الوسائط في الحقل (${fieldPath}) غير موجود. / Referenced ${targetCollection} ID in "${fieldPath}" does not exist.`,
        })
      }
      continue
    }

    if (field.type === 'relationship') {
      if (typeof field.relationTo === 'string') {
        const targetCollection = field.relationTo
        if (field.hasMany) {
          if (!Array.isArray(rawValue)) {
            errors.push({
              path: fieldPath,
              message: `قيمة الحقل (${fieldPath}) يجب أن تكون مصفوفة معرّفات صالحة. / Field "${fieldPath}" must be an array of valid IDs.`,
            })
            continue
          }
          for (const item of rawValue as unknown[]) {
            const parsedId = parsePositiveIntId(item)
            if (parsedId === null || !(await docExists(req, targetCollection, parsedId))) {
              errors.push({
                path: fieldPath,
                message: `أحد السجلات المرتبطة في الحقل (${fieldPath}) غير موجود. / One or more referenced ${targetCollection} records in "${fieldPath}" do not exist.`,
              })
              break
            }
          }
        } else {
          const parsedId = parsePositiveIntId(rawValue)
          if (parsedId === null || !(await docExists(req, targetCollection, parsedId))) {
            errors.push({
              path: fieldPath,
              message: `السجل المرتبط في الحقل (${fieldPath}) غير موجود. / Referenced ${targetCollection} record in "${fieldPath}" does not exist.`,
            })
          }
        }
      } else if (Array.isArray(field.relationTo)) {
        const allowedCollections = field.relationTo
        if (typeof rawValue !== 'object' || Array.isArray(rawValue)) {
          errors.push({
            path: fieldPath,
            message: `المرجع الداخلي في الحقل (${fieldPath}) غير صالح. / Invalid polymorphic relationship in "${fieldPath}".`,
          })
          continue
        }
        const relObj = rawValue as { relationTo?: unknown; value?: unknown }
        const relationTo =
          typeof relObj.relationTo === 'string' ? (relObj.relationTo as CollectionSlug) : null
        const parsedId = parsePositiveIntId(relObj.value)
        if (
          !relationTo ||
          !allowedCollections.includes(relationTo) ||
          parsedId === null ||
          !(await docExists(req, relationTo, parsedId))
        ) {
          errors.push({
            path: fieldPath,
            message: `السجل المرجعي المحدد في الحقل (${fieldPath}) غير موجود. / Referenced document in "${fieldPath}" does not exist.`,
          })
        }
      }
      continue
    }

    if (field.type === 'select') {
      const allowedValues = new Set(
        field.options.map((opt) => (typeof opt === 'string' ? opt : opt.value)),
      )
      if (field.hasMany) {
        if (
          !Array.isArray(rawValue) ||
          rawValue.some((item) => typeof item !== 'string' || !allowedValues.has(item))
        ) {
          errors.push({
            path: fieldPath,
            message: `قيمة الخيار في الحقل (${fieldPath}) غير صالحة. / Invalid select option in "${fieldPath}".`,
          })
        }
      } else if (typeof rawValue !== 'string' || !allowedValues.has(rawValue)) {
        errors.push({
          path: fieldPath,
          message: `قيمة الخيار في الحقل (${fieldPath}) غير صالحة. / Invalid select option in "${fieldPath}".`,
        })
      }
      continue
    }

    if (field.type === 'richText' && typeof rawValue === 'object') {
      const uploadValues = collectRichTextMediaUploadValues(rawValue)
      for (const uploadVal of uploadValues) {
        const parsedId = parsePositiveIntId(uploadVal)
        if (parsedId === null || !(await docExists(req, 'media', parsedId))) {
          errors.push({
            path: fieldPath,
            message: `أحد ملفات الوسائط المضمّنة داخل النص المنسق (${fieldPath}) غير موجود. / An embedded media item inside "${fieldPath}" does not exist.`,
          })
          break
        }
      }
    }
  }
}

/**
 * Schema-driven `beforeValidate` hook for globals (`R-6` protection):
 * Validates all upload/relationship IDs and select enum values on both draft (`?draft=true`)
 * and published saves so invalid IDs or enum values return HTTP `400` (`ValidationError`)
 * instead of reaching PostgreSQL foreign-key / enum constraints (`500`).
 */
export function createValidateGlobalDataBeforeValidateHook(
  globalSlug: string,
  fields: Field[],
): GlobalBeforeValidateHook {
  return async ({ data, req }) => {
    if (!data || typeof data !== 'object') {
      return data as unknown
    }
    const errors: Array<{ message: string; path: string }> = []
    await validateFieldsRecursively(fields, data as Record<string, unknown>, '', req, errors)
    if (errors.length > 0) {
      throw new ValidationError({
        global: globalSlug,
        errors,
        req,
      })
    }
    return data as unknown
  }
}

export function withPublishableGlobal<T extends GlobalConfig>(
  config: Omit<T, 'versions'>,
): T & { versions: PublishableGlobalVersions } {
  const existingBeforeOperation = config.hooks?.beforeOperation ?? []
  const existingBeforeValidate = config.hooks?.beforeValidate ?? []
  const existingBeforeChange = config.hooks?.beforeChange ?? []
  return {
    ...config,
    access: {
      read: publishedOrLoggedIn,
      readVersions: isAdminOrEditor,
      update: isAdminOrEditor,
      ...config.access,
    },
    hooks: {
      ...config.hooks,
      beforeOperation: [enforcePublishedReadOnGlobalBeforeOperation, ...existingBeforeOperation],
      beforeValidate: [
        createValidateGlobalDataBeforeValidateHook(config.slug, config.fields),
        ...existingBeforeValidate,
      ],
      beforeChange: [captureMainPublishedGlobalBeforeChange, ...existingBeforeChange],
    },
    versions: publishableGlobalVersions,
  } as T & { versions: PublishableGlobalVersions }
}
