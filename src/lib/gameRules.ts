import type { PublicGameRules } from '@/types'

/**
 * Client-side view of the published game limits (GET /api/settings/public → rules). The
 * server enforces all of them; the bet panel only uses these to stop obviously refused bets
 * and to explain the caps. Older servers don't publish rules, so every helper copes with null.
 */

/** Quick-pick auto cash-out targets; any above the round cap are hidden. */
export const AUTO_PRESETS = [1.5, 2, 3, 5, 10] as const

export const MIN_AUTO_TARGET = 1.01

/** The most a bet can return: min(stake × max multiplier, stake + max profit). */
export function maxWin(stake: number, rules: PublicGameRules | null | undefined): number | null {
  if (!rules || !(stake > 0)) return null
  return Math.min(stake * rules.maxMultiplier, stake + rules.maxProfitPerBet)
}

export function autoPresets(rules: PublicGameRules | null | undefined): number[] {
  const cap = rules?.maxMultiplier ?? Infinity
  return AUTO_PRESETS.filter((p) => p <= cap)
}

export type StakeProblem = 'none' | 'empty' | 'tooSmall' | 'noCredits'

export function stakeProblem(stake: number, credits: number, rules: PublicGameRules | null | undefined): StakeProblem {
  if (!Number.isFinite(stake) || stake <= 0) return 'empty'
  if (rules && stake < rules.minBet) return 'tooSmall'
  if (stake > credits) return 'noCredits'
  return 'none'
}

export type AutoProblem = 'none' | 'tooLow' | 'tooHigh'

export function autoTargetProblem(target: number, rules: PublicGameRules | null | undefined): AutoProblem {
  if (!Number.isFinite(target) || target < MIN_AUTO_TARGET) return 'tooLow'
  if (rules && target > rules.maxMultiplier) return 'tooHigh'
  return 'none'
}

/** Quick bet chips that the limits allow. */
export function allowedSteps(steps: readonly number[], rules: PublicGameRules | null | undefined): number[] {
  if (!rules) return [...steps]
  return steps.filter((s) => s >= rules.minBet)
}

/** The "Max" chip: as much as the player has (there is no maximum bet). */
export function maxStake(credits: number, _rules?: PublicGameRules | null): number {
  return Math.max(0, Math.floor(credits * 100) / 100)
}

/** Cosmetic sky stage for the climb: 0 below 10×, then 1 (10×), 2 (50×), 3 (100×). */
export function skyMilestone(multiplier: number): 0 | 1 | 2 | 3 {
  if (multiplier >= 100) return 3
  if (multiplier >= 50) return 2
  if (multiplier >= 10) return 1
  return 0
}
