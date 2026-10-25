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

/** Every block cites an Account Rule; durationDays null = the rule's default. */
export async function blockPlayer(
  playerId: string,
  body: { ruleCode: string; durationDays: number | null; internalNote?: string },
): Promise<void> {
  await api.post(`/admin/players/${playerId}/block`, body)
}

export async function unblockPlayer(playerId: string, reason?: string): Promise<void> {
  await api.post(`/admin/players/${playerId}/unblock`, { reason })
}

/** Marks a player's email verified when the verification email never arrived. */
export async function verifyPlayerEmail(playerId: string): Promise<void> {
  await api.post(`/admin/players/${playerId}/verify-email`)
}

export async function setTestAccount(playerId: string, isTestAccount: boolean): Promise<void> {
  await api.put(`/admin/players/${playerId}/test-account`, { isTestAccount })
}

export async function adjustBalance(playerId: string, amount: number, reason: string): Promise<{ newBalance: number }> {
  const response = await api.post<{ newBalance: number }>(`/admin/players/${playerId}/adjust-balance`, { amount, reason })
  return response.data
}
