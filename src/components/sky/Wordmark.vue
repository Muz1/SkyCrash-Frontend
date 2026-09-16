<script setup lang="ts">
import { cn } from '@/lib/cn'
import logo from '@/assets/logo-skycrash.png'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <RouterLink to="/" class="block leading-none">
    <img
      :src="logo"
      alt="Sky Crash"
      width="1152"
      height="576"
      :class="
        cn(
          'h-auto w-auto drop-shadow-[0_0_22px_color-mix(in_oklab,var(--neon-magenta)_55%,transparent)]',
          compact ? 'max-h-11' : 'max-h-40 sm:max-h-56',
        )
      "
    />
    <span v-if="!compact" class="mt-2 block font-arcade text-[8px] uppercase tracking-[0.42em] text-electric text-glow-blue sm:text-xs">
      The sky is the limit
    </span>
  </RouterLink>
</template>
