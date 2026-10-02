<script setup lang="ts">
import { Users, UserCheck, Gamepad2, Radio, Coins, HandCoins, TrendingUp, Rocket, MessageSquareHeart } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminTrendChart from '@/components/admin/AdminTrendChart.vue'
import { useReport } from '@/composables/useReport'
import { getOverview } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { count, mult, rand } from '@/lib/reportFormat'

const { query, data, loading, error } = useReport(getOverview)
</script>

<template>
  <ReportLayout
    v-model:query="query"
    title="Overview"
    eyebrow="Admin dashboard"
    subtitle="How Sky Crash is performing at a glance."
    :about="ABOUT.overview!"
    :ready="!!data"
    :loading="loading"
    :error="error"
    :info="data?.range"
  >
    <template v-if="data">
      <div class="adm-kpis">
        <AdminKpi label="Total players" :icon="Users" tone="violet" caption="Registered accounts">
          <span class="adm-num">{{ count(data.totalPlayers) }}</span>
        </AdminKpi>
        <AdminKpi label="Active players" :icon="UserCheck" tone="lime" caption="Played in this range">
          <span class="adm-num">{{ count(data.activePlayers) }}</span>
        </AdminKpi>
        <AdminKpi label="Games played" :icon="Gamepad2" tone="blue" caption="Resolved bets">
          <span class="adm-num">{{ count(data.gamesPlayed) }}</span>
        </AdminKpi>
        <AdminKpi label="Active games" :icon="Radio" tone="magenta" caption="Bets in the air right now">
          <span class="adm-num">{{ count(data.activeGames) }}</span>
        </AdminKpi>
        <AdminKpi label="Total wagered" :icon="Coins" tone="blue">
          <span class="adm-num">{{ rand(data.totalWagered) }}</span>
        </AdminKpi>
        <AdminKpi label="Total payouts" :icon="HandCoins" tone="ember">
          <span class="adm-num">{{ rand(data.totalPayouts) }}</span>
        </AdminKpi>
        <AdminKpi label="Profit" :icon="TrendingUp" :tone="data.netProfit >= 0 ? 'lime' : 'magenta'" caption="Net, after free credits">
          <span class="adm-num">{{ rand(data.netProfit) }}</span>
        </AdminKpi>
        <AdminKpi label="Average multiplier" :icon="Rocket" tone="violet" caption="Average crash point">
          <span class="adm-num">{{ mult(data.averageCrashMultiplier) }}</span>
        </AdminKpi>
        <AdminKpi label="Feedback responses" :icon="MessageSquareHeart" tone="magenta">
          <span class="adm-num">{{ count(data.feedbackResponses) }}</span>
        </AdminKpi>
      </div>

      <div class="adm-grid-2">
        <AdminPanel title="Wagered vs paid out" caption="Per day. The gap between the lines is gross revenue." accent="blue">
          <AdminTrendChart
            label="Daily total wagered versus total payouts"
            :dates="data.dailyWagered.map((d) => d.date)"
            :series="[
              { name: 'Wagered', values: data.dailyWagered.map((d) => d.value) },
              { name: 'Paid out', values: data.dailyPayouts.map((d) => d.value) },
            ]"
            :format="rand"
            :height="230"
          />
        </AdminPanel>
        <AdminPanel title="Active players" caption="Distinct players per day" accent="lime">
          <AdminTrendChart
            label="Daily active players"
            :dates="data.dailyActivePlayers.map((d) => d.date)"
            :series="[{ name: 'Active players', values: data.dailyActivePlayers.map((d) => d.value) }]"
            :format="count"
            :height="230"
          />
        </AdminPanel>
      </div>
    </template>
  </ReportLayout>
</template>
