import api from './api'
import type { RtpSummary } from '@/types'

export async function getRtpSummary(): Promise<RtpSummary> {
  const response = await api.get<RtpSummary>('/rtp/summary')
  return response.data
}
