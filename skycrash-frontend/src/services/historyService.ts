import api from './api'
import type { RoundHistoryEntry, BetHistoryEntry } from '@/types'

export async function getRoundHistory(page = 1, pageSize = 20): Promise<RoundHistoryEntry[]> {
  const response = await api.get<RoundHistoryEntry[]>('/rounds/history', { params: { page, pageSize } })
  return response.data
}

export async function getMyBetHistory(page = 1, pageSize = 20): Promise<BetHistoryEntry[]> {
  const response = await api.get<BetHistoryEntry[]>('/players/me/bet-history', { params: { page, pageSize } })
  return response.data
}
