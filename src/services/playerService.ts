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

/** Records that the player agreed to the given Terms of Service version. */
export async function acceptTerms(version: string): Promise<PlayerProfile> {
  const response = await api.post<PlayerProfile>('/players/me/accept-terms', { version })
  return response.data
}

/** Marks the first-flight tutorial as finished or skipped, so it doesn't auto-open again. */
export async function completeTutorial(): Promise<void> {
  await api.post('/players/me/tutorial-complete')
}
