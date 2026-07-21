<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useLobbyStore } from '@/stores/lobbyStore'
import { usePlayerStore } from '@/stores/playerStore'

const lobbyStore = useLobbyStore()
const playerStore = usePlayerStore()

onMounted(() => {
  lobbyStore.startPolling()
})

onUnmounted(() => {
  lobbyStore.stopPolling()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 flex justify-center">
    <div class="w-full max-w-md space-y-4">
      <h1 class="text-2xl font-bold">Lobby</h1>
      <p class="text-slate-400 text-sm">
        Players currently online. This list updates every few seconds.
      </p>

      <div class="bg-slate-900 rounded-xl divide-y divide-slate-800">
        <div v-if="lobbyStore.isLoading && lobbyStore.onlinePlayers.length === 0" class="p-4 text-slate-400">
          Loading…
        </div>
        <div v-else-if="lobbyStore.onlinePlayers.length === 0" class="p-4 text-slate-400">
          No one else is online right now.
        </div>
        <div
          v-for="player in lobbyStore.onlinePlayers"
          :key="player.playerId"
          class="p-4 flex items-center justify-between"
        >
          <span>{{ player.username }}</span>
          <span
            v-if="player.playerId === playerStore.profile?.playerId"
            class="text-xs text-indigo-400"
          >you</span>
          <span v-else class="h-2 w-2 rounded-full bg-emerald-500"></span>
        </div>
      </div>
    </div>
  </div>
</template>