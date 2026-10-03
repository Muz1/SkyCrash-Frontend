<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { MessageSquareHeart, Users, Percent, Star, Smile, Gift, CircleCheck } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminBarChart from '@/components/admin/AdminBarChart.vue'
import AdminTrendChart from '@/components/admin/AdminTrendChart.vue'
import { useReport } from '@/composables/useReport'
import * as service from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { count, pct, plural, rand } from '@/lib/reportFormat'
import type { FeedbackSettings } from '@/types/insights'

const { query, data, loading, error } = useReport(service.getFeedbackAnalytics)

// Sentiment split uses status colours (they mean good / neutral / bad) with labels.
const split = computed(() =>
  data.value
    ? [
        { label: 'Positive', value: data.value.positivePercentage, color: 'var(--neon-lime)' },
        { label: 'Neutral', value: data.value.neutralPercentage, color: 'oklch(0.7 0.02 260)' },
        { label: 'Negative', value: data.value.negativePercentage, color: 'oklch(0.6 0.2 22)' },
      ]
    : [],
)

// ---- prompt schedule & reward ----
const settings = ref<FeedbackSettings | null>(null)
const draft = ref<FeedbackSettings>({ firstPromptAfterRounds: 3, promptIntervalRounds: 10, intervalStepRounds: 3, rewardCredits: 500, rewardsEnabled: true })
const saving = ref(false)
const saved = ref<{ ok: boolean; text: string } | null>(null)
const dirty = computed(() => !!settings.value && JSON.stringify(settings.value) !== JSON.stringify(draft.value))
const preview = computed(() => {
  const gaps = [draft.value.firstPromptAfterRounds]
  for (let n = 1; n <= 4; n++) {
    gaps.push(Math.min(draft.value.promptIntervalRounds, Math.max(1, draft.value.firstPromptAfterRounds + n * draft.value.intervalStepRounds)))
  }
  let total = 0
  return gaps.map((g) => (total += g)).join(', ')
})

onMounted(async () => {
  settings.value = await service.getFeedbackSettings()
  draft.value = { ...settings.value }
})

