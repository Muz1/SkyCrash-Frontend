import api from './api'
import type { PublicSettings } from '@/types'

/** Admin-set lobby size and default volumes. No sign-in needed. */
export async function getPublicSettings(): Promise<PublicSettings> {
  const response = await api.get<PublicSettings>('/settings/public')
  return response.data
}
