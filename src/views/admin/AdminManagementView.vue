<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { Send, Copy, CircleCheck, CircleAlert, ShieldMinus, Crown, UserMinus, Ban } from '@lucide/vue'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminPill from '@/components/admin/AdminPill.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import AboutReport from '@/components/admin/AboutReport.vue'
import * as service from '@/services/adminAnalyticsService'
import { useAuthStore } from '@/stores/AuthStore'
import { dateTime } from '@/lib/reportFormat'
import type { AdminInvitation, AdminRole, AdminRoleEntry, RoleAction } from '@/types/insights'

const authStore = useAuthStore()

const admins = ref<AdminRoleEntry[] | null>(null)
const invitations = ref<AdminInvitation[] | null>(null)
const name = ref('')
const email = ref('')
const role = ref<AdminRole>('Admin')
const busy = ref(false)
const result = ref<{ ok: boolean; text: string } | null>(null)
// The link exists only right after creating the invite (the server stores just a hash).
const newLink = ref<string | null>(null)
const copied = ref(false)

const canSend = computed(() => name.value.trim().length > 0 && /^\S+@\S+\.\S+$/.test(email.value.trim()) && !busy.value)
const statusTone = { Pending: 'warning', Accepted: 'success', Revoked: 'neutral', Expired: 'danger' } as const

const about = {
  measures: 'Who can use this dashboard, and the invitations you have sent.',
  numbers: [
    { term: 'Admin', definition: 'Can use every report and game-management page. Admin accounts can’t play.' },
    { term: 'Manager', definition: 'An admin who can also invite admins, change roles and remove access. At least one manager always remains.' },
    { term: 'Invitation status', definition: 'Pending (link not used yet), Accepted, Revoked (cancelled or replaced by a newer invite) or Expired (after 7 days).' },
  ],
  charts: 'No charts. The tables list current admins and every invitation.',
  useFor: 'Give a teammate access by sending them the invite link (there’s no email service, so copy it into an email or chat yourself). They sign in or register with the invited email and press Accept.',
}

async function load() {
  const [a, i] = await Promise.all([service.getAdminRoles(), service.getInvitations()])
  admins.value = a
  invitations.value = i
}

function errorText(err: unknown, fallback: string) {
  return (axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined) ?? fallback
}

async function sendInvite() {
  busy.value = true
  result.value = null
  newLink.value = null
  copied.value = false
  try {
    const { invitation, token } = await service.createInvitation({ name: name.value.trim(), email: email.value.trim(), role: role.value })
    newLink.value = `${window.location.origin}/invite/${token}`
    result.value = { ok: true, text: `Invitation created for ${invitation.email}. Copy the link below and send it to them.` }
    name.value = ''
    email.value = ''
    await load()
  } catch (err) {
    result.value = { ok: false, text: errorText(err, 'The invitation could not be created.') }
  } finally {
    busy.value = false
  }
}

async function copyLink() {
  if (!newLink.value) return
  try {
    await navigator.clipboard.writeText(newLink.value)
    copied.value = true
  } catch {
    copied.value = false
  }
}

async function run(action: RoleAction, target: string) {
  busy.value = true
  result.value = null
  try {
    result.value = { ok: true, text: await service.changeRole(action, target) }
    await load()
  } catch (err) {
    result.value = { ok: false, text: errorText(err, 'That change could not be made.') }
  } finally {
    busy.value = false
  }
}

