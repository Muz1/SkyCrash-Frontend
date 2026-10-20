import api from './api'
import type { LossLimits, PlaySession } from '@/types'

export async function getLimits(): Promise<LossLimits> {
  const response = await api.get<LossLimits>('/responsible-play/limits')
  return response.data
}

/** Null clears a limit. Lowering applies now; raising waits 24 h (see pendingFromUtc). */
export async function setLimits(daily: number | null, weekly: number | null): Promise<LossLimits> {
  const response = await api.put<LossLimits>('/responsible-play/limits', { daily, weekly })
  return response.data
}

export async function getSession(): Promise<PlaySession> {
  const response = await api.get<PlaySession>('/responsible-play/session')
  return response.data
}
