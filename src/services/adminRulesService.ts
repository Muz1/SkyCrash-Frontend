import api from './api'
import type {
  AdminRulesResponse,
  AdminSanction,
  Appeal,
  ApplySanctionRequest,
  AuditLogEntry,
  RuleSet,
  SanctionFilters,
  UpdateRuleRequest,
} from '@/types/admin'

// Account Rules (admin side): rule set + versions, sanctions, appeals and the audit log.

const clean = (o: object) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ''))

export async function getAdminRules(version?: number): Promise<AdminRulesResponse> {
  return (await api.get<AdminRulesResponse>('/admin/rules', { params: clean({ version }) })).data
}

/** Publishes a new rule-set version; returns it. */
export async function updateRule(code: string, request: UpdateRuleRequest): Promise<RuleSet> {
  return (await api.put<RuleSet>(`/admin/rules/${encodeURIComponent(code)}`, request)).data
}

export async function getSanctions(filters: SanctionFilters = {}): Promise<AdminSanction[]> {
  return (await api.get<AdminSanction[]>('/admin/sanctions', { params: clean(filters) })).data
}

export async function liftSanction(id: string, reason: string): Promise<void> {
  await api.post(`/admin/sanctions/${id}/lift`, { reason })
}

export async function applySanction(playerId: string, request: ApplySanctionRequest): Promise<void> {
  await api.post(`/admin/players/${playerId}/sanctions`, request)
}

export async function getAppeals(status?: string): Promise<Appeal[]> {
  return (await api.get<Appeal[]>('/admin/appeals', { params: clean({ status }) })).data
}

export async function resolveAppeal(id: string, overturn: boolean, response: string): Promise<void> {
  await api.post(`/admin/appeals/${id}/resolve`, { overturn, response })
}

export async function getAuditLog(take = 200, userId?: string): Promise<AuditLogEntry[]> {
  return (await api.get<AuditLogEntry[]>('/admin/audit-log', { params: clean({ take, userId }) })).data
}

/** Fetches a file the API serves (CSV / Markdown) with the admin's token. */
export async function fetchFile(url: string, params: Record<string, unknown> = {}): Promise<Blob> {
  return (await api.get<Blob>(url, { params: clean(params), responseType: 'blob' })).data
}
