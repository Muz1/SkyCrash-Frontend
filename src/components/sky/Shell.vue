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
  <!-- Exactly one screen: header, content (flex-1), nav dock. Long content scrolls inside main, without a visible bar. -->
  <div class="relative flex h-dvh flex-col overflow-hidden bg-void">
    <SkyEnvironment :skin="skin" :dim="dim" />
    <Ambient :skin="skin" />
    <!-- Optional extra sky layer (e.g. lobby-mates' aircraft), drawn under the page content. -->
    <slot name="backdrop" />
    <PageTransition :craft="hangarStore.craftId" />
    <CRTOverlay />
    <HudHeader v-if="showHud" />
    <main :class="cn('relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-2 sm:px-8', props.class)">
      <slot />
    </main>
    <NavDock />
  </div>
</template>
