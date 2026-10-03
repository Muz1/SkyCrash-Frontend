<script setup lang="ts">
import Shell from '@/components/sky/Shell.vue'
import SpinWheelPanel from '@/components/sky/SpinWheelPanel.vue'
</script>

<template>
  <!-- The wheel on its own page: the only way to get free credits. Sized to fit one screen. -->
  <Shell skin="midnight" :dim="0.45" class="flex flex-col">
    <div class="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col items-center justify-center">
      <h1
        class="text-center font-display text-xl font-black uppercase tracking-[0.2em] text-ember text-glow-ember sm:text-3xl"
      >
        Spin the Wheel
      </h1>
      <p class="mt-1 text-center text-sm leading-snug text-foreground/90 sm:text-base">
        Out of fuel? Spin for free credits. One spin every 5 minutes.
      </p>
      <SpinWheelPanel class="mt-2 sm:mt-4" />
      <RouterLink
        to="/game"
        class="mt-2 font-arcade text-[0.625rem] uppercase tracking-[0.2em] text-electric hover:text-foreground sm:mt-4"
      >
        ← Back to the game
      </RouterLink>
    </div>
  </Shell>
</template>
