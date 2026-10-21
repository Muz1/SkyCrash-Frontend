import { describe, expect, it } from 'vitest'
import { isAtLeast18, latestAdultDob } from './age'

describe('age gate', () => {
  const today = new Date(Date.UTC(2026, 9, 20))
  it('is 18 on the birthday, not the day before', () => {
    expect(isAtLeast18('2008-10-20', today)).toBe(true)
    expect(isAtLeast18('2008-10-21', today)).toBe(false)
    expect(isAtLeast18('1990-01-01', today)).toBe(true)
    expect(isAtLeast18('nonsense', today)).toBe(false)
  })
  it('gives the latest allowed birth date', () => {
    expect(latestAdultDob(today)).toBe('2008-10-20')
  })
})
