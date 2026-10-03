<script setup lang="ts">
import { onMounted, toRef } from 'vue'
import { RotateCw, Timer } from '@lucide/vue'
import { useSpinStore } from '@/stores/spinStore'
import { useCountdown, formatDuration } from '@/composables/useCountdown'

/** Betting-screen shortcut to the credit wheel: "Free spin ready" or a live countdown to the next one. */
const spinStore = useSpinStore()
const { seconds } = useCountdown(toRef(spinStore, 'nextSpinAt'))

onMounted(() => {
  if (!spinStore.status) void spinStore.load()
})
</script>

<template>
  <RouterLink
    v-if="spinStore.status"
    to="/spin"
    :aria-label="
      seconds === 0
        ? 'Free spin ready: open the credit wheel'
        : `Next free spin in ${formatDuration(seconds)}`
    "
    :class="[
      'clip-hud flex shrink-0 items-center gap-1.5 border-2 bg-void/70 px-2 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember',
      seconds === 0
        ? 'animate-pulse border-ember text-ember [box-shadow:var(--glow-ember)] hover:bg-ember/15'
        : 'border-violet/50 text-muted-foreground hover:border-ember hover:text-ember',
    ]"
  >
    <RotateCw v-if="seconds === 0" class="h-3.5 w-3.5" aria-hidden="true" />
    <Timer v-else class="h-3.5 w-3.5" aria-hidden="true" />
    <span class="font-arcade text-[0.5rem] uppercase tracking-[0.12em]">
      {{ seconds === 0 ? 'Free spin ready' : 'Next spin' }}
    </span>
    <span
      v-if="seconds > 0"
      role="timer"
      class="font-arcade text-[0.5625rem] tabular-nums text-foreground"
      >{{ formatDuration(seconds) }}</span
    >
  </RouterLink>
</template>
