import type { CollectionConfig } from 'payload'

import { adminOrSelf, isAdmin, isAdminFieldLevel } from '../access/index'
import { enforcePasswordPolicy } from '../security/passwordPolicy'

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
  hooks: {
    beforeOperation: [
      (hookArg) => {
        const { args, operation, req } = hookArg as unknown as {
          args: { data?: Record<string, unknown> }
          operation: string
          req: { context: Record<string, unknown>; user?: { role?: string } | null }
        }
        if (operation === 'create' || operation === 'resetPassword') {
          enforcePasswordPolicy(args.data?.password)
        } else if (operation === 'update' || operation === 'updateByID') {
          const data = args.data
          if (data && 'password' in data && data.password !== undefined && data.password !== null) {
            enforcePasswordPolicy(data.password)
          }
          if (
            req.user?.role === 'admin' &&
            data &&
            'sessions' in data &&
            Array.isArray(data.sessions)
          ) {
            req.context.adminSetSessions = data.sessions
          }
        }
        return hookArg.args
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'update' && Array.isArray(req.context.adminSetSessions)) {
          const sessions = req.context.adminSetSessions as unknown[]
          delete req.context.adminSetSessions
          const docId = (doc as { id?: number | string }).id
          if (docId !== undefined) {
            await req.payload.db.updateOne({
              collection: 'users',
              id: docId,
              data: { sessions },
              req,
            })
            ;(doc as { sessions?: unknown[] }).sessions = sessions
          }
        }
        return doc as Record<string, unknown>
      },
    ],
    beforeValidate: [
      async ({ data, operation, originalDoc, req }) => {
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
      },
    ],
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
