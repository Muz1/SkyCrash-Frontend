// "Download rules (PDF)": the published Account rules as a PDF built in the browser from the
// rule data (no server render). jsPDF is loaded only when a player actually downloads.

import type { jsPDF as JsPdf } from 'jspdf'
import type { autoTable as AutoTable } from 'jspdf-autotable'
import type { AccountRule, AccountRuleSet } from '@/types'
import { ACCENT, COVER_BAND_HEIGHT, INK, MARGIN, MUTED, NAVY, RULE, SOFT, WHITE, pdfSafe, type Logo } from './pdfBrand'

const ACTION_LABEL: Record<string, string> = {
  Warning: 'Warning',
  Restriction: 'Restriction',
  TemporaryBlock: 'Temporary block',
  PermanentBlock: 'Permanent block',
  Escalating: 'Warning, then blocks',
}

export function actionLabel(rule: Pick<AccountRule, 'action' | 'defaultDurationDays'>): string {
  const base = ACTION_LABEL[rule.action] ?? rule.action
  return rule.action === 'TemporaryBlock' && rule.defaultDurationDays ? `${base} (${rule.defaultDurationDays} days)` : base
}

export function effectiveDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** The cover line: version and the date it took effect. */
export function rulesCoverLine(set: AccountRuleSet): string {
  return `Version ${set.label} - in effect from ${effectiveDate(set.effectiveFromUtc)}`
}

/** One table row per active rule: code, title + summary + details, what happens, appealable. */
export function rulesTableRows(set: AccountRuleSet): string[][] {
  return set.rules
    .filter((r) => r.isActive)
    .map((r) => [
      r.code,
      pdfSafe(`${r.title}\n${r.summary}\n\n${r.details}`),
      pdfSafe(actionLabel(r)),
      r.appealable ? 'Yes' : 'No',
    ])
}

export function rulesFileName(set: AccountRuleSet): string {
  return `skycrash-account-rules-v${set.label}.pdf`
}

/** Lays the PDF out. The jsPDF pieces are passed in so tests can use them without the lazy import. */
export function buildRulesPdf(
  set: AccountRuleSet,
  lib: { jsPDF: typeof JsPdf; autoTable: typeof AutoTable },
  logo: Logo | null = null,
): JsPdf {
  const doc = new lib.jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageW, COVER_BAND_HEIGHT, 'F')
  doc.setFillColor(...ACCENT)
  doc.rect(0, COVER_BAND_HEIGHT, pageW, 3, 'F')
  let textX = MARGIN
  if (logo) {
    const h = 56
    const w = (logo.width / logo.height) * h
    doc.addImage(logo.data, 'PNG', MARGIN, (COVER_BAND_HEIGHT - h) / 2, w, h)
    textX = MARGIN + w + 18
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...ACCENT)
  doc.text('SKYCRASH', textX, 32)
  doc.setFontSize(19)
  doc.setTextColor(...WHITE)
  doc.text('Account rules', textX, 54)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(185, 192, 212)
  doc.text(rulesCoverLine(set), textX, 71)

  let y = COVER_BAND_HEIGHT + 28
  if (set.changeNote) {
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    const note = doc.splitTextToSize(pdfSafe(`What changed: ${set.changeNote}`), pageW - MARGIN * 2)
    doc.text(note, MARGIN, y)
    y += note.length * 12 + 6
  }

  lib.autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 48 },
    head: [['Rule', 'What it says', 'What happens', 'Appeal']],
    body: rulesTableRows(set),
    styles: { font: 'helvetica', fontSize: 8.5, textColor: INK, cellPadding: 6, lineColor: RULE, lineWidth: 0.5, valign: 'top' },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: SOFT },
    columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' }, 2: { cellWidth: 100 }, 3: { cellWidth: 46 } },
  })

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(`SkyCrash Account rules  ·  v${set.label}`, MARGIN, pageH - 26)
    doc.text(`Page ${i} of ${pages}`, pageW - MARGIN, pageH - 26, { align: 'right' })
  }
  return doc
}

export async function downloadRulesPdf(set: AccountRuleSet): Promise<void> {
  const [{ jsPDF }, { autoTable }, { loadLogo }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    import('./pdfBrand'),
  ])
  const doc = buildRulesPdf(set, { jsPDF, autoTable }, await loadLogo())
  doc.save(rulesFileName(set))
}
