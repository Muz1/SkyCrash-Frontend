import { expect, type Locator, type Page } from '@playwright/test'
import playerFixtures from '../fixtures/player.json' with { type: 'json' }
import { mockApi, type MockOptions } from './mockApi'

export interface Screen {
  name: string
  path: string
  mock?: MockOptions
  /** Runs after navigation: open a dialog, wait for content, etc. */
  prepare?: (page: Page) => Promise<void>
  /** The screen's main control: must be fully on screen and uncovered at every size. */
  critical?: (page: Page) => Locator
}

const betButton = (page: Page) => page.getByRole('button', { name: /^bet\b/i })

const playerId = (playerFixtures['/players/me'] as { playerId: string }).playerId
const today = new Date().toISOString().slice(0, 10)

/** Dismisses the once-a-day challenge bar so the plain game screen can be measured. */
export async function skipDailyBriefing(page: Page) {
  await page.addInitScript(
    ([key, day]) => localStorage.setItem(key as string, day as string),
    [`skycrash_daily_brief_${playerId}`, today] as const,
  )
}

const heading = (page: Page, name: RegExp) => expect(page.getByRole('heading', { name }).first()).toBeVisible()

export const PLAYER_SCREENS: Screen[] = [
  { name: 'landing (guest)', path: '/', mock: { role: 'guest' } },
  { name: 'landing', path: '/' },
  { name: 'login', path: '/login', mock: { role: 'guest' }, prepare: (p) => heading(p, /welcome back/i) },
  { name: 'register', path: '/register', mock: { role: 'guest' }, prepare: (p) => heading(p, /join the flight/i) },
  {
    name: 'register terms dialog',
    path: '/register',
    mock: { role: 'guest' },
    prepare: async (p) => {
      await p.getByRole('button', { name: /read the terms/i }).click()
      await expect(p.getByRole('dialog')).toBeVisible()
    },
  },
  {
    name: 'terms (agreement needed)',
    path: '/terms',
    mock: { profile: { hasAcceptedTerms: false } },
    prepare: (p) => heading(p, /terms of service/i),
  },
  {
    name: 'tutorial',
    path: '/game?tutorial=1',
    prepare: async (p) => {
      await expect(p.getByRole('dialog', { name: /place your bet/i })).toBeVisible()
    },
  },
  {
    name: 'tutorial last step',
    path: '/game?tutorial=1',
    prepare: async (p) => {
      // Wait for each card before the next tap: the card changes height between steps.
      const dialog = p.getByRole('dialog')
      for (let step = 2; step <= 8; step++) {
        await dialog.getByRole('button', { name: /^next/i }).click()
        await expect(dialog).toContainText(`${step}/8`)
      }
      await expect(p.getByRole('dialog', { name: /your hangar/i })).toBeVisible()
    },
  },
  {
    name: 'game (betting open)',
    path: '/game',
    critical: betButton,
    prepare: async (p) => {
      await skipDailyBriefing(p)
      await p.reload()
      await expect(p.getByRole('button', { name: /^bet\b/i }).first()).toBeVisible()
    },
  },
  {
    name: 'game (first visit, how-to strip)',
    path: '/game',
    mock: { showHowTo: true },
    critical: betButton,
    prepare: async (p) => {
      await skipDailyBriefing(p)
      await p.reload()
      await expect(p.getByRole('note', { name: 'How to play' })).toBeVisible()
    },
  },
  {
    name: 'game (in flight)',
    path: '/game',
    critical: betButton,
    mock: { phase: 'Running' },
    prepare: async (p) => {
      await skipDailyBriefing(p)
      await p.reload()
      await expect(p.getByText(/next round/i).first()).toBeVisible()
    },
  },
  {
    name: 'daily challenges bar',
    path: '/game',
    critical: betButton,
    prepare: async (p) => {
      await expect(p.getByText(/challenge/i).first()).toBeVisible()
    },
  },
  {
    name: 'out of credits wheel',
    path: '/game',
    mock: { profile: { creditBalance: 0 } },
    prepare: async (p) => {
      await expect(p.getByRole('dialog').first()).toBeVisible()
    },
  },
  { name: 'hangar', path: '/hangar' },
  { name: 'spin wheel', path: '/spin' },
  { name: 'missions & achievements', path: '/missions' },
  {
    name: 'feedback form',
    path: '/',
    prepare: async (p) => {
      await p.getByRole('button', { name: /give us feedback/i }).click()
      await expect(p.getByRole('dialog').first()).toBeVisible()
    },
  },
  { name: 'round history', path: '/history' },
  { name: 'wallet', path: '/wallet' },
  {
    name: 'wallet + buy credits',
    path: '/wallet',
    mock: {
      overrides: {
        '/settings/public': { ...(playerFixtures['/settings/public'] as object), paymentsEnabled: true },
        '/payments/packs': [
          { id: 'starter', displayName: 'Starter Pack', priceZar: 20, credits: 2000 },
          { id: 'pilot', displayName: 'Pilot Pack', priceZar: 50, credits: 6000 },
          { id: 'ace', displayName: 'Ace Pack', priceZar: 100, credits: 15000 },
        ],
      },
    },
  },
  { name: 'leaderboard', path: '/leaderboard' },
  { name: 'lobby (in squadron)', path: '/lobby' },
  { name: 'lobby (not in one)', path: '/lobby', mock: { overrides: { '/lobby/mine': null } } },
  { name: 'profile', path: '/profile' },
  {
    name: 'admin invite',
    path: '/invite/e2e-token',
    mock: {
      role: 'guest',
      overrides: {
        '/invitations/e2e-token': {
          email: 'new.admin@test.local',
          name: 'New Admin',
          role: 'Admin',
          status: 'Pending',
          invitedBy: 'NewBoi',
          accountExists: false,
          expiresAtUtc: new Date(Date.now() + 86_400_000).toISOString(),
        },
      },
    },
  },
]

