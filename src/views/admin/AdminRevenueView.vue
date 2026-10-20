<script setup lang="ts">
import { Coins, HandCoins, Landmark, Gift, TrendingUp, Percent, Scale, Target } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminTrendChart from '@/components/admin/AdminTrendChart.vue'
import AdminBarChart from '@/components/admin/AdminBarChart.vue'
import { useReport } from '@/composables/useReport'
import { getRevenue } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { pct, cr } from '@/lib/reportFormat'

const { query, data, loading, error } = useReport(getRevenue)
</script>

<template>
  <ReportLayout
    v-model:query="query"
    title="Revenue & Profit"
    eyebrow="Money"
    subtitle="What players wager, what they win, and what the house keeps. Credits are play money; only PayFast purchases are rands."
    :about="ABOUT.revenue!"
    :ready="!!data"
    :loading="loading"
    :error="error"
    :info="data?.range"
  >
    <template v-if="data">
      <div class="adm-kpis">
        <AdminKpi label="Total wagered" :icon="Coins" tone="blue" :caption="`${data.betCount.toLocaleString()} resolved bets`">
          <span class="adm-num">{{ cr(data.totalWagered) }}</span>
        </AdminKpi>
        <AdminKpi label="Total payouts" :icon="HandCoins" tone="ember" :caption="`Actual RTP ${pct(data.actualRtpPercentage)}`">
          <span class="adm-num">{{ cr(data.totalPayouts) }}</span>
        </AdminKpi>
        <AdminKpi label="Gross revenue" :icon="Landmark" tone="violet" caption="Wagered − payouts">
          <span class="adm-num">{{ cr(data.grossRevenue) }}</span>
        </AdminKpi>
        <AdminKpi label="Free credits given" :icon="Gift" tone="magenta" caption="Rewards, wheel, top-ups">
          <span class="adm-num">{{ cr(data.freeCreditsGiven) }}</span>
        </AdminKpi>
        <AdminKpi label="Net profit" :icon="TrendingUp" :tone="data.netProfit >= 0 ? 'lime' : 'magenta'" caption="Gross revenue − free credits">
          <span class="adm-num">{{ cr(data.netProfit) }}</span>
        </AdminKpi>
        <AdminKpi label="Profit margin" :icon="Percent" tone="lime" caption="Net profit ÷ wagered">
          <span class="adm-num">{{ pct(data.profitMarginPercentage) }}</span>
        </AdminKpi>
        <AdminKpi label="Average bet" :icon="Scale" tone="blue">
          <span class="adm-num">{{ cr(data.averageBet) }}</span>
        </AdminKpi>
        <AdminKpi
          label="Expected from house edge"
          :icon="Target"
          tone="violet"
          :caption="`${pct(data.houseEdgePercentage)} edge × wagered`"
        >
          <span class="adm-num">{{ cr(data.expectedGrossRevenue) }}</span>
        </AdminKpi>
      </div>

      <div class="adm-grid-2">
        <AdminPanel title="Bets vs payouts" caption="Per day, on one axis" accent="blue">
          <AdminTrendChart
            label="Daily bets versus payouts"
            :dates="data.daily.map((d) => d.date)"
            :series="[
              { name: 'Wagered', values: data.daily.map((d) => d.wagered) },
              { name: 'Paid out', values: data.daily.map((d) => d.payouts) },
            ]"
            :format="cr"
            :height="240"
          />
        </AdminPanel>
        <AdminPanel title="Revenue & profit over time" caption="Gross revenue and net profit per day. Below the zero line is a loss." accent="lime">
          <AdminTrendChart
            label="Daily gross revenue and net profit"
            :dates="data.daily.map((d) => d.date)"
            :series="[
              { name: 'Gross revenue', values: data.daily.map((d) => d.grossRevenue) },
              { name: 'Net profit', values: data.daily.map((d) => d.netProfit) },
            ]"
            :format="cr"
            :height="240"
          />
        </AdminPanel>
        <AdminPanel title="Where free credits went" caption="Counted as a cost" accent="magenta">
          <AdminBarChart
            label="Free credits given by source"
            value-label="Credits"
            horizontal
            :items="data.freeCreditsBreakdown.map((b) => ({ label: b.label, value: Math.max(0, b.amount) }))"
            :format="cr"
            empty-text="No free credits were given in this range."
          />
        </AdminPanel>
      </div>
    </template>
  </ReportLayout>
</template>
