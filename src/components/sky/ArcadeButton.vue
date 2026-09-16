<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/cn'
import { arcadeButton, type ArcadeButtonSize, type ArcadeButtonVariant } from './arcadeButtonVariants'

const props = withDefaults(
  defineProps<{
    variant?: ArcadeButtonVariant
    size?: ArcadeButtonSize
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    class?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
  },
)

const classes = computed(() =>
  cn(arcadeButton({ variant: props.variant, size: props.size }), props.class),
)
</script>

<template>
  <button :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
