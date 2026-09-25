<script setup lang="ts">
import { ShieldCheck, Users, Music, VolumeX } from '@lucide/vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useAudioStore } from '@/stores/audioStore'
import CreditDisplay from './CreditDisplay.vue'
import Wordmark from './Wordmark.vue'

const playerStore = usePlayerStore()
const audioStore = useAudioStore()
</script>

<template>
  <header class="relative z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 sm:px-8 sm:py-4">
    <div class="min-w-0">
      <Wordmark compact />
    </div>
    <div class="flex items-center gap-2 justify-self-end">
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
    </div>
  </header>
</template>
