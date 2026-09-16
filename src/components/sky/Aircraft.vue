<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/cn'
import { getCraft, type CraftId } from '@/lib/craft'

/**
 * Canonical flight vector for the whole game: bottom-left → top-right at 45°.
 * Every aircraft sprite is normalised to this heading.
 */
const FLIGHT_ANGLE = 45

const props = withDefaults(
  defineProps<{
    craft: CraftId
    size?: number
    trail?: boolean
    trailIntensity?: number
    crashing?: boolean
    idle?: boolean
    class?: string
  }>(),
  {
    size: 200,
    trail: true,
    trailIntensity: 1,
    crashing: false,
    idle: true,
  },
)

const c = computed(() => getCraft(props.craft))
const trailLen = computed(() => props.size * (0.9 + props.trailIntensity * 0.9))
const particles = Array.from({ length: 10 }, (_, i) => i)
</script>

<template>
  <div :class="cn('pointer-events-none relative', props.class)" :style="{ width: `${size}px`, height: `${size}px` }">
    <span
      v-if="trail && !crashing"
      class="absolute left-[26%] top-[74%]"
      :style="{ transform: `rotate(-${FLIGHT_ANGLE}deg)` }"
    >
      <span aria-hidden class="pointer-events-none absolute left-0 top-0">
        <span
          class="absolute origin-left rounded-full blur-[3px]"
          :style="{
            width: `${trailLen}px`,
            height: `${Math.max(4, size * 0.055)}px`,
            transform: 'rotate(180deg) translateY(-50%)',
            background: `linear-gradient(90deg, transparent, color-mix(in oklab, ${c.trail} 70%, transparent) 55%, color-mix(in oklab, ${c.trail} 95%, transparent))`,
            opacity: 0.28 + trailIntensity * 0.5,
            animation: 'trail-pulse 900ms ease-in-out infinite',
          }"
        />
        <span
          v-for="i in particles"
          :key="i"
          class="absolute rounded-[1px]"
          :style="{
            width: `${Math.max(3, size * 0.035)}px`,
            height: `${Math.max(3, size * 0.035)}px`,
            background: i % 3 === 0 ? 'oklch(0.98 0.05 90)' : c.trail,
            opacity: 0,
            '--tx': `${-trailLen * (0.35 + (i % 5) * 0.16)}px`,
            '--ty': `${(i % 2 ? 1 : -1) * size * 0.035 * (1 + (i % 3))}px`,
            animation: `trail-particle ${1100 + (i % 4) * 260}ms linear ${i * 95}ms infinite`,
          }"
        />
      </span>
    </span>
    <img
      :src="c.src"
      :alt="`${c.name} aircraft`"
      width="1024"
      height="1024"
      :class="
        cn(
          'relative h-full w-full object-contain drop-shadow-[0_0_22px_color-mix(in_oklab,var(--neon-magenta)_45%,transparent)]',
          crashing ? 'animate-sky-spiral' : idle ? 'animate-sky-float' : undefined,
        )
      "
      :style="{ transform: `rotate(${c.rotate}deg)`, willChange: 'transform' }"
    />
  </div>
</template>
