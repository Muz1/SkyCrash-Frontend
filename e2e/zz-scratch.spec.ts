// TEMPORARY visual check, not committed.
import { test } from '@playwright/test'
import { PLAYER_SCREENS, openScreen } from './support/screens'
import { settle } from './support/layout'

const OUT = process.env.SHOT_DIR ?? 'test-results/shots'
const names = (process.env.SHOTS ?? '').split('|').filter(Boolean)

for (const screen of PLAYER_SCREENS.filter((s) => names.length === 0 || names.includes(s.name))) {
  test(`shot ${screen.name}`, async ({ page }) => {
    for (const vp of [
      { width: 320, height: 568 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(vp)
      if (vp.width === 320) await openScreen(page, screen)
      await settle(page)
      await page.screenshot({ path: `${OUT}/${screen.name.replace(/[^a-z0-9]+/gi, '_')}-${vp.width}.png` })
    }
  })
}
