<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/cn'
import { badgeFor } from '@/lib/achievements'

const props = withDefaults(
  defineProps<{
    achievementKey?: string | null
    name?: string | null
    size?: 'xs' | 'sm' | 'md'
    class?: string
  }>(),
  {
    achievementKey: null,
    name: null,
    size: 'sm',
  },
)

const src = computed(() => badgeFor(props.achievementKey))

const sizeClass = computed(
  () =>
    ({
      xs: 'h-4 w-4',
      sm: 'h-5 w-5',
      md: 'h-8 w-8',
    })[props.size],
)
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :alt="name ?? achievementKey ?? 'Achievement badge'"
    :title="name ?? achievementKey ?? undefined"
    :class="cn('inline-block shrink-0 object-contain drop-shadow-[0_0_4px_rgba(255,200,80,0.6)]', sizeClass, props.class)"
  />
</template>
