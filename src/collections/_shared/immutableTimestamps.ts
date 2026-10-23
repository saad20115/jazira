import type {
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Field,
  FieldAccess,
} from 'payload'

/**
 * Field-level access helper that unconditionally denies updating `createdAt` (`R-2`).
 */
export const neverUpdateFieldAccess: FieldAccess = () => false

/**
 * Shared explicit `createdAt` timestamp field definition (`R-2`).
 *
 * Matches Payload's default `createdAt` field (`type: 'date'`, `index: true`,
 * `admin: { disableBulkEdit: true, hidden: true }`) while adding explicit
 * `access: { update: neverUpdateFieldAccess }` and `admin.readOnly: true` so
 * `createdAt` is never writable via REST, GraphQL, or Local API updates.
 */
export const immutableCreatedAtField: Field = {
  name: 'createdAt',
  type: 'date',
  index: true,
  access: {
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
 * from `args.data` on `update` operations (both single-document `updateByID` and
 * bulk `update`) before field traversal runs (`R-2`).
 */
export const stripCreatedAtOnUpdateBeforeOperation: CollectionBeforeOperationHook = (rawArg) => {
  const { args, operation } = rawArg as ActiveBeforeOperationArg
  if (operation === 'update' && 'data' in args) {
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
 * Wraps a `CollectionConfig` so that `createdAt` is strictly immutable across
 * REST (`PATCH /api/<slug>/:id` and bulk `PATCH /api/<slug>?where=...`), Admin UI,
 * and Local API `update` calls (`R-2`).
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

/**
 * Applies `withImmutableCreatedAt` in-place on an existing `CollectionConfig` object (`R-2`).
 */
export function applyImmutableCreatedAtInPlace(collection: CollectionConfig): CollectionConfig {
  const updated = withImmutableCreatedAt(collection)
  collection.fields = updated.fields
  collection.hooks = updated.hooks
  return collection
}
