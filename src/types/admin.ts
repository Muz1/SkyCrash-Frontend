// Admin-only API shapes added in the October 2026 backend work (docs/API_CHANGES.md).
// Mirrors SkyCrash.Application/DTOs (AccountRulesDtos, ReconciliationDtos) and the admin
// health/risk controllers. Amounts are credits unless the name ends in Zar.

// ---------- account rules ----------

export type RuleActionName = 'Warning' | 'TemporaryBlock' | 'PermanentBlock' | 'Restriction' | 'Escalating'

export const RULE_ACTIONS: { id: RuleActionName; label: string }[] = [
  { id: 'Warning', label: 'Warning' },
  { id: 'TemporaryBlock', label: 'Temporary block' },
  { id: 'PermanentBlock', label: 'Permanent block' },
  { id: 'Restriction', label: 'Restriction' },
  { id: 'Escalating', label: 'Escalating' },
]

export interface AccountRule {
  code: string
  category: string
  title: string
  summary: string
  details: string
  action: RuleActionName | string
  defaultDurationDays: number | null
  detection: string
  isActive: boolean
  appealable: boolean
}

export interface RuleSetVersionSummary {
  version: number
  label: string
  effectiveFromUtc: string
  publishedBy: string
  changeNote: string
}

export interface RuleSet extends RuleSetVersionSummary {
  rules: AccountRule[]
}

export interface AdminRulesResponse {
  current: RuleSet
  history: RuleSetVersionSummary[]
}

export interface UpdateRuleRequest {
  title: string
  summary: string
  details: string
  action: string
  defaultDurationDays: number | null
  appealable: boolean
  isActive: boolean
  changeNote: string
}

export type SanctionStatus = 'Active' | 'Expired' | 'Lifted'

export interface AdminSanction {
  id: string
  userId: string
  username: string
  ruleCode: string
  ruleTitle: string
  ruleSetVersion: number
  action: string
  startsAtUtc: string
  endsAtUtc: string | null
  appliedBy: string
  internalNote: string | null
  status: SanctionStatus | string
  liftedAtUtc: string | null
  liftedBy: string | null
  liftReason: string | null
}

export interface SanctionFilters {
  rule?: string
  status?: string
  from?: string
  to?: string
  userId?: string
}

export interface ApplySanctionRequest {
  ruleCode: string
  /** Null = the rule's default (permanent if the rule has none). */
  durationDays: number | null
  internalNote?: string
}

export type AppealStatus = 'Open' | 'Upheld' | 'Overturned'

export interface Appeal {
  id: string
  sanctionId: string
  username: string
  ruleCode: string
  message: string
  status: AppealStatus | string
  createdAtUtc: string
  response: string | null
}

export interface AuditLogEntry {
  id: string
  createdAtUtc: string
  action: string
  actorUserId: string | null
  actor: string
  targetUserId: string | null
  ruleCode: string | null
  details: string
}

// ---------- reconciliation, risk, health ----------

export interface ReconciliationIssue {
  playerId: string | null
  username: string | null
  betId: string | null
  detail: string
}

export interface ReconciliationCheck {
  key: string
  description: string
  issueCount: number
  issues: ReconciliationIssue[]
}

export interface ReconciliationReport {
  checkedAtUtc?: string
  passed: boolean
  playersChecked?: number
  betsChecked?: number
  checks: ReconciliationCheck[]
}

export interface HouseRiskStatus {
  day: string
  netGamingRevenueToday: number
  dailyHouseLossLimit: number
  bettingPaused: boolean
  resumedByAdmin: boolean
}

export interface GameLimits {
  maxMultiplier: number
  maxProfitPerBet: number
  minBet: number
  maxBet: number
  maxRoundLiability: number
  dailyHouseLossLimit: number
  maxBetFromBonusBalance: number
  bonusWageringMultiple: number
  bonusExpiryDays: number
  feedbackRewardMinRounds?: number
  feedbackDuplicateWindowHours?: number
}

export interface AdminRiskResponse {
  status: HouseRiskStatus
  limits: GameLimits
}

export interface HouseLossLimitReachedPayload {
  netGamingRevenueToday: number
  limit: number
}

export interface AdminHealth {
  checkedAtUtc: string
  database: 'ok' | 'down' | string
  game: 'ok' | 'starting' | string
  round: { roundNumber: number; status: string; currentMultiplier: number } | null
  playersOnline: number
  payments: { mode: 'sandbox' | 'live' | 'blocked' | string; configured: boolean; httpsOk: boolean; adminSwitchOn: boolean; usable: boolean }
  ai: { primaryKey: boolean; backupKey: boolean; model: string; fallbackModel: string | null; status: string }
  email: string
  loginOtp: boolean
  googleSignIn: boolean
  version: string
}

/** The `rules` block of GET /api/settings/public. */
export interface PublicGameRules {
  houseEdgePercentage: number
  theoreticalRtpPercentage: number
  crashFormulaVersion: number
  minBet: number
  maxBet: number
  maxMultiplier: number
  maxProfitPerBet: number
  maxRoundLiability: number
  maxBetFromBonusBalance: number
  bonusWageringMultiple: number
  bonusExpiryDays: number
  bettingPaused: boolean
}
