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
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  playerId: string
  username: string
  expiresAtUtc: string
}

export interface PlayerProfile {
  playerId: string
  username: string
  email: string
  creditBalance: number
  memberSinceUtc: string
}

export interface UpdateProfilePayload {
  email: string
}

export interface OnlinePlayer {
  playerId: string
  username: string
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
  payout: number
  cashOutMultiplier: number
  roundNumber: number
}

export interface BestMultiplierEntry {
  username: string
  cashOutMultiplier: number
  roundNumber: number
}

export interface MostActiveEntry {
  username: string
  betsPlaced: number
}

export interface LeaderboardData {
  biggestWins: BiggestWinEntry[]
  bestMultipliers: BestMultiplierEntry[]
  mostActive: MostActiveEntry[]
}
