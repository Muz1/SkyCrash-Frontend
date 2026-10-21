<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cn } from '@/lib/cn'
import { ascentLayers, skinMood, skinSrc, type SkinId } from '@/lib/skins'
import sunsetRunway from '@/assets/env-sunset-runway.jpg'
import cloudCity from '@/assets/env-cloud-city.jpg'
import deepSpace from '@/assets/env-deep-space.jpg'

const props = withDefaults(
  defineProps<{
    skin?: SkinId
    class?: string
    showGrid?: boolean
    dim?: number
    priority?: boolean
    /** 0 → 1 ascent progress, only used by the "taking-off" skin. */
    progress?: number
    /**
     * Cosmetic sky stage while a round climbs: 1 at 10x, 2 at 50x, 3 at 100x. Pure CSS
     * (gradients and a colour filter), so it never touches timing or maths.
     */
    milestone?: 0 | 1 | 2 | 3
  }>(),
  {
    skin: 'sunset-runway',
    showGrid: true,
    dim: 0.35,
    priority: false,
    progress: 0,
    milestone: 0,
  },
)

/** Each milestone tints the sky a little further towards the edge of space. */
const MILESTONE_GLOW = [
  'transparent',
  'radial-gradient(ellipse at 50% -10%, color-mix(in oklab, var(--neon-orange) 45%, transparent), transparent 65%)',
  'radial-gradient(ellipse at 50% -10%, color-mix(in oklab, var(--neon-violet) 60%, transparent), transparent 70%), radial-gradient(ellipse at 80% 20%, color-mix(in oklab, var(--neon-blue) 35%, transparent), transparent 55%)',
  'radial-gradient(ellipse at 50% -15%, color-mix(in oklab, var(--neon-lime) 45%, transparent), transparent 70%), radial-gradient(ellipse at 20% 30%, color-mix(in oklab, var(--neon-magenta) 40%, transparent), transparent 60%)',
] as const
const MILESTONE_FILTER = ['none', 'saturate(1.15)', 'saturate(1.3) hue-rotate(-18deg)', 'saturate(1.45) hue-rotate(-36deg) brightness(1.08)'] as const

const ascent = computed(() => props.skin === 'taking-off')
const layers = computed(() => ascentLayers(props.progress))
const mood = computed(() => skinMood(props.skin))

const stars = Array.from({ length: 44 }, (_, i) => ({
  left: (i * 37.7) % 100,
  top: (i * 61.3) % 65,
  d: (i % 7) * 0.4,
  s: 1 + (i % 3),
}))

const starsOpacity = computed(() =>
  ascent.value ? 0.35 + layers.value.space * 0.65 : mood.value === 'ground' ? 0.35 : 1,
)
const showClouds = computed(() => (ascent.value ? true : mood.value !== 'space'))
const gridOpacity = computed(() =>
  ascent.value ? 1 - layers.value.cloud : mood.value === 'ground' ? 1 : 0.25,
)

/** Crossfading backdrop: any skin change fades the previous environment out. */
const crossfadeLayers = ref<{ id: number; src: string }[]>([{ id: 0, src: skinSrc(props.skin) }])
let seq = 0
watch(
  () => props.skin,
  (skin) => {
    if (skin === 'taking-off') return
    seq += 1
    const id = seq
    crossfadeLayers.value = [...crossfadeLayers.value.slice(-2), { id, src: skinSrc(skin) }]
    setTimeout(() => {
      crossfadeLayers.value = crossfadeLayers.value.filter((l) => l.id === id)
    }, 1200)
  },
)
</script>

