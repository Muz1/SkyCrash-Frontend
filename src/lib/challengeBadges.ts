import dailyFlyer from '@/assets/challenge-badges/daily-flyer.svg'
import rushHour from '@/assets/challenge-badges/rush-hour.svg'
import acePilot from '@/assets/challenge-badges/ace-pilot.svg'
import highAltitude from '@/assets/challenge-badges/high-altitude.svg'
import hotStreak from '@/assets/challenge-badges/hot-streak.svg'
import multiplierMiner from '@/assets/challenge-badges/multiplier-miner.svg'
import jackpotJockey from '@/assets/challenge-badges/jackpot-jockey.svg'
import payday from '@/assets/challenge-badges/payday.svg'
import highRoller from '@/assets/challenge-badges/high-roller.svg'
import bigTicket from '@/assets/challenge-badges/big-ticket.svg'
import squadLeader from '@/assets/challenge-badges/squad-leader.svg'
import wingman from '@/assets/challenge-badges/wingman.svg'
import unknownBadge from '@/assets/challenge-badges/unknown.svg'

/**
 * Badges earned by completing daily challenges: one per challenge type, each with its own
 * artwork in src/assets/challenge-badges/. They never share art with the six permanent
 * achievements (lib/achievements.ts), and there is no shared fallback: an unknown key gets
 * the neutral "?" placeholder. Keys mirror the backend's ChallengeCatalog.BadgeFor and are
 * stored on the server, so never rename one.
 */
export const CHALLENGE_BADGE_KEYS = [
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
] as const

export type ChallengeBadgeKey = (typeof CHALLENGE_BADGE_KEYS)[number]

export interface ChallengeBadgeInfo {
  src: string
  name: string
  description: string
  color: string
}

export const CHALLENGE_BADGES: Record<ChallengeBadgeKey, ChallengeBadgeInfo> = {
  DailyFlyer: { src: dailyFlyer, name: 'Daily Flyer', description: 'Complete a "play N rounds" challenge.', color: '#22d3ee' },
  RushHour: { src: rushHour, name: 'Rush Hour', description: 'Play a burst of rounds against the clock.', color: '#facc15' },
  AcePilot: { src: acePilot, name: 'Ace Pilot', description: 'Cash out on a set number of rounds.', color: '#10b981' },
  HighAltitude: { src: highAltitude, name: 'High Altitude', description: 'Cash out at a big multiplier.', color: '#a855f7' },
  HotStreak: { src: hotStreak, name: 'Hot Streak', description: 'Cash out several rounds in a row.', color: '#f97316' },
  MultiplierMiner: { src: multiplierMiner, name: 'Multiplier Miner', description: 'Bank a combined multiplier across the day.', color: '#ec4899' },
  JackpotJockey: { src: jackpotJockey, name: 'Jackpot Jockey', description: 'Land one huge payout in a single round.', color: '#f59e0b' },
  Payday: { src: payday, name: 'Payday', description: 'Earn a pile of credits from cash outs.', color: '#84cc16' },
  HighRoller: { src: highRoller, name: 'High Roller', description: 'Bet big, in total or in one go.', color: '#3b82f6' },
  BigTicket: { src: bigTicket, name: 'Big Ticket', description: 'Place one bet of at least the target.', color: '#14b8a6' },
  SquadLeader: { src: squadLeader, name: 'Squad Leader', description: 'Get friends to join your lobby.', color: '#f43f5e' },
  Wingman: { src: wingman, name: 'Wingman', description: 'Play rounds in a lobby with friends.', color: '#38bdf8' },
}

/** Shown for a badge key this build doesn't know yet (e.g. a newer server). Not an achievement asset. */
export const UNKNOWN_CHALLENGE_BADGE: ChallengeBadgeInfo = {
  src: unknownBadge,
  name: 'Mystery Badge',
  description: 'A new badge. Update the app to see it.',
  color: '#94a3b8',
}

export function isChallengeBadgeKey(key: string | null | undefined): key is ChallengeBadgeKey {
  return !!key && Object.prototype.hasOwnProperty.call(CHALLENGE_BADGES, key)
}

/** The badge for a known key, or null (callers that must draw something use challengeBadgeOrUnknown). */
export function challengeBadgeFor(key: string | null | undefined): ChallengeBadgeInfo | null {
  return isChallengeBadgeKey(key) ? CHALLENGE_BADGES[key] : null
}

export function challengeBadgeOrUnknown(key: string | null | undefined): ChallengeBadgeInfo {
  return challengeBadgeFor(key) ?? UNKNOWN_CHALLENGE_BADGE
}

/** Challenge types that need a lobby, so the UI can point players at it. */
export const SOCIAL_CHALLENGE_TYPES = new Set(['InviteFriends', 'PlayRoundsWithFriends'])
