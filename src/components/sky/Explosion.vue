<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{ size?: number }>(), { size: 260 });

const px = computed(() => Math.max(6, Math.round(props.size / 26)));

const blocks = computed(() =>
  Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2 + (i % 3) * 0.12;
    const dist = props.size * (0.42 + (i % 4) * 0.16);
    const scale = 1 + (i % 3);
    return {
      i,
      width: px.value * scale * 0.6,
      height: px.value * scale * 0.6,
      background: i % 3 === 0 ? "var(--neon-red)" : i % 3 === 1 ? "var(--neon-orange)" : "oklch(0.98 0.05 90)",
      dx: `${Math.cos(a) * dist}px`,
      dy: `${Math.sin(a) * dist}px`,
      rot: `${(i % 2 ? 1 : -1) * 320}deg`,
      duration: 900 + (i % 5) * 120,
      delay: i * 14,
    };
  }),
);

const smokes = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    return {
      i,
      dx: `${Math.cos(a) * props.size * 0.32}px`,
      dy: `${Math.sin(a) * props.size * 0.32 - props.size * 0.1}px`,
      delay: 180 + i * 60,
    };
  }),
);

const rings = [0, 140, 300, 460];
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <!-- full-stage strobe flash -->
    <span
      class="fixed inset-0 bg-[var(--neon-orange)]"
      style="animation: explode-strobe 700ms steps(1, end) forwards"
    />

    <!-- white-hot flash core -->
    <span
      class="absolute inset-0 rounded-full"
      style="
        animation: explode-flash 700ms steps(6, end) forwards;
        background: radial-gradient(circle, oklch(0.99 0.03 95) 0%, oklch(0.98 0.05 90) 28%, var(--neon-orange) 52%, transparent 68%);
      "
    />

    <!-- fireball -->
    <span
      class="absolute inset-0 rounded-full"
      style="
        animation: explode-core 1.1s steps(8, end) forwards;
        background: radial-gradient(circle, oklch(0.98 0.05 90) 0%, var(--neon-orange) 38%, color-mix(in oklab, var(--neon-red) 85%, transparent) 64%, transparent 74%);
      "
    />

    <!-- stacked shockwave rings -->
    <span
      v-for="(delay, i) in rings"
      :key="delay"
      class="absolute inset-0 rounded-full"
      :class="i % 2 ? 'border-4 border-danger' : 'border-4 border-ember'"
      :style="{ animation: `explode-ring 1.1s steps(10, end) ${delay}ms forwards` }"
    />

    <!-- pixel debris blocks -->
    <span
      v-for="b in blocks"
      :key="`block-${b.i}`"
      class="absolute left-1/2 top-1/2"
      :style="{
        width: `${b.width}px`,
        height: `${b.height}px`,
        background: b.background,
        boxShadow: '0 0 12px color-mix(in oklab, var(--neon-orange) 80%, transparent)',
        '--dx': b.dx,
        '--dy': b.dy,
        '--rot': b.rot,
        animation: `explode-block ${b.duration}ms steps(9, end) ${b.delay}ms forwards`,
      }"
    />

    <!-- smoke puffs -->
    <span
      v-for="s in smokes"
      :key="`smoke-${s.i}`"
      class="absolute left-1/2 top-1/2 rounded-full blur-[2px]"
      :style="{
        width: `${size * 0.34}px`,
        height: `${size * 0.34}px`,
        background: 'color-mix(in oklab, var(--neon-violet) 55%, transparent)',
        '--dx': s.dx,
        '--dy': s.dy,
        animation: `explode-smoke 1.4s ease-out ${s.delay}ms forwards`,
      }"
    />

    <!-- arcade BOOM! callout -->
    <span
      class="absolute left-1/2 top-1/2 whitespace-nowrap font-arcade text-2xl text-ember [text-shadow:0_0_18px_var(--neon-orange),4px_4px_0_color-mix(in_oklab,var(--neon-red)_90%,transparent)] sm:text-4xl"
      style="animation: explode-boom 1.5s steps(12, end) 120ms forwards"
    >
      BOOM!
    </span>
  </div>
</template>
