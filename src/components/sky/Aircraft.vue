<script setup lang="ts">
import { computed } from "vue";
import { getCraft, type CraftId } from "@/lib/craft";
import AircraftTrail from "./AircraftTrail.vue";

/**
 * Canonical flight vector for the whole game: bottom-left → top-right at 45°.
 * Every aircraft sprite is normalised to this heading.
 */
const FLIGHT_ANGLE = 45;

const props = withDefaults(
  defineProps<{
    craft: CraftId;
    size?: number;
    trail?: boolean;
    trailIntensity?: number;
    crashing?: boolean;
    idle?: boolean;
  }>(),
  { size: 200, trail: true, trailIntensity: 1, crashing: false, idle: true },
);

const info = computed(() => getCraft(props.craft));
</script>

<template>
  <div class="pointer-events-none relative" :style="{ width: `${size}px`, height: `${size}px` }">
    <span
      v-if="trail && !crashing"
      class="absolute left-[26%] top-[74%]"
      :style="{ transform: `rotate(-${FLIGHT_ANGLE}deg)` }"
    >
      <AircraftTrail :size="size" :color="info.trail" :intensity="trailIntensity" />
    </span>
    <img
      :src="info.src"
      :alt="`${info.name} aircraft`"
      width="1024"
      height="1024"
      class="relative h-full w-full object-contain drop-shadow-[0_0_22px_color-mix(in_oklab,var(--neon-magenta)_45%,transparent)]"
      :class="crashing ? 'animate-sky-spiral' : idle ? 'animate-sky-float' : undefined"
      :style="{ transform: `rotate(${info.rotate}deg)`, willChange: 'transform' }"
    />
  </div>
</template>
