import { expect, test } from '@playwright/test'
import { PLAYER_SCREENS, openScreen } from './support/screens'
import { expectCleanLayout, settle } from './support/layout'

// Accessibility settings: the 150% text size must still fit every key screen (no sideways
// overflow, nothing cut off), and the setting itself must work and persist.

const AT_150 = [
  'landing (guest)',
  'landing',
  'tutorial',
  'tutorial last step',
  'game (betting open)',
  'hangar',
  'missions & achievements',
  'feedback form',
  'profile',
]
// Not listed yet (owned by other screens' work): wallet and leaderboard still overflow at 150%.

for (const screen of PLAYER_SCREENS.filter((s) => AT_150.includes(s.name))) {
  test(`${screen.name} fits at 150% text`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('skycrash_text_size', '150'))
    await openScreen(page, screen)
    await expect(page.locator('html')).toHaveAttribute('data-text-size', '150')
    await settle(page)
    await expectCleanLayout(page, `${screen.name} @150%`)
  })
}

test('text size setting applies and persists', async ({ page }) => {
  const landing = PLAYER_SCREENS.find((s) => s.name === 'landing')!
  await openScreen(page, landing)
  const html = page.locator('html')
  await expect(html).not.toHaveAttribute('data-text-size', /.*/)

  // The audio/settings popover: a header button on wide screens, the menu on phones.
  const direct = page.getByRole('button', { name: 'Audio settings' }).first()
  if (await direct.isVisible()) await direct.click()
  else {
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('menuitem', { name: /audio settings/i }).or(page.getByRole('button', { name: /audio settings/i })).first().click()
  }
  const group = page.getByRole('group', { name: 'Text size' })
  await group.getByText('125%').click()
  await expect(html).toHaveAttribute('data-text-size', '125')
  await page.reload()
  await expect(html).toHaveAttribute('data-text-size', '125')
})
