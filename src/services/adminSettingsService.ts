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
