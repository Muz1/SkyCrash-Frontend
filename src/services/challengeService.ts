import api from './api'
import type { Challenge, ChallengeBadge } from '@/types'

export async function getTodayChallenges(): Promise<Challenge[]> {
  const response = await api.get<Challenge[]>('/challenges/today')
  return response.data
}

export async function getBadges(): Promise<ChallengeBadge[]> {
  const response = await api.get<ChallengeBadge[]>('/challenges/badges')
  return response.data
}
