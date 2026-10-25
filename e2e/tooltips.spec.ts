import { expect, test } from '@playwright/test'
import { ADMIN_SCREENS, openScreen } from './support/screens'
import { settle } from './support/layout'

// Admin ⓘ tooltips: a click or tap pins them open (they used to open on focus and then close
// on the same click), they stay inside the window, and Escape or a tap elsewhere closes them.
const revenue = ADMIN_SCREENS.find((s) => s.path === '/admin/revenue')!

test('admin ⓘ opens on click/tap, stays open, and closes on Escape', async ({ page }) => {
  await openScreen(page, revenue)
  await settle(page)
  const info = page.getByRole('button', { name: /^What is/ }).first()
  await info.scrollIntoViewIfNeeded()
  await info.click()
  const tip = page.getByRole('tooltip')
  await expect(tip).toBeVisible()
  await page.waitForTimeout(400) // it must not close by itself
  await expect(tip).toBeVisible()

  const box = (await tip.boundingBox())!
  const vp = page.viewportSize()!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width)
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height)

  await page.keyboard.press('Escape')
  await expect(tip).toBeHidden()
})

test('admin ⓘ: a second tap closes it, and tapping elsewhere closes it', async ({ page }) => {
  await openScreen(page, revenue)
  await settle(page)
  const info = page.getByRole('button', { name: /^What is/ }).first()
  await info.scrollIntoViewIfNeeded()
  await info.click()
  await expect(page.getByRole('tooltip')).toBeVisible()
  await info.click()
  await expect(page.getByRole('tooltip')).toBeHidden()
  await info.click()
  await expect(page.getByRole('tooltip')).toBeVisible()
  await page.mouse.click(5, 5)
  await expect(page.getByRole('tooltip')).toBeHidden()
})

test('"About this page" help is readable in the light theme', async ({ page, isMobile }) => {
  test.skip(isMobile, 'help button is in the top bar on desktop')
  await page.setViewportSize({ width: 1366, height: 768 })
  await openScreen(page, ADMIN_SCREENS.find((s) => s.path === '/admin/health')!)
  await page.getByRole('button', { name: 'What does this page do?' }).click()
  const tip = page.getByRole('tooltip')
  await expect(tip).toBeVisible()
  const [color, bg] = await tip.evaluate((el) => [getComputedStyle(el).color, getComputedStyle(el).backgroundColor])
  expect(color).not.toEqual(bg)
})
