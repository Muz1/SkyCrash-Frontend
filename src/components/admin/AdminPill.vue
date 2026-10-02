<script setup lang="ts">
import { computed } from 'vue'

type Tone = 'success' | 'danger' | 'warning' | 'info' | 'accent' | 'neutral'

const props = withDefaults(
  defineProps<{
    /** Display text. If no tone is given it is inferred from common status words. */
    label: string
    tone?: Tone
    dot?: boolean
  }>(),
  { dot: true },
)

const TONE_COLORS: Record<Tone, string> = {
  success: 'var(--neon-lime)',
  danger: 'oklch(0.72 0.19 22)',
  warning: 'var(--neon-orange)',
  info: 'var(--neon-blue)',
  accent: 'var(--neon-magenta)',
  neutral: 'oklch(0.74 0.06 300)',
}

const INFERRED: Record<string, Tone> = {
  active: 'success',
  running: 'success',
  cashedout: 'success',
  won: 'success',
  blocked: 'danger',
  crashed: 'danger',
  lost: 'danger',
  waiting: 'warning',
  pending: 'warning',
  admin: 'accent',
  player: 'neutral',
}

const tone = computed<Tone>(() => props.tone ?? INFERRED[props.label.replace(/\s+/g, '').toLowerCase()] ?? 'neutral')
// "CashedOut" -> "Cashed Out" for display.
const text = computed(() => props.label.replace(/([a-z])([A-Z])/g, '$1 $2'))
const live = computed(() => tone.value === 'success' && props.label.toLowerCase() === 'running')
</script>

<template>
  <span
    :class="['adm-pill', dot === false && 'adm-pill--plain', live && 'adm-pill--live']"
    :style="{ '--adm-pill': TONE_COLORS[tone] }"
  >
    {{ text }}
  </span>
</template>
