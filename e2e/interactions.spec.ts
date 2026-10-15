import { expect, test, type Page } from '@playwright/test'
import { mockApi } from './support/mockApi'
import { skipDailyBriefing } from './support/screens'
import { expectCleanLayout } from './support/layout'

// Behaviour of the mobile-only controls: the auto-hiding nav dock on the game screen, the
// phone header menu, and the admin menu drawer. Runs on every device project.

const isPhone = (page: Page) => {
  const vp = page.viewportSize()!
  return vp.width < 768 || (vp.width > vp.height && vp.height <= 500)
}

async function openGame(page: Page) {
  await mockApi(page)
  await skipDailyBriefing(page)
  await page.goto('/game')
  await expect(page.getByRole('button', { name: /^bet\b/i }).first()).toBeVisible()
}

const dock = (page: Page) => page.locator('#nav-dock')
const handle = (page: Page) => page.locator('[data-dock-handle]')

test.describe('nav dock on the game screen', () => {
  test('phones: hidden by default, the handle brings it back and it hides again', async ({ page }) => {
    await openGame(page)
    if (!isPhone(page)) {
      // Tablets and desktop: always visible, no handle.
      await expect(handle(page)).toHaveCount(0)
      await expect(dock(page).getByRole('link', { name: 'Home' })).toBeInViewport()
      return
    }
    await expect(dock(page)).toHaveAttribute('inert', '')
    await expect(dock(page).getByRole('link', { name: 'Home' })).not.toBeInViewport()
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(handle(page)).toBeInViewport()

    await handle(page).click()
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(handle(page)).toHaveAccessibleName('Hide navigation')
    await expect(dock(page)).not.toHaveAttribute('inert', '')
    await expect(dock(page).getByRole('link', { name: 'Home' })).toBeInViewport()

    // Auto-hides after a few seconds without interaction.
    await expect(dock(page)).toHaveAttribute('inert', '', { timeout: 7_000 })
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'false')
  })

  test('phones: tapping the game hides it; Escape hides it', async ({ page }) => {
    await openGame(page)
    test.skip(!isPhone(page), 'the dock only auto-hides on phones')
    await handle(page).click()
    await expect(dock(page)).not.toHaveAttribute('inert', '')
    // A tap on the stage (upper middle of the screen) tucks the dock away.
    const vp = page.viewportSize()!
    await page.mouse.click(Math.round(vp.width / 2), Math.round(vp.height * 0.3))
    await expect(dock(page)).toHaveAttribute('inert', '')

    await handle(page).click()
    await expect(dock(page)).not.toHaveAttribute('inert', '')
    await page.keyboard.press('Escape')
    await expect(dock(page)).toHaveAttribute('inert', '')
  })

  test('phones: a swipe up from the bottom edge reveals it', async ({ page }) => {
    await openGame(page)
    test.skip(!isPhone(page), 'the dock only auto-hides on phones')
    const { width, height } = page.viewportSize()!
    // Start beside the handle (left quarter), inside the bottom-edge zone, and drag upwards.
    const x = Math.round(width * 0.15)
    await page.mouse.move(x, height - 6)
    await page.mouse.down()
    await page.mouse.move(x, height - 40, { steps: 4 })
    await page.mouse.move(x, height - 90, { steps: 4 })
    await page.mouse.up()
    await expect(dock(page)).not.toHaveAttribute('inert', '')
    await expect(dock(page).getByRole('link', { name: 'Play' })).toBeInViewport()
  })

  test('phones: a real touch swipe (touch events) reveals it', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'raw touch events are injected through the Chromium DevTools protocol')
    await openGame(page)
    test.skip(!isPhone(page), 'the dock only auto-hides on phones')
    const { width, height } = page.viewportSize()!
    const cdp = await page.context().newCDPSession(page)
    const x = Math.round(width * 0.15)
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y: number) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
    await touch('touchStart', height - 6)
    await touch('touchMove', height - 30)
    await touch('touchMove', height - 70)
    await touch('touchMove', height - 110)
    await touch('touchEnd', height - 110)
    await expect(dock(page)).not.toHaveAttribute('inert', '')
  })

  test('phones: a tap on the bottom edge reveals it', async ({ page }) => {
    await openGame(page)
    test.skip(!isPhone(page), 'the dock only auto-hides on phones')
    const { width, height } = page.viewportSize()!
    await page.mouse.click(Math.round(width * 0.12), height - 4)
    await expect(dock(page)).not.toHaveAttribute('inert', '')
  })
})

