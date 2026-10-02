<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plane, Check, Copy } from '@lucide/vue'
import { useLobbyStore } from '@/stores/lobbyStore'
import { usePlayerStore } from '@/stores/playerStore'
import { usePrivateLobbyStore } from '@/stores/privateLobbyStore'
import { usePublicSettingsStore } from '@/stores/publicSettingsStore'
import { useGameStore } from '@/stores/gameStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import StatusBadge from '@/components/sky/StatusBadge.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import ArcadeField from '@/components/sky/ArcadeField.vue'
import AchievementBadge from '@/components/sky/AchievementBadge.vue'
import LobbyFleet from '@/components/sky/LobbyFleet.vue'
import PilotAvatar from '@/components/sky/PilotAvatar.vue'
import { useLobbyMates } from '@/composables/useLobbyMates'
import { craftForMember, isLobbyFull } from '@/lib/lobby'
import { getCraft } from '@/lib/craft'

const lobbyStore = useLobbyStore()
const playerStore = usePlayerStore()
const privateLobbyStore = usePrivateLobbyStore()
const publicSettings = usePublicSettingsStore()
const gameStore = useGameStore()
const router = useRouter()
// Everyone else in your lobby flies past in the background, in their own plane.
const { mates } = useLobbyMates()

const newLobbyName = ref('')
const joinCode = ref('')
const isBusy = ref(false)
const codeCopied = ref(false)
const playButton = ref<{ $el: HTMLElement } | null>(null)

onMounted(() => {
  lobbyStore.fetchOnlinePlayers()
  privateLobbyStore.fetchMyLobby()
  // Admin-set lobby size, for the "up to N pilots" hint before joining.
  void publicSettings.load()
})

// Private lobbies never run their own round — they only add a social filter on
// top of the one global round feed every player (public or private) shares.
const lobbyBets = computed(() => {
  if (!privateLobbyStore.lobby) return []
  const memberIds = new Set(privateLobbyStore.lobby.members.map((m) => m.playerId))
  return gameStore.roundBets.filter((b) => memberIds.has(b.playerId))
})

const memberCount = computed(() => privateLobbyStore.lobby?.members.length ?? 0)
const lobbyFull = computed(() => isLobbyFull(memberCount.value, privateLobbyStore.capacity))
const joinCodeFull = computed(() => !!joinCode.value.trim() && privateLobbyStore.isKnownFull(joinCode.value))

/** Joining never drops the player into a flight: the PLAY button is their call. */
async function focusPlay() {
  await nextTick()
  playButton.value?.$el.focus()
}

async function handleCreate() {
  if (!newLobbyName.value.trim()) return
  isBusy.value = true
  try {
    await privateLobbyStore.create(newLobbyName.value.trim())
    newLobbyName.value = ''
    void focusPlay()
  } catch {
    // errorMessage is surfaced from the store
  } finally {
    isBusy.value = false
  }
}

async function handleJoin() {
  if (!joinCode.value.trim() || joinCodeFull.value) return
  isBusy.value = true
  try {
    await privateLobbyStore.join(joinCode.value.trim())
    joinCode.value = ''
    void focusPlay()
  } catch {
    // errorMessage (including the server's "lobby is full" 409) is surfaced from the store
  } finally {
    isBusy.value = false
  }
}

/** Private lobbies share the global round, so PLAY simply means: go fly it. */
function play() {
  router.push('/game')
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
    codeCopied.value = true
    setTimeout(() => (codeCopied.value = false), 1800)
  } catch {
    // Clipboard API can be unavailable (permissions, non-secure context) — the
    // code is already shown on screen, so this is a nice-to-have only.
  }
}
</script>

