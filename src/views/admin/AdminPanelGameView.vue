<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MonitorPlay, RefreshCw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import type { HubConnection } from '@microsoft/signalr'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import PanelLeaderboard from '@/components/admin/PanelLeaderboard.vue'
import FlightStage from '@/components/sky/FlightStage.vue'
import { getConnection } from '@/services/signalr'
import { useGameStore } from '@/stores/gameStore'
import { toCraft, type FlightRow } from '@/composables/useLobbyFlight'
import * as service from '@/services/accessLinkService'
import type { PanelOverview } from '@/services/accessLinkService'
import type { LobbyRoundBet } from '@/types'
import { apiError, apiMessage } from '@/lib/apiError'
import { cr, mult } from '@/lib/reportFormat'

/**
 * Spectator view of the panel lobby: the live round as the six panel pilots see it, who is
 * flying and with what stake, and their leaderboard. The admin's game connection joins the
 * lobby's group (WatchPanelLobby), so bets and cash-outs arrive live; admins can't bet.
 */
type Watch = { lobbyId: string; roundId: string | null; bets: LobbyRoundBet[] }

const gameStore = useGameStore()
const overview = ref<PanelOverview | null>(null)
const error = ref('')
const watching = ref(false)
let watchedLobbyId: string | null = null
let connection: HubConnection | null = null
let timer: ReturnType<typeof setInterval> | null = null
let alive = true

async function loadOverview() {
  try {
    overview.value = await service.getPanelOverview()
    error.value = ''
  } catch (e) {
    error.value =
      apiError(e).status === 404
        ? "The server doesn't have the panel lobby yet: the API needs redeploying (Render → skycrash-api → Manual Deploy → Deploy latest commit)."
        : (apiMessage(e) ?? 'Could not load the panel lobby.')
  }
}

/** The app opens the game connection after sign-in; wait for it (up to ~15 s). */
async function connected(): Promise<HubConnection | null> {
  for (let i = 0; i < 30 && alive; i++) {
    const c = getConnection()
    if (c.state === 'Connected') return c
    await new Promise((r) => setTimeout(r, 500))
  }
  return null
}

async function watch_() {
  connection = await connected()
  if (!connection) {
    error.value = 'The live game connection is not up yet. Refresh in a moment.'
    return
  }
  try {
    const w = await connection.invoke<Watch | null>('WatchPanelLobby')
    watching.value = !!w
    watchedLobbyId = w?.lobbyId ?? null
    if (w?.roundId) gameStore.applyLobbyRoundBets(w.roundId, w.bets)
  } catch {
    // An API without WatchPanelLobby (not redeployed yet): the leaderboard still works.
    watching.value = false
  }
}

const onMembership = () => void loadOverview()
const onReconnected = () => void watch_()

onMounted(async () => {
  await loadOverview()
  await watch_()
  connection?.on('LobbyMemberJoined', onMembership)
  connection?.on('LobbyMemberLeft', onMembership)
  connection?.onreconnected(onReconnected)
  // Balances, online dots and the leaderboard: refresh every 15 s.
  timer = setInterval(() => void loadOverview(), 15_000)
})

onBeforeUnmount(() => {
  alive = false
  if (timer) clearInterval(timer)
  connection?.off('LobbyMemberJoined', onMembership)
  connection?.off('LobbyMemberLeft', onMembership)
  if (connection && watchedLobbyId) void connection.invoke('UnwatchPanelLobby', watchedLobbyId).catch(() => undefined)
})

// A settled round changes the leaderboard.
watch(
  () => gameStore.phase,
  (p) => {
    if (p === 'Crashed') setTimeout(() => void loadOverview(), 1500)
  },
)

function statusFor(hasBet: boolean, cashedOut: boolean): FlightRow['status'] {
  if (!hasBet) return 'spectating'
  if (cashedOut) return 'cashed'
  if (gameStore.phase === 'Running') return 'flying'
  if (gameStore.phase === 'Crashed') return 'crashed'
  return 'ready'
}