test.describe('phone header menu', () => {
  test('one menu button holds the header actions; keyboard and outside taps close it', async ({ page }) => {
    await openGame(page)
    const trigger = page.getByRole('button', { name: 'Open menu' })
    if ((page.viewportSize()!.width ?? 0) >= 768) {
      await expect(trigger).toBeHidden()
      await expect(page.getByRole('button', { name: 'Audio settings' })).toBeVisible()
      return
    }
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    const box = await trigger.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)

    await trigger.click()
    const menu = page.locator('#hud-menu')
    await expect(menu).toBeVisible()
    await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')
    // Focus moves into the menu; the game's own help and sound buttons are in it too.
    await expect(menu.getByRole('button').first()).toBeFocused()
    for (const name of ['Audio settings', 'How to play', 'Lobby', 'Wallet']) {
      await expect(menu.getByRole(name === 'Lobby' || name === 'Wallet' ? 'link' : 'button', { name })).toBeVisible()
    }
    await expectCleanLayout(page, 'header menu open')

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()

    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(menu).toBeVisible()
    await page.mouse.click(10, Math.round(page.viewportSize()!.height / 2))
    await expect(menu).toBeHidden()

    // A menu item does its job: Audio settings opens the mixer.
    await page.getByRole('button', { name: 'Open menu' }).click()
    await menu.getByRole('button', { name: 'Audio settings' }).click()
    await expect(page.getByRole('dialog', { name: 'Audio' })).toBeVisible()
  })
})

test.describe('admin menu drawer', () => {
  test('below 1024px the admin menu is a drawer with every page in it', async ({ page }) => {
    await mockApi(page, { role: 'admin' })
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
    const toggle = page.getByRole('button', { name: 'Menu', exact: true })
    if (page.viewportSize()!.width >= 1024) {
      await expect(toggle).toBeHidden()
      await expect(page.getByRole('link', { name: 'Players', exact: true })).toBeVisible()
      return
    }
    await expect(page.getByRole('link', { name: 'Players', exact: true })).toBeHidden()
    await toggle.click()
    const drawer = page.getByRole('dialog', { name: 'Admin dashboard menu' })
    await expect(drawer).toBeVisible()
    // Let the slide-in finish before measuring.
    await expect.poll(async () => (await drawer.boundingBox())?.x).toBeGreaterThanOrEqual(0)
    await expect(drawer.getByRole('link', { name: 'Overview', exact: true })).toBeFocused()
    await expect(drawer.getByRole('link', { name: 'Overview', exact: true })).toHaveAttribute('aria-current', 'page')
    await expectCleanLayout(page, 'admin drawer open')

    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(toggle).toBeFocused()

    await toggle.click()
    await drawer.getByRole('link', { name: 'Players', exact: true }).click()
    await expect(page).toHaveURL(/\/admin\/players$/)
    await expect(page.getByRole('heading', { name: 'Player Management' })).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Admin dashboard menu' })).toBeHidden()
  })

  test('every player action button is on screen on a phone', async ({ page }) => {
    await mockApi(page, { role: 'admin' })
    await page.goto('/admin/players')
    await expect(page.getByRole('heading', { name: 'Player Management' })).toBeVisible()
    const adjust = page.getByRole('button', { name: 'Adjust' })
    await expect(adjust.first()).toBeVisible()
    // Scroll each card's actions into view and check nothing pokes out sideways.
    const count = await adjust.count()
    for (let i = 0; i < count; i++) {
      await adjust.nth(i).scrollIntoViewIfNeeded()
      const box = (await adjust.nth(i).boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width)
    }
    await adjust.first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectCleanLayout(page, 'adjust balance dialog')
  })
})
