import { test } from '@playwright/test'
import { ADMIN_SCREENS, PLAYER_SCREENS, openScreen } from './support/screens'
import { expectCleanLayout, expectUncovered, settle } from './support/layout'

/** Widths from the mobile test matrix, each with a typical portrait height. */
export const MATRIX = [
  { width: 320, height: 568 },
  { width: 360, height: 740 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
  { width: 1024, height: 1366 },
]

// One navigation per screen, then every width in portrait and landscape.
test.describe.configure({ timeout: 240_000 })

for (const screen of [...PLAYER_SCREENS, ...ADMIN_SCREENS]) {
  test(`${screen.name} at every matrix width`, async ({ page }) => {
    await page.setViewportSize(MATRIX[0]!)
    await openScreen(page, screen)
    for (const size of MATRIX) {
      for (const [orientation, vp] of [
        ['portrait', size],
        ['landscape', { width: size.height, height: size.width }],
      ] as const) {
        await page.setViewportSize(vp)
        await settle(page)
        const label = `${screen.name} ${size.width} ${orientation} (${vp.width}x${vp.height})`
        await expectCleanLayout(page, label)
        if (screen.critical) await expectUncovered(page, screen.critical(page), label)
      }
    }
  })
}
