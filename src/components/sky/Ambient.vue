<script setup lang="ts">
import { computed } from "vue";
import astronaut from "@/assets/astronaut.png";
import planet from "@/assets/planet.png";
import cloud from "@/assets/cloud.png";
import { ascentLayers, skinMood, type SkinId } from "@/lib/skyEnvironments";

type Drifter = {
  src: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  bob: number;
  spin?: boolean;
  reverse?: boolean;
  opacity?: number;
};

const SPACE: Drifter[] = [
  { src: astronaut, top: "18%", size: 108, duration: 46, delay: 0, bob: 9, spin: true },
  { src: astronaut, top: "62%", size: 72, duration: 62, delay: 18, bob: 12 },
  { src: planet, top: "10%", size: 150, duration: 120, delay: 4, bob: 18, opacity: 0.55 },
  { src: planet, top: "70%", size: 84, duration: 165, delay: 40, bob: 22, reverse: true, opacity: 0.4 },
];

const SKY: Drifter[] = [
  { src: cloud, top: "34%", size: 190, duration: 68, delay: 6, bob: 16, opacity: 0.5 },
  { src: cloud, top: "58%", size: 130, duration: 96, delay: 26, bob: 20, reverse: true, opacity: 0.35 },
  { src: cloud, top: "8%", size: 240, duration: 130, delay: 12, bob: 24, opacity: 0.28 },
  { src: cloud, top: "72%", size: 96, duration: 84, delay: 40, bob: 14, opacity: 0.22 },
];

const props = withDefaults(defineProps<{ skin: SkinId; progress?: number }>(), { progress: 0 });

const ascent = computed(() => props.skin === "taking-off");
const space = computed(() => ascentLayers(props.progress).space);
const mood = computed(() => skinMood(props.skin));
const skyOpacity = computed(() => (ascent.value ? 1 - space.value : mood.value === "space" ? 0 : 1));
const spaceOpacity = computed(() => (ascent.value ? space.value : mood.value === "space" ? 1 : 0));
</script>

<template>
  <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
    <div v-if="skyOpacity > 0.01" class="absolute inset-0 transition-opacity duration-700 ease-linear" :style="{ opacity: skyOpacity }">
      <div
        v-for="(it, i) in SKY"
        :key="`sky-${i}`"
        class="absolute"
        :style="{
          top: it.top,
          left: 0,
          animation: `${it.reverse ? 'ambient-cross-back' : 'ambient-cross'} ${it.duration}s linear ${it.delay}s infinite`,
          willChange: 'transform',
        }"
      >
        <div :style="{ animation: `ambient-bob ${it.bob}s ease-in-out infinite` }">
          <img
            :src="it.src"
            alt=""
            width="512"
            height="512"
            loading="lazy"
            class="drop-shadow-[0_0_18px_color-mix(in_oklab,var(--neon-blue)_60%,transparent)]"
            :style="{
              width: `${it.size}px`,
              height: 'auto',
              opacity: it.opacity ?? 0.7,
              animation: it.spin ? 'ambient-spin 28s linear infinite' : undefined,
            }"
          />
        </div>
      </div>
    </div>

    <div v-if="spaceOpacity > 0.01" class="absolute inset-0 transition-opacity duration-700 ease-linear" :style="{ opacity: spaceOpacity }">
      <div
        v-for="(it, i) in SPACE"
        :key="`space-${i}`"
        class="absolute"
        :style="{
          top: it.top,
          left: 0,
          animation: `${it.reverse ? 'ambient-cross-back' : 'ambient-cross'} ${it.duration}s linear ${it.delay}s infinite`,
          willChange: 'transform',
        }"
      >
        <div :style="{ animation: `ambient-bob ${it.bob}s ease-in-out infinite` }">
          <img
            :src="it.src"
            alt=""
            width="512"
            height="512"
            loading="lazy"
            class="drop-shadow-[0_0_18px_color-mix(in_oklab,var(--neon-blue)_60%,transparent)]"
            :style="{
              width: `${it.size}px`,
              height: 'auto',
              opacity: it.opacity ?? 0.7,
              animation: it.spin ? 'ambient-spin 28s linear infinite' : undefined,
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
