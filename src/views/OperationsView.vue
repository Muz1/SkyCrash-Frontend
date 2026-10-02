<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Users, Radio, Hash, RefreshCw, Coins, Gauge } from '@lucide/vue'
import { useOperationsStore } from '@/stores/operationsStore'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminKpi from '@/components/admin/AdminKpi.vue'
import AdminPill from '@/components/admin/AdminPill.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import ExportPdfButton from '@/components/sky/ExportPdfButton.vue'
import { buildOperationsReport } from '@/lib/adminReports'

const operationsStore = useOperationsStore()

function buildReport() {
  return operationsStore.metrics ? buildOperationsReport(operationsStore.metrics) : null
}

onMounted(() => {
  operationsStore.startPolling()
})

onUnmounted(() => {
  operationsStore.stopPolling()
})
</script>

<template>
  <AdminShell
    help-text="A live snapshot of the game: how many players are currently online, the current round's status and number, how much has been wagered and how many rounds have run in the last hour, and how many bets are active on the round right now. Refreshes automatically every few seconds."
  >
    <AdminPage title="Operations" eyebrow="Live monitoring" subtitle="A live snapshot of the game, refreshed every few seconds.">
      <template #actions>
        <span class="adm-live">Live</span>
        <ExportPdfButton :build="buildReport" />
      </template>

      <div v-if="operationsStore.metrics" class="grid min-h-0 flex-1 grid-cols-2 grid-rows-[repeat(3,minmax(0,240px))] content-start gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))] lg:grid-rows-[repeat(2,minmax(0,300px))]">
        <AdminKpi label="Online Players" :icon="Users" tone="blue" caption="Connected right now" large fill>
          <span class="adm-num">{{ operationsStore.metrics.onlinePlayers }}</span>
        </AdminKpi>
        <AdminKpi label="Round Status" :icon="Radio" tone="magenta" caption="State of the current round" large fill>
          <AdminPill :label="operationsStore.metrics.currentRoundStatus" class="!h-[1.3em] !px-[0.45em] !text-[clamp(22px,4vh,40px)]" />
        </AdminKpi>
        <AdminKpi label="Current Round" :icon="Hash" tone="violet" caption="Round number in progress" large fill>
          <span class="adm-num">#{{ operationsStore.metrics.currentRoundNumber ?? '—' }}</span>
        </AdminKpi>
        <AdminKpi label="Rounds (Last Hour)" :icon="RefreshCw" tone="lime" caption="Rounds completed in 60 minutes" large fill>
          <span class="adm-num">{{ operationsStore.metrics.roundsLastHour }}</span>
        </AdminKpi>
        <AdminKpi label="Wagered (Last Hour)" :icon="Coins" tone="ember" caption="Credits staked in 60 minutes" large fill>
          <span class="adm-num">{{ operationsStore.metrics.totalWageredLastHour }}</span>
        </AdminKpi>
        <AdminKpi label="Active Bets (Round)" :icon="Gauge" tone="blue" caption="Open bets on this round" large fill>
          <span class="adm-num">{{ operationsStore.metrics.activeBetsThisRound }}</span>
        </AdminKpi>
      </div>

      <AdminPanel v-else fill>
        <AdminLoading text="Loading metrics…" />
      </AdminPanel>
    </AdminPage>
  </AdminShell>
</template>
