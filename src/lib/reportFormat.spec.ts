import { describe, expect, it } from 'vitest'
import { count, cr, pct2, zar } from './reportFormat'

const NB = ' '

describe('reportFormat', () => {
  it('always shows 2 decimals with a "." point and space grouping', () => {
    expect(cr(454048.4)).toBe(`454${NB}048.40`)
    expect(cr(0)).toBe('0.00')
    expect(cr(12.345)).toBe('12.35')
    expect(cr(-1234)).toBe(`−1${NB}234.00`)
  })

  it('only rands carry the R sign', () => {
    expect(zar(454048.4)).toBe(`R454${NB}048.40`)
    expect(cr(10)).not.toContain('R')
  })

  it('never prints a negative zero', () => {
    expect(cr(-0.001)).toBe('0.00')
  })

  it('formats counts and percentages consistently', () => {
    expect(count(1234567)).toBe(`1${NB}234${NB}567`)
    expect(pct2(99)).toBe('99.00%')
    expect(pct2(null)).toBe('—')
  })
})
