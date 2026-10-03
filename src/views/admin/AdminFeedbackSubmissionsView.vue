<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, ChevronLeft, ChevronRight, Gift } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminPill from '@/components/admin/AdminPill.vue'
import { useReport } from '@/composables/useReport'
import { getFeedbackSubmissions } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { dateTime } from '@/lib/reportFormat'
import type { FeedbackSubmissionFilters } from '@/types/insights'

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
</script>

<template>
  <ReportLayout
    v-model:query="query"
    title="Feedback Submissions"
    eyebrow="Feedback"
    subtitle="Read every feedback form players have sent."
    :about="ABOUT.submissions!"
    :ready="!!data"
    :loading="loading"
    :error="error"
  >
    <AdminPanel flush accent="magenta" :title="data ? `${data.totalCount.toLocaleString()} submission${data.totalCount === 1 ? '' : 's'}` : 'Submissions'">
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
        </div>
      </template>

      <ul v-if="data && data.items.length" class="divide-y divide-[var(--adm-border)]">
        <li v-for="f in data.items" :key="f.feedbackId" class="grid gap-3 px-5 py-4 lg:grid-cols-[220px_minmax(0,1fr)_200px]">
          <div>
            <p class="text-[1rem] font-bold text-[var(--adm-text)]">{{ f.username }}</p>
            <p class="text-[0.875rem] text-[var(--adm-text-3)]">{{ dateTime(f.createdAtUtc) }}</p>
            <p class="mt-1 text-[1.125rem] tracking-wider text-[var(--neon-orange)]" :aria-label="`${f.rating} out of 5 stars`">{{ stars(f.rating) }}</p>
            <AdminPill :label="f.sentiment" :tone="sentimentTone[f.sentiment]" />
          </div>
          <dl class="grid gap-2 text-[0.9375rem] leading-relaxed">
            <div v-if="f.likedText">
              <dt class="text-[0.8125rem] font-bold uppercase tracking-wider text-[var(--adm-text-3)]">Liked</dt>
              <dd class="m-0 text-[var(--adm-text)]">{{ f.likedText }}</dd>
            </div>
            <div v-if="f.improveText">
              <dt class="text-[0.8125rem] font-bold uppercase tracking-wider text-[var(--adm-text-3)]">Could improve</dt>
              <dd class="m-0 text-[var(--adm-text)]">{{ f.improveText }}</dd>
            </div>
            <div v-if="f.additionalComment">
              <dt class="text-[0.8125rem] font-bold uppercase tracking-wider text-[var(--adm-text-3)]">Anything else</dt>
              <dd class="m-0 text-[var(--adm-text)]">{{ f.additionalComment }}</dd>
            </div>
            <div v-if="f.categories.length">
              <dt class="text-[0.8125rem] font-bold uppercase tracking-wider text-[var(--adm-text-3)]">Wants us to add</dt>
              <dd class="m-0 flex flex-wrap gap-1.5">
                <AdminPill v-for="c in f.categories" :key="c" :label="c" tone="info" :dot="false" />
              </dd>
            </div>
            <p v-if="!f.likedText && !f.improveText && !f.additionalComment" class="text-[var(--adm-text-3)]">Rating only, no comments.</p>
          </dl>
          <div class="text-[0.875rem] text-[var(--adm-text-2)]">
            <p class="flex items-center gap-1.5 font-semibold" :class="f.rewardReceived ? 'text-[var(--neon-lime)]' : ''">
              <Gift class="h-4 w-4" aria-hidden="true" />
              {{ f.rewardReceived ? `Rewarded R${f.creditsAwarded.toLocaleString()}` : 'Not rewarded' }}
            </p>
            <p class="mt-1">At submit: {{ f.roundsPlayedAtSubmit }} rounds, {{ f.cashOutsAtSubmit }} cash-outs</p>
            <p>Rounds played now: {{ f.roundsPlayedNow }}</p>
          </div>
        </li>
      </ul>
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
