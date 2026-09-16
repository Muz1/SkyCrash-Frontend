<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ size: number; color: string; intensity?: number }>(),
  { intensity: 1 },
);

const len = computed(() => props.size * (0.9 + props.intensity * 0.9));

const particles = computed(() =>
  Array.from({ length: 10 }, (_, i) => ({
    i,
    width: Math.max(3, props.size * 0.035),
    height: Math.max(3, props.size * 0.035),
    background: i % 3 === 0 ? "oklch(0.98 0.05 90)" : props.color,
    tx: `${-len.value * (0.35 + (i % 5) * 0.16)}px`,
    ty: `${(i % 2 ? 1 : -1) * props.size * 0.035 * (1 + (i % 3))}px`,
    duration: 1100 + (i % 4) * 260,
    delay: i * 95,
  })),
);
</script>

<template>
  <span aria-hidden="true" class="pointer-events-none absolute left-0 top-0">
    <!-- soft heat streak -->
    <span
      class="absolute origin-left rounded-full blur-[3px]"
      :style="{
        width: `${len}px`,
        height: `${Math.max(4, size * 0.055)}px`,
        transform: 'rotate(180deg) translateY(-50%)',
        background: `linear-gradient(90deg, transparent, color-mix(in oklab, ${color} 70%, transparent) 55%, color-mix(in oklab, ${color} 95%, transparent))`,
        opacity: 0.28 + intensity * 0.5,
        animation: 'trail-pulse 900ms ease-in-out infinite',
      }"
    />
    <!-- particles peeling off behind the engines -->
    <span
      v-for="p in particles"
      :key="p.i"
      class="absolute rounded-[1px]"
      :style="{
        width: `${p.width}px`,
        height: `${p.height}px`,
        background: p.background,
        opacity: 0,
        '--tx': p.tx,
        '--ty': p.ty,
        animation: `trail-particle ${p.duration}ms linear ${p.delay}ms infinite`,
      }"
    />
  </span>
</template>
