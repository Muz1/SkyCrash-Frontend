import { describe, expect, it } from 'vitest'
import { luckCheck, luckVerdict, zBand } from './adminReports'
import type { RevenueReport } from '@/types/insights'

// Only the fields luckCheck reads; the rest of the report doesn't matter here.
const report = (over: Partial<RevenueReport>) =>
  ({ totalWagered: 20_000, grossRevenue: -1_857, expectedGrossRevenue: 200, ggrStandardDeviation: 1_500, ...over }) as RevenueReport

describe('luckCheck', () => {
  it('bands the z-score', () => {
    expect(zBand(-1.4)).toBe('normal')
    expect(zBand(2)).toBe('normal')
    expect(zBand(-2.5)).toBe('watch')
    expect(zBand(3.2)).toBe('investigate')
  })

  it('measures the gap in normal swings', () => {
    const l = luckCheck(report({}))
    expect(l.gap).toBe(-2_057)
    expect(l.z).toBeCloseTo(-1.37, 2)
    expect(l.band).toBe('normal')
    expect(luckVerdict(l)).toContain('normal luck')
  })

  it('gives the chance of a loss and the betting needed to make it rare', () => {
    const l = luckCheck(report({}))
    // expected / sd = 0.133 → about a 45% chance of a loss
    expect(l.lossChance!).toBeCloseTo(0.447, 2)
    // (1.645 × 1500 / 200)² × 20 000 ≈ 3.04 million
    expect(l.wageredForRareLoss!).toBeCloseTo(3_044_756, -3)
  })

  it('says so when there is nothing to judge', () => {
    const l = luckCheck(report({ ggrStandardDeviation: 0, gapZScore: null }))
    expect(l.lossChance).toBeNull()
    expect(luckVerdict(l)).toBe('Not enough bets yet to judge.')
  })
})
