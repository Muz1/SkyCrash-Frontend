<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/cn'
import { avatarColour, avatarInitial } from '@/lib/lobby'

/** Round avatar for a pilot: their initial on a colour picked from the username. */
const props = withDefaults(defineProps<{ username: string; size?: 'sm' | 'md'; class?: string }>(), { size: 'sm' })

const colour = computed(() => avatarColour(props.username))
</script>

<template>
  <span
    aria-hidden="true"
    :class="
      cn(
        'grid shrink-0 place-items-center rounded-full border-2 border-void font-display font-black leading-none text-void',
        size === 'md' ? 'h-9 w-9 text-sm' : 'h-6 w-6 text-[0.6875rem]',
        props.class,
      )
    "
    :style="{ background: colour, boxShadow: `0 0 10px color-mix(in oklab, ${colour} 70%, transparent)` }"
  >
    {{ avatarInitial(username) }}
  </span>
</template>
