import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from './playerStore'
import * as playerService from '@/services/playerService'

vi.mock('@/services/playerService')

describe('playerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('deduplicates concurrent fetchProfile calls into a single request', async () => {
    let resolveRequest: (value: any) => void
    const pending = new Promise((resolve) => {
      resolveRequest = resolve
    })
    vi.mocked(playerService.getMyProfile).mockReturnValue(pending as any)

    const store = usePlayerStore()

    const first = store.fetchProfile()
    const second = store.fetchProfile()

    resolveRequest!({
      playerId: 'p1',
      username: 'test',
      email: 't@test.local',
      creditBalance: 100,
      memberSinceUtc: '2026-01-01T00:00:00Z',
      isAdmin: false,
    })
    await Promise.all([first, second])

    expect(playerService.getMyProfile).toHaveBeenCalledTimes(1)
  })

  it('issues a fresh request after a previous fetchProfile call has completed', async () => {
    vi.mocked(playerService.getMyProfile).mockResolvedValue({
      playerId: 'p1',
      username: 'test',
      email: 't@test.local',
      creditBalance: 100,
      memberSinceUtc: '2026-01-01T00:00:00Z',
      isAdmin: false,
      displayedAchievementKey: null,
    })

    const store = usePlayerStore()

    await store.fetchProfile()
    await store.fetchProfile()

    expect(playerService.getMyProfile).toHaveBeenCalledTimes(2)
  })
})
