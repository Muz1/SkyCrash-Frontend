import api from './api'
import type { LeaderboardData, LeaderboardPeriod } from '@/types'

export async function getLeaderboard(period: LeaderboardPeriod = 'all'): Promise<LeaderboardData> {
  const response = await api.get<LeaderboardData>('/leaderboard', { params: { period } })
  return response.data
}
