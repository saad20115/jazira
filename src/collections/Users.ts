import {
  Forbidden,
  type CollectionAfterReadHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeOperationHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  type FieldAccess,
  type FieldHook,
  type PayloadHandler,
} from 'payload'

import {
  adminOrSelf,
  isAdmin,
  isAdminFieldLevel,
  isAdminOrEditor,
  isAdminOrSelfFieldLevel,
} from '../access/index'
import { createPublicAPIError } from '../security/apiError'
import {
  hardenLoginEnumerationBeforeOperation,
  maskLockedAuthAfterError,
} from '../security/loginEnumeration'
import { enforcePasswordPolicy } from '../security/passwordPolicy'
import { immutableCreatedAtField, withImmutableCreatedAt } from './_shared/immutableTimestamps'

type ActiveBeforeOperationArg = Exclude<
  Parameters<CollectionBeforeOperationHook>[0],
  { operation: 'read' | 'readDistinct' }
>

const enforcePasswordBeforeOperation: CollectionBeforeOperationHook = (rawArg) => {
  const { args, operation } = rawArg as ActiveBeforeOperationArg
  const data = (args as { data?: Record<string, unknown> }).data
  if (operation === 'create' || operation === 'resetPassword') {
    enforcePasswordPolicy(data?.password)
  } else if (operation === 'update') {
    if (data && 'password' in data && data.password !== undefined && data.password !== null) {
      enforcePasswordPolicy(data.password)
    }
  }
  return args
}

const enforceRoleAndPasswordBeforeValidate: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) {
    return data
  }

  if ('password' in data && data.password !== undefined && data.password !== null) {
    enforcePasswordPolicy(data.password)
  }

  const callerRole = (req.user as { role?: string } | null | undefined)?.role

  if (operation === 'create') {
    const existingUser = await req.payload.db.findOne({
      collection: 'users',
      req,
      where: {},
    })

    if (!existingUser) {
      // Very first user registered in the system becomes admin
      data.role = 'admin'
    } else if (callerRole !== 'admin') {
      data.role = 'editor'
    } else {
      data.role ??= 'editor'
    }
  } else if (originalDoc && callerRole !== 'admin') {
    // Defense-in-depth alongside field-level access (Z3): preserve existing role on non-admin updates
    const prevRole = (originalDoc as { role?: 'admin' | 'editor' }).role
    data.role = prevRole ?? 'editor'
  }

  return data
}

const preventLastAdminDemotionBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === 'update' && originalDoc) {
    const previousRole = (originalDoc as { role?: string }).role
    const nextRole = (data as { role?: string }).role
    if (previousRole === 'admin' && nextRole !== undefined && nextRole !== 'admin') {
      const docId = (originalDoc as { id?: number | string }).id
      const otherAdmins = await req.payload.count({
        collection: 'users',
        overrideAccess: true,
        req,
        where:
          docId !== undefined
            ? {
                and: [{ role: { equals: 'admin' } }, { id: { not_equals: docId } }],
              }
            : { role: { equals: 'admin' } },
      })

      if (otherAdmins.totalDocs === 0) {
        throw createPublicAPIError(
          'لا يمكن خفض صلاحية مدير النظام الوحيد إلى محرر. يجب وجود مدير نظام واحد على الأقل. / Cannot demote the last admin user.',
          400,
        )
      }
    }
  }

  return data
}

const preventLastAdminBeforeDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const targetUser = await req.payload.db.findOne<{ id: number | string; role?: string }>({
    collection: 'users',
    req,
    where: {
      id: {
        equals: id,
      },
    },
  })

  if (targetUser?.role === 'admin') {
    const otherAdmins = await req.payload.count({
      collection: 'users',
      overrideAccess: true,
      req,
      where: {
        and: [{ role: { equals: 'admin' } }, { id: { not_equals: id } }],
      },
    })

    if (otherAdmins.totalDocs === 0) {
      throw createPublicAPIError(
        'لا يمكن حذف مدير النظام الوحيد. يجب وجود مدير نظام واحد على الأقل. / Cannot delete the last admin user.',
        400,
      )
    }
  }
}

export const resolveUserDisplayNameBeforeValidate: FieldHook = ({
  value,
  siblingData,
  data,
  originalDoc,
}) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }
  const siblingEmail =
    (siblingData as { email?: unknown } | undefined)?.email ??
    (data as { email?: unknown } | undefined)?.email
  if (typeof siblingEmail === 'string' && siblingEmail.trim().length > 0) {
    return siblingEmail.trim().toLowerCase()
  }
  const origName = (originalDoc as { name?: unknown } | undefined)?.name
  if (typeof origName === 'string' && origName.trim().length > 0) {
    return origName.trim()
  }
  const origEmail = (originalDoc as { email?: unknown } | undefined)?.email
  if (typeof origEmail === 'string' && origEmail.trim().length > 0) {
    return origEmail.trim().toLowerCase()
  }
  return value as unknown
}

const isAdminOrEditorUserFieldAccess: FieldAccess = ({ req }) => {
  const user = req.user as { role?: string } | null | undefined
  return user?.role === 'admin' || user?.role === 'editor'
}

export const resolveUserDisplayNameAfterRead: FieldHook = ({ value, siblingData, data, req }) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }
  const canReadEmail = isAdminOrSelfFieldLevel({
    doc: (data ?? siblingData) as Record<string, unknown>,
    req,
  })
  if (canReadEmail) {
    const fallbackEmail =
      (siblingData as { email?: unknown } | undefined)?.email ??
      (data as { email?: unknown } | undefined)?.email
    if (typeof fallbackEmail === 'string' && fallbackEmail.trim().length > 0) {
      return fallbackEmail.trim()
    }
  }
  return value as unknown
}

