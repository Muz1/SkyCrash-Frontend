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

const MARGIN = 40
const EMBER: [number, number, number] = [234, 88, 12]
const INK: [number, number, number] = [30, 30, 40]
const MUTED: [number, number, number] = [110, 110, 125]

function cellText(value: ReportCell): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export async function exportReportPdf(report: ReportDefinition): Promise<void> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN * 2
  let y = MARGIN

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  function paragraph(text: string, size: number, color: [number, number, number], style: 'normal' | 'bold' = 'normal') {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines: string[] = doc.splitTextToSize(text, contentWidth)
    const lineHeight = size * 1.35
    ensureSpace(lines.length * lineHeight)
    doc.text(lines, MARGIN, y + size)
    y += lines.length * lineHeight
  }

  function tableEnd(): number {
    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  }

  // Header
  paragraph('SKYCRASH — ADMIN REPORT', 9, EMBER, 'bold')
  y += 2
  paragraph(report.title, 20, INK, 'bold')
  paragraph(`Generated ${new Date().toLocaleString()}`, 9, MUTED)
  y += 6
  doc.setDrawColor(...EMBER)
  doc.setLineWidth(1.5)
  doc.line(MARGIN, y, pageWidth - MARGIN, y)
  y += 14
  paragraph(report.summary, 10, INK)
  y += 10

  for (const section of report.sections) {
    ensureSpace(60)
    paragraph(section.heading, 13, EMBER, 'bold')
    y += 2
    paragraph(section.description, 9.5, MUTED)
    y += 6

    if (section.kind === 'metrics') {
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        body: section.rows.map(([label, value]) => [label, cellText(value)]),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 6, textColor: INK },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: contentWidth * 0.45, fillColor: [248, 245, 240] } },
      })
      y = tableEnd() + 18
    } else if (section.kind === 'table') {
      const body = section.rows.length
        ? section.rows.map((row) => row.map(cellText))
        : [[{ content: section.emptyText ?? 'No data.', colSpan: section.columns.length, styles: { halign: 'center' as const } }]]
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [section.columns],
        body,
        theme: 'striped',
        styles: { fontSize: 8.5, cellPadding: 4, textColor: INK },
        headStyles: { fillColor: EMBER, textColor: [255, 255, 255], fontStyle: 'bold' },
      })
      y = tableEnd() + 18
    } else {
      y += 8
    }
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`${report.title} · Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 20, { align: 'center' })
  }

  const stamp = new Date().toISOString().slice(0, 10)
  doc.save(`${report.fileName}-${stamp}.pdf`)
}

export function formatDateTime(utc: string | null | undefined): string {
  return utc ? new Date(utc).toLocaleString() : '—'
}
