import api from './api'
import type { WalletBalance, CreditTransactionRecord } from '@/types'

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