// "Export PDF" for any admin page. Rather than photographing the whole page, the page is taken
// apart into its building blocks and rebuilt as a landscape business report inside the shared
// branding (cover band, running header, footer):
//   KPI tiles        → native text cards, four to a row
//   section titles   → numbered-style headings
//   panels with data tables → native PDF tables (break cleanly across pages, header repeated)
//   panels with charts/other visuals → each captured on its own as an image, laid out two-up
//                      where the page had two columns, and never split across pages
//   anything else    → captured as an image (sliced between blocks only if taller than a page)
// The page is captured in the light admin theme so exports look the same in either theme.
// Libraries are loaded lazily on first export.

import { pdfSafe } from './pdfBrand'


/** Elements marked with this attribute (e.g. the export button itself) are left out. */
export const PDF_IGNORE_ATTR = 'data-pdf-ignore'

const PIXEL_RATIO = 2
const GAP = 12
const CARD_PAD = 12

interface Img {
  data: string
  w: number
  h: number
  /** Safe vertical cut points (CSS px from the top), for content taller than a page. */
  breaks: number[]
}

interface TableData {
  head: string[][]
  body: (string | { content: string; colSpan: number })[][]
}

type Panel = { title: string; caption: string; filters: string; table?: TableData; image?: Img; note?: string }

type Block =
  | { kind: 'kpis'; items: { label: string; value: string; caption: string }[] }
  | { kind: 'heading'; text: string }
  | { kind: 'note'; text: string }
  | { kind: 'panels'; panels: Panel[]; twoUp: boolean }
  | { kind: 'figure'; image: Img }

