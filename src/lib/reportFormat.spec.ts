import { describe, expect, it } from 'vitest'
import { amount, count, cr, pct2, zar } from './reportFormat'

const NB = ' '

describe('reportFormat', () => {
  // The bug this guards: "R454 048,4" (browser locale comma, one decimal).
  it('always shows rands with 2 decimals, a "." point and space grouping', () => {
    expect(cr(454048.4)).toBe(`R454${NB}048.40`)
    expect(cr(0)).toBe('R0.00')
    expect(cr(12.345)).toBe('R12.35')
    expect(cr(-1234)).toBe(`−R1${NB}234.00`)
    expect(zar(35)).toBe('R35.00')
  })

  it('plain amounts (no unit) use the same grouping', () => {
    expect(amount(454048.4)).toBe(`454${NB}048.40`)
  })

  it('never prints a negative zero', () => {
    expect(cr(-0.001)).toBe('R0.00')
  })

  it('formats counts and percentages consistently', () => {
    expect(count(1234567)).toBe(`1${NB}234${NB}567`)
    expect(pct2(99)).toBe('99.00%')
    expect(pct2(null)).toBe('—')
  })
})
