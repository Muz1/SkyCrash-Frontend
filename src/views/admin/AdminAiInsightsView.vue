<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles, CircleAlert, Quote } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminPill from '@/components/admin/AdminPill.vue'
import { useReport } from '@/composables/useReport'
import { getFeedbackInsights } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { pct, plural } from '@/lib/reportFormat'

const { query, data, loading, error } = useReport(getFeedbackInsights)

const split = computed(() =>
  data.value
    ? [
        { label: 'Positive', value: data.value.positivePercentage, color: 'var(--neon-lime)' },
        { label: 'Neutral', value: data.value.neutralPercentage, color: 'oklch(0.7 0.02 260)' },
        { label: 'Negative', value: data.value.negativePercentage, color: 'oklch(0.6 0.2 22)' },
      ]
    : [],
)
const sentimentTone = { Positive: 'success', Negative: 'danger', Mixed: 'warning' } as const
</script>

<template>
  <ReportLayout
    v-model:query="query"
    title="AI Feedback Insights"
    eyebrow="Feedback"
    subtitle="All the written feedback in this range, consolidated into topics and actions."
    :about="ABOUT.insights!"
    :ready="!!data"
    :loading="loading"
    :error="error"
    :info="data?.range"
  >
    <template v-if="data">
      <AdminPanel title="Summary" :caption="`${plural(data.analysed, 'submission')} analysed`" accent="magenta">
        <template #actions>
          <AdminPill
            :label="data.insights.source === 'gemini' ? 'Gemini AI' : 'Keyword analysis (no AI key set)'"
            :tone="data.insights.source === 'gemini' ? 'accent' : 'neutral'"
            :dot="false"
          />
          <RouterLink
            v-if="data.insights.source !== 'gemini'"
            to="/admin/feedback/keywords"
            class="text-[14px] font-bold text-[var(--adm-accent)] underline-offset-2 hover:underline"
          >
            Edit keywords
          </RouterLink>
        </template>
        <p v-if="data.insights.source !== 'gemini'" class="adm-note mb-4">
          No Gemini key is set, so topics come from keyword matching: a comment using a theme's keywords counts towards that topic.
          You can change the themes and keywords on the Feedback Keywords page.
        </p>
        <p v-if="data.insights.warning" class="adm-callout mb-4"><CircleAlert aria-hidden="true" />{{ data.insights.warning }}</p>
        <p class="flex gap-3 text-[18px] font-semibold leading-relaxed text-[var(--adm-text)]">
          <Sparkles class="mt-1 h-5 w-5 shrink-0 text-[var(--neon-magenta)]" aria-hidden="true" />
          {{ data.insights.summary || 'No written feedback in this range yet.' }}
        </p>
        <div class="mt-5">
          <div class="adm-split" role="img" :aria-label="split.map((s) => `${s.label} ${pct(s.value)}`).join(', ')">
            <span v-for="s in split" :key="s.label" :style="{ width: `${s.value}%`, background: s.color }" />
          </div>
          <div class="adm-split-legend">
            <span v-for="s in split" :key="s.label" class="inline-flex items-center gap-2">
              <span class="h-3 w-3 rounded-full" :style="{ background: s.color }" aria-hidden="true" />
              {{ s.label }} <b>{{ pct(s.value) }}</b>
            </span>
          </div>
        </div>
      </AdminPanel>

      <div v-if="data.insights.clusters.length" class="adm-grid-2">
        <AdminPanel v-for="c in data.insights.clusters" :key="c.title" :title="c.title" :caption="plural(c.mentions, 'mention')" accent="violet">
          <template #actions><AdminPill :label="c.sentiment" :tone="sentimentTone[c.sentiment]" /></template>
          <p class="text-[16px] leading-relaxed text-[var(--adm-text)]"><strong>Suggested action:</strong> {{ c.suggestion }}</p>
          <ul v-if="c.examples.length" class="mt-3 space-y-2">
            <li v-for="ex in c.examples" :key="ex" class="flex gap-2 text-[15px] italic leading-relaxed text-[var(--adm-text-2)]">
              <Quote class="mt-1 h-4 w-4 shrink-0 opacity-60" aria-hidden="true" /> {{ ex }}
            </li>
          </ul>
        </AdminPanel>
      </div>
    </template>
  </ReportLayout>
</template>
