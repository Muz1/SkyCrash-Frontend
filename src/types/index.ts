export interface Player {
  playerId: string
  username: string
  creditBalance: number
}

export interface ApiError {
  message: string
  statusCode: number
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  playerId: string
  username: string
  email: string
  expiresAtUtc: string
}

export interface PlayerProfile {
  playerId: string
  username: string
  email: string
  creditBalance: number
  memberSinceUtc: string
  isAdmin: boolean
  displayedAchievementKey: string | null
}

export interface UpdateProfilePayload {
  email: string
  username?: string
}

export interface UsernameAvailability {
  available: boolean
  suggestions: string[]
}

// Shape of the 409 Conflict body the backend sends when a username is taken
// (registration or profile update) — `field` tells the caller which input to flag.
export interface UsernameConflictError {
  message: string
  field?: 'username' | 'email'
  suggestions?: string[]
}

export interface OnlinePlayer {
  playerId: string
  username: string
  displayedAchievementKey: string | null
}

export interface WalletBalance {
  creditBalance: number
}

export interface CreditTransactionRecord {
  id: string
  amount: number
  type: string
  balanceAfter: number
  description: string | null
  createdAtUtc: string
}

export interface CreditPack {
  id: string
  displayName: string
  priceZar: number
  credits: number
}

export interface CheckoutResponse {
  actionUrl: string
  fields: Record<string, string>
}

export interface RoundHistoryEntry {
  roundId: string
  roundNumber: number
  crashMultiplier: number
  crashedAtUtc: string
}

export interface BetHistoryEntry {
  betId: string
  roundNumber: number
  amount: number
  status: string
  cashOutMultiplier: number | null
  payout: number | null
  placedAtUtc: string
}

export interface BiggestWinEntry {
  username: string
  displayedAchievementKey: string | null
  payout: number
  cashOutMultiplier: number
  roundNumber: number
}

export interface BestMultiplierEntry {
  username: string
  displayedAchievementKey: string | null
  cashOutMultiplier: number
  roundNumber: number
}

export interface MostActiveEntry {
  username: string
  displayedAchievementKey: string | null
  betsPlaced: number
}

export interface LeaderboardData {
  biggestWins: BiggestWinEntry[]
  bestMultipliers: BestMultiplierEntry[]
  mostActive: MostActiveEntry[]
}

export interface OperationsMetrics {
  onlinePlayers: number
  currentRoundStatus: string
  currentRoundNumber: number | null
  currentMultiplier: number | null
  roundsLastHour: number
  totalWageredLastHour: number
  activeBetsThisRound: number
}

export interface RtpWindowStats {
  totalWagered: number
  totalPaidOut: number
  actualRtpPercentage: number
  betsResolved: number
}

export interface RtpSummary {
  allTime: RtpWindowStats
  last24Hours: RtpWindowStats
  theoreticalRtpPercentage: number
  houseEdgePercentage: number
}

export interface HistogramBucket {
  label: string
  count: number
  percentage: number
}

export interface VolatilitySummary {
  sampleSize: number
  meanCrashPoint: number
  medianCrashPoint: number
  standardDeviation: number
  p10: number
  p25: number
  p75: number
  p90: number
  histogram: HistogramBucket[]
}

export interface AdminPlayerSummary {
  playerId: string
  username: string
  email: string
  creditBalance: number
  isAdmin: boolean
  isBlocked: boolean
  memberSinceUtc: string
  lastSeenUtc: string
}

export interface AdminPlayerFilters {
  search?: string
  isBlocked?: boolean
  isAdmin?: boolean
  sortBy?: 'username' | 'email' | 'balance' | 'membersince' | 'lastseen'
  sortDir?: 'asc' | 'desc'
}

export interface GameSettings {
  houseEdgePercentage: number
  theoreticalRtpPercentage: number
  maxMultiplier: number
  updatedAtUtc: string
  updatedByUsername: string | null
}

export interface AdminCurrentRound {
  roundId: string
  roundNumber: number
  status: string
  serverSeedHash: string
  currentMultiplier: number
  predeterminedCrashMultiplier: number
  countdownSeconds: number | null
  activeBetCount: number
}

export interface RoundReportItem {
  roundId: string
  roundNumber: number
  crashMultiplier: number | null
  status: string
  createdAtUtc: string
  crashedAtUtc: string | null
  betCount: number
  totalWagered: number
  totalPaidOut: number
}

export interface RoundReportResponse {
  page: number
  pageSize: number
  totalCount: number
  rounds: RoundReportItem[]
}

export type AchievementKey =
  | 'ClearedForTakeoff'
  | 'MaybeTakeABreak'
  | 'FrequentFlyer'
  | 'VeteranPilot'
  | 'SkyLegend'
  | 'CloseCall'

export interface Achievement {
  key: AchievementKey
  name: string
  description: string
  target: number
  progress: number
  unlocked: boolean
  unlockedAtUtc: string | null
  isDisplayed: boolean
}

export interface Challenge {
  id: string
  type: string
  description: string
  target: number
  progress: number
  rewardCredits: number
  isCompleted: boolean
  completedAtUtc: string | null
}

export interface LobbyMemberInfo {
  playerId: string
  username: string
  displayedAchievementKey: string | null
  joinedAtUtc: string
  isHost: boolean
}

export interface LobbyDetails {
  lobbyId: string
  name: string
  inviteCode: string
  hostPlayerId: string
  hostUsername: string
  members: LobbyMemberInfo[]
}

