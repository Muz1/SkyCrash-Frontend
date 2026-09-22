import api from './api'
import type { Achievement } from '@/types'

export async function getMyAchievements(): Promise<Achievement[]> {
  const response = await api.get<Achievement[]>('/achievements')
  return response.data
}

export async function setDisplayedAchievement(achievementKey: string | null): Promise<{ displayedAchievementKey: string | null }> {
  const response = await api.patch<{ displayedAchievementKey: string | null }>('/achievements/displayed', {
    achievementKey,
  })
  return response.data
}
