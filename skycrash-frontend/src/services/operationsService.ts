import api from './api'
import type { OperationsMetrics } from '@/types'

export async function getMetrics(): Promise<OperationsMetrics> {
  const response = await api.get<OperationsMetrics>('/operations/metrics')
  return response.data
}
