<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { CircleCheck } from '@lucide/vue'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import * as service from '@/services/adminAnalyticsService'
import { dateTime } from '@/lib/reportFormat'
import type { ActiveLobby, GameManagementSettings } from '@/types/insights'

const settings = ref<GameManagementSettings | null>(null)
const maxPlayers = ref(8)
const lobbies = ref<ActiveLobby[] | null>(null)
const message = ref<{ ok: boolean; text: string } | null>(null)
const saving = ref(false)
const dirty = computed(() => !!settings.value && settings.value.lobbyMaxPlayers !== maxPlayers.value)

async function load() {
  const [s, l] = await Promise.all([service.getGameSettings(), service.getActiveLobbies()])
  settings.value = s
  maxPlayers.value = s.lobbyMaxPlayers
  lobbies.value = l
}

async function save() {
  if (!settings.value) return
  saving.value = true
  message.value = null
  try {
    settings.value = await service.updateGameSettings({ ...settings.value, lobbyMaxPlayers: maxPlayers.value })
    message.value = { ok: true, text: 'Saved. New joins use the new limit; nobody already in a lobby is removed.' }
  } catch (err: unknown) {
    const m = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined
    message.value = { ok: false, text: m ?? 'Could not save.' }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <AdminShell>
    <AdminPage title="Lobbies" eyebrow="Game management" subtitle="Set the lobby size limit and see which private lobbies are open.">
      <div class="adm-grid-2">
        <AdminPanel title="Lobby size" caption="Most players per private lobby, host included" accent="blue">
          <form v-if="settings" class="flex flex-col gap-4" @submit.prevent="save">
            <label class="block">
              <span class="adm-label">Maximum players</span>
              <div class="flex items-center gap-4">
                <input v-model.number="maxPlayers" type="range" min="2" max="20" class="flex-1 accent-[var(--neon-blue)]" aria-label="Maximum players per lobby" />
                <span class="adm-num w-24 text-[26px] font-bold text-[var(--adm-text)]">{{ maxPlayers }} / {{ maxPlayers }}</span>
              </div>
            </label>
            <p class="adm-note">Players see e.g. “{{ Math.min(3, maxPlayers) }} / {{ maxPlayers }} PLAYERS” and a LOBBY FULL state when it’s reached.</p>
            <div class="flex flex-wrap items-center gap-3">
              <AdminButton type="submit" variant="primary" :disabled="!dirty || saving">{{ saving ? 'Saving…' : 'Save limit' }}</AdminButton>
              <p v-if="message" role="status" :class="message.ok ? 'adm-success flex items-center gap-2' : 'adm-error'">
                <CircleCheck v-if="message.ok" class="h-4 w-4" aria-hidden="true" />{{ message.text }}
              </p>
            </div>
          </form>
          <AdminLoading v-else />
        </AdminPanel>

        <AdminPanel title="Open lobbies" :caption="lobbies ? `${lobbies.length} open now` : undefined" accent="lime" flush>
          <div v-if="lobbies" class="adm-table-wrap">
            <table class="adm-table">
              <thead>
                <tr><th>Lobby</th><th>Host</th><th class="adm-num">Players</th><th>Code</th><th>Opened</th></tr>
              </thead>
              <tbody>
                <tr v-for="l in lobbies" :key="l.lobbyId">
                  <td class="adm-strong">{{ l.name }}</td>
                  <td>{{ l.hostUsername }}</td>
                  <td class="adm-num adm-strong">{{ l.members }} / {{ settings?.lobbyMaxPlayers ?? '—' }}</td>
                  <td class="adm-mono">{{ l.inviteCode }}</td>
                  <td class="adm-muted adm-num-inline">{{ dateTime(l.createdAtUtc) }}</td>
                </tr>
                <tr v-if="lobbies.length === 0"><td colspan="5" class="adm-empty">No lobbies are open right now.</td></tr>
              </tbody>
            </table>
          </div>
          <AdminLoading v-else />
        </AdminPanel>
      </div>
    </AdminPage>
  </AdminShell>
</template>
