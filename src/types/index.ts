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
  /** The player ticked "I agree to the Terms of Service". */
  acceptTerms: boolean
  /** The player ticked "I agree to the Account rules". */
  acceptRules?: boolean
  /** yyyy-mm-dd; must be 18+. */
  dateOfBirth?: string
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
  emailVerified?: boolean
}

export interface PlayerProfile {
  playerId: string
  username: string
  email: string
  creditBalance: number
  memberSinceUtc: string
  isAdmin: boolean
  /** Admins with manager status can grant/revoke admin access and appoint managers. */
  isManager?: boolean
  displayedAchievementKey: string | null
  /** Hangar loadout saved server-side; null until the player first equips (see lib/craft.ts, lib/skins.ts). */
  equippedCraftId?: string | null
  equippedSkyId?: string | null
  /** False until the player agrees to the current Terms of Service (always true for admins). */
  hasAcceptedTerms?: boolean
  currentTermsVersion?: string
  /** False until the first-flight tutorial has been finished or skipped. */
  hasCompletedTutorial?: boolean
  /** "Verify email": false shows the unverified banner. Older servers omit it. */
  emailVerified?: boolean
  /** Free-play part of creditBalance. */
  bonusBalance?: number
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
  equippedCraftId?: string | null
  equippedSkyId?: string | null
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
  maxMultiplierReached?: boolean
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
  period?: LeaderboardPeriod
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
  isManager?: boolean
  isBlocked: boolean
  memberSinceUtc: string
  lastSeenUtc: string
  emailVerified?: boolean
  isTestAccount?: boolean
}

export interface AdminPlayerFilters {
  search?: string
  isBlocked?: boolean
  isAdmin?: boolean
  emailVerified?: boolean
  isTestAccount?: boolean
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
  /** Credits paid once when it unlocks. Older servers omit it. */
  rewardCredits?: number
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
  /** Badge earned on completion; see lib/challengeBadges.ts. */
  badgeKey: string
  /** Rotation track: Endurance, Skill or Wallet & Wingmen. */
  track: string
  /** Next UTC midnight, when the daily rotation moves on. */
  resetsAtUtc: string
}

export interface ChallengeBadge {
  badgeKey: string
  timesEarned: number
  firstEarnedAtUtc: string
  lastEarnedAtUtc: string
}

export interface SpinStatus {
  canSpin: boolean
  nextSpinAtUtc: string
  secondsUntilNextSpin: number
  cooldownSeconds: number
  /** Prize per wheel segment, in drawing order. */
  segments: number[]
  /** Chance of landing on each segment (same order), summing to 1. Older servers omit it. */
  odds?: number[]
  expectedValue?: number
  dailySpinLimit?: number
  /** Null when there is no daily limit. */
  spinsLeftToday?: number | null
  /** The most recent spin, so a player who left mid-animation still sees the prize. */
  lastSpin?: LastSpin | null
}

export interface SpinResult {
  segmentIndex: number
  amount: number
  newBalance: number
  nextSpinAtUtc: string
}

export interface LobbyMemberInfo {
  playerId: string
  username: string
  displayedAchievementKey: string | null
  joinedAtUtc: string
  isHost: boolean
  equippedCraftId?: string | null
  equippedSkyId?: string | null
}

export interface LobbyDetails {
  lobbyId: string
  name: string
  inviteCode: string
  hostPlayerId: string
  hostUsername: string
  members: LobbyMemberInfo[]
  /** Admin-configurable seat limit. Older servers omit it (see LOBBY_CAPACITY). */
  maxPlayers?: number
}

/** GET /api/settings/public: admin-set values every player (signed in or not) can read. */
export interface PublicSettings {
  lobbyMaxPlayers: number
  /** Default volumes (0–100) for players who never changed their own. */
  audio: { music: number; plane: number; game: number }
  /** True while players can buy credits (admin switch on and gateway usable). */
  paymentsEnabled?: boolean
  /** Published game rules and limits. Older servers omit it. */
  rules?: PublicGameRules
  /** Google sign-in shows only when set. */
  googleClientId?: string | null
}


