// Types for the feedback loop, the admin reports and Admin Management.
// Mirrors the backend DTOs in SkyCrash.Application/DTOs (FeedbackDtos, AnalyticsDtos, AdminRoleDtos,
// GameManagementDtos).

// ---------- player feedback ----------

export interface FeedbackStatus {
  isDue: boolean
  /** A submission right now would earn rewardCredits. */
  rewardAvailable?: boolean
  roundsPlayed: number
  cashOuts?: number
  nextPromptAtCashOut?: number
  nextPromptAtRound: number
  intervalRounds: number
  rewardCredits: number
  lastSubmittedAtUtc: string | null
}

export interface SubmitFeedbackResult {
  creditsAwarded: number
  newBalance: number
  nextPromptAtRound: number
}

// ---------- shared report pieces ----------

export type RangePreset = 'today' | 'week' | 'month' | 'custom'

export interface ReportQuery {
  range: RangePreset
  from?: string
  to?: string
  /** Analytics reports leave test accounts out unless this is true (?includeTest=true). */
  includeTest?: boolean
}

export interface ReportRangeInfo {
  from: string
  to: string
  days: number
}

export interface DailyValue {
  date: string
  value: number
}

export interface LabelledCount {
  label: string
  count: number
  percentage: number
}

export interface CountBucket {
  label: string
  count: number
}

// ---------- game reports ----------

export interface OverviewReport {
  range: ReportRangeInfo
  totalPlayers: number
  activePlayers: number
  gamesPlayed: number
  activeGames: number
  totalWagered: number
  totalPayouts: number
  netProfit: number
  averageCrashMultiplier: number
  feedbackResponses: number
  dailyWagered: DailyValue[]
  dailyPayouts: DailyValue[]
  dailyActivePlayers: DailyValue[]
  dailyNetProfit: DailyValue[]
}

export interface LabelledAmount {
  label: string
  amount: number
}

export interface LargestWin {
  betId: string
  username: string
  isTestAccount: boolean
  placedAtUtc: string
  roundNumber: number
  stake: number
  bonusStake: number
  cashOutMultiplier: number
  crashMultiplier: number
  payout: number
  /** Manual, AutoTarget, ProfitCap, MaxMultiplier or RoundLiability. */
  settledBy: string
}

export interface CapEventCount {
  reason: string
  count: number
  payouts: number
}

export interface DailyRevenuePoint {
  date: string
  wagered: number
  payouts: number
  grossRevenue: number
  freeCredits: number
  netProfit: number
  ggr?: number
  ngr?: number
  purchaseRevenueZar?: number
  capEvents?: number
  largestPayout?: number
  /** Set when a cap fired or one win paid more than half the day's wagers. */
  annotation?: string | null
}

/** All amounts are credits (play money) except purchaseRevenueZar. */
export interface RevenueReport {
  range: ReportRangeInfo
  includesTestAccounts?: boolean
  totalWagered: number
  cashWagered?: number
  bonusWagered?: number
  totalPayouts: number
  ggr?: number
  ggrCash?: number
  ggrBonus?: number
  grossRevenue: number
  bonusCost?: number
  bonusCostBySource?: LabelledAmount[]
  bonusForfeited?: number
  freeCreditsGiven: number
  freeCreditsBreakdown: LabelledAmount[]
  ngr?: number
  netProfit: number
  holdPercentage?: number | null
  ngrMarginPercentage?: number | null
  profitMarginPercentage: number | null
  betCount: number
  averageBet: number
  houseEdgePercentage: number
  expectedGrossRevenue: number
  actualRtpPercentage: number
  theoreticalRtpPercentage?: number
  sampleSizeNote?: string
  gapToExpected?: number
  ggrStandardDeviation?: number
  gapZScore?: number | null
  gapExplanation?: string
  purchaseRevenueZar?: number
  purchaseCount?: number
  creditsSold?: number
  largestWins?: LargestWin[]
  capEvents?: CapEventCount[]
  daily: DailyRevenuePoint[]
}

export interface GamePerformanceReport {
  range: ReportRangeInfo
  totalRounds: number
  averageRoundSeconds: number
  averageCrashMultiplier: number
  highestMultiplier: number
  lowestMultiplier: number
  instantCrashes: number
  distribution: LabelledCount[]
  thresholds: { multiplier: number; rounds: number; percentage: number }[]
  dailyRounds: DailyValue[]
  dailyAverageCrash: DailyValue[]
}

export interface PlayerActivityReport {
  range: ReportRangeInfo
  totalRegisteredPlayers: number
  activePlayers: number
  newPlayers: number
  returningPlayers: number
  gamesPlayed: number
  averageGamesPerPlayer: number
  sessions: number
  averageSessionMinutes: number
  peakConcurrentPlayers: number
  daily: { date: string; activePlayers: number; newPlayers: number; gamesPlayed: number }[]
  sessionLengths: LabelledCount[]
}

export interface LobbyReport {
  range: ReportRangeInfo
  activeLobbies: number
  lobbiesCreated: number
  lobbiesCreatedAllTime: number
  averageLobbySize: number
  largestLobbySize: number
  maxPlayersSetting: number
  playersInLobbies: number
  joins: number
  dailyJoins: DailyValue[]
  dailyLobbiesCreated: DailyValue[]
}

export interface SkinUsageReport {
  playersWithLoadout: number
  playersWithoutLoadout: number
  planes: LabelledCount[]
  skies: LabelledCount[]
}

