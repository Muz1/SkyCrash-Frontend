<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/cn'

const props = withDefaults(
  defineProps<{
    label?: string
    class?: string
    tone?: 'blue' | 'lime' | 'magenta' | 'ember'
  }>(),
  {
    tone: 'blue',
  },
)

const toneClass = computed(
  () =>
    ({
      blue: 'text-electric text-glow-blue',
      lime: 'text-lime text-glow-lime',
      magenta: 'text-magenta text-glow-magenta',
      ember: 'text-ember text-glow-ember',
    })[props.tone],
)
</script>

<template>
  <div :class="cn('text-center', props.class)">
    <p v-if="label" class="font-display text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
      {{ label }}
    </p>
    <p :class="cn('font-arcade text-2xl leading-tight sm:text-3xl', toneClass)">
      <slot />
    </p>
  </div>
</template>
