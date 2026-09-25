<script setup lang="ts">
defineProps<{ credits: number }>()
</script>

<template>
  <div class="neon-panel clip-hud flex items-center gap-2 px-2.5 py-2 sm:gap-3 sm:px-4">
    <span
      class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[image:var(--grad-sunset)] font-arcade text-[8px] text-void"
      aria-hidden
    >
      $
    </span>
    <div class="min-w-0 leading-none">
      <p class="font-display text-[8px] uppercase tracking-[0.34em] text-muted-foreground">Credits</p>
      <p class="font-arcade text-sm text-ember text-glow-ember">
        {{ credits.toLocaleString() }}
      </p>
    </div>
  </div>
</template>
