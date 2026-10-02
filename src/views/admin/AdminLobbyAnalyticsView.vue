<script setup lang="ts">
import { Boxes, PlusSquare, Users, Maximize2, LogIn, UsersRound } from '@lucide/vue'
import ReportLayout from '@/components/admin/ReportLayout.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminTrendChart from '@/components/admin/AdminTrendChart.vue'
import { useReport } from '@/composables/useReport'
import { getLobbyReport } from '@/services/adminAnalyticsService'
import { ABOUT } from '@/lib/reportAbout'
import { count } from '@/lib/reportFormat'

const { query, data, loading, error } = useReport(getLobbyReport)
</script>

<template>
  <ReportLayout
    v-model:query="query"
    title="Lobby Analytics"
    eyebrow="Game analytics"
    subtitle="How players use private lobbies."
    :about="ABOUT.lobbies!"
    :ready="!!data"
    :loading="loading"
    :error="error"
    :info="data?.range"
  >
    <template v-if="data">
      <div class="adm-kpis">
        <AdminKpi label="Active lobbies" :icon="Boxes" tone="blue" caption="Open right now">
          <span class="adm-num">{{ count(data.activeLobbies) }}</span>
        </AdminKpi>
        <AdminKpi label="Lobbies created" :icon="PlusSquare" tone="violet" :caption="`${count(data.lobbiesCreatedAllTime)} all time`">
          <span class="adm-num">{{ count(data.lobbiesCreated) }}</span>
        </AdminKpi>
        <AdminKpi label="Average lobby size" :icon="Users" tone="lime" caption="Active lobbies">
          <span class="adm-num">{{ data.averageLobbySize }}</span>
        </AdminKpi>
        <AdminKpi label="Largest lobby" :icon="Maximize2" tone="ember" :caption="`Limit: ${data.maxPlayersSetting} players`">
          <span class="adm-num">{{ data.largestLobbySize }} / {{ data.maxPlayersSetting }}</span>
        </AdminKpi>
        <AdminKpi label="Players in lobbies" :icon="UsersRound" tone="magenta" caption="Right now">
          <span class="adm-num">{{ count(data.playersInLobbies) }}</span>
        </AdminKpi>
        <AdminKpi label="Lobby joins" :icon="LogIn" tone="blue" caption="In this range">
          <span class="adm-num">{{ count(data.joins) }}</span>
        </AdminKpi>
      </div>

      <AdminPanel title="Lobby join activity" caption="Joins and new lobbies per day" accent="blue">
        <AdminTrendChart
          label="Lobby joins and lobbies created per day"
          :dates="data.dailyJoins.map((d) => d.date)"
          :series="[
            { name: 'Joins', values: data.dailyJoins.map((d) => d.value) },
            { name: 'Lobbies created', values: data.dailyLobbiesCreated.map((d) => d.value) },
          ]"
          :format="count"
          :height="230"
        />
      </AdminPanel>
    </template>
  </ReportLayout>
</template>
