<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ClipboardList, Percent, MailCheck, ThumbsUp, ShieldCheck } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminBarChart from '@/components/admin/AdminBarChart.vue'
import { getPlayerInsights } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { count, pct } from '@/lib/reportFormat'
import { insightLabel, type InsightOptionGroup } from '@/types/feedback'
import type { InsightQuestion, PlayerInsightsReport } from '@/types/retention'

// Aggregated answers to the optional "Tell us about you" questions, as of now (no range).
const data = ref<PlayerInsightsReport | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await getPlayerInsights()
  } catch {
    error.value = 'Player insights could not be loaded. Please try again.'
  } finally {
    loading.value = false
  }
})

// Report question/dimension keys → answer-label group and a readable title.
const QUESTIONS: Record<string, { group: InsightOptionGroup; title: string }> = {
  'age-range': { group: 'ageRange', title: 'Age range' },
  gender: { group: 'gender', title: 'How players identify' },
  occupation: { group: 'occupation', title: 'What best describes them' },
  'play-frequency': { group: 'playFrequency', title: 'How often they play games' },
  devices: { group: 'devices', title: 'What they play on' },
  'session-length': { group: 'sessionLength', title: 'Typical session length' },
  'game-genres': { group: 'gameGenres', title: 'Types of games they enjoy' },
  motivations: { group: 'motivations', title: 'What makes a game fun' },
  'tried-because': { group: 'triedBecause', title: 'Why they tried Sky Crash' },
  'favourite-features': { group: 'favouriteFeatures', title: 'Favourite parts of Sky Crash' },
  'want-next': { group: 'wantNext', title: 'What they want next' },
  discovery: { group: 'discoverySource', title: 'Where they heard about Sky Crash' },
  'social-platforms': { group: 'socialPlatforms', title: 'Social platforms they use most' },
  'scroll-hooks': { group: 'scrollHooks', title: 'What would make them stop scrolling' },
}

const SECTIONS = [
  { title: 'Who plays', keys: ['age-range', 'gender', 'occupation'] },
  { title: 'How they play', keys: ['play-frequency', 'devices', 'session-length', 'game-genres'] },
  { title: 'Why they play', keys: ['motivations', 'tried-because'] },
  { title: 'What they like and want', keys: ['favourite-features', 'want-next'] },
  { title: 'How they found us', keys: ['discovery', 'social-platforms', 'scroll-hooks'] },
]

function question(key: string): InsightQuestion | undefined {
  return data.value?.questions.find((q) => q.key === key)
}

function chartItems(q: InsightQuestion) {
  const group = QUESTIONS[q.key]!.group
  return q.options.map((o) => ({ label: insightLabel(group, o.key), value: o.percentage, detail: `${o.count} of ${q.answered} players` }))
}

const dimension = ref('age-range')
const segment = computed(() => data.value?.segments.find((s) => s.dimension === dimension.value))

const recommendYes = computed(() => {
  const r = data.value?.recommend ?? []
  const total = r.reduce((a, o) => a + o.count, 0)
  return total ? { pct: r.find((o) => o.key === 'definitely')!.percentage, total } : null
})

const hookKeys = computed(() =>
  (data.value?.hooksByAge.find((h) => !h.suppressed)?.hooks ?? []).map((h) => h.key),
)
</script>

