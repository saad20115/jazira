import { describe, expect, it } from 'vitest'

import { ADMIN_GROUP_ORDER, sortAdminNavGroups } from './navGroups'

describe('P2-T7 admin nav group order', () => {
  it('sorts English and Arabic labels into the card order', () => {
    const payloadOrder = ['System', 'Media', 'Company', 'Content', 'Sales', 'Settings', 'Pages']
    expect(
      sortAdminNavGroups(payloadOrder.map((label) => ({ label }))).map((g) => g.label),
    ).toEqual(['Content', 'Pages', 'Company', 'Media', 'Sales', 'Settings', 'System'])
    const arabic = ['النظام', 'الصفحات', 'المحتوى']
    expect(sortAdminNavGroups(arabic.map((label) => ({ label }))).map((g) => g.label)).toEqual([
      'المحتوى',
      'الصفحات',
      'النظام',
    ])
  })

  it('keeps unknown groups after the known ones, in their own order', () => {
    const sorted = sortAdminNavGroups([{ label: 'Zeta' }, { label: 'System' }, { label: 'Alpha' }])
    expect(sorted.map((g) => g.label)).toEqual(['System', 'Zeta', 'Alpha'])
  })

  it('has the seven groups of the card, each in both languages', () => {
    expect(ADMIN_GROUP_ORDER.map((g) => g.en)).toEqual([
      'Content',
      'Pages',
      'Company',
      'Media',
      'Sales',
      'Settings',
      'System',
    ])
    for (const group of ADMIN_GROUP_ORDER) {
      expect(group.ar.length).toBeGreaterThan(0)
    }
  })
})
