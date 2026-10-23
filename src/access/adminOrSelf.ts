import type { Access, FieldAccess } from 'payload'

export const adminOrSelf: Access = ({ req }) => {
  const user = req.user as { id?: number | string; role?: string } | null | undefined
  if (!user) {
    return false
  }

  if (user.role === 'admin') {
    return true
  }

  if (user.id !== undefined) {
    return {
      id: {
        equals: user.id,
      },
    }
  }

  return false
}

/**
 * Field-level read access helper (`R-11`): allows `admin` to read any user's
 * field, and allows non-admin staff (`editor`) to read the field ONLY on their
 * own user document (`String(user.id) === String(doc.id)`).
 */
export const isAdminOrSelfFieldLevel: FieldAccess = ({ doc, id, req }) => {
  const user = req.user as { id?: number | string; role?: string } | null | undefined
  if (!user) {
    return false
  }

  if (user.role === 'admin') {
    return true
  }

  const targetId = (doc as { id?: number | string } | null | undefined)?.id ?? id
  if (user.id !== undefined && targetId !== undefined) {
    return String(user.id) === String(targetId)
  }

  return false
}
