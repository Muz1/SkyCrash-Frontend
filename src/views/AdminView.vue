<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import { useAuthStore } from '@/stores/AuthStore'
import Shell from '@/components/sky/Shell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import AdminTabs from '@/components/sky/AdminTabs.vue'
import AdjustBalanceModal from '@/components/AdjustBalanceModal.vue'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const modalTarget = ref<{ playerId: string; username: string } | null>(null)

onMounted(() => {
  adminStore.fetchPlayers()
})
</script>

<template>
  <Shell skin="midnight" :dim="0.65">
    <div class="mx-auto w-full max-w-4xl">
      <h1 class="font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
        Admin
      </h1>
      <div class="mt-4"><AdminTabs /></div>

      <NeonPanel class="mt-5" title="Players" accent="ember">
        <input
          v-model="adminStore.searchTerm"
          type="text"
          placeholder="Search by username or email…"
          class="clip-hud w-full border-2 border-violet/50 bg-void/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-magenta focus:outline-none"
          @keyup.enter="adminStore.fetchPlayers"
        />

        <div class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[640px] text-left text-sm">
            <thead class="whitespace-nowrap font-arcade text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th class="py-2 pr-4">Username</th>
                <th class="pr-4">Balance</th>
                <th class="pr-4">Admin</th>
                <th class="pr-4">Last Seen</th>
                <th></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/60">
              <tr v-for="player in adminStore.players" :key="player.playerId" class="whitespace-nowrap">
                <td class="py-2 pr-4 text-foreground">{{ player.username }}</td>
                <td class="pr-4 text-ember">{{ player.creditBalance }}</td>
                <td class="pr-4">{{ player.isAdmin ? 'Yes' : 'No' }}</td>
                <td class="pr-4 text-muted-foreground">{{ new Date(player.lastSeenUtc).toLocaleString() }}</td>
                <td class="space-x-2 text-right">
                  <ArcadeButton v-if="!player.isAdmin" size="sm" variant="blue" @click="adminStore.promote(player.playerId)">
                    Promote
                  </ArcadeButton>
                  <ArcadeButton
                    v-else-if="player.playerId !== authStore.playerId"
                    size="sm"
                    variant="ghost"
                    @click="adminStore.demote(player.playerId)"
                  >
                    Demote
                  </ArcadeButton>
                  <ArcadeButton size="sm" variant="magenta" @click="modalTarget = { playerId: player.playerId, username: player.username }">
                    Adjust
                  </ArcadeButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </NeonPanel>

      <AdjustBalanceModal
        v-if="modalTarget"
        :player-id="modalTarget.playerId"
        :username="modalTarget.username"
        @close="modalTarget = null"
      />
    </div>
  </Shell>
</template>
