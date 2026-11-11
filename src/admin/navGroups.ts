/**
 * P2-T7 §2 — the admin navigation groups and their order. Payload orders groups by the first
 * collection or global that names them, and lists every collection before any global, so "Pages"
 * (globals only) could never come second from configuration alone. The custom nav and dashboard
 * sort their groups with `sortAdminNavGroups`.
 */
export const ADMIN_GROUPS = {
  content: { ar: 'المحتوى', en: 'Content' },
  pages: { ar: 'الصفحات', en: 'Pages' },
  company: { ar: 'الشركة', en: 'Company' },
  media: { ar: 'الوسائط', en: 'Media' },
  sales: { ar: 'المبيعات', en: 'Sales' },
  settings: { ar: 'الإعدادات', en: 'Settings' },
  system: { ar: 'النظام', en: 'System' },
} as const

export const ADMIN_GROUP_ORDER = [
  ADMIN_GROUPS.content,
  ADMIN_GROUPS.pages,
  ADMIN_GROUPS.company,
  ADMIN_GROUPS.media,
  ADMIN_GROUPS.sales,
  ADMIN_GROUPS.settings,
  ADMIN_GROUPS.system,
] as const

function rankOf(label: string): number {
  const index = ADMIN_GROUP_ORDER.findIndex((group) => group.ar === label || group.en === label)
  return index === -1 ? ADMIN_GROUP_ORDER.length : index
}

/** Sorts translated nav groups into the P2-T7 order; unknown groups keep their order, at the end. */
export function sortAdminNavGroups<T extends { label: string }>(groups: readonly T[]): T[] {
  return groups
    .map((group, index) => ({ group, index, rank: rankOf(group.label) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ group }) => group)
}
