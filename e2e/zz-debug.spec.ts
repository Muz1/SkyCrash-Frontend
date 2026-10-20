import { expect, test } from '@playwright/test'
import { ADMIN_SCREENS, openScreen } from './support/screens'

test('debug widths', async ({ page }) => {
  const screen = ADMIN_SCREENS.find((s) => s.name === (process.env.DBG_SCREEN ?? 'admin block dialog'))!
  await openScreen(page, screen)
  await page.waitForTimeout(400)
  const out = await page.evaluate(() => {
    const host = (document.querySelector('.admin-console-modal') ?? document.querySelector('main')) as HTMLElement
    const res: string[] = ['host sw=' + host.scrollWidth + ' cw=' + host.clientWidth]
    for (const el of [...host.querySelectorAll<HTMLElement>('*')]) {
      const prev = el.style.display
      el.style.display = 'none'
      const sw = host.scrollWidth
      el.style.display = prev
      if (sw <= host.clientWidth) res.push(el.tagName + '.' + String(el.className).slice(0, 60) + ' -> ' + sw)
    }
    return res.slice(0, 15)
  })
  console.log(out.join('\n'))
  expect(true).toBe(true)
})
