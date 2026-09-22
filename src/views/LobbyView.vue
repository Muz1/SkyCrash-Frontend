<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useLobbyStore } from '@/stores/lobbyStore'
import { usePlayerStore } from '@/stores/playerStore'
import { usePrivateLobbyStore } from '@/stores/privateLobbyStore'
import { useGameStore } from '@/stores/gameStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import StatusBadge from '@/components/sky/StatusBadge.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import AchievementBadge from '@/components/sky/AchievementBadge.vue'

const lobbyStore = useLobbyStore()
const playerStore = usePlayerStore()
const privateLobbyStore = usePrivateLobbyStore()
const gameStore = useGameStore()

const newLobbyName = ref('')
const joinCode = ref('')
const isBusy = ref(false)

onMounted(() => {
  lobbyStore.fetchOnlinePlayers()
  privateLobbyStore.fetchMyLobby()
})

// Private lobbies never run their own round — they only add a social filter on
// top of the one global round feed every player (public or private) shares.
const lobbyBets = computed(() => {
  if (!privateLobbyStore.lobby) return []
  const memberIds = new Set(privateLobbyStore.lobby.members.map((m) => m.playerId))
  return gameStore.roundBets.filter((b) => memberIds.has(b.playerId))
})

async function handleCreate() {
  if (!newLobbyName.value.trim()) return
  isBusy.value = true
  try {
    await privateLobbyStore.create(newLobbyName.value.trim())
    newLobbyName.value = ''
  } catch {
    // errorMessage is surfaced from the store
  } finally {
    isBusy.value = false
  }
}

async function handleJoin() {
  if (!joinCode.value.trim()) return
  isBusy.value = true
  try {
    await privateLobbyStore.join(joinCode.value.trim())
    joinCode.value = ''
  } catch {
    // errorMessage is surfaced from the store
  } finally {
    isBusy.value = false
  }
}

async function handleLeave() {
  isBusy.value = true
  try {
    await privateLobbyStore.leave()
  } finally {
    isBusy.value = false
  }
}

async function copyInviteCode() {
  if (!privateLobbyStore.lobby) return
  try {
    await navigator.clipboard.writeText(privateLobbyStore.lobby.inviteCode)
  } catch {
    // Clipboard API can be unavailable (permissions, non-secure context) — the
    // code is already shown on screen, so this is a nice-to-have only.
  }
}
</script>

<template>
  <Shell skin="midnight" :dim="0.55">
    <div class="mx-auto w-full max-w-md space-y-5">
      <div>
        <h1 class="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-electric text-glow-blue sm:text-3xl">
          Lobby
        </h1>
        <p class="mt-2 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Pilots online right now
        </p>
      </div>

      <NeonPanel accent="blue">
        <p v-if="lobbyStore.isLoading && lobbyStore.onlinePlayers.length === 0" class="text-sm text-muted-foreground">
          Loading…
        </p>
        <p v-else-if="lobbyStore.onlinePlayers.length === 0" class="text-sm text-muted-foreground">
          No one else is online right now.
        </p>
        <ul v-else class="divide-y divide-border/60">
          <li
            v-for="player in lobbyStore.onlinePlayers"
            :key="player.playerId"
            class="flex items-center justify-between py-3 text-sm"
          >
            <span class="flex items-center gap-1.5 font-display uppercase tracking-[0.14em] text-foreground">
              <AchievementBadge :achievement-key="player.displayedAchievementKey" />
              {{ player.username }}
            </span>
            <StatusBadge v-if="player.playerId === playerStore.profile?.playerId" status="NEW" />
            <span v-else class="h-2 w-2 rounded-full bg-lime [box-shadow:var(--glow-lime)]" />
          </li>
        </ul>
      </NeonPanel>

      <NeonPanel v-if="!privateLobbyStore.lobby" title="Private Squadron" accent="magenta">
        <p class="text-xs text-muted-foreground">
          Create an invite-only lobby, or join one with a code. Private lobbies are just a
          social grouping — everyone still plays the same shared round.
        </p>

        <form class="mt-4 space-y-2" @submit.prevent="handleCreate">
          <ArcadeField v-model="newLobbyName" label="Lobby name" placeholder="Wingmen" />
          <ArcadeButton type="submit" size="md" variant="magenta" class="w-full" :disabled="isBusy || !newLobbyName.trim()">
            Create Lobby
          </ArcadeButton>
        </form>

        <div class="my-4 h-px bg-border/60" />

        <form class="space-y-2" @submit.prevent="handleJoin">
          <ArcadeField v-model="joinCode" label="Invite code" placeholder="ABC123" />
          <ArcadeButton type="submit" size="md" variant="blue" class="w-full" :disabled="isBusy || !joinCode.trim()">
            Join Lobby
          </ArcadeButton>
        </form>

        <p v-if="privateLobbyStore.errorMessage" class="mt-3 text-xs uppercase tracking-[0.2em] text-danger">
          {{ privateLobbyStore.errorMessage }}
        </p>
      </NeonPanel>

      <NeonPanel v-else :title="privateLobbyStore.lobby.name" accent="magenta">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Host: <span class="text-foreground">{{ privateLobbyStore.lobby.hostUsername }}</span>
          </p>
          <button
            type="button"
            class="clip-hud border border-electric/50 px-2 py-1 font-arcade text-[9px] uppercase text-electric transition-all hover:[box-shadow:var(--glow-blue)]"
            @click="copyInviteCode"
          >
            Code: {{ privateLobbyStore.lobby.inviteCode }}
          </button>
        </div>

        <ul class="mt-4 divide-y divide-border/60">
          <li
            v-for="member in privateLobbyStore.lobby.members"
            :key="member.playerId"
            class="flex items-center justify-between py-2 text-sm"
          >
            <span class="flex items-center gap-1.5 font-display uppercase tracking-[0.14em] text-foreground">
              <AchievementBadge :achievement-key="member.displayedAchievementKey" />
              {{ member.username }}
            </span>
            <StatusBadge v-if="member.isHost" status="TOP" />
          </li>
        </ul>

        <div v-if="lobbyBets.length > 0" class="mt-4">
          <p class="font-arcade text-[8px] uppercase tracking-[0.3em] text-muted-foreground">This round</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="(b, i) in lobbyBets"
              :key="`${b.playerId}-${i}`"
              :class="[
                'clip-hud border px-2 py-1 font-arcade text-[8px]',
                b.kind === 'cashout' ? 'border-lime/50 text-lime' : 'border-violet/40 text-muted-foreground',
              ]"
            >
              {{ b.username }}: {{ b.kind === 'cashout' ? `+${b.amount} @ ${b.cashOutMultiplier?.toFixed(2)}x` : b.amount }}
            </span>
          </div>
        </div>

        <ArcadeButton type="button" size="sm" variant="danger" class="mt-4 w-full" :disabled="isBusy" @click="handleLeave">
          Leave Lobby
        </ArcadeButton>
      </NeonPanel>
    </div>
  </Shell>
</template>
