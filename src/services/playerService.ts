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

/** Saves the equipped hangar loadout to the player's profile. */
export async function saveLoadout(craftId: string, skyId: string): Promise<void> {
  await api.put('/players/me/loadout', { craftId, skyId })
}