const admin: MockOptions = { role: 'admin' }
export const ADMIN_SCREENS: Screen[] = [
  ['overview', '/admin'],
  ['game performance', '/admin/game-performance'],
  ['player activity', '/admin/player-activity'],
  ['lobby analytics', '/admin/lobby-analytics'],
  ['retention', '/admin/retention'],
  ['player insights', '/admin/player-insights'],
  ['revenue', '/admin/revenue'],
  ['rtp', '/rtp'],
  ['feedback analytics', '/admin/feedback'],
  ['feedback submissions', '/admin/feedback/submissions'],
  ['ai insights', '/admin/feedback/insights'],
  ['feedback keywords', '/admin/feedback/keywords'],
  ['ai advisor', '/admin/advisor'],
  ['players', '/admin/players'],
  ['account rules', '/admin/rules'],
  ['account rules sanctions', '/admin/rules?tab=sanctions'],
  ['account rules appeals', '/admin/rules?tab=appeals'],
  ['account rules audit log', '/admin/rules?tab=audit'],
  ['live round', '/admin/rounds'],
  ['lobbies', '/admin/lobbies'],
  ['audio', '/admin/audio'],
  ['payments', '/admin/payments'],
  ['skin usage', '/admin/skins'],
  ['admin management', '/admin/management'],
  ['reports (legacy)', '/admin/reports'],
  ['operations', '/ops'],
  ['volatility', '/volatility'],
].map(([name, path]) => ({ name: `admin ${name}`, path: path!, mock: admin }) as Screen)

// Admin dialogs: each must fit a phone too.
ADMIN_SCREENS.push(
  {
    name: 'admin block dialog',
    path: '/admin/players',
    mock: admin,
    prepare: async (p) => {
      await p.getByRole('button', { name: /^block$/i }).first().click()
      await expect(p.getByRole('dialog', { name: /block player/i })).toBeVisible()
      await p.getByRole('dialog').getByRole('combobox').selectOption('F2')
      await expect(p.getByRole('dialog').getByText(/no bots/i)).toBeVisible()
    },
  },
  {
    name: 'admin rule edit dialog',
    path: '/admin/rules',
    mock: admin,
    prepare: async (p) => {
      await p.getByRole('button', { name: 'Edit rule F2' }).click()
      await expect(p.getByRole('dialog', { name: /edit f2/i })).toBeVisible()
    },
  },
)

/**
 * Mocks the API, opens the screen and waits until it has rendered. Returns the API calls that
 * had no fixture (the specs fail on any, so a new endpoint can't silently break CI).
 */
export async function openScreen(page: Page, screen: Screen): Promise<{ unknown: string[] }> {
  const mocks = await mockApi(page, screen.mock)
  await page.goto(screen.path)
  // Router guards resolve the profile first; then the page has rendered something.
  await page.waitForLoadState('networkidle').catch(() => undefined)
  if (screen.prepare) await screen.prepare(page)
  return mocks
}