/**
 * Defense-in-depth `afterRead` hook (`R-11`): when a non-admin staff user (`editor`)
 * reads another user's document (including via `depth=1` relationship population on
 * `quote-requests.assignedTo`), strip every field except `id` and `name`.
 */
export const restrictOtherUserFieldsForEditorAfterRead: CollectionAfterReadHook = ({
  doc,
  req,
}): Record<string, unknown> => {
  if (!doc || typeof doc !== 'object') {
    return doc as Record<string, unknown>
  }
  const record = doc as Record<string, unknown>
  const caller = req.user as { id?: number | string; role?: string } | null | undefined
  if (!caller || caller.role === 'admin') {
    return record
  }
  const recordId = record.id
  if (
    caller.id !== undefined &&
    (typeof recordId === 'number' || typeof recordId === 'string') &&
    String(caller.id) === String(recordId)
  ) {
    return record
  }
  return {
    id: record.id,
    name: record.name,
  }
}

export const disableVerifyEmailEndpointHandler: PayloadHandler = () =>
  Response.json(
    {
      errors: [
        {
          message:
            'التحقق من البريد الإلكتروني غير مفعّل لحسابات الموظفين. / Email verification is disabled for staff accounts.',
        },
      ],
    },
    { status: 404 },
  )

export const Users: CollectionConfig = withImmutableCreatedAt({
  slug: 'users',
  timestamps: true,
  forceSelect: {
    name: true,
  },
  labels: {
    singular: {
      ar: 'مستخدم',
      en: 'User',
    },
    plural: {
      ar: 'المستخدمون',
      en: 'Users',
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'updatedAt'],
    group: {
      ar: 'النظام',
      en: 'System',
    },
    description: {
      ar: 'حسابات مستخدمي لوحة التحكم وصلاحياتهم (مدير النظام أو محرر المحتوى).',
      en: 'Dashboard user accounts and role assignments (Admin or Content Editor).',
    },
  },
  access: {
    read: isAdminOrEditor,
    create: isAdmin,
    update: adminOrSelf,
    delete: isAdmin,
    unlock: isAdmin,
    admin: ({ req }) => {
      const user = req.user as { role?: string } | null | undefined
      return user?.role === 'admin' || user?.role === 'editor'
    },
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000, // 15 minutes (A1)
    tokenExpiration: 7200, // 2 hours in seconds (A2)
    useSessions: true, // Server-side session tracking enabled (A2)
    useAPIKey: false, // No API keys for users (A3)
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    },
    forgotPassword: {
      expiration: 60 * 60 * 1000, // 1 hour in milliseconds (A5)
    },
  },
  endpoints: [
    {
      path: '/verify/:id',
      method: 'post',
      handler: disableVerifyEmailEndpointHandler,
    },
    {
      path: '/:id/revoke-sessions',
      method: 'post',
      handler: async (req) => {
        if (!isAdmin({ req })) {
          throw new Forbidden(req.t)
        }

        const rawId = req.routeParams?.id
        const id =
          typeof rawId === 'number' && Number.isInteger(rawId) && rawId > 0
            ? rawId
            : typeof rawId === 'string' && /^[1-9]\d*$/.test(rawId.trim())
              ? Number.parseInt(rawId.trim(), 10)
              : null
        if (id === null) {
          throw createPublicAPIError('معرّف المستخدم غير صالح. / Invalid user ID.', 400)
        }

        const targetUser = await req.payload.db.findOne<{ id: number | string }>({
          collection: 'users',
          req,
          where: {
            id: {
              equals: id,
            },
          },
        })

        if (!targetUser) {
          return Response.json({ errors: [{ message: 'User not found.' }] }, { status: 404 })
        }

        await req.payload.db.updateOne({
          collection: 'users',
          id: targetUser.id,
          data: {
            sessions: [],
          },
          req,
        })

        return Response.json(
          {
            message: 'All sessions revoked for user.',
            revokedUserId: targetUser.id,
          },
          { status: 200 },
        )
      },
    },
  ],
  hooks: {
    beforeOperation: [enforcePasswordBeforeOperation, hardenLoginEnumerationBeforeOperation],
    beforeValidate: [enforceRoleAndPasswordBeforeValidate],
    beforeChange: [preventLastAdminDemotionBeforeChange],
    afterRead: [restrictOtherUserFieldsForEditorAfterRead],
    beforeDelete: [preventLastAdminBeforeDelete],
    afterError: [maskLockedAuthAfterError],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: {
        ar: 'الاسم',
        en: 'Name',
      },
      access: {
        read: isAdminOrEditorUserFieldAccess,
      },
      hooks: {
        beforeValidate: [resolveUserDisplayNameBeforeValidate],
        afterRead: [resolveUserDisplayNameAfterRead],
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      access: {
        read: isAdminOrSelfFieldLevel,
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      label: {
        ar: 'الدور',
        en: 'Role',
      },
      options: [
        {
          label: {
            ar: 'مدير النظام',
            en: 'Admin',
          },
          value: 'admin',
        },
        {
          label: {
            ar: 'محرر',
            en: 'Editor',
          },
          value: 'editor',
        },
      ],
      access: {
        read: isAdminOrSelfFieldLevel,
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
    },
    {
      name: 'updatedAt',
      type: 'date',
      index: true,
      admin: {
        disableBulkEdit: true,
        hidden: true,
      },
      access: {
        read: isAdminOrSelfFieldLevel,
      },
      label: ({ t }) => t('general:updatedAt'),
    },
    {
      ...immutableCreatedAtField,
      access: {
        ...immutableCreatedAtField.access,
        read: isAdminOrSelfFieldLevel,
      },
    },
  ],
})
