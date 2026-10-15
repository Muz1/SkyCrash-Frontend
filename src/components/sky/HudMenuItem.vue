<script setup lang="ts">
import { cn } from '@/lib/cn'

/**
 * One row of the phone header menu (HudHeader): a full-width 44px-tall link or button with
 * an icon. Pass `to` for navigation, or listen to `click` for an action.
 */
const props = defineProps<{
  to?: string
  /** For on/off toggles (music, sounds): exposed as aria-pressed. */
  pressed?: boolean
  accent?: 'magenta' | 'blue' | 'lime' | 'ember' | 'violet'
}>()
const emit = defineEmits<{ click: [MouseEvent] }>()

const ACCENTS = {
  magenta: 'text-magenta',
  blue: 'text-electric',
  lime: 'text-lime',
  ember: 'text-ember',
  violet: 'text-muted-foreground',
} as const

const rowClass = cn(
  'flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left font-display text-[0.6875rem] font-black uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-violet/20 focus-visible:bg-violet/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-electric',
)
</script>

<template>
  <li>
    <RouterLink v-if="props.to" :to="props.to" :class="rowClass" @click="emit('click', $event)">
      <span :class="cn('grid h-5 w-5 shrink-0 place-items-center', ACCENTS[props.accent ?? 'blue'])"><slot name="icon" /></span>
      <span class="min-w-0 flex-1"><slot /></span>
    </RouterLink>
    <button
      v-else
      type="button"
      :class="rowClass"
      :aria-pressed="props.pressed === undefined ? undefined : props.pressed"
      @click="emit('click', $event)"
    >
      <span :class="cn('grid h-5 w-5 shrink-0 place-items-center', ACCENTS[props.accent ?? 'blue'])"><slot name="icon" /></span>
      <span class="min-w-0 flex-1"><slot /></span>
    </button>
  </li>
</template>
