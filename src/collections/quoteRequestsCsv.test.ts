import { describe, expect, it } from 'vitest'

import { CSV_BOM, csvCell, formulaSafe, quoteRequestsToCsv, toCsv } from './quoteRequestsCsv'

describe('P5-T2 §4 (Q3) — quote-requests CSV export', () => {
  it('neutralises spreadsheet formulas: =SUM(A1), +1, -1, @x, tab and CR get a leading quote', () => {
    expect(formulaSafe('=SUM(A1)')).toBe("'=SUM(A1)")
    expect(formulaSafe('+1')).toBe("'+1")
    expect(formulaSafe('-1')).toBe("'-1")
    expect(formulaSafe('@x')).toBe("'@x")
    expect(formulaSafe('\tx')).toBe("'\tx")
    expect(formulaSafe('\rx')).toBe("'\rx")
    expect(formulaSafe('Hotel 1=2')).toBe('Hotel 1=2')
    expect(formulaSafe('أحمد')).toBe('أحمد')
  })

  it('quotes every cell and doubles embedded quotes', () => {
    expect(csvCell('a "b", c')).toBe('"a ""b"", c"')
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
  })

  it('starts with a UTF-8 BOM and uses CRLF line ends (Excel shows Arabic)', () => {
    const csv = toCsv([['اسم'], ['أحمد']])
    expect(csv.startsWith(CSV_BOM)).toBe(true)
    expect(csv).toBe(`${CSV_BOM}"اسم"\r\n"أحمد"\r\n`)
  })

  it('exports customer fields, status, assignee and createdAt — never ipHash, userAgent or internal notes', () => {
    const doc = {
      id: 3,
      createdAt: '2026-11-10T10:00:00.000Z',
      status: 'contacted',
      assignedTo: { id: 1, name: 'Sales One', email: 'sales1@example.test' },
      name: '=SUM(A1)',
      company: '+1 Co',
      email: '-1@example.test',
      phone: '+966573534185',
      serviceTitle: 'HVAC',
      projectType: 'hotel-tower',
      servicesNeeded: ['hvac', 'electrical'],
      message: '@x',
      locale: 'en',
      ipHash: 'a'.repeat(64),
      userAgent: 'SecretAgent/1.0',
      internalNotes: 'staff only note',
      emailLastError: 'EAUTH',
    }
    const csv = quoteRequestsToCsv([doc], 'en')
    expect(csv).not.toContain('a'.repeat(64))
    expect(csv).not.toContain('SecretAgent')
    expect(csv).not.toContain('staff only note')
    expect(csv).not.toContain('EAUTH')
    const lines = csv.slice(1).split('\r\n')
    expect(lines[0]).toContain('"Status"')
    expect(lines[0]).toContain('"Assigned to"')
    expect(lines[0]).toContain('"Created at"')
    expect(lines[1]).toContain(`"'=SUM(A1)"`)
    expect(lines[1]).toContain(`"'+1 Co"`)
    expect(lines[1]).toContain(`"'-1@example.test"`)
    expect(lines[1]).toContain(`"'@x"`)
    // The phone starts with + and is neutralised too (shown as text, never run).
    expect(lines[1]).toContain(`"'+966573534185"`)
    expect(lines[1]).toContain('"Contacted"')
    expect(lines[1]).toContain('"Sales One"')
  })

  it('uses Arabic headers and labels for an Arabic admin', () => {
    const csv = quoteRequestsToCsv(
      [
        {
          id: 1,
          createdAt: '2026-11-10T10:00:00.000Z',
          status: 'new',
          name: 'أحمد',
          email: 'a@example.test',
          phone: '+966573534185',
        },
      ],
      'ar',
    )
    expect(csv).toContain('"اسم العميل"')
    expect(csv).toContain('"جديد"')
    expect(csv).toContain('"أحمد"')
  })
})
