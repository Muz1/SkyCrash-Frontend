import api from './api'
import type { CreditPack, CheckoutResponse } from '@/types'

export async function getPacks(): Promise<CreditPack[]> {
  const response = await api.get<CreditPack[]>('/payments/packs')
  return response.data
}

export async function createCheckout(packId: string): Promise<CheckoutResponse> {
  const response = await api.post<CheckoutResponse>('/payments/checkout', { packId })
  return response.data
}