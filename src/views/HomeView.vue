<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlayerStore } from '@/stores/playerStore'
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
const lobbyStore = useLobbyStore()
const hangarStore = useHangarStore()

const steps = [
  { n: '1', t: 'Take Off', d: 'Place your bet before the round starts.' },
  { n: '2', t: 'Climb', d: 'The multiplier rises with the shared flight.' },
  { n: '3', t: 'Cash Out', d: 'Bank your credits before the crash.' },
]

onMounted(() => {
  if (!playerStore.profile) playerStore.fetchProfile()
  lobbyStore.fetchOnlinePlayers()
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-void">
    <SkyEnvironment skin="sunset-runway" :dim="0.22" priority />
    <CRTOverlay />

    <HudHeader />

    <div class="relative z-10 flex min-h-[80vh] flex-col items-center justify-end px-4 pb-44 text-center sm:pb-48">
      <Plane :craft="hangarStore.craftId" :size="200" class="mb-4 -translate-x-6 sm:mb-8" />

      <h1 class="sr-only">Sky Crash</h1>
      <div aria-hidden>
        <Wordmark />
      </div>

      <div class="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row">
        <RouterLink to="/game">
          <ArcadeButton size="xl" variant="primary">Play Sky Crash</ArcadeButton>
        </RouterLink>
        <RouterLink to="/lobby">
          <ArcadeButton size="lg" variant="ghost">{{ lobbyStore.onlinePlayers.length }} Pilots Online</ArcadeButton>
        </RouterLink>
      </div>

      <section class="mt-14 grid w-full max-w-3xl gap-3 sm:grid-cols-3" aria-label="How the flight works">
        <NeonPanel v-for="s in steps" :key="s.n" accent="magenta">
          <p class="font-arcade text-2xl text-magenta text-glow-magenta">{{ s.n }}</p>
          <p class="mt-2 font-display text-sm font-black uppercase tracking-[0.2em] text-foreground">{{ s.t }}</p>
          <p class="mt-1 text-sm text-muted-foreground">{{ s.d }}</p>
        </NeonPanel>
      </section>

      <p class="mt-10 font-arcade text-[8px] uppercase tracking-[0.3em] text-violet">
        High risk. High thrill. Beat the sky.
      </p>
    </div>

    <NavDock />
  </div>
</template>
