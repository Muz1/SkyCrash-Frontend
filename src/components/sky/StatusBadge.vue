<script setup lang="ts">
defineProps<{ status: "CASHED OUT" | "CRASHED" | "NEW" | "TOP" | "LIVE" }>();

const map: Record<string, string> = {
  "CASHED OUT": "border-lime text-lime",
  CRASHED: "border-danger text-danger",
  NEW: "border-electric text-electric",
  TOP: "border-ember text-ember",
  LIVE: "border-magenta text-magenta",
};
</script>

<template>
  <span
    class="clip-hud inline-block border px-2 py-1 font-arcade text-[7px] uppercase leading-none"
    :class="map[status]"
  >
    {{ status }}
  </span>
</template>
