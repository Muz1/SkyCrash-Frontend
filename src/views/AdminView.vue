<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Search, ArrowUp, ArrowDown } from '@lucide/vue'
import { useAdminStore } from '@/stores/adminStore'
import { useAuthStore } from '@/stores/AuthStore'
import { usePlayerStore } from '@/stores/playerStore'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminPill from '@/components/admin/AdminPill.vue'
import AdjustBalanceModal from '@/components/AdjustBalanceModal.vue'
import ExportPdfButton from '@/components/sky/ExportPdfButton.vue'
import { buildPlayersReport } from '@/lib/adminReports'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const modalTarget = ref<{ playerId: string; username: string } | null>(null)

const BLOCKED_LABELS = { all: 'All accounts', active: 'Active only', blocked: 'Blocked only' } as const
const ROLE_LABELS = { all: 'All roles', admin: 'Admins only', player: 'Players only' } as const

function buildReport() {
  return buildPlayersReport(adminStore.players, {
    search: adminStore.searchTerm,
    blocked: BLOCKED_LABELS[adminStore.blockedFilter],
    role: ROLE_LABELS[adminStore.adminFilter],
    sortBy: adminStore.sortBy,
    sortDir: adminStore.sortDir,
  })
}

// Display-only summaries of the list already loaded.
const blockedCount = computed(() => adminStore.players.filter((p) => p.isBlocked).length)
// Only managers can change who is an admin (the API enforces this too).
const isManager = computed(() => !!usePlayerStore().profile?.isManager)
const adminCount = computed(() => adminStore.players.filter((p) => p.isAdmin).length)
const balanceFormat = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

onMounted(() => {
  adminStore.fetchPlayers()
})
</script>

<template>
  <AdminShell
    help-text="Search, filter and sort every player account. Promote/demote grants or removes admin access (managers only; see the Admin Roles tab). Block immediately prevents that player from logging in or playing, and disconnects any live session — unblock restores access. Adjust changes a player's credit balance directly, for support or correction purposes, and is logged."
  >
    <AdminPage :page-export="false" title="Player Management" eyebrow="Accounts" subtitle="Search, filter and manage every player account.">
      <template #actions>
        <ExportPdfButton :build="buildReport" />
      </template>

      <AdminPanel title="Players" accent="magenta" fill flush>
        <template #actions>
          <span class="adm-panel-caption adm-num">
            {{ adminStore.players.length }} accounts · {{ adminCount }} admins · {{ blockedCount }} blocked
          </span>
        </template>

        <template #toolbar>
          <div class="adm-toolbar">
            <div class="adm-search min-w-[240px] flex-1">
              <Search aria-hidden="true" />
              <input
                v-model="adminStore.searchTerm"
                type="text"
                placeholder="Search by username or email…"
                class="adm-input"
                @keyup.enter="adminStore.fetchPlayers"
              />
            </div>
            <select
              v-model="adminStore.blockedFilter"
              class="adm-select"
              aria-label="Account status"
              @change="adminStore.fetchPlayers"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
            <select v-model="adminStore.adminFilter" class="adm-select" aria-label="Role" @change="adminStore.fetchPlayers">
              <option value="all">All Roles</option>
              <option value="admin">Admins Only</option>
              <option value="player">Players Only</option>
            </select>
            <select v-model="adminStore.sortBy" class="adm-select" aria-label="Sort by" @change="adminStore.fetchPlayers">
              <option value="username">Sort: Username</option>
              <option value="email">Sort: Email</option>
              <option value="balance">Sort: Balance</option>
              <option value="membersince">Sort: Member Since</option>
              <option value="lastseen">Sort: Last Seen</option>
            </select>
            <AdminButton
              variant="secondary"
              :title="adminStore.sortDir === 'asc' ? 'Ascending' : 'Descending'"
              @click="
                () => {
                  adminStore.toggleSortDir()
                  adminStore.fetchPlayers()
                }
              "
            >
              <ArrowUp v-if="adminStore.sortDir === 'asc'" aria-hidden="true" />
              <ArrowDown v-else aria-hidden="true" />
              {{ adminStore.sortDir === 'asc' ? 'Asc' : 'Desc' }}
            </AdminButton>
            <AdminButton variant="primary" @click="adminStore.fetchPlayers">Search</AdminButton>
          </div>
        </template>

        <div class="adm-table-wrap">
          <table class="adm-table min-w-[1000px]">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th class="adm-num">Balance</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th class="adm-num">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in adminStore.players" :key="player.playerId">
                <td class="adm-strong">
                  {{ player.username }}
                  <span v-if="player.playerId === authStore.playerId" class="adm-muted ml-1 text-[12.5px] font-medium">
                    (you)
                  </span>
                </td>
                <td class="adm-muted">{{ player.email }}</td>
                <td class="adm-num adm-strong">{{ balanceFormat.format(player.creditBalance) }}</td>
                <td><AdminPill :label="player.isManager ? 'Manager' : player.isAdmin ? 'Admin' : 'Player'" :dot="false" /></td>
                <td><AdminPill :label="player.isBlocked ? 'Blocked' : 'Active'" /></td>
                <td class="adm-muted adm-num-inline">{{ new Date(player.lastSeenUtc).toLocaleString() }}</td>
                <td class="adm-actions">
                  <div>
                    <AdminButton v-if="isManager && !player.isAdmin" size="sm" variant="info" @click="adminStore.promote(player.playerId)">
                      Promote
                    </AdminButton>
                    <AdminButton
                      v-else-if="isManager && player.isAdmin && player.playerId !== authStore.playerId"
                      size="sm"
                      variant="danger"
                      @click="adminStore.demote(player.playerId)"
                    >
                      Demote
                    </AdminButton>
                    <AdminButton
                      v-if="!player.isBlocked"
                      size="sm"
                      variant="danger"
                      :disabled="player.playerId === authStore.playerId"
                      @click="adminStore.block(player.playerId)"
                    >
                      Block
                    </AdminButton>
                    <AdminButton v-else size="sm" variant="success" @click="adminStore.unblock(player.playerId)">
                      Unblock
                    </AdminButton>
                    <AdminButton
                      size="sm"
                      variant="secondary"
                      @click="modalTarget = { playerId: player.playerId, username: player.username }"
                    >
                      Adjust
                    </AdminButton>
                  </div>
                </td>
              </tr>
              <tr v-if="adminStore.players.length === 0">
                <td colspan="7" class="adm-empty">
                  {{ adminStore.isLoading ? 'Loading players…' : 'No players match these filters.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </AdminPage>

    <AdjustBalanceModal
      v-if="modalTarget"
      :player-id="modalTarget.playerId"
      :username="modalTarget.username"
      @close="modalTarget = null"
    />
  </AdminShell>
</template>
