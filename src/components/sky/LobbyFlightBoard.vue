<script setup lang="ts">
import { computed, ref } from 'vue'
import { Users } from '@lucide/vue'
import AchievementBadge from './AchievementBadge.vue'
import { getCraft } from '@/lib/craft'
import type { FlightRow } from '@/composables/useLobbyFlight'

/**
 * Who's flying this round: my flight on top, then everyone in my private lobby with their
 * plane, stake and live status.
 *   mode="panel": always-open card in the flight stage's top-left (empty sky: the plane
 *                 climbs from the bottom-left towards the top-right).
 *   mode="chip":  phones. A small button for the round strip that opens the same board
 *                 as an overlay, so nothing covers the plane.
 */
const props = withDefaults(
  defineProps<{
    me: FlightRow
    mates: FlightRow[]
    inLobby: boolean
    lobbyName: string | null
    multiplier: number
    mode?: 'panel' | 'chip'
  }>(),
  { mode: 'panel' },
)

const open = ref(false)
const airborneCount = computed(
  () =>
    props.mates.filter((m) => m.status === 'flying').length +
    (props.me.status === 'flying' ? 1 : 0),
)
const bettingCount = computed(() => props.mates.filter((m) => m.bet !== null).length)

function statusText(row: FlightRow) {
  switch (row.status) {
    case 'ready':
      return 'Ready'
    case 'flying':
      return `Flying ${props.multiplier.toFixed(2)}x`
    case 'cashed':
      return `Cashed out ${row.cashOutMultiplier?.toFixed(2) ?? ''}x`
    case 'crashed':
      return 'Crashed'
    default:
      return 'No bet'
  }
}

function statusClass(row: FlightRow) {
  switch (row.status) {
    case 'ready':
      return 'border-ember/70 text-ember'
    case 'flying':
      return 'border-electric/70 text-electric'
    case 'cashed':
      return 'border-lime/70 text-lime'
    case 'crashed':
      return 'border-danger/70 text-danger'
    default:
      return 'border-violet/40 text-muted-foreground'
  }
}
</script>

<template>
  <div
    :class="
      mode === 'panel'
        ? 'absolute left-0 top-24 z-10 hidden max-h-[calc(100%-7rem)] flex-col lg:flex'
        : 'shrink-0 lg:hidden'
    "
  >
    <button
      v-if="mode === 'chip'"
      type="button"
      class="clip-hud flex h-8 items-center gap-1.5 border-2 border-magenta/60 bg-void/80 px-2 font-arcade text-[0.5rem] uppercase text-magenta"
      :aria-expanded="open"
      aria-controls="lobby-flight-board"
      @click="open = !open"
    >
      <Users class="h-3 w-3" aria-hidden="true" />
      {{ inLobby ? `${mates.length + 1} pilots` : 'Solo' }}
      <span v-if="airborneCount > 0" class="text-electric">· {{ airborneCount }} up</span>
    </button>

    <!-- On phones the open board goes to <body> so it layers above the game screen's banners. -->
    <Teleport to="body" :disabled="mode === 'panel'">
      <div
        v-if="mode === 'chip' && open"
        class="fixed inset-0 z-[60] bg-void/50"
        aria-hidden="true"
        @click="open = false"
      />
      <section
        v-if="mode === 'panel' || open"
        :id="mode === 'chip' ? 'lobby-flight-board' : undefined"
        aria-label="Pilots in this round"
        :class="[
          'neon-panel clip-hud min-h-0 overflow-y-auto p-2',
          mode === 'panel'
            ? 'w-64'
            : 'fixed inset-x-3 top-[calc(env(safe-area-inset-top)+7rem)] z-[61] max-h-[60dvh]',
        ]"
      >
        <p class="font-display text-[0.5625rem] font-black uppercase tracking-[0.3em] text-ember">
          My flight
        </p>
        <div class="mt-1 flex items-center gap-2">
          <img
            :src="getCraft(me.craftId).src"
            :alt="`Your plane: ${getCraft(me.craftId).name}`"
            width="1024"
            height="1024"
            class="h-7 w-7 shrink-0 object-contain"
            :style="{ transform: `rotate(${getCraft(me.craftId).rotate}deg)` }"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-foreground">
              {{ me.username }} <span class="text-xs font-normal text-muted-foreground">(you)</span>
            </p>
            <p class="text-xs text-muted-foreground">
              {{ me.bet !== null ? `Bet ${me.bet.toLocaleString()}` : 'No bet this round' }}
            </p>
          </div>
          <span
            :class="[
              'clip-hud shrink-0 border px-1.5 py-0.5 font-arcade text-[0.4375rem] uppercase',
              statusClass(me),
            ]"
            >{{ statusText(me) }}</span
          >
        </div>

        <div class="mt-2 border-t border-violet/40 pt-2">
          <template v-if="inLobby">
            <p
              class="flex items-baseline justify-between gap-2 font-display text-[0.5625rem] font-black uppercase tracking-[0.3em] text-magenta"
            >
              <span class="truncate">Lobby · {{ lobbyName }}</span>
              <span class="shrink-0 font-arcade text-[0.4375rem] tracking-normal text-muted-foreground"
                >{{ bettingCount }}/{{ mates.length }} bet</span
              >
            </p>
            <ul v-if="mates.length > 0" class="mt-1 flex flex-col gap-1.5">
              <li
                v-for="m in mates"
                :key="m.playerId"
                :class="[
                  'flex items-center gap-2 transition-opacity',
                  m.status === 'spectating' ? 'opacity-60' : '',
                ]"
              >
                <img
                  :src="getCraft(m.craftId).src"
                  :alt="`${m.username} flies the ${getCraft(m.craftId).name}`"
                  width="1024"
                  height="1024"
                  :class="[
                    'h-6 w-6 shrink-0 object-contain',
                    m.status === 'crashed' ? 'grayscale' : '',
                  ]"
                  :style="{ transform: `rotate(${getCraft(m.craftId).rotate}deg)` }"
                />
                <div class="min-w-0 flex-1">
                  <p class="flex items-center gap-1 truncate text-sm font-semibold text-foreground">
                    <AchievementBadge :achievement-key="m.achievementKey" size="xs" />
                    <span class="truncate">{{ m.username }}</span>
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ m.bet !== null ? `Bet ${m.bet.toLocaleString()}` : 'Watching' }}
                  </p>
                </div>
                <span
                  :class="[
                    'clip-hud shrink-0 border px-1.5 py-0.5 font-arcade text-[0.4375rem] uppercase',
                    statusClass(m),
                  ]"
                  >{{ statusText(m) }}</span
                >
              </li>
            </ul>
            <p v-else class="mt-1 text-xs text-muted-foreground">
              No one else here yet. Share your invite code from the
              <RouterLink
                to="/lobby"
                class="font-semibold text-electric underline-offset-2 hover:underline"
                >Lobby</RouterLink
              >.
            </p>
          </template>
          <template v-else>
            <p class="font-display text-[0.5625rem] font-black uppercase tracking-[0.3em] text-magenta">
              Solo flight
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              <RouterLink
                to="/lobby"
                class="font-semibold text-electric underline-offset-2 hover:underline"
                >Create or join a lobby</RouterLink
              >
              to see your friends' planes and bets here.
            </p>
          </template>
        </div>
      </section>
    </Teleport>
  </div>
</template>
