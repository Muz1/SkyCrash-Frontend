<script setup lang="ts">
withDefaults(defineProps<{ label?: string; tone?: "blue" | "lime" | "magenta" | "ember" }>(), {
  tone: "blue",
});

const tones: Record<string, string> = {
  blue: "text-electric text-glow-blue",
  lime: "text-lime text-glow-lime",
  magenta: "text-magenta text-glow-magenta",
  ember: "text-ember text-glow-ember",
};
</script>

<template>
  <div class="text-center">
    <p v-if="label" class="font-display text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
      {{ label }}
    </p>
    <p class="font-arcade text-2xl leading-tight sm:text-3xl" :class="tones[tone]">
      <slot />
    </p>
  </div>
</template>
