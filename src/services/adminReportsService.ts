import api from './api'
import type { BetHistoryEntry, RoundReportResponse } from '@/types'

export async function getRoundsReport(page: number, pageSize = 20): Promise<RoundReportResponse> {
  const response = await api.get<RoundReportResponse>('/admin/reports/rounds', { params: { page, pageSize } })
  return response.data
}

export async function getPlayerBetHistory(playerId: string, page = 1, pageSize = 20): Promise<BetHistoryEntry[]> {
  const response = await api.get<BetHistoryEntry[]>(`/admin/reports/players/${playerId}/bets`, {
    params: { page, pageSize },
  })
  return response.data
}
