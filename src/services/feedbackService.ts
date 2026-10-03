import api from './api'
import type { SubmitFeedbackResult } from '@/types/insights'
import type { FeedbackSubmission, PlayerFeedbackStatus, PlayerInsightAnswers } from '@/types/feedback'

export async function getFeedbackStatus(): Promise<PlayerFeedbackStatus> {
  const response = await api.get<PlayerFeedbackStatus>('/feedback/status')
  return response.data
}

export async function submitFeedback(payload: FeedbackSubmission): Promise<SubmitFeedbackResult> {
  const response = await api.post<SubmitFeedbackResult>('/feedback', payload)
  return response.data
}

/** The signed-in player's own optional answers, to pre-fill the form (null if never answered). */
export async function getMyInsightAnswers(): Promise<PlayerInsightAnswers | null> {
  const response = await api.get<PlayerInsightAnswers | ''>('/feedback/profile')
  return response.status === 204 || !response.data ? null : response.data
}
