import api from './api'
import type { AdminPlayerSummary } from '@/types'

export async function getPlayers(search?: string): Promise<AdminPlayerSummary[]> {
  const response = await api.get<AdminPlayerSummary[]>('/admin/players', { params: { search } })
  return response.data
}

export async function promotePlayer(playerId: string): Promise<void> {
  await api.post(`/admin/players/${playerId}/promote`)
}

export async function demotePlayer(playerId: string): Promise<void> {
  await api.post(`/admin/players/${playerId}/demote`)
}

export async function adjustBalance(playerId: string, amount: number, reason: string): Promise<{ newBalance: number }> {
  const response = await api.post<{ newBalance: number }>(`/admin/players/${playerId}/adjust-balance`, { amount, reason })
  return response.data
}
