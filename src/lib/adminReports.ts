// One report per admin page, built from the data that page already has loaded.
// Every section carries a plain-language description so the PDF reads on its own.
import { formatDateTime, type ReportDefinition } from '@/lib/pdfReport'
import { count, cr, longDate, mult, pct2, zar } from '@/lib/reportFormat'
import type { RevenueReport } from '@/types/insights'
import type {
  AdminPlayerSummary,
  BetHistoryEntry,
  GameSettings,
  OperationsMetrics,
  RoundReportResponse,
  RtpSummary,
  VolatilitySummary,
} from '@/types'

export function buildPlayersReport(
  players: AdminPlayerSummary[],
  filters: { search: string; blocked: string; role: string; sortBy: string; sortDir: string },
): ReportDefinition {
  const blocked = players.filter((p) => p.isBlocked).length
  const admins = players.filter((p) => p.isAdmin).length
  const totalBalance = players.reduce((sum, p) => sum + p.creditBalance, 0)

  return {
    title: 'Player Management Report',
    fileName: 'skycrash-players',
    summary:
      'A snapshot of the player accounts that matched the filters on the Player Management page when this report was exported. ' +
      'Use it to review account status, roles and credit balances.',
    sections: [
      {
        kind: 'metrics',
        heading: 'Filters Applied',
        description: 'The search and filter settings in effect when the report was generated. Only accounts matching these appear below.',
        rows: [
          ['Search term', filters.search || 'None'],
          ['Account status', filters.blocked],
          ['Role', filters.role],
          ['Sorted by', `${filters.sortBy} (${filters.sortDir === 'asc' ? 'ascending' : 'descending'})`],
        ],
      },
      {
        kind: 'metrics',
        heading: 'Summary',
        description:
          'Totals across the listed accounts. "Blocked" accounts cannot log in or play. "Total credit balance" is the combined credits currently held by these players.',
        rows: [
          ['Accounts listed', players.length],
          ['Active accounts', players.length - blocked],
          ['Blocked accounts', blocked],
          ['Admins', admins],
          ['Total credit balance', totalBalance.toFixed(2)],
        ],
      },
      {
        kind: 'table',
        heading: 'Accounts',
        description:
          'Each row is one player account. "Balance" is the player\'s current credits; "Last Seen" is the last time the player was active in the game.',
        columns: ['Username', 'Email', 'Balance', 'Role', 'Status', 'Email verified', 'Test', 'Member Since', 'Last Seen'],
        rows: players.map((p) => [
          p.username,
          p.email,
          p.creditBalance.toFixed(2),
          p.isAdmin ? 'Admin' : 'Player',
          p.isBlocked ? 'Blocked' : 'Active',
          p.emailVerified ? 'Yes' : 'No',
          p.isTestAccount ? 'Test' : '',
          formatDateTime(p.memberSinceUtc),
          formatDateTime(p.lastSeenUtc),
        ]),
        emptyText: 'No accounts matched the filters.',
      },
    ],
  }
}

