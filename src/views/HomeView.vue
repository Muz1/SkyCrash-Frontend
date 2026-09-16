<script setup lang="ts">
import CRTOverlay from "@/components/sky/CRTOverlay.vue";
import ArcadeButton from "@/components/sky/ArcadeButton.vue";
import NeonPanel from "@/components/sky/NeonPanel.vue";
import SkyEnvironment from "@/components/sky/SkyEnvironment.vue";
import Plane from "@/components/sky/Plane.vue";
import NavDock from "@/components/sky/NavDock.vue";
import Wordmark from "@/components/sky/Wordmark.vue";

const steps = [
  { n: "1", t: "Take Off", d: "Place your bet and launch." },
  { n: "2", t: "Climb", d: "The multiplier rises with altitude." },
  { n: "3", t: "Cash Out", d: "Bank your credits before the crash." },
];
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-void">
    <SkyEnvironment skin="sunset-runway" :dim="0.22" :priority="true" />
    <CRTOverlay />

    <div class="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-44 pt-16 text-center sm:pb-48">
      <Plane :size="230" class="mb-4 -translate-x-6 sm:mb-8 sm:size-auto" :style="{ width: 'min(70vw, 260px)' }" />

      <h1 class="sr-only">Sky Crash — The Sky Is The Limit</h1>
      <div aria-hidden="true">
        <Wordmark />
      </div>

      <div class="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row">
        <RouterLink to="/play">
          <ArcadeButton size="xl" variant="primary">Play Sky Crash</ArcadeButton>
        </RouterLink>
        <a href="#how-it-works">
          <ArcadeButton size="lg" variant="ghost">How It Works</ArcadeButton>
        </a>
      </div>

      <div class="mt-5 flex gap-3">
        <RouterLink to="/login">
          <ArcadeButton size="sm" variant="blue" class="bg-void/80 backdrop-blur-sm">Login</ArcadeButton>
        </RouterLink>
        <RouterLink to="/signup">
          <ArcadeButton size="sm" variant="magenta" class="bg-void/80 backdrop-blur-sm">Create Account</ArcadeButton>
        </RouterLink>
      </div>

      <section id="how-it-works" class="mt-14 grid w-full max-w-3xl gap-3 sm:grid-cols-3" aria-label="How the flight works">
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
