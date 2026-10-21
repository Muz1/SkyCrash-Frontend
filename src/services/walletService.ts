import api from './api'
import type { WalletBalanceDetail, CreditTransactionRecord, SpinStatus, SpinResult } from '@/types'

/** Total, cash and bonus credits, plus what's left to wager before bonus turns into cash. */
export async function getBalance(): Promise<WalletBalanceDetail> {
  const response = await api.get<WalletBalanceDetail>('/wallet/balance')
  return response.data
}

export async function getTransactions(): Promise<CreditTransactionRecord[]> {
  const response = await api.get<CreditTransactionRecord[]>('/wallet/transactions')
  return response.data
}

export async function getSpinStatus(): Promise<SpinStatus> {
  const response = await api.get<SpinStatus>('/wallet/spin')
  return response.data
}

/**
 * The server picks the prize; the wheel just animates to segmentIndex. The idempotency key
 * makes a retried request (flaky network) return the original spin instead of a second one.
 */
export async function spinWheel(idempotencyKey?: string): Promise<SpinResult> {
  const response = await api.post<SpinResult>('/wallet/spin', null, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  })
  return response.data
}
