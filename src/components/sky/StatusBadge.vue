<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/cn'

const props = defineProps<{
  status: 'CASHED OUT' | 'CRASHED' | 'NEW' | 'TOP' | 'LIVE'
}>()

const map: Record<string, string> = {
  'CASHED OUT': 'border-lime text-lime',
  CRASHED: 'border-danger text-danger',
  NEW: 'border-electric text-electric',
  TOP: 'border-ember text-ember',
  LIVE: 'border-magenta text-magenta',
}

const classes = computed(() =>
  cn('clip-hud inline-block border px-2 py-1 font-arcade text-[7px] uppercase leading-none', map[props.status]),
)
</script>

<template>
  <span :class="classes">{{ status }}</span>
</template>
