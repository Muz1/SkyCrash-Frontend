<script setup lang="ts">
import { ref } from 'vue'
import { Hash, Timer, Rocket, ArrowUpToLine, ArrowDownToLine, Zap } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminBarChart from '@/components/admin/AdminBarChart.vue'
import AdminTrendChart from '@/components/admin/AdminTrendChart.vue'
import { useReport } from '@/composables/useReport'
import { getGamePerformance } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { count, mult, pct } from '@/lib/reportFormat'

// Admins can add their own threshold to the standard ones (1.5x, 2x, 5x, 10x, 50x, 100x).
const threshold = ref<number | null>(null)
const { query, data, loading, error, reload } = useReport((q) => getGamePerformance(q, threshold.value ?? undefined))
</script>

<template>
  <ReportLayout
    v-model:query="query"
    title="Game Performance"
    eyebrow="Game analytics"
    subtitle="How the crash rounds behave: duration, multipliers and how often big multipliers happen."
    :about="ABOUT.gamePerformance!"
    :ready="!!data"
    :loading="loading"
    :error="error"
    :info="data?.range"
  >
    <template v-if="data">
      <div class="adm-kpis">
        <AdminKpi label="Total rounds" :icon="Hash" tone="blue">
          <span class="adm-num">{{ count(data.totalRounds) }}</span>
        </AdminKpi>
        <AdminKpi label="Average round" :icon="Timer" tone="violet" caption="Take-off to crash">
          <span class="adm-num">{{ data.averageRoundSeconds }}s</span>
        </AdminKpi>
        <AdminKpi label="Average crash" :icon="Rocket" tone="ember">
          <span class="adm-num">{{ mult(data.averageCrashMultiplier) }}</span>
        </AdminKpi>
        <AdminKpi label="Highest multiplier" :icon="ArrowUpToLine" tone="lime">
          <span class="adm-num">{{ mult(data.highestMultiplier) }}</span>
        </AdminKpi>
        <AdminKpi label="Lowest multiplier" :icon="ArrowDownToLine" tone="magenta">
          <span class="adm-num">{{ mult(data.lowestMultiplier) }}</span>
        </AdminKpi>
        <AdminKpi label="Instant crashes" :icon="Zap" tone="ember" :caption="`${pct(data.totalRounds ? (data.instantCrashes / data.totalRounds) * 100 : 0)} of rounds, at 1.00x`">
          <span class="adm-num">{{ count(data.instantCrashes) }}</span>
        </AdminKpi>
      </div>

      <div class="adm-grid-2">
        <AdminPanel title="Crash multiplier distribution" caption="Rounds per multiplier band" accent="ember">
          <AdminBarChart
            label="Number of rounds crashing in each multiplier band"
            value-label="Rounds"
            :items="data.distribution.map((b) => ({ label: b.label, value: b.count, detail: pct(b.percentage) }))"
            :height="240"
            :tone="2"
          />
        </AdminPanel>
        <AdminPanel title="Rounds reaching a multiplier" caption="Rounds that got at least this high" accent="lime">
          <template #actions>
            <form class="flex items-center gap-2" @submit.prevent="reload">
              <label class="sr-only" for="threshold">Custom threshold</label>
              <input
                id="threshold"
                v-model.number="threshold"
                type="number"
                min="1.01"
                step="0.01"
                placeholder="e.g. 3"
                class="adm-input adm-num w-24"
              />
              <button type="submit" class="adm-btn adm-btn--secondary adm-btn--sm">Add</button>
            </form>
          </template>
          <AdminBarChart
            label="Rounds reaching each multiplier threshold"
            value-label="Rounds"
            horizontal
            :items="data.thresholds.map((t) => ({ label: `≥ ${mult(t.multiplier)}`, value: t.rounds, detail: pct(t.percentage) }))"
          />
        </AdminPanel>
        <AdminPanel title="Rounds per day" accent="blue">
          <AdminTrendChart
            label="Rounds per day"
            :dates="data.dailyRounds.map((d) => d.date)"
            :series="[{ name: 'Rounds', values: data.dailyRounds.map((d) => d.value) }]"
            :format="count"
            :height="220"
          />
        </AdminPanel>
        <AdminPanel title="Average crash per day" accent="violet">
          <AdminTrendChart
            label="Average crash multiplier per day"
            :dates="data.dailyAverageCrash.map((d) => d.date)"
            :series="[{ name: 'Average crash', values: data.dailyAverageCrash.map((d) => d.value) }]"
            :format="mult"
            :height="220"
          />
        </AdminPanel>
      </div>
    </template>
  </ReportLayout>
</template>
