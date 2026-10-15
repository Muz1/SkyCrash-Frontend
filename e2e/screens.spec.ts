import { expect, test } from '@playwright/test'
import { ADMIN_SCREENS, PLAYER_SCREENS, openScreen } from './support/screens'
import { attachScreenshot, expectCleanLayout, expectUncovered, settle } from './support/layout'

// Every player and admin screen on every device project: no sideways overflow, nothing cut off.
for (const screen of [...PLAYER_SCREENS, ...ADMIN_SCREENS]) {
  test(`${screen.name} fits the screen`, async ({ page }, testInfo) => {
    const { unknown } = await openScreen(page, screen)
    await settle(page)
    await attachScreenshot(page, testInfo, screen.name)
    await expectCleanLayout(page, screen.name)
    if (screen.critical) await expectUncovered(page, screen.critical(page), screen.name)
    expect(unknown, 'API calls without a fixture').toEqual([])
  })
}
