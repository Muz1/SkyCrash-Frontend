<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search, ChevronLeft, ChevronRight, Gift, FileDown, Sheet, TriangleAlert } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminPill from '@/components/admin/AdminPill.vue'
import { useReport } from '@/composables/useReport'
import { getAllFeedbackSubmissions, getFeedbackSubmissions, getFeedbackSubmissionsCsv } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { count, cr, dateTime } from '@/lib/reportFormat'
import { buildFeedbackReport, feedbackSummary, isRatingOnly } from '@/lib/feedbackReport'
import { saveBlob, fileDate } from '@/lib/adminDownload'
import type { FeedbackSubmissionFilters, FeedbackSubmissionItem } from '@/types/insights'
import { insightLabel } from '@/types/feedback'
import { admin as copy } from '@/copy/admin'

const CATEGORIES = [
  { id: 'PlaneSkins', label: 'New plane skins' },
  { id: 'Skies', label: 'New skies' },
  { id: 'Multiplayer', label: 'Multiplayer' },
  { id: 'GameModes', label: 'New game modes' },
  { id: 'BetterUI', label: 'Better UI' },
  { id: 'SoundMusic', label: 'Sound/music' },
  { id: 'Rewards', label: 'Rewards' },
  { id: 'Other', label: 'Other' },
]

const filters = ref<FeedbackSubmissionFilters>({ page: 1 })
const search = ref('')
const groupByPlayer = ref(false)
const { query, data, loading, error, reload } = useReport((q) => getFeedbackSubmissions(q, filters.value))

// Typing searches after a short pause; any filter change goes back to page 1.
let timer: ReturnType<typeof setTimeout> | null = null
watch(search, (v) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    filters.value = { ...filters.value, search: v || undefined, page: 1 }
  }, 300)
})
watch(filters, reload, { deep: true })

function setFilter<K extends keyof FeedbackSubmissionFilters>(key: K, value: FeedbackSubmissionFilters[K]) {
  filters.value = { ...filters.value, [key]: value, page: 1 }
}
function goTo(page: number) {
  filters.value = { ...filters.value, page }
}
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)
const sentimentTone = { Positive: 'success', Neutral: 'neutral', Negative: 'danger' } as const

const summary = computed(() => (data.value ? feedbackSummary(data.value) : null))

// Concerns stay first (the API sorts them); grouping keeps each player's rows together.
const groups = computed<{ key: string; title: string | null; items: FeedbackSubmissionItem[] }[]>(() => {
  const items = data.value?.items ?? []
  if (!groupByPlayer.value) return [{ key: 'all', title: null, items }]
  const map = new Map<string, FeedbackSubmissionItem[]>()
  items.forEach((f) => map.set(f.playerId, [...(map.get(f.playerId) ?? []), f]))
  return [...map.values()].map((rows) => ({
    key: rows[0]!.playerId,
    title: `${rows[0]!.username} · ${rows.length} on this page${(rows[0]!.submissionsByPlayer ?? 1) > rows.length ? ` (${rows[0]!.submissionsByPlayer} in range)` : ''}`,
    items: rows,
  }))
})

const activeFilters = computed(() =>
  [
    presetText.value,
    filters.value.search && `search "${filters.value.search}"`,
    filters.value.rating && `${filters.value.rating} stars`,
    filters.value.sentiment,
    filters.value.category && CATEGORIES.find((c) => c.id === filters.value.category)?.label,
    filters.value.rewarded !== undefined && (filters.value.rewarded ? 'rewarded' : 'not rewarded'),
    filters.value.concern && 'concerns only',
  ]
    .filter(Boolean)
    .join(', '),
)

const PRESET_LABEL = { today: 'Today', week: 'This week', month: 'This month', custom: 'Custom' } as const
function rangeInfo() {
  const q = query.value
  return q.range === 'custom' && q.from && q.to ? { from: q.from, to: q.to, days: 0 } : null
}
const presetText = computed(() => (query.value.range === 'custom' ? '' : PRESET_LABEL[query.value.range]))

const exporting = ref<'' | 'pdf' | 'csv'>('')
const exportError = ref('')

async function exportPdf() {
  exporting.value = 'pdf'
  exportError.value = ''
  try {
    // Every matching submission, not just the 20 on screen.
    const all = await getAllFeedbackSubmissions({ ...query.value }, { ...filters.value })
    const { exportReportPdf } = await import('@/lib/pdfReport')
    await exportReportPdf(
      buildFeedbackReport(all, { range: rangeInfo(), filters: activeFilters.value, recommendLabel: (v) => insightLabel('recommend', v) }),
    )
  } catch {
    exportError.value = 'PDF export failed.'
  } finally {
    exporting.value = ''
  }
}

