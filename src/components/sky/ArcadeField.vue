<script setup lang="ts">
defineOptions({ inheritAttrs: false });
defineProps<{ label: string; modelValue?: string }>();
defineEmits<{ (e: "update:modelValue", value: string): void }>();
</script>

<template>
  <label class="block">
    <span class="mb-1.5 block font-display text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
      {{ label }}
    </span>
    <input
      v-bind="$attrs"
      class="clip-hud w-full border-2 border-violet/50 bg-void/70 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-magenta focus:outline-none focus:[box-shadow:var(--glow-magenta)]"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>
