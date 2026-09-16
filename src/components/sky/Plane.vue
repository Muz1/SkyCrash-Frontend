<script setup lang="ts">
import { computed } from "vue";
import { useHangarStore } from "@/stores/hangar";
import type { CraftId } from "@/lib/craft";
import Aircraft from "./Aircraft.vue";

const props = withDefaults(
  defineProps<{
    size?: number;
    trail?: boolean;
    trailIntensity?: number;
    crashing?: boolean;
    craft?: CraftId;
  }>(),
  { size: 180, trail: true, trailIntensity: 1, crashing: false },
);

const hangar = useHangarStore();
const resolvedCraft = computed(() => props.craft ?? hangar.craftId);
</script>

<template>
  <Aircraft
    :craft="resolvedCraft"
    :size="size"
    :trail="trail"
    :trail-intensity="trailIntensity"
    :crashing="crashing"
  />
</template>
