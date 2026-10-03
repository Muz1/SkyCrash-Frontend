// Builds admin PDF reports entirely in the browser from data a page has already loaded,
// so exporting adds no backend load. jsPDF is imported lazily on first export so it never
// ends up in the bundle that regular players download.

export type ReportCell = string | number | null | undefined

export type ReportSection =
  | { kind: 'metrics'; heading: string; description: string; rows: [label: string, value: ReportCell][] }
  | { kind: 'table'; heading: string; description: string; columns: string[]; rows: ReportCell[][]; emptyText?: string }
  | { kind: 'text'; heading: string; description: string }

export interface ReportDefinition {
  title: string
  fileName: string
  summary: string
  sections: ReportSection[]
}

function cellText(value: ReportCell): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

// Figures (counts, money, multipliers, percentages) are right-aligned in tables.
const NUMERIC = /^[-+]?(R\s?)?[\d\s,.]+(x|%)?$/i
function isNumericColumn(rows: ReportCell[][], index: number): boolean {
  const values = rows.map((r) => r[index]).filter((v) => v !== null && v !== undefined && v !== '')
  return values.length > 0 && values.every((v) => typeof v === 'number' || NUMERIC.test(String(v).trim()))
}

export async function exportReportPdf(report: ReportDefinition): Promise<void> {
  const [{ jsPDF }, { autoTable }, brand] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    import('./pdfBrand'),
  ])
  const { MARGIN, NAVY, ACCENT, INK, MUTED, RULE, SOFT, WHITE, CONTINUATION_TOP, FOOTER_SPACE } = brand

  // Wide tables get a landscape page so their columns stay readable.
  const landscape = report.sections.some((s) => s.kind === 'table' && s.columns.length > 7)
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN * 2
  const bottom = pageHeight - FOOTER_SPACE
  const tableMargin = { left: MARGIN, right: MARGIN, top: CONTINUATION_TOP, bottom: FOOTER_SPACE }

  let y = brand.drawCoverHeader(doc, {
    kicker: 'SkyCrash · Admin report',
    title: report.title,
    generated: brand.generatedLabel(),
    logo: await brand.loadLogo(),
  })

  function ensureSpace(needed: number) {
    if (y + needed > bottom) {
      doc.addPage()
      y = CONTINUATION_TOP
    }
  }

  function wrap(text: string, size: number, width: number): string[] {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    return doc.splitTextToSize(text, width)
  }

  function tableEnd(): number {
    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  }

  // Overview: shaded call-out with an accent bar.
  {
    const pad = 12
    const body = wrap(report.summary, 10, contentWidth - pad * 2 - 4)
    const h = body.length * 14 + pad * 2 + 12
    ensureSpace(h)
    doc.setFillColor(...SOFT)
    doc.rect(MARGIN, y, contentWidth, h, 'F')
    doc.setFillColor(...ACCENT)
    doc.rect(MARGIN, y, 3, h, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.setCharSpace(1)
    doc.text('OVERVIEW', MARGIN + pad + 4, y + pad + 6)
    doc.setCharSpace(0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...INK)
    doc.text(body, MARGIN + pad + 4, y + pad + 22)
    y += h + 22
  }

  report.sections.forEach((section, index) => {
    // Numbered heading with a rule, then the plain-language description.
    const desc = wrap(section.description, 9, contentWidth)
    ensureSpace(48 + desc.length * 12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...ACCENT)
    doc.text(String(index + 1).padStart(2, '0'), MARGIN, y + 11)
    doc.setFontSize(13)
    doc.setTextColor(...NAVY)
    doc.text(section.heading, MARGIN + 22, y + 11)
    doc.setDrawColor(...RULE)
    doc.setLineWidth(0.75)
    doc.line(MARGIN, y + 19, pageWidth - MARGIN, y + 19)
    y += 32
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(desc, MARGIN, y)
    y += desc.length * 12 + 8

    if (section.kind === 'metrics') {
      const fitsCards = section.rows.every(([label, value]) => label.length <= 28 && cellText(value).length <= 22)
      if (fitsCards) {
        // KPI cards, three (portrait) or four (landscape) to a row.
        const cols = landscape ? 4 : 3
        const gap = 10
        const cardW = (contentWidth - gap * (cols - 1)) / cols
        const cardH = 50
        section.rows.forEach(([label, value], i) => {
          const col = i % cols
          if (col === 0) {
            if (i > 0) y += cardH + gap
            ensureSpace(cardH)
          }
          const x = MARGIN + col * (cardW + gap)
          doc.setFillColor(...WHITE)
          doc.setDrawColor(...RULE)
          doc.setLineWidth(0.75)
          doc.rect(x, y, cardW, cardH, 'FD')
          doc.setFillColor(...NAVY)
          doc.rect(x, y, cardW, 2.5, 'F')
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7.5)
          doc.setTextColor(...MUTED)
          doc.text(doc.splitTextToSize(label.toUpperCase(), cardW - 20)[0], x + 10, y + 17)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(14)
          doc.setTextColor(...INK)
          doc.text(doc.splitTextToSize(cellText(value), cardW - 20)[0], x + 10, y + 38)
        })
        y += cardH + 24
      } else {
        autoTable(doc, {
          startY: y,
          margin: tableMargin,
          body: section.rows.map(([label, value]) => [label, cellText(value)]),
          theme: 'plain',
          styles: {
            fontSize: 9.5,
            cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
            textColor: INK,
            lineColor: RULE,
            lineWidth: { bottom: 0.75 },
          },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: contentWidth * 0.4, textColor: NAVY, fillColor: SOFT } },
        })
        y = tableEnd() + 24
      }
    } else if (section.kind === 'table') {
      const hasRows = section.rows.length > 0
      const numeric = section.columns.map((_, i) => isNumericColumn(section.rows, i))
      const body = hasRows
        ? section.rows.map((row) => row.map(cellText))
        : [
            [
              {
                content: section.emptyText ?? 'No data.',
                colSpan: section.columns.length,
                styles: { halign: 'center' as const, textColor: MUTED, fontStyle: 'italic' as const },
              },
            ],
          ]
      autoTable(doc, {
        startY: y,
        margin: tableMargin,
        head: [section.columns],
        body,
        theme: 'plain',
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
          textColor: INK,
          lineColor: RULE,
          lineWidth: { bottom: 0.5 },
        },
        headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8, lineWidth: 0 },
        alternateRowStyles: { fillColor: SOFT },
        didParseCell: (data) => {
          if (hasRows && numeric[data.column.index]) data.cell.styles.halign = 'right'
        },
      })
      y = tableEnd() + 24
    } else {
      y += 6
    }
  })

  brand.drawPageChrome(doc, report.title)
  doc.save(`${report.fileName}-${brand.fileStamp()}.pdf`)
}

export function formatDateTime(utc: string | null | undefined): string {
  return utc ? new Date(utc).toLocaleString() : '—'
}
