import api from './api'
import type { OnlinePlayer } from '@/types'

export async function getOnlinePlayers(): Promise<OnlinePlayer[]> {
  const response = await api.get<OnlinePlayer[]>('/lobby/online')
  return response.data
}

export async function sendHeartbeat(): Promise<void> {
  await api.post('/players/me/heartbeat')
}