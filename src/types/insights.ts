// Types for the feedback loop, the admin Analytics suite and Admin Role Management.
// Mirrors the backend DTOs in SkyCrash.Application/DTOs (FeedbackDtos, AnalyticsDtos, AdminRoleDtos).

export const FEEDBACK_TAGS = ['Gameplay', 'Graphics/UI', 'Sound', 'Performance'] as const
export type FeedbackTag = (typeof FEEDBACK_TAGS)[number]

export interface FeedbackStatus {
  isDue: boolean
  roundsPlayed: number
  nextPromptAtRound: number
  intervalRounds: number
  rewardCredits: number
  lastSubmittedAtUtc: string | null
}

export interface SubmitFeedbackPayload {
  rating: number
  tags: FeedbackTag[]
  improveText?: string
  likedText?: string
}

export interface SubmitFeedbackResult {
  creditsAwarded: number
  newBalance: number
  nextPromptAtRound: number
}

export interface FeedbackSettings {
  firstPromptAfterRounds: number
  promptIntervalRounds: number
  rewardCredits: number
}

export interface CountBucket {
  label: string
  count: number
}

export interface FeedbackCluster {
  title: string
  sentiment: 'Positive' | 'Negative' | 'Mixed'
  mentions: number
  suggestion: string
  examples: string[]
}

export interface FeedbackInsights {
  source: 'gemini' | 'keywords'
  summary: string
  clusters: FeedbackCluster[]
  generatedAtUtc: string
  warning: string | null
}

export interface FeedbackEntry {
  feedbackId: string
  username: string
  rating: number
  tags: string[]
  improveText: string | null
  likedText: string | null
  sentiment: 'Positive' | 'Negative' | 'Neutral'
  createdAtUtc: string
}

export interface FeedbackAnalytics {
  days: number
  totalSubmissions: number
  uniquePlayers: number
  averageRating: number
  sentimentScore: number
  totalCreditsAwarded: number
  totalCreditsAwardedAllTime: number
  ratingDistribution: CountBucket[]
  tags: { tag: string; count: number; averageRating: number }[]
  keywords: CountBucket[]
  daily: { date: string; submissions: number; averageRating: number }[]
  insights: FeedbackInsights
  recent: FeedbackEntry[]
}

export interface RtpWindow {
  label: string
  totalBets: number
  totalPayouts: number
  ggr: number
  betCount: number
  actualRtpPercentage: number
  actualHouseEdgePercentage: number
}

export interface DailyFinancialPoint {
  date: string
  bets: number
  payouts: number
  ggr: number
  rtpPercentage: number
  betCount: number
}

export interface FinancialAnalytics {
  totalBets: number
  totalPayouts: number
  ggr: number
  bonuses: number
  ngr: number
  betCount: number
  averageBet: number
  averageCashoutMultiplier: number
  cashoutRatePercentage: number
  actualRtpPercentage: number
  theoreticalRtpPercentage: number
  houseEdgePercentage: number
  daily: DailyFinancialPoint[]
  windows: RtpWindow[]
}

export interface GameplayAnalytics {
  roundsCrashed: number
  averageCrashMultiplier: number
  shareBelow2xPercentage: number
  crashDistribution: { label: string; count: number; percentage: number }[]
  currentOnlinePlayers: number
  peakConcurrentPlayers: number
  peakConcurrentAtUtc: string | null
  averageDailyActiveUsers: number
  uniqueActivePlayers: number
  daily: { date: string; activeUsers: number; peakConcurrent: number; sessions: number }[]
}

export interface RetentionAnalytics {
  newPlayers: number
  points: { label: string; day: number; eligible: number; retained: number; percentage: number }[]
  sessionsCounted: number
  averageSessionMinutes: number
  medianSessionMinutes: number
  sessionsPerActivePlayer: number
  sessionLengthDistribution: CountBucket[]
}

export interface AnalyticsOverview {
  days: number
  generatedAtUtc: string
  financial: FinancialAnalytics
  gameplay: GameplayAnalytics
  retention: RetentionAnalytics
}

export interface AdminRoleEntry {
  userId: string
  username: string
  email: string
  isManager: boolean
  isBlocked: boolean
  lastSeenUtc: string
}

export type RoleAction = 'grant-admin' | 'revoke-admin' | 'grant-manager' | 'revoke-manager'
