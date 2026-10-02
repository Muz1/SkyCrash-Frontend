import api from './api'
import type {
  AdminRoleEntry,
  AnalyticsOverview,
  FeedbackAnalytics,
  FeedbackSettings,
  RoleAction,
} from '@/types/insights'

export async function getAnalyticsOverview(days: number): Promise<AnalyticsOverview> {
  const response = await api.get<AnalyticsOverview>('/admin/analytics', { params: { days } })
  return response.data
}

export async function getFeedbackAnalytics(days: number): Promise<FeedbackAnalytics> {
  const response = await api.get<FeedbackAnalytics>('/admin/feedback/analytics', { params: { days } })
  return response.data
}

export async function getFeedbackSettings(): Promise<FeedbackSettings> {
  const response = await api.get<FeedbackSettings>('/admin/feedback/settings')
  return response.data
}

export async function updateFeedbackSettings(settings: FeedbackSettings): Promise<FeedbackSettings> {
  const response = await api.put<FeedbackSettings>('/admin/feedback/settings', settings)
  return response.data
}

export async function getAdminRoles(): Promise<AdminRoleEntry[]> {
  const response = await api.get<AdminRoleEntry[]>('/admin/roles')
  return response.data
}

/** Returns the server's confirmation message. */
export async function changeRole(action: RoleAction, email: string): Promise<string> {
  const response = await api.post<{ message: string }>(`/admin/roles/${action}`, { email })
  return response.data.message
}
