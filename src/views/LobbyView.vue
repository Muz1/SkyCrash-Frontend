<script setup lang="ts">
import { onMounted } from 'vue'
import { useLobbyStore } from '@/stores/lobbyStore'
import { usePlayerStore } from '@/stores/playerStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import StatusBadge from '@/components/sky/StatusBadge.vue'

const lobbyStore = useLobbyStore()
const playerStore = usePlayerStore()

onMounted(() => {
  lobbyStore.fetchOnlinePlayers()
})
</script>

<template>
  <Shell skin="midnight" :dim="0.55">
    <div class="mx-auto w-full max-w-md">
      <h1 class="text-center font-display text-2xl font-black uppercase tracking-[0.2em] text-electric text-glow-blue sm:text-3xl">
        Lobby
      </h1>
      <p class="mt-2 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Pilots online right now
      </p>

      <NeonPanel class="mt-6" accent="blue">
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
            <span class="font-display uppercase tracking-[0.14em] text-foreground">{{ player.username }}</span>
            <StatusBadge v-if="player.playerId === playerStore.profile?.playerId" status="NEW" />
            <span v-else class="h-2 w-2 rounded-full bg-lime [box-shadow:var(--glow-lime)]" />
          </li>
        </ul>
      </NeonPanel>
    </div>
  </Shell>
</template>
