import type { Access } from 'payload'

export const publishedOrLoggedIn: Access = ({ req }) => {
  const user = req.user as { role?: string } | null | undefined
  if (user?.role === 'admin' || user?.role === 'editor') {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