<template>
  <Shell skin="midnight" :dim="0.42">
    <template #backdrop>
      <LobbyFleet :mates="mates" />
    </template>
    <div class="mx-auto w-full max-w-md space-y-5">
      <div>
        <h1 class="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-electric text-glow-blue sm:text-3xl">
          Lobby
        </h1>
        <p class="mt-2 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {{ privateLobbyStore.lobby ? 'Your squadron is in the air' : 'Pilots online right now' }}
        </p>
      </div>

      <!-- In a lobby: a clear "joined" card; the player chooses when to PLAY. -->
      <div v-if="privateLobbyStore.lobby" role="status" aria-live="polite">
        <NeonPanel title="Lobby Joined" accent="lime" class="[box-shadow:var(--glow-lime)]">
          <p class="truncate font-display text-xl font-black uppercase tracking-[0.12em] text-foreground">
            {{ privateLobbyStore.lobby.name }}
          </p>
          <p class="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Host: <span class="text-foreground">{{ privateLobbyStore.lobby.hostUsername }}</span>
          </p>
          <p :class="['mt-3 font-arcade text-xs uppercase', lobbyFull ? 'text-ember text-glow-ember' : 'text-lime text-glow-lime']">
            {{ memberCount }} / {{ privateLobbyStore.capacity }} Players
          </p>

          <p
            v-if="lobbyFull"
            class="clip-hud mt-3 border-2 border-ember bg-ember/15 px-3 py-2 text-center font-arcade text-[10px] uppercase tracking-[0.2em] text-ember"
          >
            Lobby Full
          </p>

          <div class="mt-4 flex items-center justify-between gap-2">
            <p class="font-arcade text-[8px] uppercase tracking-[0.3em] text-muted-foreground">Invite Code</p>
            <button
              type="button"
              :aria-label="`Copy invite code ${privateLobbyStore.lobby.inviteCode}`"
              class="clip-hud flex items-center gap-2 border-2 border-electric/70 px-3 py-2 font-arcade text-xs uppercase tracking-[0.2em] text-electric transition-all hover:[box-shadow:var(--glow-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
              @click="copyInviteCode"
            >
              {{ privateLobbyStore.lobby.inviteCode }}
              <Check v-if="codeCopied" class="h-4 w-4 text-lime" aria-hidden="true" />
              <Copy v-else class="h-4 w-4" aria-hidden="true" />
              <span class="sr-only">{{ codeCopied ? 'Copied' : '' }}</span>
            </button>
          </div>

          <ArcadeButton ref="playButton" type="button" size="xl" variant="primary" class="mt-5 w-full" @click="play">
            <Plane class="h-6 w-6" aria-hidden="true" /> Play
          </ArcadeButton>

          <ul class="mt-5 divide-y divide-border/60" aria-label="Pilots in this lobby">
            <li
              v-for="member in privateLobbyStore.lobby.members"
              :key="member.playerId"
              class="flex items-center justify-between gap-2 py-2 text-sm"
            >
              <span class="flex min-w-0 items-center gap-2 font-display uppercase tracking-[0.14em] text-foreground">
                <PilotAvatar :username="member.username" />
                <AchievementBadge :achievement-key="member.displayedAchievementKey" />
                <span class="truncate">{{ member.username }}</span>
              </span>
              <span class="flex shrink-0 items-center gap-2">
                <img
                  :src="getCraft(craftForMember(member)).src"
                  :alt="`Flies the ${getCraft(craftForMember(member)).name}`"
                  :title="getCraft(craftForMember(member)).name"
                  width="1024"
                  height="1024"
                  class="h-7 w-7 object-contain"
                  :style="{ transform: `rotate(${getCraft(craftForMember(member)).rotate}deg)` }"
                />
                <StatusBadge v-if="member.isHost" status="TOP" />
                <StatusBadge v-else-if="member.playerId === playerStore.profile?.playerId" status="NEW" />
              </span>
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

      <NeonPanel v-else title="Private Squadron" accent="magenta">
        <p class="text-sm text-muted-foreground">
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
          <ArcadeButton
            type="submit"
            size="md"
            variant="blue"
            class="w-full"
            :disabled="isBusy || !joinCode.trim() || joinCodeFull"
            aria-describedby="join-full-hint"
          >
            {{ joinCodeFull ? 'Lobby Full' : 'Join Lobby' }}
          </ArcadeButton>
          <p id="join-full-hint" class="text-xs text-muted-foreground">
            Up to {{ privateLobbyStore.capacity }} players per lobby.
          </p>
        </form>

        <div
          v-if="joinCodeFull"
          role="alert"
          class="clip-hud mt-3 border-2 border-ember bg-ember/15 px-3 py-2 text-center"
        >
          <p class="font-arcade text-[10px] uppercase tracking-[0.2em] text-ember">Lobby Full</p>
          <p class="mt-1 text-sm text-foreground">{{ privateLobbyStore.errorMessage }}</p>
        </div>
        <p v-else-if="privateLobbyStore.errorMessage" role="alert" class="mt-3 text-sm font-semibold text-danger">
          {{ privateLobbyStore.errorMessage }}
        </p>
      </NeonPanel>

      <NeonPanel title="Pilots Online" accent="blue">
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
            <span class="flex min-w-0 items-center gap-2 font-display uppercase tracking-[0.14em] text-foreground">
              <PilotAvatar :username="player.username" />
              <AchievementBadge :achievement-key="player.displayedAchievementKey" />
              <span class="truncate">{{ player.username }}</span>
            </span>
            <StatusBadge v-if="player.playerId === playerStore.profile?.playerId" status="NEW" />
            <span v-else class="h-2 w-2 rounded-full bg-lime [box-shadow:var(--glow-lime)]" />
          </li>
        </ul>
      </NeonPanel>
    </div>
  </Shell>
</template>
