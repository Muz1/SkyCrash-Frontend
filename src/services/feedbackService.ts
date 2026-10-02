import api from './api'
import type { FeedbackStatus, SubmitFeedbackPayload, SubmitFeedbackResult } from '@/types/insights'

export async function getFeedbackStatus(): Promise<FeedbackStatus> {
  const response = await api.get<FeedbackStatus>('/feedback/status')
  return response.data
}

export async function submitFeedback(payload: SubmitFeedbackPayload): Promise<SubmitFeedbackResult> {
  const response = await api.post<SubmitFeedbackResult>('/feedback', payload)
  return response.data
}
