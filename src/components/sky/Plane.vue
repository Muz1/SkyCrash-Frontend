<script setup lang="ts">
import Aircraft from './Aircraft.vue'
import type { CraftId } from '@/lib/craft'

/**
 * Convenience wrapper that flies whatever craft the caller equips.
 * Always oriented along the canonical 45° bottom-left → top-right vector.
 */
withDefaults(
  defineProps<{
    craft?: CraftId
    size?: number
    trail?: boolean
    trailIntensity?: number
    crashing?: boolean
    idle?: boolean
    class?: string
  }>(),
  {
    craft: 'jet',
    size: 180,
    trail: true,
    trailIntensity: 1,
    crashing: false,
    idle: true,
  },
)
</script>

<template>
  <Aircraft
    :craft="craft"
    :size="size"
    :trail="trail"
    :trail-intensity="trailIntensity"
    :crashing="crashing"
    :idle="idle"
    :class="$props.class"
  />
</template>