export function buildReportsPageReport(
  roundsReport: RoundReportResponse,
  selected: { player: AdminPlayerSummary; bets: BetHistoryEntry[] } | null,
): ReportDefinition {
  const rounds = roundsReport.rounds
  const wagered = rounds.reduce((sum, r) => sum + r.totalWagered, 0)
  const paidOut = rounds.reduce((sum, r) => sum + r.totalPaidOut, 0)
  const totalPages = Math.max(1, Math.ceil(roundsReport.totalCount / roundsReport.pageSize))

  const report: ReportDefinition = {
    title: 'Rounds & Player Activity Report',
    fileName: 'skycrash-rounds',
    summary:
      'Round-by-round results and betting activity as shown on the Reports page. ' +
      `This export covers page ${roundsReport.page} of ${totalPages} of the rounds list (${roundsReport.totalCount} rounds in total), most recent first.`,
    sections: [
      {
        kind: 'metrics',
        heading: 'Rounds Summary',
        description:
          '"Wagered" is the total credits players bet across these rounds; "Paid Out" is the total returned to players who cashed out in time. ' +
          'The house result is wagered minus paid out — a positive value means the house won overall on these rounds.',
        rows: [
          ['Rounds in this export', rounds.length],
          ['Total bets placed', rounds.reduce((sum, r) => sum + r.betCount, 0)],
          ['Total wagered', wagered.toFixed(2)],
          ['Total paid out', paidOut.toFixed(2)],
          ['House result', (wagered - paidOut).toFixed(2)],
        ],
      },
      {
        kind: 'table',
        heading: 'Rounds',
        description:
          'Each row is one round. "Crash" is the multiplier at which the plane crashed — players who had not cashed out by then lost their bet.',
        columns: ['Round', 'Status', 'Crash', 'Bets', 'Wagered', 'Paid Out', 'Created'],
        rows: rounds.map((r) => [
          `#${r.roundNumber}`,
          r.status,
          r.crashMultiplier != null ? `${r.crashMultiplier.toFixed(2)}x` : null,
          r.betCount,
          r.totalWagered,
          r.totalPaidOut,
          formatDateTime(r.createdAtUtc),
        ]),
        emptyText: 'No rounds recorded.',
      },
    ],
  }

  if (selected) {
    const { player, bets } = selected
    const staked = bets.reduce((sum, b) => sum + b.amount, 0)
    const returned = bets.reduce((sum, b) => sum + (b.payout ?? 0), 0)
    report.sections.push(
      {
        kind: 'metrics',
        heading: `Player Activity — ${player.username}`,
        description:
          'Betting totals for the player looked up on the Reports page. "Net result" is what the player won or lost overall on these bets (payouts minus stakes).',
        rows: [
          ['Player', `${player.username} (${player.email})`],
          ['Bets listed', bets.length],
          ['Total staked', staked.toFixed(2)],
          ['Total paid out', returned.toFixed(2)],
          ['Net result', (returned - staked).toFixed(2)],
        ],
      },
      {
        kind: 'table',
        heading: 'Bet History',
        description:
          'Each row is one bet. "Cash Out" is the multiplier the player cashed out at (shown as "—" if they did not cash out before the crash); "Payout" is what they received.',
        columns: ['Round', 'Amount', 'Status', 'Cash Out', 'Payout', 'Placed'],
        rows: bets.map((b) => [
          `#${b.roundNumber}`,
          b.amount,
          b.status,
          b.cashOutMultiplier != null ? `${b.cashOutMultiplier.toFixed(2)}x` : null,
          b.payout,
          formatDateTime(b.placedAtUtc),
        ]),
        emptyText: 'This player has no bets.',
      },
    )
  }

  return report
}

export function buildRtpReport(summary: RtpSummary, settings: GameSettings | null): ReportDefinition {
  const sections: ReportDefinition['sections'] = [
    {
      kind: 'metrics',
      heading: 'House Edge Setting',
      description:
        'The house edge is the share of every bet the game keeps on average over the long run. Theoretical RTP (Return to Player) is 100% minus the house edge — the payout rate the maths guarantees over a very large number of rounds.',
      rows: [
        ['House edge', `${summary.houseEdgePercentage}%`],
        ['Theoretical RTP', `${summary.theoreticalRtpPercentage}%`],
        ['Last changed by', settings?.updatedByUsername ?? '—'],
        ['Last changed on', settings?.updatedByUsername ? formatDateTime(settings.updatedAtUtc) : '—'],
      ],
    },
  ]

  for (const [heading, stats, window] of [
    ['Actual RTP — All Time', summary.allTime, 'since the game launched'],
    ['Actual RTP — Last 24 Hours', summary.last24Hours, 'in the last 24 hours'],
  ] as const) {
    sections.push({
      kind: 'metrics',
      heading,
      description:
        `The payout rate actually delivered to players ${window}: total paid out divided by total wagered. ` +
        'Over enough bets this should settle close to the theoretical RTP; short windows can swing noticeably either way.',
      rows: [
        ['Actual RTP', `${stats.actualRtpPercentage}%`],
        ['Difference from theoretical', `${(stats.actualRtpPercentage - summary.theoreticalRtpPercentage).toFixed(2)} percentage points`],
        ['Bets resolved', stats.betsResolved],
        ['Total wagered', stats.totalWagered],
        ['Total paid out', stats.totalPaidOut],
      ],
    })
  }

  return {
    title: 'RTP & House Edge Report',
    fileName: 'skycrash-rtp',
    summary:
      'Compares the configured house edge with the return actually paid to players. A large, persistent gap between actual and theoretical RTP can indicate unusual player behaviour or a problem worth investigating.',
    sections,
  }
}

