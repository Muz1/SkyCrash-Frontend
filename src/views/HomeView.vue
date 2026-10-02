<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useAuthStore } from '@/stores/AuthStore'
import { useLobbyStore } from '@/stores/lobbyStore'
import { useHangarStore } from '@/stores/hangarStore'
import SkyEnvironment from '@/components/sky/SkyEnvironment.vue'
import CRTOverlay from '@/components/sky/CRTOverlay.vue'
import Plane from '@/components/sky/Plane.vue'
import NavDock from '@/components/sky/NavDock.vue'
import HudHeader from '@/components/sky/HudHeader.vue'
import Wordmark from '@/components/sky/Wordmark.vue'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'
import NeonPanel from '@/components/sky/NeonPanel.vue'

const playerStore = usePlayerStore()
const authStore = useAuthStore()
const lobbyStore = useLobbyStore()
const hangarStore = useHangarStore()

const steps = [
  { n: '1', t: 'Take Off', d: 'Place your bet before the round starts.' },
  { n: '2', t: 'Climb', d: 'The multiplier rises with the shared flight.' },
  { n: '3', t: 'Cash Out', d: 'Bank your credits before the crash.' },
]

onMounted(() => {
  // Home is public: only load account data for signed-in pilots.
  if (!authStore.isAuthenticated) return
  if (!playerStore.profile) playerStore.fetchProfile()
  lobbyStore.fetchOnlinePlayers()
})
</script>

<template>
  <!-- Exactly one screen: header, hero + steps (flex-1), nav dock. Never scrolls. -->
  <div class="relative flex h-dvh flex-col overflow-hidden bg-void">
    <SkyEnvironment skin="sunset-runway" :dim="0.22" priority />
    <CRTOverlay />

    <HudHeader />

    <div
      class="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center"
    >
      <Plane
        :craft="hangarStore.craftId"
        :size="200"
        class="mb-1 !h-[clamp(64px,14dvh,180px)] !w-[clamp(64px,14dvh,180px)] -translate-x-6 sm:mb-2"
      />

      <h1 class="sr-only">Sky Crash</h1>
      <div aria-hidden>
        <Wordmark />
      </div>

      <div class="mt-[clamp(0.75rem,2.5dvh,1.5rem)] flex flex-col items-center gap-3 sm:flex-row">
        <!-- Logged-out players are sent to log in first, then straight on to the game. -->
        <RouterLink to="/game">
          <ArcadeButton size="xl" variant="primary">Play Sky Crash</ArcadeButton>
        </RouterLink>
        <!-- Secondary to Play: beside it on desktop, directly beneath it on phones. -->
        <RouterLink to="/lobby">
          <ArcadeButton size="md" variant="blue" class="sm:px-8 sm:py-4 sm:text-lg">Join Lobby</ArcadeButton>
        </RouterLink>
        <RouterLink v-if="!authStore.isAuthenticated" to="/register">
          <ArcadeButton size="md" variant="ghost" class="sm:px-8 sm:py-4 sm:text-lg">Create Account</ArcadeButton>
        </RouterLink>
        <!-- Same destination as Join Lobby, so phones skip it to keep the hero on one screen. -->
        <RouterLink v-else to="/lobby" class="hidden sm:block">
          <ArcadeButton size="md" variant="ghost" class="sm:px-8 sm:py-4 sm:text-lg">
            {{ lobbyStore.onlinePlayers.length }} Pilots Online
          </ArcadeButton>
        </RouterLink>
      </div>

      <section
        class="mt-[clamp(0.75rem,3dvh,1.5rem)] grid w-full max-w-3xl grid-cols-3 gap-2 sm:gap-3"
        aria-label="How the flight works"
      >
        <NeonPanel v-for="s in steps" :key="s.n" accent="magenta" class="[&>div]:p-2.5 sm:[&>div]:p-5">
          <p class="font-arcade text-base text-magenta text-glow-magenta sm:text-2xl">{{ s.n }}</p>
          <p class="mt-1.5 font-display text-[10px] font-black uppercase tracking-[0.14em] text-foreground sm:mt-2 sm:text-sm sm:tracking-[0.2em]">
            {{ s.t }}
          </p>
          <p class="mt-1 hidden text-sm text-muted-foreground sm:block [@media(max-height:600px)]:hidden">{{ s.d }}</p>
        </NeonPanel>
      </section>

      <p class="mt-4 font-arcade text-[8px] uppercase tracking-[0.3em] text-violet [@media(max-height:900px)]:hidden">
        High risk. High thrill. Beat the sky.
      </p>
    </div>

    <NavDock />
  </div>
</template>
