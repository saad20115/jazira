import type { FieldAccess } from 'payload'

export const isAdminFieldLevel: FieldAccess = ({ req }) => {
  const user = req.user as { role?: string } | null | undefined
  return user?.role === 'admin'
}
