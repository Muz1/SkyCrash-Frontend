import { describe, expect, it } from 'vitest'
import { ACHIEVEMENT_BADGES } from '@/lib/achievements'
import {
  CHALLENGE_BADGES,
  CHALLENGE_BADGE_KEYS,
  UNKNOWN_CHALLENGE_BADGE,
  challengeBadgeFor,
  challengeBadgeOrUnknown,
} from '@/lib/challengeBadges'
import challengeBadgesSource from './challengeBadges.ts?raw'

// Mirrors the backend's ChallengeCatalog.BadgeFor (SkyCrash.Domain/Common/ChallengeCatalog.cs).
// When a challenge type is added there, add its key here and give it its own badge.
const BACKEND_BADGE_KEYS = [
  'DailyFlyer',
  'RushHour',
  'AcePilot',
  'HighAltitude',
  'HotStreak',
  'MultiplierMiner',
  'JackpotJockey',
  'Payday',
  'HighRoller',
  'BigTicket',
  'SquadLeader',
  'Wingman',
]

const achievementSources = new Set(Object.values(ACHIEVEMENT_BADGES).map((b) => b.src))
const achievementNames = new Set(Object.values(ACHIEVEMENT_BADGES).map((b) => b.name))

describe('challenge badges (brief 2.4)', () => {
  it('has a badge for every backend challenge badge key', () => {
    for (const key of BACKEND_BADGE_KEYS) expect({ key, hasBadge: challengeBadgeFor(key) !== null }).toEqual({ key, hasBadge: true })
    expect([...CHALLENGE_BADGE_KEYS].sort()).toEqual([...BACKEND_BADGE_KEYS].sort())
  })

  it('never resolves to an achievement badge asset', () => {
    for (const key of CHALLENGE_BADGE_KEYS) {
      const badge = CHALLENGE_BADGES[key]
      // The key is in the object so a failure names the offending badge.
      expect({ key, reusesArt: achievementSources.has(badge.src) }).toEqual({ key, reusesArt: false })
      expect({ key, src: badge.src }).not.toEqual({ key, src: expect.stringContaining('/achievements/') })
      expect({ key, reusesName: achievementNames.has(badge.name) }).toEqual({ key, reusesName: false })
    }
  })

  it('only imports art from the challenge-badges folder', () => {
    const imports = [...challengeBadgesSource.matchAll(/from '(@\/assets\/[^']+)'/g)].map((m) => m[1]!)
    expect(imports.length).toBe(CHALLENGE_BADGE_KEYS.length + 1)
    for (const path of imports) expect(path).toMatch(/^@\/assets\/challenge-badges\/[a-z-]+\.svg$/)
  })

  it('gives every challenge type its own artwork', () => {
    const sources = CHALLENGE_BADGE_KEYS.map((k) => CHALLENGE_BADGES[k].src)
    expect(new Set(sources).size).toBe(sources.length)
    const colours = CHALLENGE_BADGE_KEYS.map((k) => CHALLENGE_BADGES[k].color.toLowerCase())
    expect(new Set(colours).size).toBe(colours.length)
  })

  it('shows a neutral placeholder (not an achievement badge) for unknown keys', () => {
    for (const key of ['NotARealBadge', '', null, undefined, 'ClearedForTakeoff', 'SkyLegend', 'toString']) {
      expect(challengeBadgeFor(key)).toBeNull()
      const shown = challengeBadgeOrUnknown(key)
      expect(shown).toBe(UNKNOWN_CHALLENGE_BADGE)
      expect(achievementSources.has(shown.src)).toBe(false)
      expect(shown.src).not.toMatch(/\/achievements\//)
    }
    expect(CHALLENGE_BADGE_KEYS.map((k) => CHALLENGE_BADGES[k].src)).not.toContain(UNKNOWN_CHALLENGE_BADGE.src)
  })
})
