// Feedback Submissions PDF, generated from data (jsPDF + jspdf-autotable via exportReportPdf),
// never a screenshot. A summary header (average rating, count by rating, top "wants us to add"
// tags, flagged concerns), then one wrapped table row per submission across as many pages as
// needed. Every submission matching the filters is included, not just the page on screen.
import type { ReportDefinition } from './pdfReport'
import { count, dateTime, longDate } from './reportFormat'
import type { FeedbackSubmissionItem, FeedbackSubmissionsPage, FeedbackSubmissionsSummary, ReportRangeInfo } from '@/types/insights'

export const hasWrittenFeedback = (f: FeedbackSubmissionItem) =>
  !!(f.likedText?.trim() || f.improveText?.trim() || f.additionalComment?.trim())

/** "Rating only, no comments" only when there is no text AND no tags. */
export const isRatingOnly = (f: FeedbackSubmissionItem) => !hasWrittenFeedback(f) && !(f.tags?.length || f.categories.length)

/** Summary from the API, or worked out from the rows for older APIs. */
export function feedbackSummary(page: FeedbackSubmissionsPage): FeedbackSubmissionsSummary {
  if (page.summary) return page.summary
  const items = page.items
  const byRating = [5, 4, 3, 2, 1].map((n) => ({ label: `${n}`, count: items.filter((f) => f.rating === n).length }))
  const tags = new Map<string, number>()
  items.forEach((f) => f.categories.forEach((c) => tags.set(c, (tags.get(c) ?? 0) + 1)))
  return {
    averageRating: items.length ? items.reduce((s, f) => s + f.rating, 0) / items.length : 0,
    countByRating: byRating,
    topRequestedTags: [...tags].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, c]) => ({ label, count: c })),
    concernCount: items.filter((f) => f.isConcern).length,
    duplicateCount: items.filter((f) => f.isDuplicate).length,
    playersWithSeveralSubmissions: new Set(items.filter((f) => (f.submissionsByPlayer ?? 1) > 1).map((f) => f.playerId)).size,
  }
}

const stars = (n: number) => `${n}/5`

function comments(f: FeedbackSubmissionItem, recommendLabel: (v: string) => string): string {
  const parts: string[] = []
  if (f.likedText?.trim()) parts.push(`Liked: ${f.likedText.trim()}`)
  if (f.improveText?.trim()) parts.push(`Could improve: ${f.improveText.trim()}`)
  if (f.additionalComment?.trim()) parts.push(`Anything else: ${f.additionalComment.trim()}`)
  if (f.categories.length) parts.push(`Wants us to add: ${f.categories.join(', ')}`)
  if (f.recommend) parts.push(`Would recommend: ${recommendLabel(f.recommend)}`)
  return parts.length ? parts.join('\n') : isRatingOnly(f) ? 'Rating only, no comments.' : '—'
}

function flags(f: FeedbackSubmissionItem): string {
  const out: string[] = []
  if (f.isConcern) out.push(`CONCERN${f.concernPhrases?.length ? `: ${f.concernPhrases.join(', ')}` : ''}`)
  if (f.isDuplicate) out.push('Repeat within 24h')
  if ((f.submissionsByPlayer ?? 1) > 1) out.push(`${f.submissionsByPlayer} from this player`)
  return out.join('\n')
}

export function buildFeedbackReport(
  page: FeedbackSubmissionsPage,
  opts: { range?: ReportRangeInfo | null; filters?: string; recommendLabel?: (v: string) => string } = {},
): ReportDefinition {
  const s = feedbackSummary(page)
  const label = opts.recommendLabel ?? ((v: string) => v)
  const range = opts.range ? `${longDate(opts.range.from)} – ${longDate(opts.range.to)}` : 'Selected dates'
  return {
    title: 'Feedback Submissions',
    fileName: 'skycrash-feedback',
    landscape: true,
    summary:
      `${range}. ${count(page.items.length)} of ${count(page.totalCount)} submissions` +
      (opts.filters ? ` (filters: ${opts.filters})` : '') +
      `. Average rating ${s.averageRating.toFixed(2)}/5. ${count(s.concernCount)} flagged as a responsible-gambling concern (listed first), ` +
      `${count(s.duplicateCount)} repeats within 24h, ${count(s.playersWithSeveralSubmissions)} players with several submissions.`,
    sections: [
      {
        kind: 'metrics',
        heading: 'Summary',
        description: 'Ratings from 1 to 5 stars. Concerns are submissions that mention things like addiction or losing money they can’t afford.',
        rows: [
          ['Submissions', count(page.totalCount)],
          ['Average rating', `${s.averageRating.toFixed(2)} / 5`],
          ...s.countByRating.map((b) => [`${b.label} star${b.label === '1' ? '' : 's'}`, count(b.count)] as [string, string]),
          ['Concerns flagged', count(s.concernCount)],
          ['Repeats within 24h', count(s.duplicateCount)],
        ],
      },
      {
        kind: 'table',
        heading: 'Top "wants us to add" requests',
        description: 'How many submissions asked for each addition.',
        columns: ['Request', 'Submissions'],
        rows: s.topRequestedTags.map((t) => [t.label, count(t.count)]),
        emptyText: 'No requests ticked.',
      },
      {
        kind: 'table',
        heading: 'Flagged concerns',
        description: 'Follow these up first. The phrases are what triggered the flag.',
        columns: ['Date', 'Player', 'Rating', 'Phrases', 'Comment'],
        rows: page.items
          .filter((f) => f.isConcern)
          .map((f) => [dateTime(f.createdAtUtc), f.username, stars(f.rating), (f.concernPhrases ?? []).join(', '), comments(f, label)]),
        emptyText: 'No concerns flagged.',
        widths: { 0: 0.13, 1: 0.12, 2: 0.06, 3: 0.17 },
      },
      {
        kind: 'table',
        heading: 'All submissions',
        description: 'One row per submission, concerns first. Long comments wrap inside their cell.',
        columns: ['Date', 'Player', 'Rating', 'Sentiment', 'Flags', 'Feedback'],
        rows: page.items.map((f) => [dateTime(f.createdAtUtc), f.username, stars(f.rating), f.sentiment, flags(f), comments(f, label)]),
        emptyText: 'No feedback matches these filters.',
        widths: { 0: 0.12, 1: 0.11, 2: 0.06, 3: 0.08, 4: 0.13 },
      },
    ],
  }
}