<template>
  <ReportLayout
    title="Player Insights"
    eyebrow="Feedback"
    subtitle="Who plays Sky Crash, why, how they found us and what they want next."
    :about="ABOUT.playerInsights!"
    :ready="!!data"
    :loading="loading"
    :error="error"
    :filter="false"
  >
    <template v-if="data">
      <div class="adm-kpis">
        <AdminKpi label="Respondents" :icon="ClipboardList" tone="blue" :caption="`of ${count(data.totalPlayers)} players`">
          <span class="adm-num">{{ count(data.respondents) }}</span>
        </AdminKpi>
        <AdminKpi label="Response rate" :icon="Percent" tone="violet" caption="Answered at least one optional question">
          <span class="adm-num">{{ pct(data.responseRatePercentage) }}</span>
        </AdminKpi>
        <AdminKpi label="Want to hear from us" :icon="MailCheck" tone="lime" :caption="`${count(data.marketingOptOuts)} said no thanks`">
          <span class="adm-num">{{ count(data.marketingOptIns) }}</span>
        </AdminKpi>
        <AdminKpi label="Would definitely recommend" :icon="ThumbsUp" tone="ember" :caption="recommendYes ? `of ${count(recommendYes.total)} who answered` : 'No answers yet'">
          <span class="adm-num">{{ recommendYes ? pct(recommendYes.pct) : '—' }}</span>
        </AdminKpi>
      </div>

      <p class="adm-callout adm-callout--info flex items-start gap-2">
        <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Totals only: individual answers are never shown. Wherever answers are compared with play behaviour, groups smaller
          than {{ data.minimumGroupSize }} players are hidden so nobody can be identified.
        </span>
      </p>

      <div v-if="!data.respondents" class="adm-empty">
        No player has answered the optional questions yet. They appear after the main feedback form.
      </div>

      <template v-else>
        <template v-for="section in SECTIONS" :key="section.title">
          <h2 class="adm-section-title">{{ section.title }}</h2>
          <div class="adm-grid-2">
            <template v-for="key in section.keys" :key="key">
              <AdminPanel
                v-if="question(key)"
                :title="QUESTIONS[key]!.title"
                :caption="`${count(question(key)!.answered)} answered${question(key)!.multiSelect ? ' · pick-many, so totals can pass 100%' : ''}`"
                accent="blue"
              >
                <p v-if="question(key)!.suppressed" class="adm-empty">
                  Shown once at least {{ data.minimumGroupSize }} players have answered ({{ question(key)!.answered }} so far), so no one's
                  answer can be singled out.
                </p>
                <AdminBarChart
                  v-else
                  horizontal
                  :label="QUESTIONS[key]!.title"
                  value-label="Share of players"
                  :items="chartItems(question(key)!)"
                  :format="(v) => `${v}%`"
                  empty-text="No answers yet"
                />
              </AdminPanel>
            </template>
            <AdminPanel v-if="section.title === 'Who plays'" title="Where players are based" caption="Countries with enough players to show" accent="violet">
              <div v-if="!data.countries.length" class="adm-empty">No countries given yet.</div>
              <table v-else class="adm-table adm-table--dense">
                <caption class="sr-only">Players by country</caption>
                <thead><tr><th scope="col">Country</th><th scope="col" class="text-right">Players</th></tr></thead>
                <tbody>
                  <tr v-for="c in data.countries" :key="c.country"><th scope="row">{{ c.country }}</th><td class="text-right">{{ count(c.players) }}</td></tr>
                </tbody>
              </table>
            </AdminPanel>
          </div>
        </template>

        <h2 class="adm-section-title">Retention by answer</h2>
        <AdminPanel title="Who comes back?" caption="Observed relationships between answers and play, not causes" accent="lime" flush>
          <template #toolbar>
            <label class="flex items-center gap-2">
              <span class="adm-label">Compare by</span>
              <select v-model="dimension" class="adm-select">
                <option v-for="s in data.segments" :key="s.dimension" :value="s.dimension">{{ QUESTIONS[s.dimension]?.title ?? s.dimension }}</option>
              </select>
            </label>
          </template>
          <div class="adm-table-wrap">
            <table class="adm-table adm-table--dense">
              <caption class="sr-only">Retention by {{ QUESTIONS[dimension]?.title }}</caption>
              <thead>
                <tr>
                  <th scope="col">Answer</th>
                  <th scope="col" class="text-right">Players</th>
                  <th scope="col" class="text-right">Return rate</th>
                  <th scope="col" class="text-right">Day 7</th>
                  <th scope="col" class="text-right">Avg sessions</th>
                  <th scope="col" class="text-right">Avg flights</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in segment?.rows ?? []" :key="r.key">
                  <th scope="row">{{ insightLabel(QUESTIONS[dimension]!.group, r.key) }}</th>
                  <template v-if="r.suppressed">
                    <td class="text-right opacity-70">{{ r.players ? `< ${data.minimumGroupSize}` : '0' }}</td>
                    <td colspan="4" class="text-right text-xs opacity-70">Hidden: fewer than {{ data.minimumGroupSize }} players</td>
                  </template>
                  <template v-else>
                    <td class="text-right">{{ count(r.players) }}</td>
                    <td class="text-right font-bold">{{ pct(r.returnRate) }}</td>
                    <td class="text-right">{{ pct(r.day7) }}</td>
                    <td class="text-right">{{ r.averageSessions }}</td>
                    <td class="text-right">{{ r.averageFlights }}</td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <h2 class="adm-section-title">Marketing messages by audience</h2>
        <AdminPanel title="What would make each age group stop scrolling?" caption="Share of each age group choosing each hook" accent="magenta" flush>
          <div v-if="!hookKeys.length" class="adm-empty">
            Not enough answers yet: each age group needs at least {{ data.minimumGroupSize }} players before it's shown.
          </div>
          <div v-else class="adm-table-wrap">
            <table class="adm-table adm-table--dense">
              <caption class="sr-only">Social media hooks by age range</caption>
              <thead>
                <tr>
                  <th scope="col">Age range</th>
                  <th v-for="k in hookKeys" :key="k" scope="col" class="text-right">{{ insightLabel('scrollHooks', k) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in data.hooksByAge" :key="a.ageRange">
                  <th scope="row">{{ insightLabel('ageRange', a.ageRange) }}</th>
                  <td v-if="a.suppressed" :colspan="hookKeys.length" class="text-right text-xs opacity-70">
                    Hidden: fewer than {{ data.minimumGroupSize }} players
                  </td>
                  <template v-else>
                    <td v-for="h in a.hooks" :key="h.key" class="text-right">{{ pct(h.percentage) }}</td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </template>
    </template>
  </ReportLayout>
</template>
