<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    accent?: "violet" | "magenta" | "blue" | "lime" | "ember";
  }>(),
  { accent: "violet" },
);

const accentClass: Record<string, string> = {
  violet: "text-violet",
  magenta: "text-magenta",
  blue: "text-electric",
  lime: "text-lime",
  ember: "text-ember",
};
</script>

<template>
  <section class="neon-panel clip-hud crt-scan">
    <header v-if="title" class="border-b border-border/70 px-4 py-2">
      <h2
        class="font-display text-[10px] font-black uppercase tracking-[0.32em] sm:text-xs"
        :class="accentClass[accent]"
      >
        {{ title }}
      </h2>
    </header>
    <div class="p-4 sm:p-5">
      <slot />
    </div>
  </section>
</template>
