// Account Rules as a PDF, generated from the rule-set data (jsPDF + jspdf-autotable via
// exportReportPdf). Cover line "Rule set vX.0, effective DATE", one row per active rule.
import type { ReportDefinition } from './pdfReport'
import { longDate } from './reportFormat'
import { RULE_ACTIONS, type RuleSet } from '@/types/admin'

export const actionLabel = (a: string) => RULE_ACTIONS.find((x) => x.id === a)?.label ?? a

export const durationLabel = (days: number | null) => (days ? `${days} day${days === 1 ? '' : 's'}` : 'Permanent / none')

export function rulesCoverLine(set: RuleSet): string {
  return `Rule set ${set.label}, effective ${longDate(set.effectiveFromUtc)}`
}

export function buildRulesReport(set: RuleSet): ReportDefinition {
  const active = set.rules.filter((r) => r.isActive)
  const inactive = set.rules.length - active.length
  return {
    title: 'SkyCrash Account Rules',
    fileName: `skycrash-rules-${set.label}`,
    landscape: true,
    summary:
      `${rulesCoverLine(set)}. Published by ${set.publishedBy || 'system'}` +
      (set.changeNote ? ` — "${set.changeNote}".` : '.') +
      ` ${active.length} active rule${active.length === 1 ? '' : 's'}` +
      (inactive ? ` (${inactive} switched off and not shown).` : '.') +
      ' Every warning, block or restriction cites one of these rules and the version it was given under.',
    sections: [
      {
        kind: 'table',
        heading: rulesCoverLine(set),
        description:
          'One row per active rule. "Default" is the block length used when an admin does not set one. Appealable rules can be appealed from the blocked screen or the profile.',
        columns: ['Code', 'Rule', 'Summary', 'Details', 'Action', 'Default', 'Appeal'],
        rows: active.map((r) => [
          r.code,
          r.title,
          r.summary,
          r.details,
          actionLabel(r.action),
          durationLabel(r.defaultDurationDays),
          r.appealable ? 'Yes' : 'No',
        ]),
        emptyText: 'No active rules.',
        widths: { 0: 0.05, 1: 0.15, 2: 0.2, 3: 0.35, 4: 0.1, 5: 0.09, 6: 0.06 },
      },
    ],
  }
}
