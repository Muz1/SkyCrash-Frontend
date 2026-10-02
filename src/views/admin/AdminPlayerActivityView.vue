<script setup lang="ts">
import { Users, UserCheck, UserPlus, Repeat, Gamepad2, Divide, Timer, Gauge } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminBarChart from '@/components/admin/AdminBarChart.vue'
import AdminTrendChart from '@/components/admin/AdminTrendChart.vue'
import { useReport } from '@/composables/useReport'
import { getPlayerActivity } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { count, plural } from '@/lib/reportFormat'

const { query, data, loading, error } = useReport(getPlayerActivity)
</script>

<template>
  <ReportLayout
    v-model:query="query"
    title="Player Activity"
    eyebrow="Game analytics"
    subtitle="Who is playing, who is new, who comes back, and for how long."
    :about="ABOUT.playerActivity!"
    :ready="!!data"
    :loading="loading"
    :error="error"
    :info="data?.range"
  >
    <template v-if="data">
      <div class="adm-kpis">
        <AdminKpi label="Registered players" :icon="Users" tone="violet" caption="All time">
          <span class="adm-num">{{ count(data.totalRegisteredPlayers) }}</span>
        </AdminKpi>
        <AdminKpi label="Active players" :icon="UserCheck" tone="lime">
          <span class="adm-num">{{ count(data.activePlayers) }}</span>
        </AdminKpi>
        <AdminKpi label="New players" :icon="UserPlus" tone="blue" caption="Signed up in this range">
          <span class="adm-num">{{ count(data.newPlayers) }}</span>
        </AdminKpi>
        <AdminKpi label="Returning players" :icon="Repeat" tone="magenta" caption="Active, signed up earlier">
          <span class="adm-num">{{ count(data.returningPlayers) }}</span>
        </AdminKpi>
        <AdminKpi label="Games played" :icon="Gamepad2" tone="ember">
          <span class="adm-num">{{ count(data.gamesPlayed) }}</span>
        </AdminKpi>
        <AdminKpi label="Games per player" :icon="Divide" tone="blue" caption="Among players who bet">
          <span class="adm-num">{{ data.averageGamesPerPlayer }}</span>
        </AdminKpi>
        <AdminKpi label="Avg session" :icon="Timer" tone="violet" :caption="plural(data.sessions, 'session')">
          <span class="adm-num">{{ data.averageSessionMinutes }} min</span>
        </AdminKpi>
        <AdminKpi label="Peak concurrent" :icon="Gauge" tone="lime" caption="Most online at once">
          <span class="adm-num">{{ count(data.peakConcurrentPlayers) }}</span>
        </AdminKpi>
      </div>

      <div class="adm-grid-2">
        <AdminPanel title="Active & new players" caption="Per day" accent="lime">
          <AdminTrendChart
            label="Active and new players per day"
            :dates="data.daily.map((d) => d.date)"
            :series="[
              { name: 'Active players', values: data.daily.map((d) => d.activePlayers) },
              { name: 'New players', values: data.daily.map((d) => d.newPlayers) },
            ]"
            :format="count"
            :height="230"
          />
        </AdminPanel>
        <AdminPanel title="Games played" caption="Per day" accent="ember">
          <AdminTrendChart
            label="Games played per day"
            :dates="data.daily.map((d) => d.date)"
            :series="[{ name: 'Games played', values: data.daily.map((d) => d.gamesPlayed) }]"
            :format="count"
            :height="230"
          />
        </AdminPanel>
        <AdminPanel title="Session length" caption="Completed sessions" accent="violet">
          <AdminBarChart
            label="Sessions by length"
            value-label="Sessions"
            :items="data.sessionLengths.map((b) => ({ label: b.label, value: b.count }))"
            :height="200"
          />
        </AdminPanel>
      </div>
    </template>
  </ReportLayout>
</template>
