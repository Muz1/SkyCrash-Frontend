import api from './api'
import type { VolatilitySummary } from '@/types'

export async function getSummary(): Promise<VolatilitySummary> {
  const response = await api.get<VolatilitySummary>('/volatility/summary')
  return response.data
}
