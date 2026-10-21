<script setup lang="ts">
import { cr } from '@/lib/reportFormat'
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
import BlockPlayerDialog from '@/components/admin/BlockPlayerDialog.vue'
import ReasonDialog from '@/components/admin/ReasonDialog.vue'
import { admin as copy } from '@/copy/admin'
import ExportPdfButton from '@/components/sky/ExportPdfButton.vue'
import { buildPlayersReport } from '@/lib/adminReports'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const modalTarget = ref<{ playerId: string; username: string } | null>(null)
const blockTarget = ref<{ playerId: string; username: string } | null>(null)
const unblockTarget = ref<{ playerId: string; username: string } | null>(null)
const blockDialog = ref<InstanceType<typeof BlockPlayerDialog> | null>(null)
const unblockDialog = ref<InstanceType<typeof ReasonDialog> | null>(null)
const testError = ref('')

async function applyBlock(body: { ruleCode: string; durationDays: number | null; internalNote?: string }) {
  if (!blockTarget.value) return
  try {
    await adminStore.block(blockTarget.value.playerId, body)
    blockTarget.value = null
  } catch (err) {
    blockDialog.value?.fail(err)
  }
}

async function applyUnblock(reason: string) {
  if (!unblockTarget.value) return
  try {
    await adminStore.unblock(unblockTarget.value.playerId, reason)
    unblockTarget.value = null
  } catch (err) {
    unblockDialog.value?.fail(err)
  }
}

async function toggleTest(playerId: string, value: boolean) {
  testError.value = ''
  try {
    await adminStore.setTestAccount(playerId, value)
  } catch {
    testError.value = 'Could not change the test-account flag. Is the API up to date?'
    await adminStore.fetchPlayers()
  }
}

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
const testCount = computed(() => adminStore.players.filter((p) => p.isTestAccount).length)
// Only managers can change who is an admin (the API enforces this too).
const isManager = computed(() => !!usePlayerStore().profile?.isManager)
const adminCount = computed(() => adminStore.players.filter((p) => p.isAdmin).length)

onMounted(() => {
  adminStore.fetchPlayers()
})
</script>

<template>
  <AdminShell
    help-text="Search, filter and sort every player account. Promote/demote grants or removes admin access (managers only; see the Admin Roles tab). Block applies an Account Rule (pick the rule, the duration is pre-filled) and disconnects any live session; Unblock asks for a reason. Test accounts are left out of reports. Adjust changes a player's credit balance directly, for support or correction purposes, and is logged."
  >
    <AdminPage :page-export="false" title="Player Management" eyebrow="Accounts" subtitle="Search, filter and manage every player account.">
      <template #actions>
        <ExportPdfButton :build="buildReport" />
      </template>

      <AdminPanel title="Players" accent="magenta" fill flush>
        <template #actions>
          <span class="adm-panel-caption adm-num">
            {{ adminStore.players.length }} accounts · {{ adminCount }} admins · {{ blockedCount }} blocked · {{ testCount }} test
          </span>
        </template>

        <template #toolbar>
          <div class="adm-toolbar">
            <div class="adm-search min-w-[15rem] flex-1">
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
            <select v-model="adminStore.verifiedFilter" class="adm-select" aria-label="Email verified" @change="adminStore.fetchPlayers">
              <option value="all">Any Email</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
            <select v-model="adminStore.testFilter" class="adm-select" aria-label="Test accounts" @change="adminStore.fetchPlayers">
              <option value="all">Test + Real</option>
              <option value="real">Real Only</option>
              <option value="test">Test Only</option>
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

        <p v-if="testError" class="adm-error mx-4 mt-3" role="alert">{{ testError }}</p>
        <div class="adm-table-wrap">
          <!-- One card per player on phones (see .adm-table--cards in admin.css). -->
          <table class="adm-table adm-table--cards min-w-[75rem]">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th class="adm-num">Balance</th>
                <th>Role</th>
                <th>Status</th>
                <th>Email ✓</th>
                <th>Test</th>
                <th>Last Seen</th>
                <th class="adm-num">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in adminStore.players" :key="player.playerId">
                <td class="adm-strong" data-label="Username">
                  {{ player.username }}
                  <span v-if="player.playerId === authStore.playerId" class="adm-muted ml-1 text-[0.7812rem] font-medium">
                    (you)
                  </span>
                </td>
                <td class="adm-muted" data-label="Email">{{ player.email }}</td>
                <td class="adm-num adm-strong" data-label="Balance">{{ cr(player.creditBalance) }}</td>
                <td data-label="Role"><AdminPill :label="player.isManager ? 'Manager' : player.isAdmin ? 'Admin' : 'Player'" :dot="false" /></td>
                <td data-label="Status"><AdminPill :label="player.isBlocked ? 'Blocked' : 'Active'" /></td>
                <td data-label="Email ✓">
                  <AdminPill :label="player.emailVerified ? 'Verified' : 'Unverified'" :tone="player.emailVerified ? 'success' : 'warning'" :dot="false" />
                </td>
                <td data-label="Test">
                  <label class="adm-switch" :title="player.isAdmin ? 'Admins never bet' : 'Test accounts are left out of reports'">
                    <input
                      type="checkbox"
                      :checked="!!player.isTestAccount"
                      :disabled="player.isAdmin"
                      :aria-label="`Test account: ${player.username}`"
                      @change="toggleTest(player.playerId, ($event.target as HTMLInputElement).checked)"
                    />
                    <span class="adm-switch-track" aria-hidden="true" />
                    <span>{{ player.isTestAccount ? 'Test' : 'Real' }}</span>
                  </label>
                </td>
                <td class="adm-muted adm-num-inline" data-label="Last Seen">{{ new Date(player.lastSeenUtc).toLocaleString() }}</td>
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
                      @click="blockTarget = { playerId: player.playerId, username: player.username }"
                    >
                      Block
                    </AdminButton>
                    <AdminButton
                      v-else
                      size="sm"
                      variant="success"
                      @click="unblockTarget = { playerId: player.playerId, username: player.username }"
                    >
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
                <td colspan="9" class="adm-empty">
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
    <BlockPlayerDialog
      v-if="blockTarget"
      ref="blockDialog"
      :username="blockTarget.username"
      @close="blockTarget = null"
      @submit="applyBlock"
    />
    <ReasonDialog
      v-if="unblockTarget"
      ref="unblockDialog"
      :title="`${copy.players.unblockTitle}: ${unblockTarget.username}`"
      :sub="copy.players.unblockSub"
      placeholder="e.g. Appeal upheld; ID checked"
      confirm="Unblock"
      variant="success"
      tone="#22c55e"
      @close="unblockTarget = null"
      @submit="applyUnblock"
    />
  </AdminShell>
</template>
