import api from './api'
import type { PlayerInsightsReport, PlayerRetentionReport } from '@/types/retention'
import type {
  ActiveLobby,
  AdminInvitation,
  AdminRole,
  AdminRoleEntry,
  FeedbackAnalytics,
  FeedbackInsightsReport,
  FeedbackSettings,
  FeedbackSubmissionFilters,
  FeedbackSubmissionsPage,
  GameManagementSettings,
  GamePerformanceReport,
  InvitationPreview,
  LobbyReport,
  OverviewReport,
  PlayerActivityReport,
  ReportQuery,
  RevenueReport,
  RoleAction,
  SkinUsageReport,
  PaymentSettings,
  FeedbackTheme,
  AdvisorRecommendations,
  AdvisorChatMessage,
} from '@/types/insights'

// Every report takes the same ?range=&from=&to= query (see ReportFilter.vue).
function params(q: ReportQuery, extra: Record<string, unknown> = {}) {
  return { range: q.range, ...(q.range === 'custom' ? { from: q.from, to: q.to } : {}), ...extra }
}

async function get<T>(url: string, q: ReportQuery, extra?: Record<string, unknown>): Promise<T> {
  const response = await api.get<T>(url, { params: params(q, extra) })
  return response.data
}

export const getOverview = (q: ReportQuery) => get<OverviewReport>('/admin/analytics/overview', q)
export const getRevenue = (q: ReportQuery) => get<RevenueReport>('/admin/analytics/revenue', q)
export const getGamePerformance = (q: ReportQuery, threshold?: number) =>
  get<GamePerformanceReport>('/admin/analytics/game-performance', q, threshold ? { threshold } : {})
export const getPlayerActivity = (q: ReportQuery) => get<PlayerActivityReport>('/admin/analytics/player-activity', q)
export const getLobbyReport = (q: ReportQuery) => get<LobbyReport>('/admin/analytics/lobbies', q)
export const getFeedbackAnalytics = (q: ReportQuery) => get<FeedbackAnalytics>('/admin/feedback/analytics', q)
export const getFeedbackInsights = (q: ReportQuery) => get<FeedbackInsightsReport>('/admin/feedback/insights', q)
export const getFeedbackSubmissions = (q: ReportQuery, filters: FeedbackSubmissionFilters) =>
  get<FeedbackSubmissionsPage>('/admin/feedback/submissions', q, { ...filters })

export async function getSkinUsage(): Promise<SkinUsageReport> {
  return (await api.get<SkinUsageReport>('/admin/analytics/skins')).data
}

export async function getFeedbackSettings(): Promise<FeedbackSettings> {
  return (await api.get<FeedbackSettings>('/admin/feedback/settings')).data
}

export async function updateFeedbackSettings(settings: FeedbackSettings): Promise<FeedbackSettings> {
  return (await api.put<FeedbackSettings>('/admin/feedback/settings', settings)).data
}

export async function getGameSettings(): Promise<GameManagementSettings> {
  return (await api.get<GameManagementSettings>('/admin/game/settings')).data
}

export async function updateGameSettings(settings: GameManagementSettings): Promise<GameManagementSettings> {
  return (await api.put<GameManagementSettings>('/admin/game/settings', settings)).data
}

export async function getActiveLobbies(): Promise<ActiveLobby[]> {
  return (await api.get<ActiveLobby[]>('/admin/game/lobbies')).data
}

// ---------- admin management ----------

export async function getAdminRoles(): Promise<AdminRoleEntry[]> {
  return (await api.get<AdminRoleEntry[]>('/admin/roles')).data
}

/** Returns the server's confirmation message. */
export async function changeRole(action: RoleAction, email: string): Promise<string> {
  return (await api.post<{ message: string }>(`/admin/roles/${action}`, { email })).data.message
}

export async function getInvitations(): Promise<AdminInvitation[]> {
  return (await api.get<AdminInvitation[]>('/admin/roles/invitations')).data
}

/** The token comes back once; the link built from it is the only way to accept. */
export async function createInvitation(payload: { name: string; email: string; role: AdminRole }) {
  return (await api.post<{ invitation: AdminInvitation; token: string }>('/admin/roles/invitations', payload)).data
}

export async function revokeInvitation(id: string): Promise<void> {
  await api.post(`/admin/roles/invitations/${id}/revoke`)
}

export async function previewInvitation(token: string): Promise<InvitationPreview> {
  return (await api.get<InvitationPreview>(`/invitations/${encodeURIComponent(token)}`)).data
}

export async function acceptInvitation(token: string): Promise<string> {
  return (await api.post<{ message: string }>(`/invitations/${encodeURIComponent(token)}/accept`)).data.message
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  return (await api.get<PaymentSettings>('/admin/payments')).data
}

export async function updatePaymentSettings(enabled: boolean): Promise<PaymentSettings> {
  return (await api.put<PaymentSettings>('/admin/payments', { enabled })).data
}

export async function getFeedbackThemes(): Promise<FeedbackTheme[]> {
  return (await api.get<FeedbackTheme[]>('/admin/feedback/themes')).data
}

export async function saveFeedbackThemes(themes: FeedbackTheme[]): Promise<FeedbackTheme[]> {
  return (await api.put<FeedbackTheme[]>('/admin/feedback/themes', themes)).data
}

export async function resetFeedbackThemes(): Promise<FeedbackTheme[]> {
  return (await api.post<FeedbackTheme[]>('/admin/feedback/themes/reset')).data
}

export async function getAdvisorRecommendations(query: ReportQuery): Promise<AdvisorRecommendations> {
  return (await api.get<AdvisorRecommendations>('/admin/advisor/recommendations', { params: params(query) })).data
}

export async function askAdvisor(messages: AdvisorChatMessage[], query: ReportQuery): Promise<string> {
  return (await api.post<{ reply: string }>('/admin/advisor/chat', { messages }, { params: params(query) })).data.reply
}

// Player Retention and Player Insights: computed "as of now" across all players (no range).
export async function getPlayerRetention(): Promise<PlayerRetentionReport> {
  return (await api.get<PlayerRetentionReport>('/admin/analytics/retention')).data
}

export async function getPlayerInsights(): Promise<PlayerInsightsReport> {
  return (await api.get<PlayerInsightsReport>('/admin/analytics/player-insights')).data
}
