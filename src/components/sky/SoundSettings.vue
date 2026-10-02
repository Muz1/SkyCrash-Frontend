<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Volume2, VolumeX, X } from '@lucide/vue'
import { useAudioStore } from '@/stores/audioStore'
import { soundEngine } from '@/lib/soundEngine'
import { cn } from '@/lib/cn'

/**
 * Mixer popover: master, background music and aircraft/SFX channels, each
 * with its own mute toggle and 0–100 slider. Changes apply live and persist
 * through audioStore. Escape or a click outside closes it.
 */
const emit = defineEmits<{ close: [] }>()

const audioStore = useAudioStore()
const root = ref<HTMLElement | null>(null)

type Channel = 'master' | 'music' | 'sfx'

const channels = computed(() => [
  {
    id: 'master' as Channel,
    label: 'Master',
    hint: 'Everything',
    enabled: audioStore.masterEnabled,
    volume: audioStore.masterVolume,
    toggle: audioStore.toggleMaster,
  },
  {
    id: 'music' as Channel,
    label: 'Music',
    hint: 'Background soundtrack',
    enabled: audioStore.musicEnabled,
    volume: audioStore.musicVolume,
    toggle: audioStore.toggleMusic,
  },
  {
    id: 'sfx' as Channel,
    label: 'Aircraft & SFX',
    hint: 'Engine, take-off, cash-out, crash',
    enabled: audioStore.sfxEnabled,
    volume: audioStore.sfxVolume,
    toggle: audioStore.toggleSfx,
  },
])

function onInput(channel: Channel, e: Event) {
  // Any slider drag is a user gesture, so it's a safe moment to unlock audio too.
  soundEngine.unlock()
  audioStore.setVolume(channel, Number((e.target as HTMLInputElement).value))
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

function onPointerDown(e: PointerEvent) {
  const target = e.target as Node | null
  // Clicks on the toggle button that opened us are handled by the header itself.
  if (target instanceof Element && target.closest('[data-sound-settings-trigger]')) return
  if (root.value && target && !root.value.contains(target)) emit('close')
}

onMounted(async () => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeyDown)
  await nextTick()
  root.value?.querySelector<HTMLElement>('input, button')?.focus()
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div
    ref="root"
    role="dialog"
    aria-modal="false"
    aria-labelledby="sound-settings-title"
    class="clip-hud w-[min(20rem,calc(100vw-2rem))] border-2 border-electric bg-void p-4 text-foreground [box-shadow:inset_0_0_24px_color-mix(in_oklab,var(--neon-blue)_18%,transparent)]"
  >
    <div class="flex items-center justify-between gap-2">
      <h2 id="sound-settings-title" class="font-display text-xs font-black uppercase tracking-[0.3em] text-electric">
        Sound
      </h2>
      <button
        type="button"
        aria-label="Close sound settings"
        class="grid h-8 w-8 place-items-center border-2 border-violet/60 text-foreground transition-colors hover:border-electric hover:text-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
        @click="emit('close')"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <ul class="mt-3 space-y-4">
      <li v-for="ch in channels" :key="ch.id">
        <div class="flex items-center justify-between gap-2">
          <label :for="`sound-${ch.id}`" class="min-w-0">
            <span class="block font-arcade text-[9px] uppercase leading-tight text-foreground">{{ ch.label }}</span>
            <span class="mt-1 block text-xs leading-tight text-muted-foreground">{{ ch.hint }}</span>
          </label>
          <button
            type="button"
            :aria-pressed="!ch.enabled"
            :aria-label="`${ch.enabled ? 'Mute' : 'Unmute'} ${ch.label}`"
            :class="
              cn(
                'flex h-8 shrink-0 items-center gap-1 border-2 px-2 font-arcade text-[8px] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric',
                ch.enabled
                  ? 'border-electric text-electric hover:bg-electric/15'
                  : 'border-danger bg-danger/15 text-foreground hover:bg-danger/25',
              )
            "
            @click="ch.toggle()"
          >
            <Volume2 v-if="ch.enabled" class="h-3.5 w-3.5" aria-hidden="true" />
            <VolumeX v-else class="h-3.5 w-3.5" aria-hidden="true" />
            {{ ch.enabled ? 'On' : 'Muted' }}
          </button>
        </div>
        <div class="mt-2 flex items-center gap-3">
          <input
            :id="`sound-${ch.id}`"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="ch.volume"
            :aria-valuetext="`${ch.volume} percent${ch.enabled ? '' : ', muted'}`"
            :class="
              cn(
                'h-2 min-w-0 flex-1 cursor-pointer accent-[var(--neon-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 focus-visible:ring-offset-void',
                !ch.enabled && 'opacity-50',
              )
            "
            @input="onInput(ch.id, $event)"
          />
          <output :for="`sound-${ch.id}`" class="w-9 shrink-0 text-right font-arcade text-[9px] text-foreground">
            {{ ch.volume }}
          </output>
        </div>
      </li>
    </ul>
  </div>
</template>