// ---------- feedback reports ----------

export interface FeedbackAnalytics {
  range: ReportRangeInfo
  totalSubmissions: number
  uniquePlayers: number
  eligiblePlayers: number
  responseRatePercentage: number
  averageRating: number
  positivePercentage: number
  neutralPercentage: number
  negativePercentage: number
  sentimentScore: number
  creditsAwarded: number
  rewardedSubmissions: number
  ratingDistribution: CountBucket[]
  requestedImprovements: { tag: string; label: string; count: number; fromCheckboxes: number; fromComments: number }[]
  keywords: CountBucket[]
  daily: { date: string; submissions: number; averageRating: number }[]
}

export interface FeedbackSubmissionItem {
  feedbackId: string
  playerId: string
  username: string
  createdAtUtc: string
  rating: number
  sentiment: 'Positive' | 'Neutral' | 'Negative'
  categories: string[]
  likedText: string | null
  improveText: string | null
  additionalComment: string | null
  recommend?: string | null
  rewardReceived: boolean
  creditsAwarded: number
  roundsPlayedAtSubmit: number
  cashOutsAtSubmit: number
  roundsPlayedNow: number
  /** Raw "wants us to add" tag keys (categories holds their labels). */
  tags?: string[]
  /** Responsible-gambling concern, with the phrases that triggered it. */
  isConcern?: boolean
  concernPhrases?: string[]
  /** Sent within 24h of the same player's previous submission (never rewarded). */
  isDuplicate?: boolean
  /** How many submissions this player has in the range. */
  submissionsByPlayer?: number
}

export interface FeedbackSubmissionsSummary {
  averageRating: number
  countByRating: CountBucket[]
  topRequestedTags: CountBucket[]
  concernCount: number
  duplicateCount: number
  playersWithSeveralSubmissions: number
}

export interface FeedbackSubmissionsPage {
  summary?: FeedbackSubmissionsSummary
  page: number
  pageSize: number
  totalCount: number
  items: FeedbackSubmissionItem[]
}

export interface FeedbackSubmissionFilters {
  search?: string
  rating?: number
  sentiment?: string
  category?: string
  rewarded?: boolean
  /** True: only responsible-gambling concerns. */
  concern?: boolean
  page?: number
  pageSize?: number
}

export interface FeedbackCluster {
  title: string
  sentiment: 'Positive' | 'Negative' | 'Mixed'
  mentions: number
  suggestion: string
  examples: string[]
}

export interface FeedbackInsightsReport {
  range: ReportRangeInfo
  analysed: number
  positivePercentage: number
  neutralPercentage: number
  negativePercentage: number
  insights: {
    source: 'gemini' | 'keywords'
    summary: string
    clusters: FeedbackCluster[]
    generatedAtUtc: string
    warning: string | null
  }
}

export interface FeedbackSettings {
  firstPromptAfterRounds: number
  promptIntervalRounds: number
  intervalStepRounds: number
  rewardCredits: number
  /** Off: feedback is still collected but never pays credits. */
  rewardsEnabled: boolean
}

/** One keyword theme used to group feedback when no AI key is set. */
export interface FeedbackTheme {
  title: string
  keywords: string[]
  /** Shown when players mostly complain about it. */
  fix: string
  /** Shown when players mostly praise it. */
  keep: string
}

// ---------- game management ----------

/** GET/PUT /api/admin/payments: the payment gateway switch and whether purchases can actually open. */
export interface PaymentSettings {
  enabled: boolean
  gatewayConfigured: boolean
  sandbox: boolean
  livePaymentsAllowed: boolean
  purchasesOpen: boolean
}

export interface GameManagementSettings {
  lobbyMaxPlayers: number
  defaultMusicVolume: number
  defaultPlaneVolume: number
  defaultGameVolume: number
}

export interface ActiveLobby {
  lobbyId: string
  name: string
  inviteCode: string
  hostUsername: string
  members: number
  createdAtUtc: string
}

// ---------- admin management ----------

export interface AdminRoleEntry {
  userId: string
  username: string
  email: string
  isManager: boolean
  isBlocked: boolean
  lastSeenUtc: string
}

export type AdminRole = 'Admin' | 'Manager'
export type RoleAction = 'grant-admin' | 'revoke-admin' | 'grant-manager' | 'revoke-manager'

export interface AdminInvitation {
  invitationId: string
  name: string
  email: string
  role: AdminRole
  status: 'Pending' | 'Accepted' | 'Revoked' | 'Expired'
  invitedBy: string
  createdAtUtc: string
  expiresAtUtc: string
  acceptedAtUtc: string | null
}

export interface InvitationPreview {
  email: string
  name: string
  role: AdminRole
  status: AdminInvitation['status']
  invitedBy: string
  accountExists: boolean
  expiresAtUtc: string
}

// ---------- AI Advisor ----------

export interface AdvisorRecommendation {
  title: string
  area: string
  impact: 'High' | 'Medium' | 'Low'
  why: string
  action: string
  evidence: string[]
}

export interface AdvisorRecommendations {
  range: ReportRangeInfo
  /** 'gemini' or 'rules'. */
  source: string
  /** False without a Gemini key: recommendations are rule-based and chat is unavailable. */
  aiAvailable: boolean
  facts: { label: string; value: string }[]
  recommendations: AdvisorRecommendation[]
}

export interface AdvisorChatMessage {
  role: 'user' | 'assistant'
  text: string
}