/** A lobby-mate's bet on the current round (GameHub.GetLobbyRoundBets). */
export interface LobbyRoundBet {
  playerId: string
  username: string
  displayedAchievementKey: string | null
  equippedCraftId: string | null
  amount: number
  status: 'Placed' | 'CashedOut' | 'Lost'
  cashOutMultiplier: number | null
}

// ---------------------------------------------------------------------------------------
// Player-side features from the October 2026 backend work (see backend docs/API_CHANGES.md).
// ---------------------------------------------------------------------------------------

/** GET /api/settings/public → rules: house edge and every risk limit (enforced by the server). */
export interface PublicGameRules {
  houseEdgePercentage: number
  theoreticalRtpPercentage: number
  crashFormulaVersion: number
  minBet: number
  maxMultiplier: number
  maxProfitPerBet: number
  maxRoundLiability: number
  maxBetFromBonusBalance: number
  bonusWageringMultiple: number
  bonusExpiryDays: number
  bettingPaused: boolean
}

/** Full wallet split: bonus credits must be wagered before they turn into cash credits. */
export interface WalletBalanceDetail {
  creditBalance: number
  bonusBalance: number
  cashBalance: number
  bonusWageringRemaining: number
  bonusExpiresAtUtc: string | null
}

export interface LastSpin {
  amount: number
  segmentIndex: number
  spunAtUtc: string
}

/** GET /api/rounds/{id}/verify: everything needed to recompute a finished round. */
export interface RoundVerification {
  roundId: string
  roundNumber: number
  serverSeedHash: string
  serverSeed: string | null
  hmacMessage: string
  clientSeed: string | null
  houseEdge: number
  maxMultiplier: number
  formulaVersion: number
  crashMultiplier: number | null
  maxMultiplierReached: boolean
  crashedAtUtc: string | null
}

/** One bet on the current round, for the public live-bets panel (usernames only). */
export interface LiveRoundBet {
  username: string
  amount: number
  status: 'Placed' | 'CashedOut' | 'Lost' | string
  cashOutMultiplier: number | null
  payout: number | null
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'all'

export interface AccountRule {
  code: string
  category: string
  title: string
  summary: string
  details: string
  action: string
  defaultDurationDays: number | null
  detection: string
  isActive: boolean
  appealable: boolean
}

export interface AccountRuleSet {
  version: number
  label: string
  effectiveFromUtc: string
  publishedBy: string
  changeNote: string
  rules: AccountRule[]
}

export interface PlayerSanction {
  id: string
  ruleCode: string
  ruleTitle: string
  ruleSummary: string
  ruleSetVersion: number
  action: string
  startsAtUtc: string
  /** Null = permanent. */
  endsAtUtc: string | null
  appealable: boolean
  appealPending?: boolean
}

export type AccountStatus = 'GoodStanding' | 'Warning' | 'Restricted' | 'Blocked'

export interface AccountStanding {
  status: AccountStatus
  activeSanctions: PlayerSanction[]
  currentRuleSetVersion: number
  acceptedRuleSetVersion: number | null
  mustAcceptRules: boolean
}

/** 403 body from POST /api/auth/login when the account is blocked. */
export interface BlockedLogin {
  message: string
  sanction: PlayerSanction | null
  appealToken: string | null
}

export interface LossLimits {
  daily: number | null
  weekly: number | null
  pendingDaily: number | null
  pendingWeekly: number | null
  pendingFromUtc: string | null
  netLossToday: number
  netLossThisWeek: number
}

export interface PlaySession {
  startedAtUtc: string | null
  minutesPlayed: number
  bets: number
  wagered: number
  won: number
  netResult: number
  reminderMinutes: number
}

export type CashOutReason = 'AutoTarget' | 'ProfitCap' | 'MaxMultiplier' | 'RoundLiability'
