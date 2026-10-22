import {
  Forbidden,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeOperationHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
} from 'payload'

import { adminOrSelf, isAdmin, isAdminFieldLevel } from '../access/index'
import { createPublicAPIError } from '../security/apiError'
import { enforcePasswordPolicy } from '../security/passwordPolicy'

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

export const Users: CollectionConfig = {
  slug: 'users',
  timestamps: true,
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
    useAsTitle: 'email',
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
    read: adminOrSelf,
    create: isAdmin,
    update: adminOrSelf,
    delete: isAdmin,
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
    beforeOperation: [enforcePasswordBeforeOperation],
    beforeValidate: [enforceRoleAndPasswordBeforeValidate],
    beforeChange: [preventLastAdminDemotionBeforeChange],
    beforeDelete: [preventLastAdminBeforeDelete],
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
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
    },
  ],
}
