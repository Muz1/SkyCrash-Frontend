import api from './api'
import type { WalletBalance, CreditTransactionRecord, SpinStatus, SpinResult } from '@/types'

export async function getBalance(): Promise<WalletBalance> {
  const response = await api.get<WalletBalance>('/wallet/balance')
  return response.data
}

export async function getTransactions(): Promise<CreditTransactionRecord[]> {
  const response = await api.get<CreditTransactionRecord[]>('/wallet/transactions')
  return response.data
}

export async function demoTopUp(): Promise<WalletBalance> {
  const response = await api.post<WalletBalance>('/wallet/demo-topup')
  return response.data
}

export async function getSpinStatus(): Promise<SpinStatus> {
  const response = await api.get<SpinStatus>('/wallet/spin')
  return response.data
}

/** The server picks the prize; the wheel just animates to segmentIndex. */
export async function spinWheel(): Promise<SpinResult> {
  const response = await api.post<SpinResult>('/wallet/spin')
  return response.data
}
