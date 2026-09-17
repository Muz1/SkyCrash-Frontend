<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import { useAuthStore } from '@/stores/AuthStore'
import AdminShell from '@/components/sky/AdminShell.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import AdjustBalanceModal from '@/components/AdjustBalanceModal.vue'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const modalTarget = ref<{ playerId: string; username: string } | null>(null)

onMounted(() => {
  adminStore.fetchPlayers()
})
</script>

<template>
  <AdminShell
    help-text="Search, filter and sort every player account. Promote/demote grants or removes admin access. Block immediately prevents that player from logging in or playing, and disconnects any live session — unblock restores access. Adjust changes a player's credit balance directly, for support or correction purposes, and is logged."
  >
    <h1 class="font-display text-2xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl">
      Player Management
    </h1>

    <NeonPanel class="mt-5" title="Players" accent="ember">
      <div class="flex flex-wrap items-center gap-2">
        <input
          v-model="adminStore.searchTerm"
          type="text"
          placeholder="Search by username or email…"
          class="clip-hud min-w-[220px] flex-1 border-2 border-violet/50 bg-void/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-magenta focus:outline-none"
          @keyup.enter="adminStore.fetchPlayers"
        />
        <select
          v-model="adminStore.blockedFilter"
          class="clip-hud border-2 border-violet/50 bg-void/70 px-2 py-2 text-xs uppercase tracking-[0.15em] text-foreground focus:border-magenta focus:outline-none"
          @change="adminStore.fetchPlayers"
        >
          <option value="all">All Accounts</option>
          <option value="active">Active Only</option>
          <option value="blocked">Blocked Only</option>
        </select>
        <select
          v-model="adminStore.adminFilter"
          class="clip-hud border-2 border-violet/50 bg-void/70 px-2 py-2 text-xs uppercase tracking-[0.15em] text-foreground focus:border-magenta focus:outline-none"
          @change="adminStore.fetchPlayers"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins Only</option>
          <option value="player">Players Only</option>
        </select>
        <select
          v-model="adminStore.sortBy"
          class="clip-hud border-2 border-violet/50 bg-void/70 px-2 py-2 text-xs uppercase tracking-[0.15em] text-foreground focus:border-magenta focus:outline-none"
          @change="adminStore.fetchPlayers"
        >
          <option value="username">Sort: Username</option>
          <option value="email">Sort: Email</option>
          <option value="balance">Sort: Balance</option>
          <option value="membersince">Sort: Member Since</option>
          <option value="lastseen">Sort: Last Seen</option>
        </select>
        <ArcadeButton
          size="sm"
          variant="ghost"
          @click="
            () => {
              adminStore.toggleSortDir()
              adminStore.fetchPlayers()
            }
          "
        >
          {{ adminStore.sortDir === 'asc' ? '↑ Asc' : '↓ Desc' }}
        </ArcadeButton>
        <ArcadeButton size="sm" variant="blue" @click="adminStore.fetchPlayers">Search</ArcadeButton>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead class="whitespace-nowrap font-arcade text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
            <tr>
              <th class="py-2 pr-4">Username</th>
              <th class="pr-4">Email</th>
              <th class="pr-4">Balance</th>
              <th class="pr-4">Role</th>
              <th class="pr-4">Status</th>
              <th class="pr-4">Last Seen</th>
              <th></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border/60">
            <tr v-for="player in adminStore.players" :key="player.playerId" class="whitespace-nowrap">
              <td class="py-2 pr-4 text-foreground">{{ player.username }}</td>
              <td class="pr-4 text-muted-foreground">{{ player.email }}</td>
              <td class="pr-4 text-ember">{{ player.creditBalance }}</td>
              <td class="pr-4">{{ player.isAdmin ? 'Admin' : 'Player' }}</td>
              <td class="pr-4">
                <span :class="player.isBlocked ? 'text-danger' : 'text-lime'">
                  {{ player.isBlocked ? 'Blocked' : 'Active' }}
                </span>
              </td>
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
                <ArcadeButton
                  v-if="!player.isBlocked"
                  size="sm"
                  variant="danger"
                  :disabled="player.playerId === authStore.playerId"
                  @click="adminStore.block(player.playerId)"
                >
                  Block
                </ArcadeButton>
                <ArcadeButton v-else size="sm" variant="cash" @click="adminStore.unblock(player.playerId)">
                  Unblock
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
  </AdminShell>
</template>
