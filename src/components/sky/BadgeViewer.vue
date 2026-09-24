<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useBadgeViewerStore } from '@/stores/badgeViewerStore'
import { badgeInfoFor } from '@/lib/achievements'
import ArcadeButton from '@/components/sky/ArcadeButton.vue'

const badgeViewerStore = useBadgeViewerStore()
const info = computed(() => badgeInfoFor(badgeViewerStore.achievementKey))

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') badgeViewerStore.close()
}

// Only listen for Escape while the viewer is open.
watch(info, (value) => {
  if (value) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Transition name="badge-viewer">
    <div
      v-if="info"
      class="fixed inset-0 z-[90] flex items-center justify-center bg-void/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-label="info.name"
      @click.self="badgeViewerStore.close()"
    >
      <div
        class="neon-panel clip-hud flex w-full max-w-sm flex-col items-center gap-4 border-2 bg-void/95 p-6 text-center"
        :style="{ borderColor: info.color, boxShadow: `0 0 24px ${info.color}66` }"
      >
        <img
          :src="info.src"
          :alt="info.name"
          class="badge-viewer-img aspect-square w-full max-w-[18rem] object-contain"
          :style="{ filter: `drop-shadow(0 0 16px ${info.color}aa)` }"
        />
        <div>
          <h2 class="font-display text-lg font-black uppercase tracking-[0.2em]" :style="{ color: info.color }">
            {{ info.name }}
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">{{ info.description }}</p>
        </div>
        <ArcadeButton size="sm" variant="ghost" @click="badgeViewerStore.close()">Close</ArcadeButton>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.badge-viewer-enter-active,
.badge-viewer-leave-active {
  transition: opacity 0.15s ease;
}
.badge-viewer-enter-active .badge-viewer-img {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.badge-viewer-enter-from,
.badge-viewer-leave-to {
  opacity: 0;
}
.badge-viewer-enter-from .badge-viewer-img {
  transform: scale(0.6);
}
</style>