export function buildOperationsReport(metrics: OperationsMetrics): ReportDefinition {
  return {
    title: 'Operations Snapshot',
    fileName: 'skycrash-operations',
    summary:
      'A point-in-time snapshot of the live game, captured at the moment this report was exported. The Operations page refreshes every few seconds, so these figures reflect a single instant.',
    sections: [
      {
        kind: 'metrics',
        heading: 'Live Game State',
        description: 'What was happening in the game at the time of export: players connected, and the state of the round in progress.',
        rows: [
          ['Online players', metrics.onlinePlayers],
          ['Current round', metrics.currentRoundNumber != null ? `#${metrics.currentRoundNumber}` : '—'],
          ['Round status', metrics.currentRoundStatus],
          ['Active bets on current round', metrics.activeBetsThisRound],
        ],
      },
      {
        kind: 'metrics',
        heading: 'Last Hour',
        description: 'Activity over the 60 minutes before export — useful for gauging how busy the game is.',
        rows: [
          ['Rounds played', metrics.roundsLastHour],
          ['Total wagered', metrics.totalWageredLastHour],
        ],
      },
    ],
  }
}

export function buildVolatilityReport(summary: VolatilitySummary): ReportDefinition {
  return {
    title: 'Volatility Report',
    fileName: 'skycrash-volatility',
    summary:
      `Statistics on where the last ${summary.sampleSize} crashed rounds actually crashed. ` +
      'Use this to sanity-check that the live game behaves as the configured house edge predicts and to spot anomalies.',
    sections: [
      {
        kind: 'metrics',
        heading: 'Crash Point Statistics',
        description:
          'The "crash point" is the multiplier at which a round ended. The mean is pulled up by rare very high crashes, so the median (the middle value) better reflects a typical round. ' +
          'Standard deviation measures how spread out crash points are. P10 means 10% of rounds crashed at or below that value; P90 means 90% did.',
        rows: [
          ['Rounds sampled', summary.sampleSize],
          ['Mean crash point', `${summary.meanCrashPoint}x`],
          ['Median crash point', `${summary.medianCrashPoint}x`],
          ['Standard deviation', summary.standardDeviation],
          ['P10 / P90', `${summary.p10}x / ${summary.p90}x`],
          ['P25 / P75', `${summary.p25}x / ${summary.p75}x`],
        ],
      },
      {
        kind: 'table',
        heading: 'Crash Point Distribution',
        description:
          'How many sampled rounds crashed within each multiplier range. In a fair crash game most rounds end at low multipliers, with the share falling steadily as the range increases.',
        columns: ['Range', 'Rounds', 'Share of Sample'],
        rows: summary.histogram.map((b) => [b.label, b.count, `${b.percentage}%`]),
        emptyText: 'No crashed rounds in the sample.',
      },
    ],
  }
}

// ---------- Revenue & Profit (structured PDF, built from the loaded report) ----------

const settledLabel: Record<string, string> = {
  Manual: 'Manual',
  AutoTarget: 'Auto target',
  ProfitCap: 'Profit cap',
  MaxMultiplier: 'Max multiplier',
  RoundLiability: 'Round liability',
}
export const settledByLabel = (s: string) => settledLabel[s] ?? s.replace(/([a-z])([A-Z])/g, '$1 $2')

