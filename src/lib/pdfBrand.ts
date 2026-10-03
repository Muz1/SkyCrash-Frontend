// Shared look for every admin PDF (structured reports and page snapshots): a navy cover band
// with the logo on page one, a slim running header on later pages, and a footer with the
// confidentiality line and page numbers. All measurements are in points (jsPDF unit 'pt').

import type { jsPDF } from 'jspdf'
import logoUrl from '@/assets/logo-skycrash.png'

export type Rgb = [number, number, number]

export const NAVY: Rgb = [16, 22, 46]
export const ACCENT: Rgb = [234, 88, 12]
export const INK: Rgb = [28, 32, 44]
export const MUTED: Rgb = [105, 112, 128]
export const RULE: Rgb = [221, 225, 232]
export const SOFT: Rgb = [246, 247, 250]
export const WHITE: Rgb = [255, 255, 255]

export const MARGIN = 40
/** Where content starts on pages after the first (below the running header). */
export const CONTINUATION_TOP = 58
/** Space kept clear at the bottom of every page for the footer. */
export const FOOTER_SPACE = 48
export const COVER_BAND_HEIGHT = 92

export interface Logo {
  data: string
  width: number
  height: number
}

/** The logo, downscaled so it doesn't bloat the PDF. Null if it can't be loaded. */
export async function loadLogo(): Promise<Logo | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = logoUrl
    })
    const width = Math.min(320, img.naturalWidth)
    const height = Math.round((img.naturalHeight / img.naturalWidth) * width)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
    return { data: canvas.toDataURL('image/png'), width, height }
  } catch {
    return null
  }
}

export function generatedLabel(date = new Date()): string {
  return date.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
}

/** Page-one header band. Returns the y position where content can start. */
export function drawCoverHeader(
  doc: jsPDF,
  opts: { kicker: string; title: string; generated: string; logo: Logo | null },
): number {
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageW, COVER_BAND_HEIGHT, 'F')
  doc.setFillColor(...ACCENT)
  doc.rect(0, COVER_BAND_HEIGHT, pageW, 3, 'F')

  let textX = MARGIN
  if (opts.logo) {
    const h = 56
    const w = (opts.logo.width / opts.logo.height) * h
    doc.addImage(opts.logo.data, 'PNG', MARGIN, (COVER_BAND_HEIGHT - h) / 2, w, h)
    textX = MARGIN + w + 18
    doc.setDrawColor(70, 80, 115)
    doc.setLineWidth(0.75)
    doc.line(textX - 9, 24, textX - 9, COVER_BAND_HEIGHT - 24)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...ACCENT)
  doc.setCharSpace(1.2)
  doc.text(opts.kicker.toUpperCase(), textX, 32)
  doc.setCharSpace(0)

  doc.setFontSize(19)
  doc.setTextColor(...WHITE)
  const maxTitleW = pageW - textX - MARGIN
  doc.text(doc.splitTextToSize(opts.title, maxTitleW)[0], textX, 54)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(185, 192, 212)
  doc.text(`Generated ${opts.generated}`, textX, 71)

  return COVER_BAND_HEIGHT + 3 + 24
}

/** Running header and footer on every page; call once, after all content is placed. */
export function drawPageChrome(doc: jsPDF, title: string): void {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const pages = doc.getNumberOfPages()

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)

    if (i > 1) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...NAVY)
      doc.text('SKYCRASH', MARGIN, 30)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...MUTED)
      doc.text(title, MARGIN + doc.getTextWidth('SKYCRASH  ') + 4, 30)
      doc.setDrawColor(...RULE)
      doc.setLineWidth(0.75)
      doc.line(MARGIN, 38, pageW - MARGIN, 38)
    }

    const footerY = pageH - 26
    doc.setDrawColor(...RULE)
    doc.setLineWidth(0.75)
    doc.line(MARGIN, footerY - 12, pageW - MARGIN, footerY - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text('SkyCrash  ·  Confidential - for internal use only', MARGIN, footerY)
    doc.text(`Page ${i} of ${pages}`, pageW - MARGIN, footerY, { align: 'right' })
  }
}

export function fileStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Text for jsPDF's built-in fonts (WinAnsi): swaps characters they can't draw for close
 * equivalents, e.g. the typographic minus used for negative amounts, thin/narrow spaces from
 * number formatting and curly quotes, and drops emoji.
 */
export function pdfSafe(text: string): string {
  return text
    .replace(/−/g, '-')
    .replace(/[ -   ]/g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[​-‍️]|\p{Extended_Pictographic}/gu, '')
    .trim()
}
