import api from './api'
import type { LeaderboardData } from '@/types'

export async function getLeaderboard(): Promise<LeaderboardData> {
  const response = await api.get<LeaderboardData>('/leaderboard')
  return response.data
}