import { describe, expect, it, vi } from 'vitest'
import { buildFeedbackReport, isRatingOnly } from './feedbackReport'
import { FEEDBACK_EXPORT_PAGE_SIZE, getAllFeedbackSubmissions } from '@/services/adminAnalyticsService'
import type { FeedbackSubmissionFilters, FeedbackSubmissionItem, FeedbackSubmissionsPage, ReportQuery } from '@/types/insights'

vi.mock('@/services/api', () => ({ default: { get: vi.fn<(...args: unknown[]) => Promise<unknown>>() } }))

const item = (i: number, over: Partial<FeedbackSubmissionItem> = {}): FeedbackSubmissionItem => ({
  feedbackId: `f-${i}`,
  playerId: `p-${i % 7}`,
  username: `pilot${i % 7}`,
  createdAtUtc: '2026-10-15T12:00:00Z',
  rating: (i % 5) + 1,
  sentiment: 'Neutral',
  categories: [],
  tags: [],
  likedText: null,
  improveText: null,
  additionalComment: null,
  rewardReceived: false,
  creditsAwarded: 0,
  roundsPlayedAtSubmit: 5,
  cashOutsAtSubmit: 2,
  roundsPlayedNow: 9,
  ...over,
})

/** A fake API: honours page/pageSize (capped at 1000 like the backend) over `total` rows. */
function fakeApi(total: number) {
  const all = Array.from({ length: total }, (_, i) => item(i, i === 3 ? { isConcern: true, concernPhrases: ['addiction'] } : {}))
  const calls: FeedbackSubmissionFilters[] = []
  const fetchPage = async (_q: ReportQuery, f: FeedbackSubmissionFilters): Promise<FeedbackSubmissionsPage> => {
    calls.push(f)
    const size = Math.min(f.pageSize ?? 20, 1000)
    const page = f.page ?? 1
    return { page, pageSize: size, totalCount: total, items: all.slice((page - 1) * size, page * size) }
  }
  return { fetchPage, calls }
}

const q: ReportQuery = { range: 'month' }

describe('feedback export', () => {
  it('asks for the API maximum page size, not the 20 on screen', async () => {
    const { fetchPage, calls } = fakeApi(45)
    await getAllFeedbackSubmissions(q, { page: 3, rating: 4 }, fetchPage)
    expect(calls[0]).toMatchObject({ page: 1, pageSize: FEEDBACK_EXPORT_PAGE_SIZE, rating: 4 })
  })

  it.each([0, 1, 20, 21, 999, 1000, 1001, 2345])('exports exactly totalCount rows (%i submissions)', async (total) => {
    const { fetchPage } = fakeApi(total)
    const page = await getAllFeedbackSubmissions(q, {}, fetchPage)
    expect(page.items).toHaveLength(page.totalCount)
    const table = buildFeedbackReport(page).sections.find((s) => s.kind === 'table' && s.heading === 'All submissions')
    if (table?.kind !== 'table') throw new Error('no submissions table')
    expect(table.rows).toHaveLength(page.totalCount)
  })

  it('lists flagged concerns in their own section', async () => {
    const { fetchPage } = fakeApi(10)
    const report = buildFeedbackReport(await getAllFeedbackSubmissions(q, {}, fetchPage))
    const concerns = report.sections.find((s) => s.heading === 'Flagged concerns')
    if (concerns?.kind !== 'table') throw new Error('no concerns table')
    expect(concerns.rows).toHaveLength(1)
    expect(concerns.rows[0]).toContain('addiction')
  })

  it('says "rating only" only when there is no text and no tags', () => {
    expect(isRatingOnly(item(1))).toBe(true)
    expect(isRatingOnly(item(1, { tags: ['Skies'], categories: ['New skies'] }))).toBe(false)
    expect(isRatingOnly(item(1, { improveText: 'More planes' }))).toBe(false)
  })
})
