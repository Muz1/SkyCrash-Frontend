import api from './api'
import type { AdminHealth, AdminRiskResponse, HouseRiskStatus, PublicGameRules, ReconciliationReport } from '@/types/admin'

// Operational checks for the admin console: health tiles, the daily loss circuit breaker and
// the money reconciliation.

export async function getHealth(): Promise<AdminHealth> {
  return (await api.get<AdminHealth>('/admin/health')).data
}

export async function getRisk(): Promise<AdminRiskResponse> {
  return (await api.get<AdminRiskResponse>('/admin/risk')).data
}

/** Lets bets resume for the rest of today after the daily loss limit paused them. */
export async function resumeBetting(): Promise<HouseRiskStatus> {
  return (await api.post<HouseRiskStatus>('/admin/risk/resume')).data
}

export async function getReconciliation(): Promise<ReconciliationReport> {
  return (await api.get<ReconciliationReport>('/admin/reconciliation')).data
}

/** The published game rules (caps, edge) from the public settings. Null on older APIs. */
export async function getPublicGameRules(): Promise<PublicGameRules | null> {
  const data = (await api.get<{ rules?: PublicGameRules }>('/settings/public')).data
  return data.rules ?? null
}

export interface TestEmailResult {
  ok: boolean
  mode: string
  message?: string
  error?: string
  server?: string
}

/** System Health → "Send test email": sends through the configured sender and returns the real error, if any. */
export async function sendTestEmail(to: string): Promise<TestEmailResult> {
  return (await api.post<TestEmailResult>('/admin/health/test-email', { to })).data
}
