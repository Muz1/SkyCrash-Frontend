<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Aircraft from './Aircraft.vue'
import logo from '@/assets/logo-skycrash.png'
import type { CraftId } from '@/lib/craft'

const props = withDefaults(defineProps<{ craft?: CraftId }>(), { craft: 'jet' })

const DURATION = 3400
const route = useRoute()
const flightKey = ref(0)
let hideTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => route.path,
  () => {
    flightKey.value += 1
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      flightKey.value = 0
    }, DURATION + 200)
  },
)
</script>

<template>
  <div v-if="flightKey !== 0" :key="flightKey" aria-hidden class="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
    <div
      class="absolute inset-0"
      :style="{
        animation: `transition-wipe ${DURATION}ms cubic-bezier(0.33,0,0.2,1) forwards`,
        background:
          'radial-gradient(ellipse at 10% 110%, color-mix(in oklab, var(--neon-magenta) 42%, transparent), oklch(0.11 0.06 285 / 0.8) 72%)',
      }"
    />
    <div
      class="absolute -left-1/2 bottom-0 h-[220%] w-[3px] origin-bottom rotate-[-45deg]"
      :style="{
        animation: `transition-wipe ${DURATION}ms cubic-bezier(0.33,0,0.2,1) forwards`,
        background: 'linear-gradient(to top, color-mix(in oklab, var(--neon-blue) 80%, transparent), transparent)',
      }"
    />
    <img
      :src="logo"
      alt=""
      width="1152"
      height="576"
      class="absolute left-1/2 top-1/2 w-[46vw] max-w-md -translate-x-1/2 -translate-y-1/2 opacity-0"
      :style="{ animation: `transition-wipe ${DURATION}ms cubic-bezier(0.33,0,0.2,1) forwards` }"
    />
    <div
      class="absolute left-0 top-0"
      :style="{ animation: `craft-diagonal ${DURATION}ms cubic-bezier(0.22,0.61,0.36,1) forwards`, willChange: 'transform' }"
    >
      <div :style="{ animation: `craft-sway ${DURATION}ms ease-in-out` }">
        <Aircraft
          :craft="props.craft"
          :size="420"
          :idle="false"
          :trail-intensity="1.6"
          class="w-[48vw] max-w-[460px]"
          :style="{ width: 'min(48vw, 460px)', height: 'min(48vw, 460px)' }"
        />
      </div>
    </div>
  </div>
</template>