async function revoke(i: AdminInvitation) {
  busy.value = true
  try {
    await service.revokeInvitation(i.invitationId)
    result.value = { ok: true, text: `Invitation for ${i.email} revoked; its link no longer works.` }
    await load()
  } catch (err) {
    result.value = { ok: false, text: errorText(err, 'Could not revoke the invitation.') }
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminShell>
    <AdminPage title="Admin Management" eyebrow="Access control" subtitle="Invite administrators, change their role, or remove access.">
      <AboutReport v-bind="about" />

      <p
        v-if="result"
        role="status"
        :class="result.ok ? 'adm-success flex items-center gap-2 !text-[15px]' : 'adm-error'"
      >
        <CircleCheck v-if="result.ok" class="h-4 w-4 shrink-0" aria-hidden="true" />
        <CircleAlert v-else class="h-4 w-4 shrink-0" aria-hidden="true" />
        {{ result.text }}
      </p>

      <div class="adm-grid-2">
        <AdminPanel title="Add admin" caption="Creates a one-time invite link (valid 7 days)" accent="magenta">
          <form class="flex flex-col gap-4" @submit.prevent="sendInvite">
            <label class="block">
              <span class="adm-label">Name</span>
              <input v-model="name" type="text" maxlength="100" class="adm-input w-full" placeholder="Thandi Nkosi" autocomplete="off" />
            </label>
            <label class="block">
              <span class="adm-label">Email</span>
              <input v-model="email" type="email" class="adm-input w-full" placeholder="thandi@example.com" autocomplete="off" spellcheck="false" />
            </label>
            <fieldset>
              <legend class="adm-label">Role</legend>
              <div class="adm-segmented">
                <button type="button" :aria-pressed="role === 'Admin'" @click="role = 'Admin'">Admin</button>
                <button type="button" :aria-pressed="role === 'Manager'" @click="role = 'Manager'">Manager</button>
              </div>
            </fieldset>
            <AdminButton type="submit" variant="primary" :disabled="!canSend"><Send aria-hidden="true" /> Send invitation</AdminButton>
            <div v-if="newLink" class="rounded-xl border border-[var(--adm-border-strong)] bg-[var(--adm-surface-2)] p-3">
              <p class="adm-label !mb-1">Invite link: copy it now, it won't be shown again</p>
              <div class="flex gap-2">
                <input :value="newLink" readonly class="adm-input adm-mono flex-1" aria-label="Invite link" @focus="($event.target as HTMLInputElement).select()" />
                <AdminButton variant="secondary" @click="copyLink"><Copy aria-hidden="true" /> {{ copied ? 'Copied' : 'Copy' }}</AdminButton>
              </div>
            </div>
          </form>
        </AdminPanel>

        <AdminPanel title="Administrators" :caption="admins ? `${admins.length} admin${admins.length === 1 ? '' : 's'}` : undefined" accent="blue" flush>
          <div v-if="admins" class="adm-table-wrap">
            <table class="adm-table">
              <thead><tr><th>Name</th><th>Role</th><th>Last seen</th><th class="text-right">Actions</th></tr></thead>
              <tbody>
                <tr v-for="a in admins" :key="a.userId">
                  <td>
                    <p class="adm-strong">{{ a.username }}<span v-if="a.email === authStore.email" class="adm-muted"> (you)</span></p>
                    <p class="adm-muted text-[13.5px]">{{ a.email }}</p>
                  </td>
                  <td><AdminPill :label="a.isManager ? 'Manager' : 'Admin'" :tone="a.isManager ? 'warning' : 'accent'" /></td>
                  <td class="adm-muted adm-num-inline">{{ dateTime(a.lastSeenUtc) }}</td>
                  <td class="adm-actions">
                    <div v-if="a.email !== authStore.email">
                      <AdminButton size="sm" :variant="a.isManager ? 'secondary' : 'info'" :disabled="busy" @click="run(a.isManager ? 'revoke-manager' : 'grant-manager', a.email)">
                        <component :is="a.isManager ? UserMinus : Crown" aria-hidden="true" /> {{ a.isManager ? 'Make admin' : 'Make manager' }}
                      </AdminButton>
                      <AdminButton size="sm" variant="danger" :disabled="busy" @click="run('revoke-admin', a.email)">
                        <ShieldMinus aria-hidden="true" /> Remove
                      </AdminButton>
                    </div>
                    <span v-else class="adm-muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <AdminLoading v-else />
        </AdminPanel>
      </div>

      <AdminPanel title="Invitations" :caption="invitations ? `${invitations.length} sent` : undefined" accent="violet" flush>
        <div v-if="invitations" class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Invited by</th><th>Sent</th><th class="text-right">Action</th></tr></thead>
            <tbody>
              <tr v-for="i in invitations" :key="i.invitationId">
                <td class="adm-strong">{{ i.name }}</td>
                <td>{{ i.email }}</td>
                <td>{{ i.role }}</td>
                <td><AdminPill :label="i.status" :tone="statusTone[i.status]" /></td>
                <td>{{ i.invitedBy }}</td>
                <td class="adm-muted adm-num-inline">{{ dateTime(i.createdAtUtc) }}</td>
                <td class="adm-actions">
                  <div>
                    <AdminButton v-if="i.status === 'Pending'" size="sm" variant="danger" :disabled="busy" @click="revoke(i)">
                      <Ban aria-hidden="true" /> Revoke
                    </AdminButton>
                  </div>
                </td>
              </tr>
              <tr v-if="invitations.length === 0"><td colspan="7" class="adm-empty">No invitations sent yet.</td></tr>
            </tbody>
          </table>
        </div>
        <AdminLoading v-else />
      </AdminPanel>
    </AdminPage>
  </AdminShell>
</template>
