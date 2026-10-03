<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Search, ChevronLeft, ChevronRight, UserRound } from '@lucide/vue'
import * as adminReportsService from '@/services/adminReportsService'
import * as adminService from '@/services/adminService'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminPill from '@/components/admin/AdminPill.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
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
    <AdminPage :page-export="false" title="Reports" eyebrow="Audit" subtitle="Round outcomes and per-player betting activity. Read-only.">
      <template #actions>
        <ExportPdfButton :build="buildReport" />
      </template>

      <div class="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)]">
        <AdminPanel title="Rounds Report" caption="Most recent first" accent="ember" fill flush>
          <template v-if="roundsReport">
            <div class="adm-table-wrap">
              <table class="adm-table adm-table--dense min-w-[40rem]">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Status</th>
                    <th class="adm-num">Crash</th>
                    <th class="adm-num">Bets</th>
                    <th class="adm-num">Wagered</th>
                    <th class="adm-num">Paid Out</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in roundsReport.rounds" :key="r.roundId">
                    <td class="adm-strong adm-num-inline">#{{ r.roundNumber }}</td>
                    <td><AdminPill :label="r.status" /></td>
                    <td class="adm-num adm-strong">{{ r.crashMultiplier != null ? `${r.crashMultiplier.toFixed(2)}x` : '—' }}</td>
                    <td class="adm-num">{{ r.betCount }}</td>
                    <td class="adm-num">{{ r.totalWagered }}</td>
                    <td class="adm-num">{{ r.totalPaidOut }}</td>
                    <td class="adm-muted adm-num-inline">{{ new Date(r.createdAtUtc).toLocaleString() }}</td>
                  </tr>
                  <tr v-if="roundsReport.rounds.length === 0">
                    <td colspan="7" class="adm-empty">No rounds recorded yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <AdminLoading v-else />

          <template v-if="roundsReport" #footer>
            <AdminButton size="sm" variant="secondary" :disabled="roundsPage <= 1" @click="loadRoundsReport(roundsPage - 1)">
              <ChevronLeft aria-hidden="true" /> Previous
            </AdminButton>
            <span class="adm-num-inline">
              Page {{ roundsReport.page }} · {{ roundsReport.totalCount }} rounds total
            </span>
            <AdminButton
              size="sm"
              variant="secondary"
              :disabled="roundsPage * roundsReport.pageSize >= roundsReport.totalCount"
              @click="loadRoundsReport(roundsPage + 1)"
            >
              Next <ChevronRight aria-hidden="true" />
            </AdminButton>
          </template>
        </AdminPanel>

        <AdminPanel title="Player Activity" caption="Look up one player's bet history" accent="blue" fill flush>
          <template #toolbar>
            <div class="adm-toolbar flex-col !items-stretch">
              <label class="adm-label !mb-0" for="report-player-search">Search Player</label>
              <div class="flex gap-2">
                <div class="adm-search flex-1">
                  <Search aria-hidden="true" />
                  <input
                    id="report-player-search"
                    v-model="playerSearch"
                    type="text"
                    placeholder="username or email…"
                    class="adm-input"
                    @keyup.enter="searchPlayers"
                  />
                </div>
                <AdminButton variant="primary" :disabled="isSearchingPlayers" @click="searchPlayers">Search</AdminButton>
              </div>
              <div v-if="playerResults.length > 0" class="flex max-h-[4.25rem] flex-wrap gap-1.5 overflow-y-auto">
                <button
                  v-for="p in playerResults"
                  :key="p.playerId"
                  type="button"
                  data-player-chip
                  :class="[
                    'inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[0.8438rem] font-semibold transition-colors',
                    selectedPlayer?.playerId === p.playerId
                      ? 'border-[oklch(0.75_0.17_231/0.6)] bg-[oklch(0.75_0.17_231/0.15)] text-[var(--neon-blue)]'
                      : 'border-[var(--adm-border-strong)] bg-[var(--adm-field)] text-[var(--adm-text-2)] hover:border-[oklch(0.75_0.17_231/0.5)] hover:text-[var(--adm-text)]',
                  ]"
                  @click="selectPlayer(p)"
                >
                  <UserRound class="h-3.5 w-3.5" aria-hidden="true" />
                  {{ p.username }}
                </button>
              </div>
            </div>
          </template>

          <template v-if="selectedPlayer">
            <p class="flex-shrink-0 border-b border-[var(--adm-border)] px-4 py-2.5 text-[0.8438rem] font-semibold text-[var(--adm-text-2)]">
              Bet history — <span class="text-[var(--neon-blue)]">{{ selectedPlayer.username }}</span>
            </p>
            <div class="adm-table-wrap">
              <table class="adm-table adm-table--dense min-w-[32.5rem]">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th class="adm-num">Amount</th>
                    <th>Status</th>
                    <th class="adm-num">Cash Out</th>
                    <th class="adm-num">Payout</th>
                    <th>Placed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="b in playerBets" :key="b.betId">
                    <td class="adm-strong adm-num-inline">#{{ b.roundNumber }}</td>
                    <td class="adm-num">{{ b.amount }}</td>
                    <td><AdminPill :label="b.status" /></td>
                    <td class="adm-num">{{ b.cashOutMultiplier != null ? `${b.cashOutMultiplier.toFixed(2)}x` : '—' }}</td>
                    <td class="adm-num adm-strong">{{ b.payout ?? '—' }}</td>
                    <td class="adm-muted adm-num-inline">{{ new Date(b.placedAtUtc).toLocaleString() }}</td>
                  </tr>
                  <tr v-if="playerBets.length === 0">
                    <td colspan="6" class="adm-empty">No bets found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <div v-else class="adm-state flex-col !gap-2 px-6 text-center">
            <Search class="h-6 w-6 opacity-60" aria-hidden="true" />
            <span>Search for a player and select them to view their bet history.</span>
          </div>
        </AdminPanel>
      </div>
    </AdminPage>
  </AdminShell>
</template>