export async function exportElementPdf(page: HTMLElement, title: string): Promise<void> {
  const [{ toJpeg, getFontEmbedCSS }, { jsPDF }, { autoTable }, brand] = await Promise.all([
    import('html-to-image'),
    import('jspdf'),
    import('jspdf-autotable'),
    import('./pdfBrand'),
  ])

  // Fonts are embedded once and reused for every capture (embedding them per chart is slow
  // and bloats the file).
  let fontEmbedCSS: string | undefined
  const capture = async (el: HTMLElement): Promise<Img> => {
    fontEmbedCSS ??= await getFontEmbedCSS(page)
    const width = el.scrollWidth
    const height = el.scrollHeight
    const breaks = breakPoints(el)
    const restoreColours = resolveSvgColours(el)
    const data = await toJpeg(el, {
      width,
      height,
      quality: 0.9,
      fontEmbedCSS,
      pixelRatio: PIXEL_RATIO,
      backgroundColor: '#ffffff',
      cacheBust: true,
      style: { margin: '0', maxHeight: 'none', overflow: 'visible' },
      filter: (node) => !(node instanceof HTMLElement && isSkipped(node)),
    }).finally(restoreColours)
    return { data, w: width, h: height, breaks }
  }

  // ---- 1. read the page into blocks (in the light theme)
  const subtitle = text(page.querySelector('.adm-subtitle'))
  const period = text(page.querySelector('.adm-filter-range'))
  const blocks: Block[] = []
  const bodyEl = page.querySelector<HTMLElement>('.adm-page-body') ?? page
  const restoreTheme = useLightTheme(page)
  let bodyWidth = 1
  try {
    await nextFrame()
    bodyWidth = Math.max(1, bodyEl.clientWidth)
    await collect(bodyEl, blocks, capture)
  } finally {
    restoreTheme()
  }

  // ---- 2. lay the blocks out as a report
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
  const { MARGIN, NAVY, ACCENT, INK, MUTED, RULE, SOFT, WHITE, CONTINUATION_TOP, FOOTER_SPACE } = brand
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - MARGIN * 2
  const bottom = pageH - FOOTER_SPACE
  const fullPageAvail = bottom - CONTINUATION_TOP
  // One scale for every captured chart (page CSS px → PDF pt), so text in charts is the same
  // size throughout and a panel that sat alone is never blown up to fill the page.
  const pxScale = contentW / bodyWidth

  let y = brand.drawCoverHeader(doc, {
    kicker: 'SkyCrash · Admin report',
    title,
    generated: brand.generatedLabel(),
    logo: await brand.loadLogo(),
  })

  const newPage = () => {
    doc.addPage()
    y = CONTINUATION_TOP
  }
  const ensure = (h: number) => {
    if (y + h > bottom) newPage()
  }
  const wrap = (t: string, size: number, width: number, style: 'normal' | 'bold' = 'normal'): string[] => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    return doc.splitTextToSize(t, width)
  }
  const tableEnd = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

  // Intro: what the page is, and the reporting period.
  if (subtitle || period) {
    const body = subtitle ? wrap(subtitle, 10, contentW - 32) : []
    const h = 20 + body.length * 14 + (period ? 16 : 0) + 8
    doc.setFillColor(...SOFT)
    doc.rect(MARGIN, y, contentW, h, 'F')
    doc.setFillColor(...ACCENT)
    doc.rect(MARGIN, y, 3, h, 'F')
    let ty = y + 18
    if (body.length) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...INK)
      doc.text(body, MARGIN + 16, ty)
      ty += body.length * 14
    }
    if (period) {
      doc.setFontSize(8.5)
      doc.setTextColor(...MUTED)
      doc.text(`Reporting period: ${period}`, MARGIN + 16, ty + 2)
    }
    y += h + 18
  }

  function heading(t: string) {
    ensure(40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...NAVY)
    doc.text(t, MARGIN, y + 12)
    doc.setDrawColor(...RULE)
    doc.setLineWidth(0.75)
    doc.line(MARGIN, y + 19, pageW - MARGIN, y + 19)
    y += 32
  }

  function note(t: string) {
    const body = wrap(t, 9, contentW - 28)
    const h = body.length * 12 + 16
    ensure(h)
    doc.setFillColor(...SOFT)
    doc.rect(MARGIN, y, contentW, h, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(body, MARGIN + 14, y + 13)
    y += h + GAP
  }

  function kpis(items: { label: string; value: string; caption: string }[]) {
    const cols = 4
    const cardW = (contentW - GAP * (cols - 1)) / cols
    const cardH = 58
    items.forEach((k, i) => {
      const col = i % cols
      if (col === 0) {
        if (i > 0) y += cardH + GAP
        ensure(cardH)
      }
      const x = MARGIN + col * (cardW + GAP)
      doc.setFillColor(...WHITE)
      doc.setDrawColor(...RULE)
      doc.setLineWidth(0.75)
      doc.rect(x, y, cardW, cardH, 'FD')
      doc.setFillColor(...NAVY)
      doc.rect(x, y, cardW, 2.5, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...MUTED)
      doc.text(doc.splitTextToSize(k.label.toUpperCase(), cardW - 20)[0], x + 10, y + 16)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.setTextColor(...INK)
      doc.text(doc.splitTextToSize(k.value || '—', cardW - 20)[0], x + 10, y + 36)
      if (k.caption) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(...MUTED)
        doc.text(doc.splitTextToSize(k.caption, cardW - 20)[0], x + 10, y + 49)
      }
    })
    y += cardH + 20
  }

  /** Card header lines (title, caption, filters) for a given width. */
  function headerLines(p: Panel, width: number) {
    const titleLines = p.title ? wrap(p.title, 11, width, 'bold') : []
    const sub = [p.caption, p.filters].filter(Boolean).join('  ·  ')
    const subLines = sub ? wrap(sub, 8, width) : []
    return { titleLines, subLines, h: titleLines.length * 14 + subLines.length * 10 + (titleLines.length || subLines.length ? 8 : 0) }
  }

  function drawHeader(p: Panel, x: number, top: number, width: number) {
    const { titleLines, subLines } = headerLines(p, width)
    let ty = top
    if (titleLines.length) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...NAVY)
      doc.text(titleLines, x, ty + 10)
      ty += titleLines.length * 14
    }
    if (subLines.length) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...MUTED)
      doc.text(subLines, x, ty + 7)
    }
  }

  /** Image at the page scale (never wider than the card), and smaller if taller than maxH. */
  function fit(img: Img, width: number, maxH: number) {
    let w = Math.min(width, img.w * pxScale)
    let h = (img.h / img.w) * w
    if (h > maxH) {
      h = maxH
      w = (img.w / img.h) * h
    }
    return { w, h }
  }

  /** One or two image cards side by side, all on the same page. */
  function imageRow(row: Panel[], columns = row.length) {
    const cols = Math.max(columns, row.length)
    const cardW = (contentW - GAP * (cols - 1)) / cols
    const innerW = cardW - CARD_PAD * 2
    const maxImgH = fullPageAvail - 90
    const sized = row.map((p) => {
      const head = headerLines(p, innerW)
      const img = p.image ? fit(p.image, innerW, maxImgH) : { w: 0, h: 0 }
      const noteLines = p.note ? wrap(p.note, 9, innerW) : []
      return { p, head, img, noteLines, h: CARD_PAD * 2 + head.h + img.h + noteLines.length * 12 }
    })
    const rowH = Math.max(...sized.map((s) => s.h))
    ensure(rowH)
    sized.forEach((s, i) => {
      const x = MARGIN + i * (cardW + GAP)
      doc.setFillColor(...WHITE)
      doc.setDrawColor(...RULE)
      doc.setLineWidth(0.75)
      doc.rect(x, y, cardW, rowH, 'FD')
      doc.setFillColor(...ACCENT)
      doc.rect(x, y, 3, rowH, 'F')
      drawHeader(s.p, x + CARD_PAD, y + CARD_PAD, innerW)
      const top = y + CARD_PAD + s.head.h
      if (s.p.image) {
        doc.addImage(s.p.image.data, 'JPEG', x + CARD_PAD + (innerW - s.img.w) / 2, top, s.img.w, s.img.h)
      }
      if (s.noteLines.length) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(...MUTED)
        doc.text(s.noteLines, x + CARD_PAD, top + 10)
      }
    })
    y += rowH + GAP
  }

  function tablePanel(p: Panel) {
    const head = headerLines(p, contentW - 10)
    ensure(head.h + 60)
    doc.setFillColor(...NAVY)
    doc.rect(MARGIN, y, 3, Math.max(14, head.h - 6), 'F')
    drawHeader(p, MARGIN + 10, y, contentW - 10)
    y += head.h
    const t = p.table!
    const numeric = (t.head[0] ?? []).map((_, i) =>
      isNumericColumn(t.body.map((r) => (typeof r[i] === 'string' ? (r[i] as string) : ''))),
    )
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, top: CONTINUATION_TOP, bottom: FOOTER_SPACE },
      head: t.head.length ? t.head : undefined,
      body: t.body,
      theme: 'plain',
      styles: { fontSize: 8.5, cellPadding: { top: 5, bottom: 5, left: 6, right: 6 }, textColor: INK, lineColor: RULE, lineWidth: { bottom: 0.5 } },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8, lineWidth: 0 },
      alternateRowStyles: { fillColor: SOFT },
      didParseCell: (d) => {
        if (d.section === 'body' && numeric[d.column.index] && d.column.index > 0) d.cell.styles.halign = 'right'
        if (d.section === 'head' && numeric[d.column.index] && d.column.index > 0) d.cell.styles.halign = 'right'
      },
    })
    y = tableEnd() + 20
  }

  /** A full-width image; taller-than-a-page content is cut between blocks, not through them. */
  function figure(img: Img) {
    const scale = Math.min(contentW / img.w, pxScale)
    const drawW = img.w * scale
    let start = 0
    while (start < img.h - 1) {
      const avail = (bottom - y) / scale
      if (avail < 80 && y > CONTINUATION_TOP) {
        newPage()
        continue
      }
      let end = Math.min(img.h, start + avail)
      if (end < img.h) {
        const cut = img.breaks.filter((b) => b > start + avail * 0.4 && b <= end).pop()
        if (cut) end = cut
      }
      const slice = cropImage(img, start, end)
      const h = (end - start) * scale
      doc.addImage(slice, 'JPEG', MARGIN, y, drawW, h)
      y += h
      start = end
      if (start < img.h - 1) newPage()
    }
    y += GAP
  }

  /** Rough height of a block's first row, so a heading is never left alone at a page bottom. */
  function firstRowHeight(b: Block | undefined): number {
    if (!b) return 0
    if (b.kind === 'kpis') return 58
    if (b.kind === 'note') return 40
    if (b.kind === 'heading') return 40
    if (b.kind === 'figure') return Math.min(240, b.image.h * pxScale)
    const first = b.panels[0]!
    if (first.table) return 110
    const cardW = b.twoUp ? (contentW - GAP) / 2 - CARD_PAD * 2 : contentW - CARD_PAD * 2
    const imgs = b.panels.slice(0, b.twoUp ? 2 : 1).map((p) => (p.image ? fit(p.image, cardW, fullPageAvail - 90).h : 30))
    return Math.max(...imgs) + 70
  }

  for (const [i, b] of blocks.entries()) {
    if (b.kind === 'kpis') kpis(b.items)
    else if (b.kind === 'heading') {
      ensure(40 + Math.min(firstRowHeight(blocks[i + 1]), fullPageAvail - 40))
      heading(b.text)
    }
    else if (b.kind === 'note') note(b.text)
    else if (b.kind === 'figure') figure(b.image)
    else {
      // Panels: tables full width; images/notes two-up when the page had two columns.
      let pending: Panel[] = []
      const flush = () => {
        if (pending.length) imageRow(pending, b.twoUp ? 2 : 1)
        pending = []
      }
      for (const p of b.panels) {
        if (p.table) {
          flush()
          tablePanel(p)
        } else {
          pending.push(p)
          if (pending.length === (b.twoUp ? 2 : 1)) flush()
        }
      }
      flush()
    }
  }

  brand.drawPageChrome(doc, title)
  doc.save(`skycrash-${slug(title)}-${brand.fileStamp()}.pdf`)

  // Crops a horizontal band (CSS px) out of a captured image.
  function cropImage(img: Img, start: number, end: number): string {
    const canvas = document.createElement('canvas')
    const source = imageCache.get(img.data)!
    canvas.width = source.width
    canvas.height = Math.max(1, Math.round((end - start) * PIXEL_RATIO))
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(source, 0, Math.round(start * PIXEL_RATIO), source.width, canvas.height, 0, 0, source.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.9)
  }
}

