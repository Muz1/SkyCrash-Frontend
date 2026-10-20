import { describe, expect, it } from 'vitest'
import { buildRulesReport, rulesCoverLine } from './rulesReport'
import type { AccountRule, RuleSet } from '@/types/admin'

const rule = (code: string, over: Partial<AccountRule> = {}): AccountRule => ({
  code,
  category: 'Fraud',
  title: `Rule ${code} title`,
  summary: `Summary for ${code}.`,
  details: `Details for ${code}.`,
  action: 'TemporaryBlock',
  defaultDurationDays: 7,
  detection: 'AdminReview',
  isActive: true,
  appealable: true,
  ...over,
})

const set: RuleSet = {
  version: 4,
  label: 'v4.0',
  effectiveFromUtc: '2026-10-18T09:00:00Z',
  publishedBy: 'NewBoi',
  changeNote: 'Clarified F2',
  rules: [rule('U1', { action: 'PermanentBlock', defaultDurationDays: null }), rule('F1'), rule('F2'), rule('C1', { action: 'Escalating' }), rule('X9', { isActive: false })],
}

describe('buildRulesReport', () => {
  it('has one row for every active rule, and none for switched-off rules', () => {
    const report = buildRulesReport(set)
    const table = report.sections.find((s) => s.kind === 'table')
    expect(table?.kind).toBe('table')
    if (table?.kind !== 'table') return
    const codes = table.rows.map((r) => r[0])
    for (const r of set.rules.filter((x) => x.isActive)) {
      expect(codes).toContain(r.code)
      const row = table.rows.find((x) => x[0] === r.code)!
      expect(row).toContain(r.title)
      expect(row).toContain(r.summary)
    }
    expect(codes).not.toContain('X9')
    expect(table.rows).toHaveLength(set.rules.filter((x) => x.isActive).length)
  })

  it('opens with "Rule set vX.0, effective DATE"', () => {
    expect(rulesCoverLine(set)).toBe('Rule set v4.0, effective 18 Oct 2026')
    expect(buildRulesReport(set).summary.startsWith('Rule set v4.0, effective 18 Oct 2026')).toBe(true)
  })

  it('labels actions and durations in plain words', () => {
    const table = buildRulesReport(set).sections[0]
    if (table?.kind !== 'table') throw new Error('no table')
    const u1 = table.rows.find((r) => r[0] === 'U1')!
    expect(u1).toContain('Permanent block')
    expect(u1).toContain('Permanent / none')
  })
})