const pilots = computed<FlightRow[]>(() =>
  (overview.value?.members ?? [])
    .map((m) => {
      const bet = gameStore.lobbyBets[m.playerId]
      return {
        playerId: m.playerId,
        username: m.username,
        achievementKey: null,
        craftId: toCraft(bet?.craftId ?? m.equippedCraftId),
        isMe: false,
        isHost: false,
        bet: bet?.amount ?? null,
        status: statusFor(!!bet, bet?.status === 'CashedOut'),
        cashOutMultiplier: bet?.cashOutMultiplier ?? null,
      }
    })
    .sort((a, b) => Number(b.bet !== null) - Number(a.bet !== null)),
)
const lead = computed(() => pilots.value.find((p) => p.bet !== null) ?? pilots.value[0])
const online = computed(() => overview.value?.members.filter((m) => m.online).length ?? 0)
const onlineIds = computed(() => new Set(overview.value?.members.filter((m) => m.online).map((m) => m.playerId)))

const STATUS_TEXT: Record<FlightRow['status'], string> = {
  spectating: 'Sitting out',
  ready: 'Bet placed',
  flying: 'Flying',
  cashed: 'Cashed out',
  crashed: 'Crashed',
}
const phaseText = computed(() =>
  gameStore.phase === 'Waiting'
    ? `Betting open${gameStore.countdownSeconds != null ? ` · ${gameStore.countdownSeconds}s` : ''}`
    : gameStore.phase === 'Running'
      ? `Flying · ${mult(gameStore.currentMultiplier)}`
      : gameStore.phase === 'Crashed'
        ? `Crashed at ${mult(gameStore.currentMultiplier)}`
        : 'Waiting for the next round',
)
</script>

<template>
  <AdminShell help-text="Watch the panel play. Every panel pilot is put in the same lobby when they open their link or QR code. This page shows the live round as they see it, each pilot's stake and result this round, and the leaderboard over all their rounds. You only watch: admins can't bet.">
    <AdminPage title="Panel game" eyebrow="Game management" subtitle="The panel's shared lobby, live, with their leaderboard.">
      <template #actions>
        <AdminButton @click="loadOverview"><RefreshCw aria-hidden="true" /> Refresh</AdminButton>
        <RouterLink to="/watch/panel" class="inline-flex">
          <AdminButton variant="primary"><MonitorPlay aria-hidden="true" /> Watch in their lobby</AdminButton>
        </RouterLink>
      </template>

      <p v-if="error" class="adm-error" role="alert">{{ error }}</p>
      <AdminLoading v-if="!overview && !error" text="Loading the panel lobby…" />

      <template v-if="overview">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <AdminPanel
            :title="overview.lobbyName"
            :caption="`Lobby code ${overview.inviteCode} · ${online} of ${overview.members.length} online · ${phaseText}`"
            accent="magenta"
            flush
          >
            <div class="relative h-[clamp(16rem,42dvh,26rem)] overflow-hidden rounded-b-[inherit] bg-void">
              <FlightStage v-if="lead" :craft="lead.craftId" :wingmen="pilots.filter((p) => p !== lead)" class="h-full" />
              <div v-else class="adm-state h-full !text-[#d8ccf5]">
                No pilots in the lobby yet. They join it as soon as they open their link or QR code.
              </div>
            </div>
            <p v-if="!watching && overview.members.length" class="adm-note px-4 py-2">
              Live bets will show once the API is redeployed with the panel lobby update. The leaderboard below already works.
            </p>
          </AdminPanel>

          <AdminPanel title="This round" caption="Each pilot's stake and result, live" accent="blue" flush>
            <div class="adm-table-wrap">
              <table class="adm-table">
                <thead>
                  <tr><th>Pilot</th><th>Status</th><th class="adm-num">Stake</th><th class="adm-num">Cash-out</th></tr>
                </thead>
                <tbody>
                  <tr v-for="p in pilots" :key="p.playerId">
                    <td class="adm-strong">
                      <span
                        class="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                        :style="{ background: onlineIds.has(p.playerId) ? 'var(--neon-lime)' : 'var(--adm-border)' }"
                        :aria-label="onlineIds.has(p.playerId) ? 'Online' : 'Offline'"
                        role="img"
                      />{{ p.username }}
                    </td>
                    <td>{{ STATUS_TEXT[p.status] }}</td>
                    <td class="adm-num">{{ p.bet === null ? '—' : cr(p.bet) }}</td>
                    <td class="adm-num">{{ p.cashOutMultiplier == null ? '—' : mult(p.cashOutMultiplier) }}</td>
                  </tr>
                  <tr v-if="pilots.length === 0"><td colspan="4" class="adm-empty">Nobody in the lobby yet.</td></tr>
                </tbody>
              </table>
            </div>
          </AdminPanel>
        </div>

        <PanelLeaderboard :rows="overview.leaderboard" />
      </template>
    </AdminPage>
  </AdminShell>
</template>
