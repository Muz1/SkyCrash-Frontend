import { expect, type Page, type TestInfo } from '@playwright/test'

export interface LayoutProblem {
  kind: 'page-overflow' | 'container-overflow' | 'cut-off' | 'unreachable'
  detail: string
}

/**
 * Collects layout problems in the current viewport:
 *  - page-overflow: the document is wider than the window (horizontal scroll / cut-off content).
 *  - container-overflow: a vertical scroller (e.g. the page's <main>) is wider than itself,
 *    which shows up as sideways scrolling inside the page. Intentional horizontal scrollers
 *    (chip rows, wide admin tables) opt out with `data-scroll-x` or an overflow-x-auto class.
 *  - cut-off: a visible button/link/input pokes out of the window or a clipping ancestor sideways.
 *  - unreachable: a control is below/above the window and no ancestor can scroll it into view.
 * Hidden things (inert, aria-hidden, visibility:hidden, display:none) are ignored.
 */
export async function collectLayoutProblems(page: Page): Promise<LayoutProblem[]> {
  return page.evaluate(() => {
    const problems: { kind: string; detail: string }[] = []
    const vw = window.innerWidth
    const vh = window.innerHeight
    const doc = document.documentElement
    const tol = 1

    const describe = (el: Element) => {
      const id = el.id ? `#${el.id}` : ''
      const label =
        el.getAttribute('aria-label') ||
        (el as HTMLElement).innerText?.trim().replace(/\s+/g, ' ').slice(0, 40) ||
        el.getAttribute('placeholder') ||
        ''
      const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 4).join('.') : ''
      return `<${el.tagName.toLowerCase()}${id}${cls ? '.' + cls : ''}> [${label.replace(/"/g, "'")}]`
    }

    if (doc.scrollWidth > vw + tol || document.body.scrollWidth > vw + tol) {
      // Find the widest culprits to make the failure actionable.
      const culprits = [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.right > vw + tol && !el.closest('[data-scroll-x],[inert],[aria-hidden="true"]')
        })
        .slice(0, 3)
        .map(describe)
      problems.push({ kind: 'page-overflow', detail: `scrollWidth ${doc.scrollWidth} > ${vw}: ${culprits.join(', ')}` })
    }

    const isHidden = (el: Element) => {
      if (el.closest('[inert],[aria-hidden="true"]')) return true
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return true
      const r = el.getBoundingClientRect()
      return r.width < 2 || r.height < 2
    }
    const intentionalX = (el: Element) =>
      el.hasAttribute('data-scroll-x') || /\boverflow-x-(auto|scroll)\b/.test(String((el as HTMLElement).className))

    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      const cs = getComputedStyle(el)
      const scrollsY = cs.overflowY === 'auto' || cs.overflowY === 'scroll'
      if (scrollsY && cs.overflowX !== 'hidden' && cs.overflowX !== 'clip' && !intentionalX(el)) {
        if (el.scrollWidth > el.clientWidth + tol && !isHidden(el)) {
          problems.push({
            kind: 'container-overflow',
            detail: `${describe(el)} scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}`,
          })
        }
      }
    }

    const controls = document.querySelectorAll<HTMLElement>('button, a[href], input:not([type=hidden]), select, textarea, [role=button]')
    for (const el of controls) {
      if (isHidden(el)) continue
      const r = el.getBoundingClientRect()
      // Inside an intentional horizontal scroller, sideways overflow is expected.
      let horizontallyScrollable = false
      let clipLeft = 0
      let clipRight = vw
      let canScrollY = false
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const acs = getComputedStyle(a)
        if (acs.overflowX === 'auto' || acs.overflowX === 'scroll') {
          if (a.scrollWidth > a.clientWidth + tol) horizontallyScrollable = true
        }
        if (acs.overflowY === 'auto' || acs.overflowY === 'scroll') canScrollY = true
        if (['hidden', 'clip', 'auto', 'scroll'].includes(acs.overflowX)) {
          const ar = a.getBoundingClientRect()
          clipLeft = Math.max(clipLeft, ar.left)
          clipRight = Math.min(clipRight, ar.right)
        }
        if (acs.position === 'fixed') break
      }
      if (!horizontallyScrollable && (r.left < clipLeft - tol || r.right > clipRight + tol)) {
        problems.push({
          kind: 'cut-off',
          detail: `${describe(el)} spans x ${Math.round(r.left)}..${Math.round(r.right)}, visible area ${Math.round(clipLeft)}..${Math.round(clipRight)}`,
        })
      }
      if ((r.top >= vh - tol || r.bottom <= tol) && !canScrollY) {
        problems.push({ kind: 'unreachable', detail: `${describe(el)} at y ${Math.round(r.top)} outside 0..${vh}` })
      }
    }
    return problems as { kind: 'page-overflow' | 'container-overflow' | 'cut-off' | 'unreachable'; detail: string }[]
  })
}

/** Fails the test (soft, so every viewport gets reported) if the screen has layout problems. */
export async function expectCleanLayout(page: Page, label: string) {
  const problems = await collectLayoutProblems(page)
  expect.soft(problems.map((p) => `${p.kind}: ${p.detail}`), `${label}: layout problems`).toEqual([])
}

/** Saves a full-viewport screenshot as a test artifact (not a pixel-diff gate). */
export async function attachScreenshot(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, { body: await page.screenshot({ animations: 'disabled' }), contentType: 'image/png' })
}

/** Lets fonts, transitions and lazy route chunks settle before measuring. */
export async function settle(page: Page) {
  await page.evaluate(() => document.fonts?.ready)
  await page.waitForTimeout(350)
}
