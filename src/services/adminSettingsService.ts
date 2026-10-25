import api from './api'
import type { GameSettings } from '@/types'

export async function getSettings(): Promise<GameSettings> {
  const response = await api.get<GameSettings>('/admin/settings')
  return response.data
}

export async function updateHouseEdge(houseEdgePercentage: number, password: string): Promise<GameSettings> {
  const response = await api.put<GameSettings>('/admin/settings/house-edge', { houseEdgePercentage, password })
  return response.data
}

export interface EditableLimits {
  maxMultiplier: number
  maxProfitPerBet: number
  maxRoundLiability: number
  dailyHouseLossLimit: number
}

export interface LimitsSettings {
  limits: EditableLimits
  /** False until a manager sets the settings password; limits can't be changed before then. */
  passwordSet: boolean
  updatedAtUtc: string | null
  updatedByUsername: string | null
  passwordChangedAtUtc: string | null
}

export async function getLimits(): Promise<LimitsSettings> {
  return (await api.get<LimitsSettings>('/admin/settings/limits')).data
}

/** Saves the risk limits; needs the settings password. */
export async function updateLimits(limits: EditableLimits, settingsPassword: string): Promise<LimitsSettings> {
  return (await api.put<LimitsSettings>('/admin/settings/limits', { ...limits, settingsPassword })).data
}

/** First time: a manager's own login password. After that: the current settings password. */
export async function changeSettingsPassword(currentPassword: string, newPassword: string): Promise<LimitsSettings> {
  return (await api.put<LimitsSettings>('/admin/settings/limits/password', { currentPassword, newPassword })).data
}
