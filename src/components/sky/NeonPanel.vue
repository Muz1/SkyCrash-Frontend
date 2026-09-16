<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/cn'

const props = withDefaults(
  defineProps<{
    title?: string
    accent?: 'violet' | 'magenta' | 'blue' | 'lime' | 'ember'
    class?: string
  }>(),
  {
    accent: 'violet',
  },
)

const accentClass = computed(
  () =>
    ({
      violet: 'text-violet',
      magenta: 'text-magenta',
      blue: 'text-electric',
      lime: 'text-lime',
      ember: 'text-ember',
    })[props.accent],
)
</script>

<template>
  <section :class="cn('neon-panel clip-hud crt-scan', props.class)">
    <header v-if="title" class="border-b border-border/70 px-4 py-2">
      <h2 :class="cn('font-display text-[10px] font-black uppercase tracking-[0.32em] sm:text-xs', accentClass)">
        {{ title }}
      </h2>
    </header>
    <div class="p-4 sm:p-5">
      <slot />
    </div>
  </section>
</template>
