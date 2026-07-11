export interface Player {
  playerId: string
  username: string
  creditBalance: number
}

export interface ApiError {
  message: string
  statusCode: number
}