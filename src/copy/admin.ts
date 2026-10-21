// Admin console copy. Short headers, numbers first; the definitions sit behind an ⓘ.
// Re-exported from en.ts as `en.admin` (kept in its own file so merging with other copy is a one-liner).

export const admin = {
  credits: {
    note: 'Credits are play money; only PayFast purchases are rands.',
  },
  testToggle: {
    label: 'Include test accounts',
    hint: 'Test accounts are left out of every report unless this is on.',
  },
  revenue: {
    title: 'Revenue & Profit',
    eyebrow: 'Money',
    subtitle: 'What players wager, win and what the house keeps. Credits are play money; only PayFast purchases are rands.',
    kpi: {
      ggr: { label: 'GGR', info: 'Gross gaming revenue: total wagered − total payouts, in credits. Split into GGR on cash-credit stakes and on bonus-credit stakes.' },
      expected: {
        label: 'Expected from house edge',
        info: 'What the house edge predicts the house keeps: wagered × edge. The gap to actual GGR is measured in standard deviations of normal luck (z).',
      },
      rtp: { label: 'Actual RTP', info: 'Return to player: payouts ÷ wagered. The theoretical RTP is 100% − house edge. Small samples swing far from it.' },
      bonusCost: { label: 'Bonus cost', info: 'Free credits granted in the range (wheel, achievements, challenges, feedback, admin top-ups), by source. Forfeited bonus expired unwagered.' },
      ngr: { label: 'NGR', info: 'Net gaming revenue: GGR − bonus cost.' },
      hold: { label: 'Hold %', info: 'GGR ÷ wagered. Over many bets this moves towards the house edge.' },
      ngrMargin: { label: 'NGR margin', info: 'NGR ÷ wagered.' },
      purchases: { label: 'Purchases', info: 'Real money from PayFast credit-pack purchases, in rands. The only figure on this page in R.' },
      wagered: { label: 'Wagered', info: 'Sum of stakes on resolved bets, split into cash and bonus credits.' },
      payouts: { label: 'Payouts', info: 'Credits paid to players who cashed out (stake × cash-out multiplier).' },
      avgBet: { label: 'Avg bet', info: 'Total wagered ÷ resolved bets.' },
    },
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
