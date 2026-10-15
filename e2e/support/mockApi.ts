import type { Page, Route, WebSocketRoute } from '@playwright/test'
import playerFixtures from '../fixtures/player.json' with { type: 'json' }
import adminFixtures from '../fixtures/admin.json' with { type: 'json' }

/**
 * Backend-free test harness. The e2e dev server is started with the API pointed at
 * API_ORIGIN (a host that does not exist), and every request to it is answered here from
 * the JSON fixtures in e2e/fixtures (GET responses captured from a real local backend seeded
 * with six test players, a lobby, feedback and a few rounds of bets).
 * SignalR is faked too: negotiate is answered over HTTP and the WebSocket speaks just
 * enough of the JSON hub protocol for the game screen to show a live round.
 */
export const API_ORIGIN = 'http://api.skycrash.test'

type Json = unknown
type FixtureMap = Record<string, Json>

export type Role = 'guest' | 'player' | 'admin'
export type RoundPhase = 'Waiting' | 'Running' | 'Crashed'

export interface MockOptions {
  role?: Role
  /** Patch the signed-in profile (e.g. { hasCompletedTutorial: false }). */
  profile?: Record<string, unknown>
  /** Override individual GET responses by path (without /api and query). */
  overrides?: FixtureMap
  /** Round state the fake hub reports. Defaults to a betting countdown. */
  phase?: RoundPhase
}

const FAKE_TOKEN = 'e2e-fake-jwt'

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

/** Paths ending in an id are matched to the fixture key with ':id'. */
function normalise(path: string): string {
  return path.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, '/:id')
}

export async function mockApi(page: Page, opts: MockOptions = {}): Promise<{ unknown: string[] }> {
  const role = opts.role ?? 'player'
  const base: FixtureMap = clone(role === 'admin' ? adminFixtures : playerFixtures) as FixtureMap
  // Admin pages also read a few player-side endpoints (public settings, etc.).
  const fixtures: FixtureMap = { ...(clone(playerFixtures) as FixtureMap), ...base, ...opts.overrides }
  const profile = { ...(fixtures['/players/me'] as Record<string, unknown>), ...opts.profile }
  fixtures['/players/me'] = profile
  const unknown: string[] = []

  if (role !== 'guest') {
    await page.addInitScript(
      ([token, p]) => {
        const prof = p as { playerId: string; username: string; email: string }
        localStorage.setItem('skycrash_token', token as string)
        localStorage.setItem('skycrash_username', prof.username)
        localStorage.setItem('skycrash_email', prof.email)
        localStorage.setItem('skycrash_player_id', prof.playerId)
        // Keep the one-off "how to play" strip and audio unlock noise out of layout checks.
        localStorage.setItem('skycrash_howto_dismissed', '1')
      },
      [FAKE_TOKEN, profile] as const,
    )
  }

  const authResponse = {
    token: FAKE_TOKEN,
    playerId: profile.playerId,
    username: profile.username,
    email: profile.email,
    expiresAtUtc: new Date(Date.now() + 3600_000).toISOString(),
  }

  await page.route(`${API_ORIGIN}/api/**`, async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = normalise(url.pathname.replace(/^\/api/, ''))
    const method = req.method()
    const json = (body: Json, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (method === 'GET') {
      if (path === '/auth/check-username') return json({ available: true, suggestions: [] })
      if (path in fixtures) {
        const body = fixtures[path]
        return body === null ? route.fulfill({ status: 204, body: '' }) : json(body)
      }
      unknown.push(`${method} ${path}`)
      return json({ message: 'not mocked' }, 404)
    }

    // Writes: answer with something plausible so the UI keeps going.
    if (path === '/auth/login' || path === '/auth/register') return json(authResponse)
    if (path === '/players/me' || path === '/players/me/accept-terms') return json(profile)
    if (path === '/players/me/heartbeat' || path === '/players/me/tutorial-complete' || path === '/lobby/leave') {
      return route.fulfill({ status: 204, body: '' })
    }
    if (path === '/wallet/spin') {
      return json({ segmentIndex: 2, amount: 250, newBalance: 1250, nextSpinAtUtc: new Date(Date.now() + 300_000).toISOString() })
    }
    if (path === '/feedback') return json({ creditsAwarded: 500, newBalance: 1500, nextPromptAtRound: 20 })
    return json({ message: 'ok' })
  })

  await mockHub(page, opts.phase ?? 'Waiting')
  return { unknown }
}

const RS = '\u001e'

function snapshot(phase: RoundPhase) {
  return {
    roundId: '00000000-0000-4000-8000-000000000042',
    roundNumber: 42,
    status: phase,
    serverSeedHash: 'e2e-seed-hash',
    currentMultiplier: phase === 'Waiting' ? 1 : 2.37,
    crashMultiplier: phase === 'Crashed' ? 2.37 : null,
    countdownSeconds: phase === 'Waiting' ? 30 : null,
  }
}

/** A minimal SignalR JSON-protocol server: handshake, one snapshot, answers to invocations. */
async function mockHub(page: Page, phase: RoundPhase) {
  await page.route(`${API_ORIGIN}/hubs/game/negotiate**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        negotiateVersion: 1,
        connectionId: 'e2e-connection',
        connectionToken: 'e2e-connection-token',
        availableTransports: [{ transport: 'WebSockets', transferFormats: ['Text', 'Binary'] }],
      }),
    }),
  )
  await page.routeWebSocket(/\/hubs\/game/, (ws: WebSocketRoute) => {
    let handshaken = false
    const send = (msg: Record<string, unknown>) => ws.send(JSON.stringify(msg) + RS)
    ws.onMessage((raw) => {
      const frames = String(raw).split(RS).filter(Boolean)
      for (const frame of frames) {
        const msg = JSON.parse(frame) as { type?: number; invocationId?: string; target?: string }
        if (!handshaken) {
          handshaken = true
          ws.send('{}' + RS)
          send({ type: 1, target: 'RoundSnapshot', arguments: [snapshot(phase)] })
          continue
        }
        if (msg.type === 1 && msg.invocationId) {
          send({ type: 3, invocationId: msg.invocationId, result: msg.target === 'GetLobbyRoundBets' ? [] : null })
        }
      }
    })
  })
}
