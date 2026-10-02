<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { ShieldCheck, Users, Music, VolumeX, SlidersHorizontal } from '@lucide/vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/AuthStore'
import { useAudioStore } from '@/stores/audioStore'
import CreditDisplay from './CreditDisplay.vue'
import Wordmark from './Wordmark.vue'
import SoundSettings from './SoundSettings.vue'

const playerStore = usePlayerStore()
const authStore = useAuthStore()
const audioStore = useAudioStore()

const soundOpen = ref(false)
const soundTrigger = ref<HTMLButtonElement | null>(null)

async function closeSound() {
  soundOpen.value = false
  // Hand focus back to the button that opened the mixer.
  await nextTick()
  soundTrigger.value?.focus()
}
</script>

<template>
  <header class="relative z-20 flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 sm:px-8 sm:py-4">
    <div class="min-w-0">
      <Wordmark compact />
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <button
        type="button"
        :aria-label="audioStore.musicEnabled ? 'Mute music' : 'Play music'"
        :aria-pressed="audioStore.musicEnabled"
        :title="audioStore.musicEnabled ? 'Mute music' : 'Play music'"
        :class="[
          'grid h-9 w-9 shrink-0 place-items-center border-2 bg-void/70 clip-hud transition-all',
          audioStore.musicEnabled
            ? 'border-magenta/70 text-magenta hover:[box-shadow:var(--glow-magenta)]'
            : 'border-violet/50 text-muted-foreground hover:border-magenta hover:text-magenta',
        ]"
        @click="audioStore.toggleMusic()"
      >
        <Music v-if="audioStore.musicEnabled" class="h-4 w-4" aria-hidden="true" />
        <VolumeX v-else class="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        ref="soundTrigger"
        type="button"
        data-sound-settings-trigger
        aria-label="Sound settings"
        title="Sound settings"
        aria-haspopup="dialog"
        :aria-expanded="soundOpen"
        aria-controls="sound-settings"
        :class="[
          'grid h-9 w-9 shrink-0 place-items-center border-2 bg-void/70 clip-hud transition-all',
          soundOpen
            ? 'border-electric text-electric [box-shadow:var(--glow-blue)]'
            : 'border-electric/70 text-electric hover:[box-shadow:var(--glow-blue)]',
        ]"
        @click="soundOpen ? closeSound() : (soundOpen = true)"
      >
        <SlidersHorizontal class="h-4 w-4" aria-hidden="true" />
      </button>
      <template v-if="!authStore.isAuthenticated">
        <RouterLink
          to="/login"
          class="clip-hud border-2 border-electric/70 bg-void/70 px-3 py-2 font-display text-[10px] font-black uppercase tracking-[0.18em] text-electric transition-all hover:[box-shadow:var(--glow-blue)]"
        >
          Login
        </RouterLink>
        <RouterLink
          to="/register"
          class="clip-hud border-2 border-magenta/70 bg-void/70 px-3 py-2 font-display text-[10px] font-black uppercase tracking-[0.18em] text-magenta transition-all hover:[box-shadow:var(--glow-magenta)]"
        >
          Create Account
        </RouterLink>
      </template>
      <template v-else>
      <RouterLink
        v-if="playerStore.profile?.isAdmin"
        to="/admin"
        aria-label="Admin"
        class="grid h-9 w-9 shrink-0 place-items-center border-2 border-ember/70 bg-void/70 text-ember clip-hud transition-all hover:[box-shadow:var(--glow-ember)]"
      >
        <ShieldCheck class="h-4 w-4" aria-hidden="true" />
      </RouterLink>
      <RouterLink
        to="/lobby"
        aria-label="Lobby"
        class="grid h-9 w-9 shrink-0 place-items-center border-2 border-electric/70 bg-void/70 text-electric clip-hud transition-all hover:[box-shadow:var(--glow-blue)]"
      >
        <Users class="h-4 w-4" aria-hidden="true" />
      </RouterLink>
      <RouterLink to="/wallet" aria-label="Wallet" class="transition-transform hover:-translate-y-0.5">
        <CreditDisplay :credits="playerStore.profile?.creditBalance ?? 0" />
      </RouterLink>
      </template>
    </div>
    <SoundSettings
      v-if="soundOpen"
      id="sound-settings"
      class="absolute right-4 top-full z-40 sm:right-8"
      @close="closeSound"
    />
  </header>
</template>
