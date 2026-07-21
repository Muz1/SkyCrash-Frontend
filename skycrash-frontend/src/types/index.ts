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