async function save() {
  saving.value = true
  saved.value = null
  try {
    settings.value = await service.updateFeedbackSettings(draft.value)
    draft.value = { ...settings.value }
    saved.value = { ok: true, text: 'Saved. Applies from each player’s next cash-out.' }
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined
    saved.value = { ok: false, text: message ?? 'Could not save.' }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ReportLayout
    v-model:query="query"
    title="Feedback Analytics"
    eyebrow="Feedback"
    subtitle="How many players respond, how happy they are, and what they want next."
    :about="ABOUT.feedback!"
    :ready="!!data"
    :loading="loading"
    :error="error"
    :info="data?.range"
  >
    <template v-if="data">
      <div class="adm-kpis">
        <AdminKpi label="Submissions" :icon="MessageSquareHeart" tone="magenta">
          <span class="adm-num">{{ count(data.totalSubmissions) }}</span>
        </AdminKpi>
        <AdminKpi label="Players who responded" :icon="Users" tone="blue">
          <span class="adm-num">{{ count(data.uniquePlayers) }}</span>
        </AdminKpi>
        <AdminKpi label="Response rate" :icon="Percent" tone="violet" :caption="`of ${plural(data.eligiblePlayers, 'player')} asked`">
          <span class="adm-num">{{ pct(data.responseRatePercentage) }}</span>
        </AdminKpi>
        <AdminKpi label="Average rating" :icon="Star" tone="ember" caption="Out of 5 stars">
          <span class="adm-num">{{ data.totalSubmissions ? data.averageRating.toFixed(2) : '—' }}</span>
        </AdminKpi>
        <AdminKpi label="Positive feedback" :icon="Smile" tone="lime" :caption="`${pct(data.neutralPercentage)} neutral · ${pct(data.negativePercentage)} negative`">
          <span class="adm-num">{{ pct(data.positivePercentage) }}</span>
        </AdminKpi>
        <AdminKpi label="Rewards paid" :icon="Gift" tone="violet" :caption="plural(data.rewardedSubmissions, 'rewarded submission')">
          <span class="adm-num">{{ rand(data.creditsAwarded) }}</span>
        </AdminKpi>
      </div>

      <AdminPanel title="Sentiment" caption="Share of submissions" accent="lime">
        <div class="adm-split" role="img" :aria-label="split.map((s) => `${s.label} ${pct(s.value)}`).join(', ')">
          <span v-for="s in split" :key="s.label" :style="{ width: `${s.value}%`, background: s.color }" />
        </div>
        <div class="adm-split-legend">
          <span v-for="s in split" :key="s.label" class="inline-flex items-center gap-2">
            <span class="h-3 w-3 rounded-full" :style="{ background: s.color }" aria-hidden="true" />
            {{ s.label }} <b>{{ pct(s.value) }}</b>
          </span>
        </div>
      </AdminPanel>

      <div class="adm-grid-2">
        <AdminPanel title="Most requested improvements" caption="From the “add” boxes and players’ own words" accent="magenta">
          <AdminBarChart
            label="Most requested improvements"
            value-label="Submissions asking"
            horizontal
            :items="data.requestedImprovements.map((r) => ({ label: r.label, value: r.count, detail: `${r.fromCheckboxes} ticked · ${r.fromComments} written` }))"
            empty-text="No requests in this period yet."
          />
        </AdminPanel>
        <AdminPanel title="Submissions over time" accent="blue">
          <AdminTrendChart
            label="Feedback submissions per day"
            :dates="data.daily.map((d) => d.date)"
            :series="[{ name: 'Submissions', values: data.daily.map((d) => d.submissions) }]"
            :format="count"
            :height="220"
          />
        </AdminPanel>
        <AdminPanel title="Ratings" caption="Submissions per star rating" accent="ember">
          <AdminBarChart
            label="Feedback submissions per star rating"
            value-label="Submissions"
            :items="data.ratingDistribution.map((r) => ({ label: r.label, value: r.count }))"
            :height="200"
            :tone="2"
          />
        </AdminPanel>
        <AdminPanel title="Prompt schedule & reward" caption="When players are asked, counted in cash-outs" accent="violet">
          <form v-if="settings" class="flex flex-col gap-4" @submit.prevent="save">
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="adm-label">First ask after (cash-outs)</span>
                <input v-model.number="draft.firstPromptAfterRounds" type="number" min="1" max="1000" class="adm-input adm-num w-full" />
              </label>
              <label class="block">
                <span class="adm-label">Gap grows by (cash-outs)</span>
                <input v-model.number="draft.intervalStepRounds" type="number" min="0" max="100" class="adm-input adm-num w-full" />
              </label>
              <label class="block">
                <span class="adm-label">Longest gap (cash-outs)</span>
                <input v-model.number="draft.promptIntervalRounds" type="number" min="1" max="1000" class="adm-input adm-num w-full" />
              </label>
              <label class="block">
                <span class="adm-label">Reward (credits)</span>
                <input v-model.number="draft.rewardCredits" type="number" min="0" max="10000" class="adm-input adm-num w-full" />
              </label>
            </div>
            <label class="flex cursor-pointer items-center gap-3 text-[1rem] font-bold text-[var(--adm-text)]">
              <input v-model="draft.rewardsEnabled" type="checkbox" class="h-5 w-5 accent-[var(--neon-lime)]" />
              Pay the reward for feedback
              <span class="font-normal text-[var(--adm-text-3)]">{{ draft.rewardsEnabled ? '(on)' : '(off: feedback is still collected, with no credits)' }}</span>
            </label>
            <p class="adm-note">
              Players are asked after cash-out {{ preview }}… Big wins (5x+) also ask, and players can give feedback from the home page any
              time, but only a due answer earns the reward.
            </p>
            <div class="flex flex-wrap items-center gap-3">
              <AdminButton type="submit" variant="primary" :disabled="!dirty || saving">{{ saving ? 'Saving…' : 'Save' }}</AdminButton>
              <p v-if="saved" role="status" :class="saved.ok ? 'adm-success flex items-center gap-2' : 'adm-error'">
                <CircleCheck v-if="saved.ok" class="h-4 w-4" aria-hidden="true" />{{ saved.text }}
              </p>
            </div>
          </form>
        </AdminPanel>
      </div>
    </template>
  </ReportLayout>
</template>
