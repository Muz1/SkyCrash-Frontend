<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'

/**
 * The ⓘ behind a short label: tap (or hover / focus) shows the definition. Keeps headers short
 * and numbers first; the full wording is one tap away. Escape or a tap elsewhere closes it.
 */
const props = defineProps<{ term: string; text: string }>()

const open = ref(false)
const alignRight = ref(false)
const root = ref<HTMLElement | null>(null)
const id = `adm-info-${Math.random().toString(36).slice(2, 9)}`

function place() {
  const r = root.value?.getBoundingClientRect()
  alignRight.value = !!r && r.left > window.innerWidth / 2
}
async function show() {
  place()
  open.value = true
  await nextTick()
  document.addEventListener('pointerdown', outside, true)
}
function hide() {
  open.value = false
  document.removeEventListener('pointerdown', outside, true)
}
function outside(e: Event) {
  if (root.value && !root.value.contains(e.target as Node)) hide()
}
onBeforeUnmount(hide)
</script>

<template>
  <span ref="root" class="adm-info" @mouseenter="show" @mouseleave="hide" @keydown.esc="hide">
    <button
      type="button"
      class="adm-info-btn"
      :aria-label="`What is ${props.term}?`"
      :aria-expanded="open"
      :aria-describedby="open ? id : undefined"
      @click.stop="open ? hide() : show()"
      @focus="show"
      @blur="hide"
    >
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5" />
        <rect x="7.25" y="7" width="1.5" height="5" rx="0.75" fill="currentColor" />
        <circle cx="8" cy="4.75" r="1" fill="currentColor" />
      </svg>
    </button>
    <span v-if="open" :id="id" role="tooltip" :class="['adm-info-pop', alignRight && 'is-right']">
      <strong>{{ term }}</strong>
      {{ text }}
    </span>
  </span>
</template>
