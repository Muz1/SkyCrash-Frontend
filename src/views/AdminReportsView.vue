<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as adminReportsService from '@/services/adminReportsService'
import * as adminService from '@/services/adminService'
import AdminShell from '@/components/sky/AdminShell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import ExportPdfButton from '@/components/sky/ExportPdfButton.vue'
import { buildReportsPageReport } from '@/lib/adminReports'
import type { AdminPlayerSummary, BetHistoryEntry, RoundReportResponse } from '@/types'

const roundsReport = ref<RoundReportResponse | null>(null)
const roundsPage = ref(1)

const playerSearch = ref('')
const playerResults = ref<AdminPlayerSummary[]>([])
const selectedPlayer = ref<AdminPlayerSummary | null>(null)
const playerBets = ref<BetHistoryEntry[]>([])
const isSearchingPlayers = ref(false)

function buildReport() {
  if (!roundsReport.value) return null
  return buildReportsPageReport(
    roundsReport.value,
    selectedPlayer.value ? { player: selectedPlayer.value, bets: playerBets.value } : null,
  )
}

async function loadRoundsReport(page: number) {
  roundsPage.value = page
  roundsReport.value = await adminReportsService.getRoundsReport(page)
}

async function searchPlayers() {
  isSearchingPlayers.value = true
  try {
    playerResults.value = await adminService.getPlayers({ search: playerSearch.value || undefined })
  } finally {
    isSearchingPlayers.value = false
  }
}

async function selectPlayer(player: AdminPlayerSummary) {
  selectedPlayer.value = player
  playerBets.value = await adminReportsService.getPlayerBetHistory(player.playerId)
}

onMounted(() => {
  loadRoundsReport(1)
})
</script>

<template>
  <AdminShell
    help-text="Rounds Report lists every round with its outcome and betting activity, most recent first. Player Activity lets you look up one player's full bet history for support or investigation purposes. Both are read-only."
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <h1 class="font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
        Reports
      </h1>
      <ExportPdfButton :build="buildReport" />
    </div>

    <NeonPanel class="mt-5" title="Rounds Report" accent="ember">
      <div v-if="roundsReport" class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead class="whitespace-nowrap font-arcade text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
            <tr>
              <th class="py-2 pr-4">Round</th>
              <th class="pr-4">Status</th>
              <th class="pr-4">Crash</th>
              <th class="pr-4">Bets</th>
              <th class="pr-4">Wagered</th>
              <th class="pr-4">Paid Out</th>
              <th class="pr-4">Created</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border/60">
            <tr v-for="r in roundsReport.rounds" :key="r.roundId" class="whitespace-nowrap">
              <td class="py-2 pr-4 text-foreground">#{{ r.roundNumber }}</td>
              <td class="pr-4">{{ r.status }}</td>
              <td class="pr-4 text-ember">{{ r.crashMultiplier?.toFixed(2) ?? '—' }}x</td>
              <td class="pr-4">{{ r.betCount }}</td>
              <td class="pr-4">{{ r.totalWagered }}</td>
              <td class="pr-4">{{ r.totalPaidOut }}</td>
              <td class="pr-4 text-muted-foreground">{{ new Date(r.createdAtUtc).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>

        <div class="mt-4 flex items-center justify-between">
          <ArcadeButton size="sm" variant="ghost" :disabled="roundsPage <= 1" @click="loadRoundsReport(roundsPage - 1)">
            Previous
          </ArcadeButton>
          <span class="text-xs text-muted-foreground">
            Page {{ roundsReport.page }} · {{ roundsReport.totalCount }} rounds total
          </span>
          <ArcadeButton
            size="sm"
            variant="ghost"
            :disabled="roundsPage * roundsReport.pageSize >= roundsReport.totalCount"
            @click="loadRoundsReport(roundsPage + 1)"
          >
            Next
          </ArcadeButton>
        </div>
      </div>
      <p v-else class="text-muted-foreground">Loading…</p>
    </NeonPanel>

    <NeonPanel class="mt-5" title="Player Activity" accent="blue">
      <div class="flex flex-wrap gap-2">
        <ArcadeField
          v-model="playerSearch"
          label="Search Player"
          placeholder="username or email…"
          class="min-w-[220px] flex-1"
          @keyup.enter="searchPlayers"
        />
        <ArcadeButton size="sm" variant="blue" class="self-end" :disabled="isSearchingPlayers" @click="searchPlayers">
          Search
        </ArcadeButton>
      </div>

      <div v-if="playerResults.length > 0" class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="p in playerResults"
          :key="p.playerId"
          type="button"
          class="clip-hud border border-violet/40 bg-void/50 px-3 py-1.5 text-xs text-foreground transition-colors hover:border-electric hover:text-electric"
          @click="selectPlayer(p)"
        >
          {{ p.username }}
        </button>
      </div>

      <div v-if="selectedPlayer" class="mt-4">
        <p class="font-arcade text-[9px] uppercase tracking-[0.2em] text-electric">
          Bet history — {{ selectedPlayer.username }}
        </p>
        <div class="mt-2 overflow-x-auto">
          <table class="w-full min-w-[520px] text-left text-sm">
            <thead class="whitespace-nowrap font-arcade text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th class="py-2 pr-4">Round</th>
                <th class="pr-4">Amount</th>
                <th class="pr-4">Status</th>
                <th class="pr-4">Cash Out</th>
                <th class="pr-4">Payout</th>
                <th class="pr-4">Placed</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/60">
              <tr v-for="b in playerBets" :key="b.betId" class="whitespace-nowrap">
                <td class="py-2 pr-4">#{{ b.roundNumber }}</td>
                <td class="pr-4">{{ b.amount }}</td>
                <td class="pr-4">{{ b.status }}</td>
                <td class="pr-4">{{ b.cashOutMultiplier?.toFixed(2) ?? '—' }}x</td>
                <td class="pr-4">{{ b.payout ?? '—' }}</td>
                <td class="pr-4 text-muted-foreground">{{ new Date(b.placedAtUtc).toLocaleString() }}</td>
              </tr>
              <tr v-if="playerBets.length === 0">
                <td colspan="6" class="py-3 text-center text-muted-foreground">No bets found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </NeonPanel>
  </AdminShell>
</template>