async function exportCsv() {
  exporting.value = 'csv'
  exportError.value = ''
  try {
    saveBlob(await getFeedbackSubmissionsCsv({ ...query.value }), `skycrash-feedback-${fileDate()}.csv`)
  } catch {
    exportError.value = 'CSV download failed.'
  } finally {
    exporting.value = ''
  }
}
</script>

<template>
  <ReportLayout
    v-model:query="query"
    title="Feedback Submissions"
    eyebrow="Feedback"
    subtitle="Read every feedback form players have sent. Concerns first."
    :about="ABOUT.submissions!"
    :ready="!!data"
    :loading="loading"
    :error="error"
    :page-export="false"
  >
    <template #actions>
      <AdminButton :disabled="!!exporting || !data" @click="exportPdf"><FileDown aria-hidden="true" />{{ exporting === 'pdf' ? 'Exporting…' : 'Export PDF' }}</AdminButton>
      <AdminButton :disabled="!!exporting" @click="exportCsv"><Sheet aria-hidden="true" />CSV</AdminButton>
    </template>

    <p v-if="exportError" class="adm-error" role="alert">{{ exportError }}</p>

    <div v-if="summary" class="adm-kpis">
      <div class="adm-kpi">
        <span class="adm-kpi-label">Avg rating</span>
        <span class="adm-kpi-value adm-num">{{ summary.averageRating.toFixed(2) }}</span>
        <span class="adm-kpi-caption adm-num">{{ summary.countByRating.map((b) => `${b.label}★ ${b.count}`).join(' · ') }}</span>
      </div>
      <div class="adm-kpi">
        <span class="adm-kpi-label">Concerns</span>
        <span class="adm-kpi-value adm-num" :class="{ 'text-[#ef4444]': summary.concernCount > 0 }">{{ count(summary.concernCount) }}</span>
        <span class="adm-kpi-caption">Responsible-gambling flags</span>
      </div>
      <div class="adm-kpi">
        <span class="adm-kpi-label">Repeats</span>
        <span class="adm-kpi-value adm-num">{{ count(summary.duplicateCount) }}</span>
        <span class="adm-kpi-caption">{{ count(summary.playersWithSeveralSubmissions) }} players sent several</span>
      </div>
      <div class="adm-kpi">
        <span class="adm-kpi-label">Top requests</span>
        <span class="adm-kpi-caption">
          <template v-if="summary.topRequestedTags.length">{{ summary.topRequestedTags.slice(0, 3).map((t) => `${t.label} (${t.count})`).join(' · ') }}</template>
          <template v-else>None ticked</template>
        </span>
      </div>
    </div>

    <AdminPanel flush accent="magenta" :title="data ? `${count(data.totalCount)} submission${data.totalCount === 1 ? '' : 's'}` : 'Submissions'">
      <template #toolbar>
        <div class="adm-toolbar flex-wrap">
          <div class="adm-search min-w-[13.75rem] flex-1">
            <Search aria-hidden="true" />
            <input v-model="search" type="search" class="adm-input" placeholder="Search player or comments…" aria-label="Search feedback" />
          </div>
          <select class="adm-select" aria-label="Rating" @change="setFilter('rating', Number(($event.target as HTMLSelectElement).value) || undefined)">
            <option value="">Any rating</option>
            <option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="n">{{ n }} star{{ n === 1 ? '' : 's' }}</option>
          </select>
          <select class="adm-select" aria-label="Sentiment" @change="setFilter('sentiment', ($event.target as HTMLSelectElement).value || undefined)">
            <option value="">Any sentiment</option>
            <option>Positive</option>
            <option>Neutral</option>
            <option>Negative</option>
          </select>
          <select class="adm-select" aria-label="Category" @change="setFilter('category', ($event.target as HTMLSelectElement).value || undefined)">
            <option value="">Any request</option>
            <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
          <select
            class="adm-select"
            aria-label="Reward"
            @change="setFilter('rewarded', ($event.target as HTMLSelectElement).value === '' ? undefined : ($event.target as HTMLSelectElement).value === 'yes')"
          >
            <option value="">Rewarded or not</option>
            <option value="yes">Rewarded</option>
            <option value="no">Not rewarded</option>
          </select>
          <label class="adm-switch">
            <input type="checkbox" :checked="!!filters.concern" @change="setFilter('concern', ($event.target as HTMLInputElement).checked || undefined)" />
            <span class="adm-switch-track" aria-hidden="true" />
            <span>{{ copy.feedback.concernsOnly }}</span>
          </label>
          <label class="adm-switch">
            <input v-model="groupByPlayer" type="checkbox" />
            <span class="adm-switch-track" aria-hidden="true" />
            <span>{{ copy.feedback.groupByPlayer }}</span>
          </label>
        </div>
      </template>

      <template v-if="data && data.items.length">
        <template v-for="g in groups" :key="g.key">
          <p v-if="g.title" class="adm-fb-group">{{ g.title }}</p>
          <ul class="adm-fb-list">
            <li v-for="f in g.items" :key="f.feedbackId" :class="['adm-fb-item', f.isConcern && 'is-concern']">
              <div class="adm-fb-who">
                <span class="adm-fb-name">{{ f.username }}</span>
                <span class="adm-subline">{{ dateTime(f.createdAtUtc) }}</span>
                <span class="adm-fb-stars" :aria-label="`${f.rating} out of 5 stars`">{{ stars(f.rating) }}</span>
                <div class="adm-fb-flags">
                  <AdminPill :label="f.sentiment" :tone="sentimentTone[f.sentiment]" />
                  <span v-if="f.isConcern" class="adm-badge adm-badge--bad">
                    <TriangleAlert class="h-3.5 w-3.5" aria-hidden="true" />{{ copy.feedback.concern }}
                  </span>
                  <span v-if="f.isDuplicate" class="adm-badge adm-badge--warn">{{ copy.feedback.repeat }}</span>
                  <span v-if="(f.submissionsByPlayer ?? 1) > 1" class="adm-badge adm-badge--info">{{ f.submissionsByPlayer }} from this player</span>
                </div>
                <p v-if="f.isConcern && f.concernPhrases?.length" class="adm-subline m-0">Flagged: “{{ f.concernPhrases.join('”, “') }}”</p>
              </div>
              <dl class="adm-fb-fields">
                <div v-if="f.likedText">
                  <dt>Liked</dt>
                  <dd>{{ f.likedText }}</dd>
                </div>
                <div v-if="f.improveText">
                  <dt>Could improve</dt>
                  <dd>{{ f.improveText }}</dd>
                </div>
                <div v-if="f.additionalComment">
                  <dt>Anything else</dt>
                  <dd>{{ f.additionalComment }}</dd>
                </div>
                <div v-if="f.recommend">
                  <dt>Would recommend to a friend</dt>
                  <dd>{{ insightLabel('recommend', f.recommend) }}</dd>
                </div>
                <div v-if="f.categories.length">
                  <dt>Wants us to add</dt>
                  <dd class="adm-chips">
                    <AdminPill v-for="c in f.categories" :key="c" :label="c" tone="info" :dot="false" />
                  </dd>
                </div>
                <div v-if="isRatingOnly(f)">
                  <dd class="adm-subline">{{ copy.feedback.ratingOnly }}</dd>
                </div>
              </dl>
              <div class="adm-fb-meta">
                <p class="flex items-center gap-1.5 font-semibold" :class="f.rewardReceived ? 'text-[#22c55e]' : ''">
                  <Gift class="h-4 w-4 shrink-0" aria-hidden="true" />
                  {{ f.rewardReceived ? `Rewarded ${cr(f.creditsAwarded)} credits` : 'Not rewarded' }}
                </p>
                <p>At submit: {{ f.roundsPlayedAtSubmit }} rounds, {{ f.cashOutsAtSubmit }} cash-outs</p>
                <p>Rounds played now: {{ f.roundsPlayedNow }}</p>
              </div>
            </li>
          </ul>
        </template>
      </template>
      <p v-else-if="data" class="adm-empty px-6 py-10">No feedback matches these filters.</p>

      <template v-if="data && data.totalCount > data.pageSize" #footer>
        <AdminButton size="sm" :disabled="data.page <= 1" @click="goTo(data.page - 1)"><ChevronLeft aria-hidden="true" /> Previous</AdminButton>
        <span>Page {{ data.page }} of {{ Math.ceil(data.totalCount / data.pageSize) }}</span>
        <AdminButton size="sm" :disabled="data.page * data.pageSize >= data.totalCount" @click="goTo(data.page + 1)">
          Next <ChevronRight aria-hidden="true" />
        </AdminButton>
      </template>
    </AdminPanel>
  </ReportLayout>
</template>