<template>
  <div
    aria-hidden
    :class="cn('absolute inset-0 overflow-hidden transition-[filter] duration-[1200ms] ease-out', props.class)"
    :style="{ filter: MILESTONE_FILTER[props.milestone] }"
  >
    <div v-if="ascent" class="absolute inset-0">
      <img
        :src="sunsetRunway"
        alt=""
        width="1920"
        height="1088"
        class="absolute inset-0 h-full w-full object-cover"
        :style="{
          transform: `translate3d(0, ${progress * 6}%, 0) scale(${1 + progress * 0.06})`,
          willChange: 'transform',
        }"
      />
      <img
        :src="cloudCity"
        alt=""
        width="1920"
        height="1088"
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-linear"
        :style="{ opacity: layers.cloud }"
      />
      <img
        :src="deepSpace"
        alt=""
        width="1920"
        height="1088"
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-linear"
        :style="{ opacity: layers.space }"
      />
    </div>
    <template v-else>
      <img
        v-for="(l, i) in crossfadeLayers"
        :key="l.id"
        :src="l.src"
        alt=""
        width="1920"
        height="1088"
        :loading="priority && i === 0 ? 'eager' : 'lazy'"
        class="absolute inset-0 h-full w-full object-cover"
        :style="
          i === crossfadeLayers.length - 1 && crossfadeLayers.length > 1
            ? { animation: 'env-fade-in 1100ms ease-out both' }
            : {}
        "
      />
    </template>

    <div aria-hidden class="absolute inset-0 transition-opacity duration-700" :style="{ opacity: starsOpacity }">
      <span
        v-for="(s, i) in stars"
        :key="i"
        class="animate-twinkle absolute rounded-full bg-white"
        :style="{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.s}px`, height: `${s.s}px`, animationDelay: `${s.d}s` }"
      />
    </div>

    <div v-if="ascent" class="transition-opacity duration-500" :style="{ opacity: 1 - layers.space }">
      <div aria-hidden class="absolute inset-x-0 bottom-0 top-1/3 overflow-hidden">
        <div
          v-for="i in [0, 1, 2]"
          :key="i"
          class="absolute h-24 w-64 rounded-full blur-2xl"
          :style="{
            left: `${i * 34}%`,
            bottom: `${12 + i * 18}%`,
            background:
              i % 2 === 0
                ? 'color-mix(in oklab, var(--neon-magenta) 45%, transparent)'
                : 'color-mix(in oklab, var(--neon-violet) 50%, transparent)',
            animation: `sky-float ${10 + i * 3}s ease-in-out ${i}s infinite`,
          }"
        />
      </div>
    </div>
    <div v-else-if="showClouds" aria-hidden class="absolute inset-x-0 bottom-0 top-1/3 overflow-hidden">
      <div
        v-for="i in [0, 1, 2]"
        :key="i"
        class="absolute h-24 w-64 rounded-full blur-2xl"
        :style="{
          left: `${i * 34}%`,
          bottom: `${12 + i * 18}%`,
          background:
            i % 2 === 0
              ? 'color-mix(in oklab, var(--neon-magenta) 45%, transparent)'
              : 'color-mix(in oklab, var(--neon-violet) 50%, transparent)',
          animation: `sky-float ${10 + i * 3}s ease-in-out ${i}s infinite`,
        }"
      />
    </div>

    <div
      v-if="showGrid"
      class="grid-floor absolute inset-x-0 bottom-0 h-1/3 transition-opacity duration-500"
      :style="{ opacity: gridOpacity }"
    />

    <div
      class="absolute inset-0 transition-opacity duration-300"
      :style="{
        background: `linear-gradient(180deg, oklch(0.11 0.06 285 / ${dim + 0.25}) 0%, oklch(0.11 0.06 285 / ${dim}) 45%, oklch(0.11 0.06 285 / ${Math.min(dim + 0.5, 0.95)}) 100%)`,
      }"
    />
    <div
      class="absolute inset-0"
      style="background: radial-gradient(ellipse at 50% 120%, color-mix(in oklab, var(--neon-magenta) 22%, transparent), transparent 60%)"
    />
    <!-- milestone glow: fades between stages, sits above the dimming so it reads clearly -->
    <div
      v-for="(glow, i) in MILESTONE_GLOW.slice(1)"
      :key="i"
      data-sky-milestone
      class="absolute inset-0 transition-opacity duration-[1200ms] ease-out motion-reduce:transition-none"
      :style="{ background: glow, opacity: props.milestone === i + 1 ? 1 : 0 }"
    />
  </div>
</template>
