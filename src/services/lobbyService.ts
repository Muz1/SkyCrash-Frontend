import api from './api'
import type { LobbyDetails, OnlinePlayer } from '@/types'

export async function getOnlinePlayers(): Promise<OnlinePlayer[]> {
  const response = await api.get<OnlinePlayer[]>('/lobby/online')
  return response.data
}

export async function sendHeartbeat(): Promise<void> {
  await api.post('/players/me/heartbeat')
}

export async function getMyPrivateLobby(): Promise<LobbyDetails | null> {
  const response = await api.get<LobbyDetails | ''>('/lobby/mine')
  return response.status === 204 || !response.data ? null : (response.data as LobbyDetails)
}

export async function createPrivateLobby(name: string): Promise<LobbyDetails> {
  const response = await api.post<LobbyDetails>('/lobby', { name })
  return response.data
}

export async function joinPrivateLobby(inviteCode: string): Promise<LobbyDetails> {
  const response = await api.post<LobbyDetails>('/lobby/join', { inviteCode })
  return response.data
}

export async function leavePrivateLobby(): Promise<void> {
  await api.post('/lobby/leave')
}