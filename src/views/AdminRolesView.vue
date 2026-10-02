<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { ShieldCheck, ShieldPlus, ShieldMinus, Crown, UserMinus, Mail, CircleCheck, CircleAlert } from '@lucide/vue'
import * as analyticsService from '@/services/adminAnalyticsService'
import { useAuthStore } from '@/stores/AuthStore'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminPill from '@/components/admin/AdminPill.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import AdminExplain from '@/components/admin/AdminExplain.vue'
import type { AdminRoleEntry, RoleAction } from '@/types/insights'

const authStore = useAuthStore()

const admins = ref<AdminRoleEntry[] | null>(null)
const email = ref('')
const busy = ref<RoleAction | null>(null)
const result = ref<{ ok: boolean; text: string } | null>(null)

const managers = computed(() => admins.value?.filter((a) => a.isManager).length ?? 0)
const emailValid = computed(() => /^\S+@\S+\.\S+$/.test(email.value.trim()))

const ACTIONS: { action: RoleAction; label: string; variant: 'primary' | 'secondary' | 'danger' | 'info'; icon: typeof ShieldPlus }[] = [
  { action: 'grant-admin', label: 'Grant admin', variant: 'primary', icon: ShieldPlus },
  { action: 'revoke-admin', label: 'Revoke admin', variant: 'danger', icon: ShieldMinus },
  { action: 'grant-manager', label: 'Make manager', variant: 'info', icon: Crown },
  { action: 'revoke-manager', label: 'Remove manager', variant: 'secondary', icon: UserMinus },
]

const explain = [
  {
    term: 'Player → Admin (Grant admin)',
    definition:
      "Turns a player account into an admin. Admins operate the console but can't play: their credits are frozen (kept, not deleted) and they leave any private lobby. Not possible while the player has a bet in the current round.",
  },
  {
    term: 'Admin → Player (Revoke admin)',
    definition:
      'Returns the account to a normal player with its previous credit balance restored. At least one admin must remain, and you cannot revoke your own access.',
  },
  {
    term: 'Manager',
    definition:
      'An admin who can also use this page: grant/revoke admin access by email and make other admins managers. At least one manager must always remain. NewBoi is the seeded manager.',
  },
  {
    term: 'When does it take effect?',
    definition:
      "Immediately, on the account's very next request. Access is checked against the database every time, so nobody has to log out and back in.",
  },
]

async function load() {
  admins.value = await analyticsService.getAdminRoles()
}

async function run(action: RoleAction, target = email.value.trim()) {
  if (!target) return
  busy.value = action
  result.value = null
  try {
    const message = await analyticsService.changeRole(action, target)
    result.value = { ok: true, text: message }
    if (target === email.value.trim()) email.value = ''
    await load()
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined
    result.value = { ok: false, text: message ?? 'That change could not be made.' }
  } finally {
    busy.value = null
  }
}

onMounted(load)
</script>

<template>
  <AdminShell
    help-text="Managers decide who has admin access. Enter any account's email and choose an action. Changes apply on that account's next request. Player lobbies are unaffected by anything here except that a newly promoted admin leaves their lobby."
  >
    <AdminPage
      title="Admin Role Management"
      eyebrow="Access control"
      subtitle="Grant or revoke admin access by email, and choose which admins are managers."
    >
      <div class="grid min-h-0 flex-1 gap-4 overflow-y-auto lg:grid-cols-[minmax(320px,440px)_minmax(0,1fr)] lg:overflow-visible">
        <div class="flex min-w-0 flex-col gap-4">
          <AdminPanel title="Change access" caption="Applies to any account, player or admin" accent="magenta">
            <form class="flex flex-col gap-4" @submit.prevent="run('grant-admin')">
              <label class="block">
                <span class="adm-label">Account email</span>
                <div class="adm-search">
                  <Mail aria-hidden="true" />
                  <input
                    v-model="email"
                    type="email"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="pilot@example.com"
                    class="adm-input"
                    aria-describedby="roles-result"
                  />
                </div>
              </label>
              <div class="grid grid-cols-2 gap-2">
                <AdminButton
                  v-for="a in ACTIONS"
                  :key="a.action"
                  :type="a.action === 'grant-admin' ? 'submit' : 'button'"
                  :variant="a.variant"
                  :disabled="!emailValid || busy !== null"
                  @click="a.action === 'grant-admin' ? undefined : run(a.action)"
                >
                  <component :is="a.icon" aria-hidden="true" />
                  {{ busy === a.action ? 'Working…' : a.label }}
                </AdminButton>
              </div>
              <p
                id="roles-result"
                role="status"
                aria-live="polite"
                :class="result ? (result.ok ? 'adm-success flex items-center gap-2' : 'adm-error') : 'sr-only'"
              >
                <template v-if="result">
                  <CircleCheck v-if="result.ok" class="h-4 w-4 shrink-0" aria-hidden="true" />
                  <CircleAlert v-else class="h-4 w-4 shrink-0" aria-hidden="true" />
                  {{ result.text }}
                </template>
              </p>
            </form>
          </AdminPanel>

          <AdminExplain title="How roles work" :items="explain" />
        </div>

        <AdminPanel
          title="Current admins"
          :caption="admins ? `${admins.length} admin${admins.length === 1 ? '' : 's'} · ${managers} manager${managers === 1 ? '' : 's'}` : undefined"
          accent="blue"
          fill
          flush
        >
          <template v-if="admins">
            <div class="adm-table-wrap">
              <table class="adm-table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Last seen</th>
                    <th class="text-right">Quick actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="a in admins" :key="a.userId">
                    <td class="adm-strong">
                      {{ a.username }}
                      <span v-if="a.email === authStore.email" class="adm-muted"> (you)</span>
                    </td>
                    <td class="adm-muted">{{ a.email }}</td>
                    <td>
                      <span class="inline-flex flex-wrap gap-1.5">
                        <AdminPill :label="a.isManager ? 'Manager' : 'Admin'" :tone="a.isManager ? 'warning' : 'accent'" />
                        <AdminPill v-if="a.isBlocked" label="Blocked" />
                      </span>
                    </td>
                    <td class="adm-muted adm-num-inline">{{ new Date(a.lastSeenUtc).toLocaleString() }}</td>
                    <td class="adm-actions">
                      <div v-if="a.email !== authStore.email">
                        <AdminButton
                          size="sm"
                          :variant="a.isManager ? 'secondary' : 'info'"
                          :disabled="busy !== null"
                          @click="run(a.isManager ? 'revoke-manager' : 'grant-manager', a.email)"
                        >
                          <component :is="a.isManager ? UserMinus : Crown" aria-hidden="true" />
                          {{ a.isManager ? 'Remove manager' : 'Make manager' }}
                        </AdminButton>
                        <AdminButton size="sm" variant="danger" :disabled="busy !== null" @click="run('revoke-admin', a.email)">
                          <ShieldMinus aria-hidden="true" /> Revoke
                        </AdminButton>
                      </div>
                      <span v-else class="adm-muted">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <AdminLoading v-else />
          <template #footer>
            <span class="flex items-center gap-2">
              <ShieldCheck class="h-4 w-4" aria-hidden="true" />
              Every change is logged with the manager who made it.
            </span>
          </template>
        </AdminPanel>
      </div>
    </AdminPage>
  </AdminShell>
</template>
