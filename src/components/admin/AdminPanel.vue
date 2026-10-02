<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    caption?: string
    accent?: 'magenta' | 'violet' | 'blue' | 'ember' | 'lime'
    /** Grow to fill the remaining height of a flex column. */
    fill?: boolean
    /** Body scrolls internally (scrollbar hidden) instead of growing the page. */
    scroll?: boolean
    /** Remove body padding (tables). */
    flush?: boolean
  }>(),
  { accent: 'violet', fill: false, scroll: false, flush: false },
)

const ACCENTS = {
  magenta: 'var(--neon-magenta)',
  violet: 'var(--neon-violet)',
  blue: 'var(--neon-blue)',
  ember: 'var(--neon-orange)',
  lime: 'var(--neon-lime)',
} as const

const dot = computed(() => ({ background: ACCENTS[props.accent], boxShadow: `0 0 8px ${ACCENTS[props.accent]}` }))
</script>

<template>
  <section :class="['adm-panel', fill && 'adm-panel--fill']">
    <header v-if="title || $slots.actions" class="adm-panel-header">
      <div class="min-w-0">
        <h2 v-if="title" class="adm-panel-title">
          <span class="adm-panel-dot" :style="dot" aria-hidden="true" />
          {{ title }}
        </h2>
        <p v-if="caption" class="adm-panel-caption">{{ caption }}</p>
      </div>
      <div v-if="$slots.actions" class="adm-panel-actions"><slot name="actions" /></div>
    </header>
    <slot name="toolbar" />
    <div
      :class="[
        'adm-panel-body',
        flush && 'adm-panel-body--flush',
        scroll && 'adm-panel-body--scroll',
        (scroll || fill) && 'flex min-h-0 flex-1 flex-col',
      ]"
    >
      <slot />
    </div>
    <footer v-if="$slots.footer" class="adm-panel-footer"><slot name="footer" /></footer>
  </section>
</template>
