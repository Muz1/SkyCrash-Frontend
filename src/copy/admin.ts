// Admin console copy. Short headers, numbers first; the definitions sit behind an ⓘ.
// Re-exported from en.ts as `en.admin` (kept in its own file so merging with other copy is a one-liner).

export const admin = {
  credits: {
    note: 'All amounts are in rands (R).',
  },
  testToggle: {
    label: 'Include test accounts',
    hint: 'Test accounts are left out of every report unless this is on.',
  },
  revenue: {
    title: 'Revenue & Profit',
    eyebrow: 'Money',
    subtitle: 'What players wager, win and what the house keeps. All amounts in rands (R).',
    kpi: {
      ggr: { label: 'Gross gaming revenue (GGR)', info: 'Total wagered − total payouts. Split into stakes paid with bought credits and with bonus credits.' },
      expected: {
        label: 'Expected profit',
        info: 'What the house edge predicts the house keeps: wagered × edge. The gap to actual GGR is measured in standard deviations of normal luck (z).',
      },
      rtp: { label: 'Actual return to player (RTP)', info: 'Payouts ÷ wagered. The theoretical return to player is 100% − house edge. Small samples swing far from it.' },
      bonusCost: { label: 'Bonus cost', info: 'Free credits granted in the range (wheel, achievements, challenges, feedback, admin top-ups), by source. Forfeited bonus expired unwagered.' },
      ngr: { label: 'Net gaming revenue (NGR)', info: 'Gross gaming revenue − bonus cost.' },
      gap: { label: 'Gap to expected', info: 'Actual gross gaming revenue − expected. Negative = players were luckier than average.' },
      sd: { label: 'Standard deviation', info: 'How far profit normally swings from expected for these exact bets (their stakes and cash-out points). Big stakes and high cash-outs make it larger.' },
      z: { label: 'z-score', info: 'How many normal swings (standard deviations) the result is from expected. Between −2 and +2 is ordinary luck.' },
      purchases: { label: 'Purchases', info: 'Money paid through PayFast for credit packs.' },
      wagered: { label: 'Wagered', info: 'Sum of stakes on resolved bets, split into cash and bonus credits.' },
      payouts: { label: 'Payouts', info: 'Paid to players who cashed out (stake × cash-out multiplier).' },
    },
    luck: { title: 'Statistics: is this profit just luck?', caption: 'Compares actual profit with what the house edge predicts' },
    largestWins: { title: 'Largest wins', caption: 'Top 10 payouts in the range' },
    capEvents: { title: 'Cap events', caption: 'Bets cashed out by a risk cap', empty: 'No caps fired in this range.' },
    reconciliation: { title: 'Reconciliation', caption: 'Do the books balance?', run: 'Run checks', rerun: 'Run again' },
    annotationLegend: 'Marked day: a cap fired or one win paid more than half the day’s wagers. Hover the marker.',
  },
  players: {
    blockTitle: 'Block player',
    blockSub: 'Every block cites a rule. The player sees the rule, its summary and the end date.',
    unblockTitle: 'Unblock player',
    unblockSub: 'Lifts every active block. The reason goes into the audit log.',
    durationHint: 'Empty = the rule’s default (permanent if it has none).',
  },
  rules: {
    title: 'Account Rules',
    eyebrow: 'Accounts',
    subtitle: 'The rule set players agree to, every sanction, appeals and the audit log.',
    changeNoteRequired: 'A change note is required: it is published with the new version.',
  },
  feedback: {
    ratingOnly: 'Rating only, no comments.',
    concern: 'Responsible-gambling concern',
    repeat: 'Repeat within 24h',
    concernsOnly: 'Concerns only',
    groupByPlayer: 'Group by player',
  },
  health: {
    title: 'System Health',
    eyebrow: 'Operations',
    subtitle: 'Is everything up? Check this before a demo.',
    lossBanner: 'Daily loss limit reached: new bets are paused for today.',
  },
  ai: {
    unavailable: 'AI unavailable — showing rule-based insights',
    unavailableHint: 'No Gemini key is set (or the AI did not answer), so these come from the built-in rules. Nothing is broken.',
  },
} as const
