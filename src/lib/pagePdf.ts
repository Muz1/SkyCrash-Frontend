// "Export PDF" for any admin page: renders the page exactly as it looks (KPIs, charts,
// tables) to an image and lays it out over as many A4 pages as it needs. The browser does
// the rendering (html-to-image), so the app's oklch colours come out right. Both libraries
// are loaded lazily on first export.

/** Elements marked with this attribute (e.g. the export button itself) are left out. */
export const PDF_IGNORE_ATTR = 'data-pdf-ignore'

export async function exportElementPdf(element: HTMLElement, title: string): Promise<void> {
  const [{ toPng }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')])

  // Paint on the page's own background so light and dark admin themes both export cleanly.
  const background = backgroundOf(element)
  // Capture the page's full height, not just the part visible in its scrolling container.
  const width = element.scrollWidth
  const height = element.scrollHeight
  const dataUrl = await toPng(element, {
    width,
    height,
    style: { height: `${height}px`, maxHeight: 'none', overflow: 'visible' },
    pixelRatio: 2,
    backgroundColor: background,
    cacheBust: true,
    filter: (node) => !(node instanceof HTMLElement && node.hasAttribute(PDF_IGNORE_ATTR)),
  })
  const image = await loadImage(dataUrl)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 10
  const headerH = 12
  const contentW = pageW - margin * 2
  const contentH = pageH - margin * 2 - headerH

  // Image scaled to the content width; slice it into page-high strips.
  const mmPerPx = contentW / image.width
  const slicePx = Math.floor(contentH / mmPerPx)
  const pages = Math.max(1, Math.ceil(image.height / slicePx))
  const stamp = new Date().toLocaleString()

  const canvas = document.createElement('canvas')
  canvas.width = image.width
  const ctx = canvas.getContext('2d')!

  for (let i = 0; i < pages; i++) {
    if (i > 0) pdf.addPage()
    const sy = i * slicePx
    const sh = Math.min(slicePx, image.height - sy)
    canvas.height = sh
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, sh)
    ctx.drawImage(image, 0, sy, image.width, sh, 0, 0, image.width, sh)

    pdf.setFontSize(12)
    pdf.setTextColor(30, 30, 40)
    pdf.text(`Sky Crash · ${title}`, margin, margin + 5)
    pdf.setFontSize(8)
    pdf.setTextColor(110, 110, 120)
    pdf.text(`Exported ${stamp}  ·  page ${i + 1} of ${pages}`, pageW - margin, margin + 5, {
      align: 'right',
    })
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.92),
      'JPEG',
      margin,
      margin + headerH,
      contentW,
      sh * mmPerPx,
    )
  }

  pdf.save(`skycrash-${slug(title)}-${new Date().toISOString().slice(0, 10)}.pdf`)
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
