import api from './api'
import type { AdminPlayerFilters, AdminPlayerSummary } from '@/types'

export async function getPlayers(filters: AdminPlayerFilters): Promise<AdminPlayerSummary[]> {
  const response = await api.get<AdminPlayerSummary[]>('/admin/players', { params: filters })
  return response.data
}

export async function promotePlayer(playerId: string): Promise<void> {
  await api.post(`/admin/players/${playerId}/promote`)
}

export async function demotePlayer(playerId: string): Promise<void> {
  await api.post(`/admin/players/${playerId}/demote`)
}

export async function blockPlayer(playerId: string): Promise<void> {
  await api.post(`/admin/players/${playerId}/block`)
}

export async function unblockPlayer(playerId: string): Promise<void> {
  await api.post(`/admin/players/${playerId}/unblock`)
}

export async function adjustBalance(playerId: string, amount: number, reason: string): Promise<{ newBalance: number }> {
  const response = await api.post<{ newBalance: number }>(`/admin/players/${playerId}/adjust-balance`, { amount, reason })
  return response.data
}
