import api from './api'
import type { RoundHistoryEntry, BetHistoryEntry, RoundVerification } from '@/types'

export async function getRoundHistory(page = 1, pageSize = 20): Promise<RoundHistoryEntry[]> {
  const response = await api.get<RoundHistoryEntry[]>('/rounds/history', { params: { page, pageSize } })
  return response.data
}

export async function getMyBetHistory(page = 1, pageSize = 20): Promise<BetHistoryEntry[]> {
  const response = await api.get<BetHistoryEntry[]>('/players/me/bet-history', { params: { page, pageSize } })
  return response.data
}

/** The provably-fair proof for one round (the browser recomputes it, see lib/verifyRound.ts). */
export async function getRoundVerification(roundId: string): Promise<RoundVerification> {
  const response = await api.get<RoundVerification>(`/rounds/${encodeURIComponent(roundId)}/verify`)
  return response.data
}
