// Admin Player Retention and Player Insights reports. Mirrors the backend's RetentionDtos.cs.

export interface RetentionWindow {
  day: number
  label: string
  fromDay: number
  toDay: number
  eligiblePlayers: number
  retainedPlayers: number
  /** Null until at least one player has had the whole window to come back. */
  percentage: number | null
}

export interface RetentionCohort {
  label: string
  startDate: string
  endDate: string
  players: number
  windows: RetentionWindow[]
}

export interface FeatureEngagementRow {
  key: string
  label: string
  users: number
  nonUsers: number
  usersAvgSessions: number
  nonUsersAvgSessions: number
  usersAvgFlights: number
  nonUsersAvgFlights: number
  usersReturnRate: number | null
  nonUsersReturnRate: number | null
  usersDay7: number | null
  nonUsersDay7: number | null
  trackedSince: string | null
}

export interface PlayerRetentionReport {
  generatedAtUtc: string
  totalRegisteredPlayers: number
  playersWithActivity: number
  neverPlayed: number
  newPlayers: number
  activePlayers: number
  returningPlayers: number
  longTermPlayers: number
  inactivePlayers: number
  recentlyInactivePlayers: number
  averageSessionsPerPlayer: number
  averageFlightsPerPlayer: number
  averageDaysPlayed: number
  totals: {
    sessions: number
    returnSessions: number
    flights: number
    completedRounds: number
    cashOuts: number
    multiplayerRounds: number
    loginsRecorded: number
    loginTrackingSince: string | null
  }
  windows: RetentionWindow[]
  cohorts: RetentionCohort[]
  features: FeatureEngagementRow[]
  feedback: {
    submitters: number
    returnedAfter: number
    returnedAfterPercentage: number | null
    averageSessionsAfter: number
    nonSubmitterReturnRate: number | null
  }
  dataNotes: string[]
}

export interface InsightOptionCount {
  key: string
  count: number
  percentage: number
}

export interface InsightQuestion {
  key: string
  multiSelect: boolean
  answered: number
  /** Fewer than minimumGroupSize answers: options is empty so no individual can be singled out. */
  suppressed?: boolean
  options: InsightOptionCount[]
}

export interface InsightSegmentRow {
  key: string
  players: number
  suppressed: boolean
  returnRate: number | null
  averageSessions: number | null
  averageFlights: number | null
  day7: number | null
}

export interface PlayerInsightsReport {
  generatedAtUtc: string
  minimumGroupSize: number
  totalPlayers: number
  respondents: number
  responseRatePercentage: number
  marketingOptIns: number
  marketingOptOuts: number
  questions: InsightQuestion[]
  countries: { country: string; players: number }[]
  segments: { dimension: string; rows: InsightSegmentRow[] }[]
  hooksByAge: { ageRange: string; players: number; suppressed: boolean; hooks: InsightOptionCount[] }[]
  recommend: InsightOptionCount[]
}
