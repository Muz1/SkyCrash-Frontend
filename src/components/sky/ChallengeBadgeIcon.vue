<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/cn'
import { challengeBadgeFor } from '@/lib/challengeBadges'

/** A daily-challenge badge: existing badge art inside its category's colour ring. */
const props = withDefaults(
  defineProps<{
    badgeKey: string
    size?: 'sm' | 'md' | 'lg'
    /** Shows "x3" when the badge has been earned more than once. */
    count?: number
    locked?: boolean
    class?: string
  }>(),
  { size: 'md', count: 0, locked: false },
)

const info = computed(() => challengeBadgeFor(props.badgeKey))
const sizeClass = computed(() => ({ sm: 'h-9 w-9', md: 'h-12 w-12', lg: 'h-20 w-20' })[props.size])
</script>

<template>
  <span
    v-if="info"
    :class="cn('relative inline-grid shrink-0 place-items-center rounded-full border-2 bg-void/70 p-1', sizeClass, locked && 'opacity-60 grayscale-[70%]', props.class)"
    :style="{ borderColor: info.color, boxShadow: locked ? undefined : `0 0 12px ${info.color}66` }"
    role="img"
    :aria-label="`${info.name} badge${locked ? ' (not earned yet)' : count > 1 ? `, earned ${count} times` : ''}`"
  >
    <img :src="info.src" alt="" class="h-full w-full object-contain" />
    <span
      v-if="count > 1"
      class="absolute -bottom-1 -right-1 min-w-5 rounded-full border border-void bg-foreground px-1 text-center font-display text-[0.625rem] font-black leading-4 text-void"
      aria-hidden="true"
    >
      x{{ count }}
    </span>
  </span>
</template>
