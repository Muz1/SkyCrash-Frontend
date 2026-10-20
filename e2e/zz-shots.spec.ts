import { test } from '@playwright/test'
import { mockApi } from './support/mockApi'
const out = 'C:/Users/SBSANJ~1/AppData/Local/Temp/claude/c--Users-SBSANJ001-Downloads-SkyCrash-Database/2ac51a01-ae6f-404f-92ab-85aa5074bee9/scratchpad'
test('shots', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await mockApi(page, { role: 'guest' })
  await page.goto('/')
  await page.waitForTimeout(1500)
  await page.getByRole('heading', { name: /how it works/i }).scrollIntoViewIfNeeded()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: out + '/landing.png' })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: out + '/landing-wide.png' })
  await page.setViewportSize({ width: 320, height: 568 })
  await page.getByRole('button', { name: /full tutorial/i }).click()
  for (let i = 1; i <= 5; i++) {
    await page.waitForTimeout(1300)
    await page.screenshot({ path: out + '/tut' + i + '.png' })
    if (i < 5) await page.getByRole('dialog').getByRole('button', { name: /^next/i }).click()
  }
})
test('hangar shots', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await mockApi(page)
  await page.goto('/hangar')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: out + '/hangar.png' })
  await page.locator('main ul button').nth(1).click({ timeout: 5000 })
  await page.waitForTimeout(800)
  await page.screenshot({ path: out + '/hangar2.png' })
})
