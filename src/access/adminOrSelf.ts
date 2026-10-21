import type { Access } from 'payload'

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
