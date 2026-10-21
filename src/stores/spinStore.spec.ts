import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { AxiosError, AxiosHeaders } from 'axios'
import { useSpinStore } from './spinStore'
import { usePlayerStore } from './playerStore'
import * as walletService from '@/services/walletService'
import type { SpinStatus } from '@/types'

vi.mock('@/services/walletService')

const status = (over: Partial<SpinStatus> = {}): SpinStatus => ({
  canSpin: true,
  nextSpinAtUtc: '2026-10-20T10:00:00Z',
  secondsUntilNextSpin: 0,
  cooldownSeconds: 300,
  segments: [10, 100, 20, 250],
  odds: [0.4, 0.2, 0.3, 0.1],
  spinsLeftToday: 3,
  lastSpin: null,
  ...over,
})

function httpError(code: number, data: unknown) {
  const err = new AxiosError('fail', String(code))
  err.response = { status: code, data, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } }
  return err
}

describe('spinStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('skycrash_player_id', 'p1')
    usePlayerStore().profile = {
      playerId: 'p1',
      username: 'ace',
      email: 'a@test.local',
      creditBalance: 100,
      memberSinceUtc: '2026-01-01T00:00:00Z',
      isAdmin: false,
      displayedAchievementKey: null,
    }
  })

  it('applies the prize as soon as the server answers, before any animation', async () => {
    vi.mocked(walletService.getSpinStatus).mockResolvedValue(status())
    vi.mocked(walletService.spinWheel).mockResolvedValue({ segmentIndex: 1, amount: 100, newBalance: 200, nextSpinAtUtc: '2026-10-20T10:05:00Z' })
    const store = useSpinStore()
    await store.load()
    const outcome = await store.spin()
    expect(outcome.ok).toBe(true)
    expect(usePlayerStore().profile!.creditBalance).toBe(200)
    expect(store.nextSpinAt).toBe('2026-10-20T10:05:00Z')
    expect(store.spinsLeftToday).toBe(2)
  })

  it('sends a fresh Idempotency-Key per spin', async () => {
    vi.mocked(walletService.getSpinStatus).mockResolvedValue(status())
    vi.mocked(walletService.spinWheel).mockResolvedValue({ segmentIndex: 0, amount: 10, newBalance: 110, nextSpinAtUtc: '2026-10-20T10:05:00Z' })
    const store = useSpinStore()
    await store.spin()
    await store.spin()
    const [k1] = vi.mocked(walletService.spinWheel).mock.calls[0]!
    const [k2] = vi.mocked(walletService.spinWheel).mock.calls[1]!
    expect(k1).toBeTruthy()
    expect(k2).toBeTruthy()
    expect(k1).not.toBe(k2)
  })

  it('shows "you won on your last spin" after leaving mid-animation, once', async () => {
    vi.mocked(walletService.getSpinStatus).mockResolvedValue(status())
    vi.mocked(walletService.spinWheel).mockResolvedValue({ segmentIndex: 3, amount: 250, newBalance: 350, nextSpinAtUtc: '2026-10-20T10:05:00Z' })
    const first = useSpinStore()
    await first.load()
    await first.spin() // the player navigates away before the wheel stops: no markSeen()

    // A later visit (new page load): the server reports the spin.
    setActivePinia(createPinia())
    vi.mocked(walletService.getSpinStatus).mockResolvedValue(
      status({ canSpin: false, lastSpin: { amount: 250, segmentIndex: 3, spunAtUtc: '2026-10-20T10:00:01Z' } }),
    )
    const second = useSpinStore()
    await second.load()
    expect(second.unseenLastSpin?.amount).toBe(250)
    second.markSeen()

    setActivePinia(createPinia())
    const third = useSpinStore()
    await third.load()
    expect(third.unseenLastSpin).toBeNull()
  })

  it('does not repeat a prize the wheel already revealed', async () => {
    vi.mocked(walletService.getSpinStatus).mockResolvedValue(status())
    vi.mocked(walletService.spinWheel).mockResolvedValue({ segmentIndex: 0, amount: 10, newBalance: 110, nextSpinAtUtc: '2026-10-20T10:05:00Z' })
    const store = useSpinStore()
    await store.load()
    await store.spin()
    store.markSeen() // animation finished

    setActivePinia(createPinia())
    vi.mocked(walletService.getSpinStatus).mockResolvedValue(
      status({ lastSpin: { amount: 10, segmentIndex: 0, spunAtUtc: '2026-10-20T10:00:01Z' } }),
    )
    const next = useSpinStore()
    await next.load()
    expect(next.unseenLastSpin).toBeNull()
  })

  it('maps 403 and 429 answers to short messages', async () => {
    const store = useSpinStore()
    vi.mocked(walletService.spinWheel).mockRejectedValueOnce(httpError(403, { code: 'email-unverified' }))
    expect(await store.spin()).toMatchObject({ ok: false, failure: { kind: 'email-unverified' } })
    vi.mocked(walletService.spinWheel).mockRejectedValueOnce(httpError(403, { code: 'restricted' }))
    expect(await store.spin()).toMatchObject({ ok: false, failure: { kind: 'restricted' } })
    vi.mocked(walletService.spinWheel).mockRejectedValueOnce(httpError(429, { message: 'No spins left today.' }))
    expect(await store.spin()).toMatchObject({ ok: false, failure: { kind: 'limit', message: 'No spins left today' } })
  })
})
