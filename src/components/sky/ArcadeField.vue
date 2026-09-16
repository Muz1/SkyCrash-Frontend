<script setup lang="ts">
import { cn } from '@/lib/cn'

withDefaults(
  defineProps<{
    label: string
    type?: string
    placeholder?: string
    autocomplete?: string
    required?: boolean
    min?: number | string
    max?: number | string
    step?: number | string
    maxlength?: number | string
    class?: string
  }>(),
  {
    type: 'text',
  },
)

const model = defineModel<string | number>()
</script>

<template>
  <label class="block">
    <span class="mb-1.5 block font-display text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
      {{ label }}
    </span>
    <input
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :min="min"
      :max="max"
      :step="step"
      :maxlength="maxlength"
      :class="
        cn(
          'clip-hud w-full border-2 border-violet/50 bg-void/70 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-magenta focus:outline-none focus:[box-shadow:var(--glow-magenta)]',
          $props.class,
        )
      "
    />
  </label>
</template>