// ---------------------------------------------------------------- reading the page

const imageCache = new Map<string, HTMLImageElement>()

/**
 * SVG colours given as CSS variables (e.g. stroke="var(--adm-chart-1)") are defined on the
 * admin console wrapper, which isn't part of a single-panel capture. Resolve them to real
 * colours for the capture; returns an undo.
 */
function resolveSvgColours(root: HTMLElement): () => void {
  const undo: [Element, string, string][] = []
  for (const node of Array.from(root.querySelectorAll('svg *'))) {
    for (const attr of ['stroke', 'fill', 'stop-color']) {
      const value = node.getAttribute(attr)
      if (value?.includes('var(')) {
        undo.push([node, attr, value])
        node.setAttribute(attr, getComputedStyle(node).getPropertyValue(attr))
      }
    }
  }
  return () => undo.forEach(([node, attr, value]) => node.setAttribute(attr, value))
}

const KNOWN = '.adm-kpis, .adm-panel, .adm-section-title, .adm-grid-2'

function isSkipped(el: HTMLElement): boolean {
  return (
    el.hasAttribute(PDF_IGNORE_ATTR) ||
    el.classList.contains('adm-about') ||
    // The chart's Chart/Table toggle row, unless it also carries the series legend.
    (el.classList.contains('adm-chart-tools') && !el.querySelector('.adm-legend')) ||
    el.classList.contains('adm-panel-actions') ||
    el.tagName === 'BUTTON'
  )
}

