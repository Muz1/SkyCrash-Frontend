import { describe, expect, it, vi } from 'vitest'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { buildRulesPdf, rulesCoverLine, rulesTableRows } from './rulesPdf'
import type { AccountRule, AccountRuleSet } from '@/types'

const rule = (code: string, isActive = true): AccountRule => ({
  code,
  category: 'Conduct',
  title: `Rule ${code}`,
  summary: `Summary of ${code}.`,
  details: `Details of ${code}.`,
  action: 'TemporaryBlock',
  defaultDurationDays: 7,
  detection: 'AdminReview',
  isActive,
  appealable: true,
})

const set: AccountRuleSet = {
  version: 3,
  label: '1.2',
  effectiveFromUtc: '2026-10-15T00:00:00Z',
  publishedBy: 'Admin',
  changeNote: 'Clarified C1.',
  rules: [rule('U1'), rule('F1'), rule('X9', false), rule('C1'), rule('R2')],
}

describe('rules PDF', () => {
  it('has one row per active rule, and none for inactive ones', () => {
    const rows = rulesTableRows(set)
    expect(rows.map((r) => r[0])).toEqual(['U1', 'F1', 'C1', 'R2'])
    expect(rows[0]![1]).toContain('Rule U1')
    expect(rows[0]![2]).toBe('Temporary block (7 days)')
  })

  it('puts the version and effective date on the cover', () => {
    expect(rulesCoverLine(set)).toBe('Version 1.2 - in effect from 15 October 2026')
  })

  it('the builder writes every active rule into the PDF table', () => {
    const spy = vi.fn<typeof autoTable>(autoTable)
    const doc = buildRulesPdf(set, { jsPDF, autoTable: spy })
    expect(spy).toHaveBeenCalledOnce()
    const body = spy.mock.calls[0]![1].body as string[][]
    for (const r of set.rules.filter((x) => x.isActive)) {
      expect(body.some((row) => row[0] === r.code && row[1]!.includes(r.title))).toBe(true)
    }
    expect(body).toHaveLength(4)
    const text = doc.output()
    expect(text).toContain('Version 1.2')
    for (const code of ['U1', 'F1', 'C1', 'R2']) expect(text).toContain(`(${code})`)
    expect(text).not.toContain('(X9)')
  })
})
