<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RefreshCw, Sigma, ChartNoAxesColumn, Activity, MoveHorizontal } from '@lucide/vue'
import { useVolatilityStore } from '@/stores/volatilityStore'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import ExportPdfButton from '@/components/sky/ExportPdfButton.vue'
import { buildVolatilityReport } from '@/lib/adminReports'

const volatilityStore = useVolatilityStore()

function buildReport() {
  return volatilityStore.summary ? buildVolatilityReport(volatilityStore.summary) : null
}

// Display only: bars are scaled to the tallest bucket so small buckets stay readable.
const maxPercentage = computed(() =>
  Math.max(1, ...(volatilityStore.summary?.histogram.map((b) => b.percentage) ?? [0])),
)

onMounted(() => {
  volatilityStore.fetchSummary()
})
</script>

<template>
  <AdminShell
    help-text="Statistics on where rounds have actually been crashing over the last 500 rounds — mean, median, spread, percentiles and a distribution histogram. Use this to sanity-check that the live game matches the configured house edge and to spot anomalies."
  >
    <AdminPage :page-export="false"
      title="Volatility"
      eyebrow="Risk analytics"
      subtitle="How unpredictable crash points are — not the same as RTP's average payback %"
    >
      <template #actions>
        <AdminButton variant="ghost" @click="volatilityStore.fetchSummary">
          <RefreshCw aria-hidden="true" /> Refresh
        </AdminButton>
        <ExportPdfButton :build="buildReport" />
      </template>

      <AdminPanel v-if="!volatilityStore.summary" fill>
        <AdminLoading text="Loading distribution…" />
      </AdminPanel>

      <template v-else>
        <div class="grid shrink-0 grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <AdminKpi label="Mean" :icon="Sigma" tone="blue" caption="Average crash point">
            <span class="adm-num">{{ volatilityStore.summary.meanCrashPoint }}x</span>
          </AdminKpi>
          <AdminKpi label="Median" :icon="ChartNoAxesColumn" tone="lime" caption="Half of rounds crash below">
            <span class="adm-num">{{ volatilityStore.summary.medianCrashPoint }}x</span>
          </AdminKpi>
          <AdminKpi label="Std. Deviation" :icon="Activity" tone="magenta" caption="Spread of crash points">
            <span class="adm-num">{{ volatilityStore.summary.standardDeviation }}</span>
          </AdminKpi>
          <AdminKpi label="P10 / P90" :icon="MoveHorizontal" tone="ember" caption="80% of rounds fall in this range">
            <span class="adm-num">{{ volatilityStore.summary.p10 }}x / {{ volatilityStore.summary.p90 }}x</span>
          </AdminKpi>
          <AdminKpi label="P25 / P75" :icon="MoveHorizontal" tone="violet" caption="Middle 50% of rounds">
            <span class="adm-num">{{ volatilityStore.summary.p25 }}x / {{ volatilityStore.summary.p75 }}x</span>
          </AdminKpi>
        </div>

        <AdminPanel
          title="Crash Point Distribution"
          :caption="`Based on the last ${volatilityStore.summary.sampleSize} crashed rounds`"
          accent="blue"
          fill
        >
          <div class="flex min-h-0 flex-1 flex-col">
            <div
              class="flex shrink-0 items-center gap-4 pb-2 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-[var(--adm-text-3)]"
            >
              <span class="w-32 shrink-0">Crash range</span>
              <span class="flex-1">Share of rounds</span>
              <span class="w-16 shrink-0 text-right">Share</span>
              <span class="w-16 shrink-0 text-right">Rounds</span>
            </div>
            <ul class="flex min-h-0 flex-1 flex-col justify-around overflow-y-auto border-t border-[var(--adm-border)]">
              <li
                v-for="bucket in volatilityStore.summary.histogram"
                :key="bucket.label"
                class="group flex items-center gap-4 rounded-md px-0 py-1.5 transition-colors hover:bg-[oklch(0.62_0.26_305/0.07)]"
                :title="`${bucket.label}: ${bucket.percentage}% of rounds (${bucket.count})`"
              >
                <span class="adm-num-inline w-32 shrink-0 text-[0.9062rem] font-semibold text-[var(--adm-text-2)]">
                  {{ bucket.label }}
                </span>
                <div class="relative h-3 flex-1 rounded-r-[4px] bg-[oklch(1_0_0/0.03)]">
                  <div
                    class="absolute inset-y-0 left-0 rounded-r-[4px] bg-[linear-gradient(90deg,oklch(0.6_0.14_231),var(--neon-blue))] transition-[filter] group-hover:brightness-125"
                    :style="{ width: Math.max(0.5, (bucket.percentage / maxPercentage) * 100) + '%' }"
                  />
                </div>
                <span class="adm-num w-16 shrink-0 text-right text-[0.9062rem] font-semibold text-[var(--adm-text)]">
                  {{ bucket.percentage }}%
                </span>
                <span class="adm-num w-16 shrink-0 text-right text-[0.875rem] text-[var(--adm-text-3)]">{{ bucket.count }}</span>
              </li>
            </ul>
          </div>
        </AdminPanel>
      </template>
    </AdminPage>
  </AdminShell>
</template>