export function buildRevenueReport(r: RevenueReport): ReportDefinition {
  const ggr = r.ggr ?? r.grossRevenue
  const ngr = r.ngr ?? r.netProfit
  const bonusCost = r.bonusCost ?? r.freeCreditsGiven
  const bySource = r.bonusCostBySource ?? r.freeCreditsBreakdown
  const range = `${longDate(r.range.from)} – ${longDate(r.range.to)} (${r.range.days} days, UTC)`
  return {
    title: 'Revenue & Profit Report',
    fileName: 'skycrash-revenue',
    summary:
      `${range}. ${r.includesTestAccounts ? 'Test accounts included.' : 'Test accounts excluded.'} ` +
      'All amounts are credits except Purchases, which are rands. Credits are play money; only PayFast purchases are rands. ' +
      (r.gapExplanation ? r.gapExplanation : ''),
    sections: [
      {
        kind: 'metrics',
        heading: 'Headline figures',
        description:
          'GGR = wagered − payouts. NGR = GGR − bonus cost. Hold % = GGR ÷ wagered. NGR margin = NGR ÷ wagered. Expected from house edge = wagered × edge.',
        rows: [
          ['GGR (credits)', cr(ggr)],
          ['GGR on cash stakes', cr(r.ggrCash)],
          ['GGR on bonus stakes', cr(r.ggrBonus)],
          ['Expected from house edge', cr(r.expectedGrossRevenue)],
          ['Gap to expected', cr(r.gapToExpected)],
          ['Gap in std devs (z)', r.gapZScore == null ? '—' : r.gapZScore.toFixed(2)],
          ['Std dev of GGR', cr(r.ggrStandardDeviation)],
          ['Actual RTP', pct2(r.actualRtpPercentage)],
          ['Theoretical RTP', pct2(r.theoreticalRtpPercentage ?? 100 - r.houseEdgePercentage)],
          ['Bonus cost', cr(bonusCost)],
          ['Bonus forfeited', cr(r.bonusForfeited)],
          ['NGR (credits)', cr(ngr)],
          ['Hold %', pct2(r.holdPercentage)],
          ['NGR margin', pct2(r.ngrMarginPercentage ?? r.profitMarginPercentage)],
          ['Wagered', cr(r.totalWagered)],
          ['Payouts', cr(r.totalPayouts)],
          ['Resolved bets', count(r.betCount)],
          ['Average bet', cr(r.averageBet)],
          ['Purchases (ZAR)', zar(r.purchaseRevenueZar)],
          ['Purchase count', count(r.purchaseCount)],
          ['Credits sold', cr(r.creditsSold)],
        ],
      },
      ...(r.sampleSizeNote ? [{ kind: 'text' as const, heading: 'Sample size', description: r.sampleSizeNote }] : []),
      {
        kind: 'table',
        heading: 'Bonus cost by source',
        description: 'Free credits granted in the range, by where they came from (credits).',
        columns: ['Source', 'Credits'],
        rows: bySource.map((b) => [b.label, cr(b.amount)]),
        emptyText: 'No bonus credits were granted in this range.',
      },
      {
        kind: 'table',
        heading: 'Largest wins',
        description: 'The ten biggest payouts. "Settled by" says whether the player cashed out or a cap / auto target did. TEST marks a test account.',
        columns: ['Player', 'Round', 'Stake', 'Cash-out', 'Crash', 'Payout', 'Settled by', 'When'],
        rows: (r.largestWins ?? []).map((w) => [
          `${w.username}${w.isTestAccount ? ' (TEST)' : ''}`,
          `#${w.roundNumber}`,
          cr(w.stake),
          mult(w.cashOutMultiplier),
          mult(w.crashMultiplier),
          cr(w.payout),
          settledByLabel(w.settledBy),
          formatDateTime(w.placedAtUtc),
        ]),
        emptyText: 'No winning bets in this range.',
      },
      {
        kind: 'table',
        heading: 'Cap events',
        description: 'Bets cashed out by a risk cap: profit cap (10 000 max profit), max multiplier (100x) or round liability.',
        columns: ['Reason', 'Bets', 'Payouts'],
        rows: (r.capEvents ?? []).map((c) => [settledByLabel(c.reason), count(c.count), cr(c.payouts)]),
        emptyText: 'No caps fired in this range.',
      },
      {
        kind: 'table',
        heading: 'Daily breakdown',
        description: 'Per UTC day. A note marks days where a cap fired or one win paid more than half the day’s wagers.',
        columns: ['Date', 'Wagered', 'Payouts', 'GGR', 'NGR', 'Purchases (R)', 'Caps', 'Note'],
        rows: r.daily.map((d) => [
          longDate(d.date),
          cr(d.wagered),
          cr(d.payouts),
          cr(d.ggr ?? d.grossRevenue),
          cr(d.ngr ?? d.netProfit),
          zar(d.purchaseRevenueZar),
          count(d.capEvents),
          d.annotation ?? '',
        ]),
      },
    ],
  }
}
