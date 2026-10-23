<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'

/**
 * The ⓘ behind a short label: tap (or hover / focus) shows the definition. Keeps headers short
 * and numbers first; the full wording is one tap away. Escape or a tap elsewhere closes it.
 * The pop-up is position: fixed and kept inside the window, so cards and scrolling tables
 * (overflow: hidden / auto) can't clip it; it opens above when there's no room below.
 */
const props = defineProps<{ term: string; text: string }>()

const GAP = 6
const MARGIN = 8

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const pop = ref<HTMLElement | null>(null)
const popStyle = ref<Record<string, string>>({ visibility: 'hidden' })
const id = `adm-info-${Math.random().toString(36).slice(2, 9)}`

function place() {
  const anchor = root.value?.getBoundingClientRect()
  const box = pop.value?.getBoundingClientRect()
  if (!anchor || !box) return
  const vw = window.innerWidth
  const vh = window.innerHeight
  const left = Math.min(Math.max(MARGIN, anchor.left), vw - box.width - MARGIN)
  const below = anchor.bottom + GAP
  const top = below + box.height <= vh - MARGIN ? below : Math.max(MARGIN, anchor.top - GAP - box.height)
  popStyle.value = { left: `${Math.max(MARGIN, left)}px`, top: `${top}px` }
}
async function show() {
  popStyle.value = { visibility: 'hidden' }
  open.value = true
  await nextTick()
  place()
  document.addEventListener('pointerdown', outside, true)
  window.addEventListener('scroll', hide, true)
  window.addEventListener('resize', hide)
}
function hide() {
  open.value = false
  document.removeEventListener('pointerdown', outside, true)
  window.removeEventListener('scroll', hide, true)
  window.removeEventListener('resize', hide)
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
    <span v-if="open" :id="id" ref="pop" role="tooltip" class="adm-info-pop" :style="popStyle">
      <strong>{{ term }}</strong>
      {{ text }}
    </span>
  </span>
</template>
