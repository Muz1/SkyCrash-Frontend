import api from './api'
import type { Challenge } from '@/types'

export async function getTodayChallenges(): Promise<Challenge[]> {
  const response = await api.get<Challenge[]>('/challenges/today')
  return response.data
}
