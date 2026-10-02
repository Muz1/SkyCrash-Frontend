<script setup lang="ts">
import { computed, type Component } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    caption?: string
    icon?: Component
    tone?: 'magenta' | 'violet' | 'blue' | 'ember' | 'lime'
    large?: boolean
    /** Stretch to fill the parent grid cell (wallboard layout). */
    fill?: boolean
  }>(),
  { tone: 'violet', large: false, fill: false },
)

const TONES = {
  magenta: 'var(--neon-magenta)',
  violet: 'var(--neon-violet)',
  blue: 'var(--neon-blue)',
  ember: 'var(--neon-orange)',
  lime: 'var(--neon-lime)',
} as const

const style = computed(() => ({ '--adm-kpi-tone': TONES[props.tone] }))
</script>

<template>
  <div :class="['adm-kpi', large && 'adm-kpi--lg', fill && 'adm-kpi--fill']" :style="style">
    <div class="adm-kpi-head">
      <span class="adm-kpi-label">{{ label }}</span>
      <span v-if="icon" class="adm-kpi-icon" aria-hidden="true"><component :is="icon" /></span>
    </div>
    <div class="flex flex-col gap-1.5">
      <div class="adm-kpi-value"><slot /></div>
      <div v-if="caption || $slots.caption" class="adm-kpi-caption">
        <slot name="caption">{{ caption }}</slot>
      </div>
    </div>
  </div>
</template>
