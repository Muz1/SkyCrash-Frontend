/**
 * Copy for the onboarding / polish pass: tutorial, landing page, hangar, badges, accessibility
 * and the feedback pop-up. Kept in its own file (and its own top-level sections) so it merges
 * cleanly with the other areas' copy; src/copy/en.ts can spread it in.
 * Keep it short: buttons 1–2 words, tutorial steps ≤ 10 words, helpers ≤ 8, toasts ≤ 6.
 */
export const polishCopy = {
  tutorial: {
    kicker: 'How to play',
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    done: "Let's fly",
    replay: 'How to play',
    steps: {
      credits: { title: 'Your credits', body: 'You start with free credits. No real money.' },
      bet: { title: 'Place a bet', body: 'Pick an amount, then tap BET before take-off.' },
      climb: { title: 'Watch it climb', body: 'The multiplier rises the longer the plane flies.' },
      cashout: { title: 'Cash out', body: 'Tap CASH OUT before the plane crashes.' },
      crash: { title: 'Crash = lost bet', body: 'Crash before cashing out and the bet is gone.' },
    },
    house: 'Every target returns 99% on average.',
  },

  landing: {
    tagline: 'Bet. Watch it climb. Cash out in time.',
    howItWorks: 'How it works',
    fullTutorial: 'Full tutorial',
  },

  hangar: {
    newTag: 'New',
    tapAgain: 'Tap again to equip',
    equip: 'Equip',
    equipped: 'Equipped',
    proceed: 'Proceed to game',
    equippedToast: (name: string) => `${name} equipped`,
  },

  badges: {
    unknownName: 'Mystery Badge',
  },

  a11y: {
    textSize: 'Text size',
    textSizeHint: 'Bigger text on every screen',
  },

  feedback: {
    dontAsk: "Don't ask again",
  },
} as const

export default polishCopy