function visible(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
}

function text(el: Element | null | undefined): string {
  return pdfSafe(((el as HTMLElement | null)?.innerText ?? '').replace(/\s+/g, ' '))
}

async function collect(root: HTMLElement, out: Block[], capture: (el: HTMLElement) => Promise<Img>) {
  for (const child of Array.from(root.children)) {
    if (!(child instanceof HTMLElement) || isSkipped(child) || !visible(child)) continue

    if (child.classList.contains('adm-kpis')) {
      const items = Array.from(child.querySelectorAll<HTMLElement>('.adm-kpi')).map((k) => ({
        label: text(k.querySelector('.adm-kpi-label')),
        value: text(k.querySelector('.adm-kpi-value')),
        caption: text(k.querySelector('.adm-kpi-caption')),
      }))
      if (items.length) out.push({ kind: 'kpis', items })
    } else if (child.classList.contains('adm-section-title')) {
      out.push({ kind: 'heading', text: text(child) })
    } else if (child.classList.contains('adm-grid-2')) {
      const panels: Panel[] = []
      for (const p of Array.from(child.children)) {
        if (p instanceof HTMLElement && p.classList.contains('adm-panel') && visible(p)) panels.push(await readPanel(p, capture))
      }
      if (panels.length) out.push({ kind: 'panels', panels, twoUp: true })
    } else if (child.classList.contains('adm-panel')) {
      out.push({ kind: 'panels', panels: [await readPanel(child, capture)], twoUp: false })
    } else if (child.querySelector(KNOWN)) {
      await collect(child, out, capture)
    } else if (child.classList.contains('adm-error')) {
      continue
    } else if (!child.querySelector('img, svg, canvas, table, input, select') && child.children.length <= 3) {
      const t = text(child)
      if (t) out.push({ kind: 'note', text: t })
    } else {
      out.push({ kind: 'figure', image: await remember(await capture(child)) })
    }
  }
}

