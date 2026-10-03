// Player-side feedback types. The shared status/result shapes live in
// types/insights.ts; these add the newer fields the player form uses.
import type { FeedbackStatus } from '@/types/insights'

/** "What would you like us to add?" options, mapped to the tag values the backend stores. */
export const FEATURE_REQUESTS = [
  { tag: 'PlaneSkins', label: 'New plane skins' },
  { tag: 'Skies', label: 'New skies' },
  { tag: 'Multiplayer', label: 'Multiplayer' },
  { tag: 'GameModes', label: 'New game modes' },
  { tag: 'BetterUI', label: 'Better UI' },
  { tag: 'SoundMusic', label: 'Sound/music' },
  { tag: 'Rewards', label: 'Rewards' },
  { tag: 'Other', label: 'Other' },
] as const

export type FeatureRequestTag = (typeof FEATURE_REQUESTS)[number]['tag']

/** POST /api/feedback body. Everything except the rating is optional. */
export interface FeedbackSubmission {
  rating: number
  likedText?: string
  improveText?: string
  tags: FeatureRequestTag[]
  additionalComment?: string
  recommend?: string
  /** The optional "Tell us about you" answers; omitted when the player skips that section. */
  profile?: PlayerInsightAnswers
}

/**
 * Optional "Tell us about you" answers (keys must match the backend's PlayerInsightOptions).
 * Also what GET /api/feedback/profile returns: the signed-in player's own answers only.
 */
export interface PlayerInsightAnswers {
  ageRange?: string | null
  gender?: string | null
  genderSelfDescribe?: string | null
  country?: string | null
  region?: string | null
  occupation?: string | null
  playFrequency?: string | null
  devices?: string[] | null
  sessionLength?: string | null
  gameGenres?: string[] | null
  motivations?: string[] | null
  triedBecause?: string | null
  favouriteFeatures?: string[] | null
  wantNext?: string[] | null
  wantNextText?: string | null
  discoverySource?: string | null
  socialPlatforms?: string[] | null
  scrollHooks?: string[] | null
  marketingOptIn?: boolean | null
  marketingContact?: string | null
}

/** The optional "Tell us about you" steps, in order. */
export type PilotStep = 'pilot' | 'style' | 'motivation' | 'features' | 'discovery' | 'hook' | 'optin'

export interface ChoiceOption {
  key: string
  label: string
  emoji?: string
}

