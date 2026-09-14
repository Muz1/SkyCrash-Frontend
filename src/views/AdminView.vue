<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import { useAuthStore } from '@/stores/AuthStore'
import AdjustBalanceModal from '@/components/AdjustBalanceModal.vue'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const modalTarget = ref<{ playerId: string; username: string } | null>(null)

onMounted(() => {
  adminStore.fetchPlayers()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 flex justify-center">
    <div class="w-full max-w-4xl space-y-4">
      <h1 class="text-2xl font-bold">Admin — Players</h1>

      <input
        v-model="adminStore.searchTerm"
        type="text"
        placeholder="Search by username or email…"
        class="w-full bg-slate-900 rounded-lg px-3 py-2"
        @keyup.enter="adminStore.fetchPlayers"
      />

      <table class="w-full text-sm">
        <thead class="text-slate-400 text-left">
          <tr>
            <th class="py-2">Username</th>
            <th>Balance</th>
            <th>Admin</th>
            <th>Last Seen</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in adminStore.players" :key="player.playerId" class="border-t border-slate-800">
            <td class="py-2">{{ player.username }}</td>
            <td>{{ player.creditBalance }}</td>
            <td>{{ player.isAdmin ? 'Yes' : 'No' }}</td>
            <td>{{ new Date(player.lastSeenUtc).toLocaleString() }}</td>
            <td class="space-x-2 text-right">
              <button
                v-if="!player.isAdmin"
                class="text-xs bg-slate-800 hover:bg-slate-700 rounded px-2 py-1"
                @click="adminStore.promote(player.playerId)"
              >
                Promote
              </button>
              <button
                v-else-if="player.playerId !== authStore.playerId"
                class="text-xs bg-slate-800 hover:bg-slate-700 rounded px-2 py-1"
                @click="adminStore.demote(player.playerId)"
              >
                Demote
              </button>
              <button
                class="text-xs bg-slate-800 hover:bg-slate-700 rounded px-2 py-1"
                @click="modalTarget = { playerId: player.playerId, username: player.username }"
              >
                Adjust
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <AdjustBalanceModal
        v-if="modalTarget"
        :player-id="modalTarget.playerId"
        :username="modalTarget.username"
        @close="modalTarget = null"
      />
    </div>
  </div>
</template>
