import api from './api'
import type { SubmitFeedbackResult } from '@/types/insights'
import type { FeedbackSubmission, PlayerFeedbackStatus } from '@/types/feedback'

export async function getFeedbackStatus(): Promise<PlayerFeedbackStatus> {
  const response = await api.get<PlayerFeedbackStatus>('/feedback/status')
  return response.data
}

export async function submitFeedback(payload: FeedbackSubmission): Promise<SubmitFeedbackResult> {
  const response = await api.post<SubmitFeedbackResult>('/feedback', payload)
  return response.data
}