// Answer options for the questionnaire. The keys are what the backend stores and validates
// (Domain/Common/PlayerInsightOptions.cs); the labels are only for display, here and in the
// admin Player Insights report.
export const INSIGHT_OPTIONS = {
  ageRange: [
    { key: '18-20', label: '18–20' },
    { key: '21-24', label: '21–24' },
    { key: '25-29', label: '25–29' },
    { key: '30-39', label: '30–39' },
    { key: '40+', label: '40+' },
    { key: 'prefer-not', label: 'Prefer not to say' },
  ],
  gender: [
    { key: 'woman', label: 'Woman' },
    { key: 'man', label: 'Man' },
    { key: 'non-binary', label: 'Non-binary' },
    { key: 'self-describe', label: 'Prefer to self-describe' },
    { key: 'prefer-not', label: 'Prefer not to say' },
  ],
  occupation: [
    { key: 'student', label: 'Student', emoji: '🎓' },
    { key: 'employed', label: 'Employed', emoji: '💼' },
    { key: 'self-employed', label: 'Self-employed', emoji: '🚀' },
    { key: 'looking', label: 'Currently looking for work', emoji: '🔍' },
    { key: 'other', label: 'Other', emoji: '✨' },
    { key: 'prefer-not', label: 'Prefer not to say', emoji: '🤐' },
  ],
  playFrequency: [
    { key: 'daily', label: 'Every day' },
    { key: 'several-weekly', label: 'Several times a week' },
    { key: 'weekly', label: 'About once a week' },
    { key: 'occasionally', label: 'Occasionally' },
    { key: 'rarely', label: 'Rarely' },
  ],
  devices: [
    { key: 'smartphone', label: 'Smartphone', emoji: '📱' },
    { key: 'laptop', label: 'Laptop', emoji: '💻' },
    { key: 'desktop', label: 'Desktop', emoji: '🖥️' },
    { key: 'tablet', label: 'Tablet', emoji: '📲' },
    { key: 'console', label: 'Console', emoji: '🎮' },
  ],
  sessionLength: [
    { key: 'under-10', label: 'Under 10 minutes' },
    { key: '10-30', label: '10–30 minutes' },
    { key: '30-60', label: '30–60 minutes' },
    { key: '60-plus', label: 'More than an hour' },
  ],
  gameGenres: [
    { key: 'arcade', label: 'Arcade', emoji: '👾' },
    { key: 'racing', label: 'Racing', emoji: '🏎️' },
    { key: 'strategy', label: 'Strategy', emoji: '♟️' },
    { key: 'simulation', label: 'Simulation', emoji: '🛩️' },
    { key: 'multiplayer', label: 'Multiplayer', emoji: '👥' },
    { key: 'competitive', label: 'Competitive games', emoji: '🏆' },
    { key: 'casual', label: 'Casual games', emoji: '☕' },
    { key: 'mobile', label: 'Mobile games', emoji: '📱' },
    { key: 'casino-style', label: 'Casino-style games', emoji: '🎰' },
    { key: 'other', label: 'Other', emoji: '✨' },
  ],
  motivations: [
    { key: 'competition', label: 'Competition', emoji: '🏁' },
    { key: 'rewards', label: 'Winning rewards', emoji: '💰' },
    { key: 'high-scores', label: 'High scores', emoji: '📈' },
    { key: 'friends', label: 'Playing with friends', emoji: '🤝' },
    { key: 'strategy', label: 'Strategy', emoji: '🧠' },
    { key: 'customisation', label: 'Customisation', emoji: '🎨' },
    { key: 'unlocking', label: 'Unlocking things', emoji: '🔓' },
    { key: 'relaxing', label: 'Relaxing', emoji: '😌' },
    { key: 'quick-sessions', label: 'Short, quick sessions', emoji: '⚡' },
    { key: 'novelty', label: 'Trying something new', emoji: '🌟' },
    { key: 'other', label: 'Other', emoji: '✨' },
  ],
  triedBecause: [
    { key: 'curious', label: 'I was curious', emoji: '🤔' },
    { key: 'friend', label: 'A friend recommended it', emoji: '🗣️' },
    { key: 'social-media', label: 'I saw it on social media', emoji: '📲' },
    { key: 'visuals', label: 'I liked the visuals', emoji: '🌈' },
    { key: 'aviation-theme', label: 'I liked the plane/aviation theme', emoji: '✈️' },
    { key: 'rewards', label: 'I liked the rewards', emoji: '🎁' },
    { key: 'compete', label: 'I wanted to compete', emoji: '🏆' },
    { key: 'play-with-others', label: 'I wanted to play with other people', emoji: '👥' },
    { key: 'other', label: 'Other', emoji: '✨' },
  ],
  favouriteFeatures: [
    { key: 'flying', label: 'Flying', emoji: '✈️' },
    { key: 'lobbies', label: 'Multiplayer lobbies', emoji: '👥' },
    { key: 'plane-skins', label: 'Plane skins', emoji: '🛩️' },
    { key: 'customisation', label: 'Customisation', emoji: '🎨' },
    { key: 'leaderboards', label: 'Leaderboards', emoji: '🏆' },
    { key: 'rewards', label: 'Credits/rewards', emoji: '💰' },
    { key: 'spin-wheel', label: 'Spin the Wheel', emoji: '🎡' },
    { key: 'challenges', label: 'Challenges', emoji: '🎯' },
    { key: 'social', label: 'Social features', emoji: '💬' },
    { key: 'visual-style', label: 'Visual style', emoji: '🌆' },
    { key: 'other', label: 'Other', emoji: '✨' },
  ],
  wantNext: [
    { key: 'plane-skins', label: 'More plane skins', emoji: '🛩️' },
    { key: 'environments', label: 'More environments', emoji: '🌄' },
    { key: 'multiplayer', label: 'More multiplayer features', emoji: '👥' },
    { key: 'competitions', label: 'More competitions', emoji: '🏁' },
    { key: 'challenges', label: 'More challenges', emoji: '🎯' },
    { key: 'rewards', label: 'More rewards', emoji: '🎁' },
    { key: 'customisation', label: 'More customisation', emoji: '🎨' },
    { key: 'social', label: 'More social features', emoji: '💬' },
    { key: 'game-modes', label: 'New game modes', emoji: '🕹️' },
    { key: 'other', label: 'Other', emoji: '✨' },
  ],
  discoverySource: [
    { key: 'tiktok', label: 'TikTok', emoji: '🎵' },
    { key: 'instagram', label: 'Instagram', emoji: '📸' },
    { key: 'youtube', label: 'YouTube', emoji: '▶️' },
    { key: 'facebook', label: 'Facebook', emoji: '👍' },
    { key: 'discord', label: 'Discord', emoji: '🎧' },
    { key: 'friend', label: 'A friend', emoji: '🤝' },
    { key: 'university', label: 'University', emoji: '🎓' },
    { key: 'web-search', label: 'Website/search', emoji: '🔎' },
    { key: 'other', label: 'Other', emoji: '✨' },
  ],
  socialPlatforms: [
    { key: 'tiktok', label: 'TikTok', emoji: '🎵' },
    { key: 'instagram', label: 'Instagram', emoji: '📸' },
    { key: 'youtube', label: 'YouTube', emoji: '▶️' },
    { key: 'facebook', label: 'Facebook', emoji: '👍' },
    { key: 'discord', label: 'Discord', emoji: '🎧' },
    { key: 'x', label: 'X', emoji: '✖️' },
    { key: 'other', label: 'Other', emoji: '✨' },
  ],
  scrollHooks: [
    { key: 'plane-skin', label: 'An awesome plane/skin', emoji: '🛩️' },
    { key: 'competition', label: 'A competition', emoji: '🏆' },
    { key: 'rewards', label: 'Rewards/credits', emoji: '💰' },
    { key: 'multiplayer', label: 'Multiplayer action', emoji: '👥' },
    { key: 'funny', label: 'Funny content', emoji: '😂' },
    { key: 'update', label: 'A new update', emoji: '🆕' },
    { key: 'limited-event', label: 'A limited-time event', emoji: '⏳' },
    { key: 'visuals', label: 'Cool visuals', emoji: '🌈' },
    { key: 'friend-playing', label: 'A friend playing', emoji: '🙌' },
    { key: 'other', label: 'Other', emoji: '✨' },
  ],
  recommend: [
    { key: 'definitely', label: 'Definitely', emoji: '🙌' },
    { key: 'maybe', label: 'Maybe', emoji: '🤔' },
    { key: 'probably-not', label: 'Probably not', emoji: '😕' },
    { key: 'prefer-not', label: 'Prefer not to say', emoji: '🤐' },
  ],
} satisfies Record<string, ChoiceOption[]>

export type InsightOptionGroup = keyof typeof INSIGHT_OPTIONS

/** Display label for a stored answer key (falls back to the key itself). */
export function insightLabel(group: InsightOptionGroup, key: string): string {
  return (INSIGHT_OPTIONS[group] as ChoiceOption[]).find((o) => o.key === key)?.label ?? key
}

/** GET /api/feedback/status, including the cash-out based schedule fields. */
export interface PlayerFeedbackStatus extends FeedbackStatus {
  /** True when a submission right now would be rewarded. Older servers omit it. */
  rewardAvailable?: boolean
  cashOuts?: number
  nextPromptAtCashOut?: number
}
