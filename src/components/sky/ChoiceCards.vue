<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '@lucide/vue'
import { cn } from '@/lib/cn'
import type { ChoiceOption } from '@/types/feedback'

/**
 * Clickable answer cards for the feedback questionnaire. Single choice (radio semantics;
 * clicking the chosen card again clears it) or multiple choice (checkbox semantics).
 *   variant="pill"  compact chips that wrap, for short labels
 *   variant="card"  roomier tiles with an emoji, for the "big" questions
 */
const props = withDefaults(
  defineProps<{
    options: readonly ChoiceOption[]
    label: string
    multiple?: boolean
    variant?: 'pill' | 'card'
  }>(),
  { multiple: false, variant: 'pill' },
)

const single = defineModel<string | null>('value', { default: null })
const many = defineModel<string[] | null | undefined>('values', { default: () => [] })

const emit = defineEmits<{ pick: [] }>()

function isOn(key: string) {
  return props.multiple ? (many.value ?? []).includes(key) : single.value === key
}

function toggle(key: string) {
  if (props.multiple) {
    const current = many.value ?? []
    many.value = current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
  } else {
    single.value = single.value === key ? null : key
  }
  emit('pick')
}

const gridClass = computed(() =>
  props.variant === 'card'
    ? 'grid grid-cols-2 gap-2 sm:grid-cols-3'
    : 'flex flex-wrap gap-2',
)
</script>

<template>
  <div :role="multiple ? 'group' : 'radiogroup'" :aria-label="label" :class="gridClass">
    <button
      v-for="o in options"
      :key="o.key"
      type="button"
      :role="multiple ? 'checkbox' : 'radio'"
      :aria-checked="isOn(o.key)"
      :class="
        cn(
          'group relative flex items-center gap-2 border-2 text-left font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric active:scale-[0.97]',
          variant === 'card'
            ? 'clip-hud min-h-[3.75rem] px-3 py-2 text-sm sm:text-base'
            : 'min-h-10 rounded-full px-4 py-1.5 text-sm',
          isOn(o.key)
            ? 'border-electric bg-electric/20 text-foreground [box-shadow:var(--glow-blue)]'
            : 'border-violet/50 bg-void/60 text-foreground/90 hover:-translate-y-0.5 hover:border-electric',
        )
      "
      @click="toggle(o.key)"
    >
      <span v-if="o.emoji" aria-hidden="true" :class="variant === 'card' ? 'text-xl' : 'text-base'">{{ o.emoji }}</span>
      <span class="min-w-0 flex-1 leading-tight">{{ o.label }}</span>
      <span
        v-if="isOn(o.key)"
        :key="`on-${o.key}`"
        class="animate-sky-pop grid h-5 w-5 shrink-0 place-items-center rounded-full bg-electric text-void"
        aria-hidden="true"
      >
        <Check class="h-3.5 w-3.5" />
      </span>
    </button>
  </div>
</template>
