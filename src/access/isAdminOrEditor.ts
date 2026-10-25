import type { Access, FieldAccess } from 'payload'

export const isAdminOrEditor: Access = ({ req }) => {
  const user = req.user as { role?: string } | null | undefined
  return user?.role === 'admin' || user?.role === 'editor'
}

export const isAdminOrEditorFieldLevel: FieldAccess = ({ req }) => {
  const user = req.user as { role?: string } | null | undefined
  return user?.role === 'admin' || user?.role === 'editor'
}
