import type {
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  DateField,
  Field,
  FieldAccess,
} from 'payload'

/**
 * Field-level access helper that unconditionally denies creating or updating `createdAt`
 * via the API (`R-2`, `R-10`).
 */
export const neverUpdateFieldAccess: FieldAccess = () => false

/**
 * Shared explicit `createdAt` timestamp field definition (`R-2`, `R-10`).
 *
 * Matches Payload's default `createdAt` field (`type: 'date'`, `index: true`,
 * `admin: { disableBulkEdit: true, hidden: true }`) while adding explicit
 * `access: { create: neverUpdateFieldAccess, update: neverUpdateFieldAccess }`
 * and `admin.readOnly: true` so `createdAt` cannot be forged on `create` or
 * rewritten on `update` via REST, GraphQL, or Local API (`overrideAccess: false`).
 *
 * Note for future backfills / migrations:
 * - `payload.create({ ..., overrideAccess: true })` (e.g. seed scripts) may set `createdAt`.
 * - `payload.update({ ..., overrideAccess: true })` CANNOT change `createdAt` because
 *   `stripCreatedAtOnUpdateBeforeOperation`, `preserveCreatedAtBeforeValidate`, and
 *   `preserveCreatedAtBeforeChange` run unconditionally on `update`. Any future backfill
 *   or migration that needs to rewrite `createdAt` on an existing row must use the
 *   database adapter directly (`payload.db.updateOne` / SQL).
 */
export const immutableCreatedAtField: DateField = {
  name: 'createdAt',
  type: 'date',
  index: true,
  access: {
    create: neverUpdateFieldAccess,
    update: neverUpdateFieldAccess,
  },
  admin: {
    disableBulkEdit: true,
    hidden: true,
    readOnly: true,
  },
  label: ({ t }) => t('general:createdAt'),
}

type ActiveBeforeOperationArg = Exclude<
  Parameters<CollectionBeforeOperationHook>[0],
  { operation: 'read' | 'readDistinct' }
>

/**
 * Collection `beforeOperation` hook that strips any incoming `createdAt` property
 * from `args.data` on:
 * - all `update` operations (single-document `updateByID` and bulk `update`), and
 * - `create` operations when `overrideAccess === false` (REST `POST /api/<slug>`,
 *   GraphQL, and Local API with `overrideAccess: false`) (`R-2`, `R-10`).
 */
export const stripCreatedAtOnUpdateBeforeOperation: CollectionBeforeOperationHook = (rawArg) => {
  const { args, operation } = rawArg as ActiveBeforeOperationArg
  if (operation === 'update' && 'data' in args) {
    const dataRecord = args.data as Record<string, unknown> | undefined
    if (dataRecord && typeof dataRecord === 'object') {
      delete dataRecord.createdAt
    }
  } else if (
    operation === 'create' &&
    'data' in args &&
    'overrideAccess' in args &&
    args.overrideAccess === false
  ) {
    const dataRecord = args.data as Record<string, unknown> | undefined
    if (dataRecord && typeof dataRecord === 'object') {
      delete dataRecord.createdAt
    }
  }
  return args
}

/**
 * Collection `beforeValidate` hook that restores `originalDoc.createdAt` (or deletes
 * `data.createdAt` if `originalDoc.createdAt` is absent) on `update` operations (`R-2`).
 */
export const preserveCreatedAtBeforeValidate: CollectionBeforeValidateHook = ({
  data,
  operation,
  originalDoc,
}) => {
  if (operation === 'update' && data && typeof data === 'object') {
    const mutable = data as Record<string, unknown>
    const origRecord = originalDoc as Record<string, unknown> | undefined
    const prevCreatedAt = origRecord?.createdAt
    if (prevCreatedAt !== undefined) {
      mutable.createdAt = prevCreatedAt
    } else {
      delete mutable.createdAt
    }
  }
  return data
}

/**
 * Collection `beforeChange` hook that restores `originalDoc.createdAt` (or deletes
 * `data.createdAt` if `originalDoc.createdAt` is absent) on `update` operations (`R-2`).
 */
export const preserveCreatedAtBeforeChange: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
}) => {
  if (operation === 'update') {
    const mutable = data as Record<string, unknown>
    const origRecord = originalDoc as Record<string, unknown> | undefined
    const prevCreatedAt = origRecord?.createdAt
    if (prevCreatedAt !== undefined) {
      mutable.createdAt = prevCreatedAt
    } else {
      delete mutable.createdAt
    }
  }
  return data
}

function prependUniqueHook<T>(hooks: T[] | undefined, hook: T): T[] {
  const existing = hooks ?? []
  if (existing.includes(hook)) {
    return existing
  }
  return [hook, ...existing]
}

/**
 * Wraps a `CollectionConfig` so that `createdAt` cannot be forged on `create`
 * (`overrideAccess: false`) and is strictly immutable across REST (`PATCH /api/<slug>/:id`
 * and bulk `PATCH /api/<slug>?where=...`), Admin UI, and Local API `update` calls (`R-2`, `R-10`).
 */
export function withImmutableCreatedAt(collection: CollectionConfig): CollectionConfig {
  if (collection.timestamps === false) {
    return collection
  }

  const existingFields = collection.fields
  const hasCreatedAt = existingFields.some((field) => 'name' in field && field.name === 'createdAt')

  const fields: Field[] = hasCreatedAt
    ? existingFields.map((field) => {
        if ('name' in field && field.name === 'createdAt' && field.type === 'date') {
          return {
            ...field,
            access: {
              ...field.access,
              create: neverUpdateFieldAccess,
              update: neverUpdateFieldAccess,
            },
            admin: {
              ...field.admin,
              disableBulkEdit: true,
              hidden: true,
              readOnly: true,
            },
          }
        }
        return field
      })
    : [...existingFields, immutableCreatedAtField]

  return {
    ...collection,
    fields,
    hooks: {
      ...collection.hooks,
      beforeOperation: prependUniqueHook(
        collection.hooks?.beforeOperation,
        stripCreatedAtOnUpdateBeforeOperation,
      ),
      beforeValidate: prependUniqueHook(
        collection.hooks?.beforeValidate,
        preserveCreatedAtBeforeValidate,
      ),
      beforeChange: prependUniqueHook(
        collection.hooks?.beforeChange,
        preserveCreatedAtBeforeChange,
      ),
    },
  }
}
