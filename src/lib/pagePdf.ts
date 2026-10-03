// "Export PDF" for any admin page: renders the page as it looks (KPIs, charts, tables) to an
// image and lays it out over as many A4 pages as it needs, inside the shared report branding
// (cover band, running header, footer). The page is always captured in the light admin theme
// so exports look the same whichever theme the admin is using, and page breaks are placed
// between cards and rows rather than through them. Libraries are loaded lazily on first export.

/** Elements marked with this attribute (e.g. the export button itself) are left out. */
export const PDF_IGNORE_ATTR = 'data-pdf-ignore'

const PIXEL_RATIO = 2

export async function exportElementPdf(element: HTMLElement, title: string): Promise<void> {
  const [{ toPng }, { jsPDF }, brand] = await Promise.all([
    import('html-to-image'),
    import('jspdf'),
    import('./pdfBrand'),
  ])

  const restoreTheme = useLightTheme(element)
  let dataUrl: string
  let breaks: number[]
  let width: number
  let background: string
  try {
    await nextFrame()
    background = backgroundOf(element)
    // Capture the page's full height, not just the part visible in its scrolling container.
    width = element.scrollWidth
    const height = element.scrollHeight
    breaks = breakPoints(element)
    dataUrl = await toPng(element, {
      width,
      height,
      style: { height: `${height}px`, maxHeight: 'none', overflow: 'visible' },
      pixelRatio: PIXEL_RATIO,
      backgroundColor: background,
      cacheBust: true,
      filter: (node) => !(node instanceof HTMLElement && node.hasAttribute(PDF_IGNORE_ATTR)),
    })
  } finally {
    restoreTheme()
  }
  const image = await loadImage(dataUrl)

  // Wide dashboards go landscape so their text isn't shrunk too far.
  const landscape = width > 900
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const { MARGIN, CONTINUATION_TOP, FOOTER_SPACE, RULE } = brand
  const contentW = pageW - MARGIN * 2
  const ptPerCssPx = contentW / width

  const firstTop = brand.drawCoverHeader(pdf, {
    kicker: 'SkyCrash · Admin dashboard',
    title,
    generated: brand.generatedLabel(),
    logo: await brand.loadLogo(),
  })

  const canvas = document.createElement('canvas')
  canvas.width = image.width
  const ctx = canvas.getContext('2d')!
  const totalCss = image.height / PIXEL_RATIO

  let start = 0
  let page = 0
  while (start < totalCss - 1) {
    if (page > 0) pdf.addPage()
    const top = page === 0 ? firstTop : CONTINUATION_TOP
    const availCss = (pageH - FOOTER_SPACE - top) / ptPerCssPx
    let end = Math.min(totalCss, start + availCss)
    if (end < totalCss) {
      // Prefer the lowest gap between blocks in the bottom half of the page.
      const candidate = breaks.filter((b) => b > start + availCss * 0.5 && b <= end).pop()
      if (candidate) end = candidate
    }

    const sy = Math.round(start * PIXEL_RATIO)
    const sh = Math.max(1, Math.round(end * PIXEL_RATIO) - sy)
    canvas.height = sh
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, sh)
    ctx.drawImage(image, 0, sy, image.width, sh, 0, 0, image.width, sh)
    const drawH = (sh / PIXEL_RATIO) * ptPerCssPx
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN, top, contentW, drawH)
    pdf.setDrawColor(...RULE)
    pdf.setLineWidth(0.5)
    pdf.rect(MARGIN, top, contentW, drawH)

    start = end
    page++
  }

  brand.drawPageChrome(pdf, title)
  pdf.save(`skycrash-${slug(title)}-${brand.fileStamp()}.pdf`)
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

/** Y positions (CSS px from the element's top) where one block ends: safe places to break. */
function breakPoints(element: HTMLElement): number[] {
  const origin = element.getBoundingClientRect().top - element.scrollTop
  const points = new Set<number>()
  const walk = (node: Element, depth: number) => {
    for (const child of Array.from(node.children)) {
      if (!(child instanceof HTMLElement) || child.hasAttribute(PDF_IGNORE_ATTR)) continue
      const rect = child.getBoundingClientRect()
      if (rect.height < 8) continue
      points.add(Math.round(rect.bottom - origin) + 6)
      // Table rows and nested cards are break points too.
      if (depth < 6) walk(child, depth + 1)
    }
  }
  walk(element, 0)
  return [...points].sort((a, b) => a - b)
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

function backgroundOf(element: HTMLElement): string {
  for (let el: HTMLElement | null = element; el; el = el.parentElement) {
    const bg = getComputedStyle(el).backgroundColor
    if (bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg)) return bg
  }
  return '#ffffff'
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not render the page.'))
    img.src = src
  })
}

function slug(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'report'
  )
}
