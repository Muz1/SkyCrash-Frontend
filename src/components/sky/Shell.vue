<script setup lang="ts">
import { useHangarStore } from '@/stores/hangarStore'
import { cn } from '@/lib/cn'
import type { SkinId } from '@/lib/skins'
import SkyEnvironment from './SkyEnvironment.vue'
import Ambient from './Ambient.vue'
import PageTransition from './PageTransition.vue'
import CRTOverlay from './CRTOverlay.vue'
import NavDock from './NavDock.vue'
import HudHeader from './HudHeader.vue'

const props = withDefaults(
  defineProps<{
    skin?: SkinId
    dim?: number
    class?: string
    showHud?: boolean
  }>(),
  {
    skin: 'sunset-runway',
    dim: 0.45,
    showHud: true,
  },
)

const hangarStore = useHangarStore()
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-void">
    <SkyEnvironment :skin="skin" :dim="dim" />
    <Ambient :skin="skin" />
    <PageTransition :craft="hangarStore.craftId" />
    <CRTOverlay />
    <HudHeader v-if="showHud" />
    <main :class="cn('relative z-10 px-4 pb-40 sm:px-8', props.class)">
      <slot />
    </main>
    <NavDock />
  </div>
</template>
