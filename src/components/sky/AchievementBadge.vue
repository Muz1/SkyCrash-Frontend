<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/cn'
import { badgeInfoFor } from '@/lib/achievements'
import { useBadgeViewerStore } from '@/stores/badgeViewerStore'

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

const badgeViewerStore = useBadgeViewerStore()
const info = computed(() => badgeInfoFor(props.achievementKey))
const label = computed(() => props.name ?? info.value?.name ?? 'Achievement badge')

const sizeClass = computed(
  () =>
    ({
      xs: 'h-4 w-4',
      sm: 'h-5 w-5',
      md: 'h-8 w-8',
    })[props.size],
)

function openViewer() {
  if (props.achievementKey) badgeViewerStore.open(props.achievementKey)
}
</script>

<template>
  <button
    v-if="info"
    type="button"
    :title="`${label} — click to view`"
    :aria-label="`View ${label} badge`"
    :class="cn('inline-flex shrink-0 cursor-zoom-in align-middle transition-transform duration-150 hover:scale-125', props.class)"
    @click.stop.prevent="openViewer"
  >
    <img
      :src="info.src"
      :alt="label"
      :class="cn('object-contain', sizeClass)"
      :style="{ filter: `drop-shadow(0 0 3px ${info.color})` }"
    />
  </button>
</template>
