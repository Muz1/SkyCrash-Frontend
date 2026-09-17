import api from './api'
import type { AdminCurrentRound } from '@/types'

export async function getCurrentRound(): Promise<AdminCurrentRound | null> {
  try {
    const response = await api.get<AdminCurrentRound>('/admin/rounds/current')
    return response.data
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) return null
    throw err
  }
}
