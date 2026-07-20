import api from './api'
import type { PlayerProfile, UpdateProfilePayload } from '@/types'

export async function getMyProfile(): Promise<PlayerProfile> {
  const response = await api.get<PlayerProfile>('/players/me')
  return response.data
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<PlayerProfile> {
  const response = await api.patch<PlayerProfile>('/players/me', payload)
  return response.data
}