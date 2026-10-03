<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { CircleCheck, Play, Music, Plane, Sparkles } from '@lucide/vue'
import AdminShell from '@/components/sky/AdminShell.vue'
import AdminPage from '@/components/admin/AdminPage.vue'
import AdminPanel from '@/components/admin/AdminPanel.vue'
import AdminButton from '@/components/admin/AdminButton.vue'
import AdminLoading from '@/components/admin/AdminLoading.vue'
import * as service from '@/services/adminAnalyticsService'
import { soundEngine } from '@/lib/soundEngine'
import type { GameManagementSettings } from '@/types/insights'

// Default volumes apply to players who have never changed their own audio settings.
const settings = ref<GameManagementSettings | null>(null)
const draft = ref<GameManagementSettings | null>(null)
const saving = ref(false)
const message = ref<{ ok: boolean; text: string } | null>(null)
const dirty = computed(() => JSON.stringify(settings.value) !== JSON.stringify(draft.value))

const channels = [
  { key: 'defaultMusicVolume', label: 'Music', hint: 'Background soundtrack', icon: Music },
  { key: 'defaultPlaneVolume', label: 'Plane sounds', hint: 'Engine and flight hum', icon: Plane },
  { key: 'defaultGameVolume', label: 'Game sounds', hint: 'Take-off, cash-out, win and crash', icon: Sparkles },
] as const

const previews = [
  { label: 'Take-off', play: () => soundEngine.takeoff() },
  { label: 'Cash-out / win', play: () => soundEngine.cashOut() },
  { label: 'Crash', play: () => soundEngine.crash() },
  { label: 'Countdown tick', play: () => soundEngine.countdownTick(true) },
]

function preview(play: () => void) {
  soundEngine.unlock()
  play()
}

onMounted(async () => {
  settings.value = await service.getGameSettings()
  draft.value = { ...settings.value }
})

async function save() {
  if (!draft.value) return
  saving.value = true
  message.value = null
  try {
    settings.value = await service.updateGameSettings(draft.value)
    draft.value = { ...settings.value }
    message.value = { ok: true, text: 'Saved. New players start with these levels.' }
  } catch (err: unknown) {
    const m = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined
    message.value = { ok: false, text: m ?? 'Could not save.' }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AdminShell>
    <AdminPage title="Audio" eyebrow="Game management" subtitle="Default sound levels for new players, and a preview of every game sound.">
      <div class="adm-grid-2">
        <AdminPanel title="Default volumes" caption="Players can always change their own in the AUDIO panel" accent="violet">
          <form v-if="draft" class="flex flex-col gap-5" @submit.prevent="save">
            <label v-for="c in channels" :key="c.key" class="block">
              <span class="flex items-center gap-2 text-[1rem] font-bold text-[var(--adm-text)]">
                <component :is="c.icon" class="h-5 w-5" aria-hidden="true" /> {{ c.label }}
                <span class="ml-auto adm-num text-[1.125rem]">{{ draft[c.key] }}%</span>
              </span>
              <span class="mb-2 block text-[0.875rem] text-[var(--adm-text-3)]">{{ c.hint }}</span>
              <input v-model.number="draft[c.key]" type="range" min="0" max="100" class="w-full accent-[var(--neon-violet)]" :aria-label="`${c.label} default volume`" />
            </label>
            <div class="flex flex-wrap items-center gap-3">
              <AdminButton type="submit" variant="primary" :disabled="!dirty || saving">{{ saving ? 'Saving…' : 'Save defaults' }}</AdminButton>
              <p v-if="message" role="status" :class="message.ok ? 'adm-success flex items-center gap-2' : 'adm-error'">
                <CircleCheck v-if="message.ok" class="h-4 w-4" aria-hidden="true" />{{ message.text }}
              </p>
            </div>
          </form>
          <AdminLoading v-else />
        </AdminPanel>

        <AdminPanel title="Sound check" caption="Plays through your speakers at your browser's volume" accent="ember">
          <div class="grid grid-cols-2 gap-3">
            <AdminButton v-for="p in previews" :key="p.label" variant="secondary" @click="preview(p.play)">
              <Play aria-hidden="true" /> {{ p.label }}
            </AdminButton>
          </div>
          <p class="adm-note mt-4">
            In game each cue plays at most once per round, and the crash cuts the engine sound, so cues don't pile on top of each other.
          </p>
        </AdminPanel>
      </div>
    </AdminPage>
  </AdminShell>
</template>
