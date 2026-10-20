import { describe, expect, it } from 'vitest'
import { DISMISS_COOLDOWN_MS, mayAutoAsk } from './useFeedbackPrompt'
import type { PlayerFeedbackStatus } from '@/types/feedback'

const status = (patch: Partial<PlayerFeedbackStatus> = {}): PlayerFeedbackStatus => ({
  isDue: true,
  rewardAvailable: true,
  roundsPlayed: 20,
  nextPromptAtRound: 20,
  intervalRounds: 10,
  rewardCredits: 500,
  lastSubmittedAtUtc: null,
  ...patch,
})

describe('feedback pop-up: when it may open by itself', () => {
  const now = 1_800_000_000_000

  it('asks by default', () => {
    expect(mayAutoAsk({}, status(), now)).toBe(true)
  })

  it('never asks again after "Don\'t ask again"', () => {
    expect(mayAutoAsk({ neverAsk: true }, status(), now)).toBe(false)
  })

  it('stops once the player has submitted (locally or per the server)', () => {
    expect(mayAutoAsk({ submitted: true }, status(), now)).toBe(false)
    expect(mayAutoAsk({}, status({ lastSubmittedAtUtc: '2026-10-01T10:00:00Z' }), now)).toBe(false)
  })

  it('waits 24 hours after a dismiss', () => {
    expect(mayAutoAsk({ dismissedAt: now - 60_000 }, status(), now)).toBe(false)
    expect(mayAutoAsk({ dismissedAt: now - DISMISS_COOLDOWN_MS + 1 }, status(), now)).toBe(false)
    expect(mayAutoAsk({ dismissedAt: now - DISMISS_COOLDOWN_MS }, status(), now)).toBe(true)
  })
})
