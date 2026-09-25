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
  <!-- Sized to the viewport so Home never needs scrolling; the pinned dock sits below the content. -->
  <div class="relative flex min-h-[100dvh] flex-col overflow-hidden bg-void">
    <SkyEnvironment skin="sunset-runway" :dim="0.22" priority />
    <CRTOverlay />

    <HudHeader />

    <div
      class="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-28 text-center sm:pb-36"
    >
      <Plane
        :craft="hangarStore.craftId"
        :size="200"
        class="mb-2 !h-[clamp(96px,18dvh,200px)] !w-[clamp(96px,18dvh,200px)] -translate-x-6 sm:mb-3"
      />

      <h1 class="sr-only">Sky Crash</h1>
      <div aria-hidden>
        <Wordmark />
      </div>

      <div class="mt-5 flex flex-col items-center gap-3 sm:mt-6 sm:flex-row">
        <RouterLink to="/game">
          <ArcadeButton size="xl" variant="primary">Play Sky Crash</ArcadeButton>
        </RouterLink>
        <RouterLink to="/lobby">
          <ArcadeButton size="md" variant="ghost" class="sm:px-8 sm:py-4 sm:text-lg">
            {{ lobbyStore.onlinePlayers.length }} Pilots Online
          </ArcadeButton>
        </RouterLink>
      </div>

      <!-- Hidden on short screens (landscape phones) so the hero + actions always fit. -->
      <section
        class="mt-6 grid w-full max-w-3xl grid-cols-3 gap-2 sm:gap-3 [@media(max-height:680px)]:hidden"
        aria-label="How the flight works"
      >
        <NeonPanel v-for="s in steps" :key="s.n" accent="magenta" class="[&>div]:p-2.5 sm:[&>div]:p-5">
          <p class="font-arcade text-base text-magenta text-glow-magenta sm:text-2xl">{{ s.n }}</p>
          <p class="mt-1.5 font-display text-[10px] font-black uppercase tracking-[0.14em] text-foreground sm:mt-2 sm:text-sm sm:tracking-[0.2em]">
            {{ s.t }}
          </p>
          <p class="mt-1 hidden text-sm text-muted-foreground sm:block">{{ s.d }}</p>
        </NeonPanel>
      </section>

      <p class="mt-5 font-arcade text-[8px] uppercase tracking-[0.3em] text-violet max-sm:[@media(max-height:560px)]:hidden sm:[@media(max-height:960px)]:hidden">
        High risk. High thrill. Beat the sky.
      </p>
    </div>

    <NavDock />
  </div>
</template>
