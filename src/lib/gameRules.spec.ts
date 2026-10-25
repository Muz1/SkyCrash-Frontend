import { describe, expect, it } from 'vitest'
import { autoPresets, autoTargetProblem, maxStake, maxWin, skyMilestone, stakeProblem } from './gameRules'
import type { PublicGameRules } from '@/types'

const rules: PublicGameRules = {
  houseEdgePercentage: 1,
  theoreticalRtpPercentage: 99,
  crashFormulaVersion: 2,
  maxMultiplier: 100,
  maxProfitPerBet: 10000,
  maxRoundLiability: 50000,
  bonusWageringMultiple: 5,
  bonusExpiryDays: 7,
  bettingPaused: false,
}

describe('gameRules', () => {
  it('max win is the smaller of the multiplier cap and the profit cap', () => {
    expect(maxWin(50, rules)).toBe(5000) // 50 × 100
    expect(maxWin(500, rules)).toBe(10500) // 500 + 10 000
    expect(maxWin(0, rules)).toBeNull()
    expect(maxWin(50, null)).toBeNull()
  })

  it('hides auto presets above the cap', () => {
    expect(autoPresets(rules)).toEqual([1.5, 2, 3, 5, 10])
    expect(autoPresets({ ...rules, maxMultiplier: 4 })).toEqual([1.5, 2, 3])
    expect(autoPresets(null)).toEqual([1.5, 2, 3, 5, 10])
  })

  it('checks stake and auto target against the limits', () => {
    expect(stakeProblem(0, 100)).toBe('empty')
    expect(stakeProblem(0.01, 100)).toBe('none') // no minimum bet
    expect(stakeProblem(2000, 5000)).toBe('none')
    expect(stakeProblem(100, 50)).toBe('noCredits')
    expect(autoTargetProblem(1, rules)).toBe('tooLow')
    expect(autoTargetProblem(150, rules)).toBe('tooHigh')
    expect(autoTargetProblem(100, rules)).toBe('none')
  })

  it('the max stake is the whole balance', () => {
    expect(maxStake(5000)).toBe(5000)
    expect(maxStake(321.456)).toBe(321.45)
  })

  it('maps multipliers to sky milestones', () => {
    expect([1, 9.99, 10, 49.9, 50, 100].map(skyMilestone)).toEqual([0, 0, 1, 1, 2, 3])
  })
})