async function readPanel(panel: HTMLElement, capture: (el: HTMLElement) => Promise<Img>): Promise<Panel> {
  const title = text(panel.querySelector('.adm-panel-title'))
  const caption = text(panel.querySelector('.adm-panel-caption'))
  // Any filter controls in the panel's toolbar, e.g. "Compare by: Age range".
  const filters = Array.from(panel.querySelectorAll<HTMLSelectElement>('select'))
    .map((s) => {
      const label = text(s.closest('label')?.querySelector('span') ?? null)
      const chosen = s.selectedOptions[0]?.text ?? ''
      return label ? `${label}: ${chosen}` : chosen
    })
    .filter(Boolean)
    .join(' · ')
  const body = panel.querySelector<HTMLElement>('.adm-panel-body') ?? panel

  const hasChart = !!body.querySelector('.adm-chart, .adm-vchart, .adm-hbars, .adm-trend, .adm-split, svg, canvas, img')
  const tables = Array.from(body.querySelectorAll<HTMLTableElement>('table')).filter(visible)
  if (!hasChart && tables.length === 1) {
    return { title, caption, filters, table: readTable(tables[0]!) }
  }
  const empty = body.querySelector('.adm-empty')
  if (!hasChart && !tables.length && empty && text(body) === text(empty)) {
    return { title, caption, filters, note: text(empty) }
  }
  return { title, caption, filters, image: await remember(await capture(body)) }
}

function readTable(t: HTMLTableElement): TableData {
  const cells = (row: HTMLTableRowElement) =>
    Array.from(row.cells).map((c) => (c.colSpan > 1 ? { content: text(c), colSpan: c.colSpan } : text(c)))
  const head = t.tHead ? Array.from(t.tHead.rows).map((r) => Array.from(r.cells).map((c) => text(c))) : []
  const body = Array.from(t.tBodies).flatMap((b) => Array.from(b.rows).map(cells))
  return { head, body }
}

async function remember(img: Img): Promise<Img> {
  if (!imageCache.has(img.data)) imageCache.set(img.data, await loadImage(img.data))
  return img
}

const NUMERIC = /^[-+]?(R\s?)?[\d\s,.]+(x|%| pts)?$|^[—·]$|^Too early$/i
function isNumericColumn(values: string[]): boolean {
  const filled = values.filter((v) => v && v !== '—' && v !== '·')
  return filled.length > 0 && values.every((v) => !v || NUMERIC.test(v.trim()))
}

/** Switches the admin console to its light theme for the capture; returns an undo. */
function useLightTheme(element: HTMLElement): () => void {
  const themed = element.closest<HTMLElement>('[data-theme]')
  if (!themed) return () => {}
  const previous = themed.getAttribute('data-theme')
  themed.setAttribute('data-theme', 'light')
  return () => {
    if (previous === null) themed.removeAttribute('data-theme')
    else themed.setAttribute('data-theme', previous)
  }
}

/** Y positions (CSS px from the element's top) where one block ends: safe places to cut. */
function breakPoints(element: HTMLElement): number[] {
  const origin = element.getBoundingClientRect().top - element.scrollTop
  const points = new Set<number>()
  const walk = (node: Element, depth: number) => {
    for (const child of Array.from(node.children)) {
      if (!(child instanceof HTMLElement)) continue
      const rect = child.getBoundingClientRect()
      if (rect.height < 8) continue
      points.add(Math.round(rect.bottom - origin) + 4)
      if (depth < 6) walk(child, depth + 1)
    }
  }
  walk(element, 0)
  return [...points].sort((a, b) => a - b)
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not render the page.'))
    img.src = src
  })
}

function slug(t: string) {
  return (
    t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'report'
  )
}
