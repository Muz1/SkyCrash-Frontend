import api from './api'
import type { AccountRuleSet, AccountStanding } from '@/types'

/** The published Account rules (anyone can read them). */
export async function getRules(version?: number): Promise<AccountRuleSet> {
  const response = await api.get<AccountRuleSet>('/rules', { params: version ? { version } : undefined })
  return response.data
}

/** My standing: status badge, active sanctions and whether new rules need accepting. */
export async function getMyStanding(): Promise<AccountStanding> {
  const response = await api.get<AccountStanding>('/rules/me')
  return response.data
}

export async function acceptRules(version: number): Promise<void> {
  await api.post('/rules/me/accept', { version })
}

/** Works signed in, or from the blocked-login screen with its appeal token. */
export async function submitAppeal(payload: {
  sanctionId: string
  message: string
  appealToken?: string | null
}): Promise<void> {
  await api.post('/rules/appeals', payload)
}

export async function selfExclude(days: 1 | 7 | 30): Promise<{ endsAtUtc: string | null }> {
  const response = await api.post<{ endsAtUtc: string | null }>('/rules/me/self-exclusion', { days })
  return response.data
}
