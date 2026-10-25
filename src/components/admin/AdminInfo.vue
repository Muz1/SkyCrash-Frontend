<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'

/**
 * The ⓘ behind a short label. Hover or keyboard focus shows the definition while you're on it;
 * a click or tap pins it open until you tap again, tap elsewhere or press Escape. It renders in
 * the console's tooltip layer (position: fixed, kept inside the window), so no card or scrolling
 * table can clip or cover it, and it opens above when there's no room below.
 */
const props = defineProps<{ term: string; text: string }>()

const GAP = 6
const MARGIN = 8

const open = ref(false)
const pinned = ref(false)
const btn = ref<HTMLElement | null>(null)
const pop = ref<HTMLElement | null>(null)
const popStyle = ref<Record<string, string>>({ visibility: 'hidden' })
const id = `adm-info-${Math.random().toString(36).slice(2, 9)}`
let leaveTimer: ReturnType<typeof setTimeout> | undefined

function place() {
  const anchor = btn.value?.getBoundingClientRect()
  const box = pop.value?.getBoundingClientRect()
  if (!anchor || !box) return
  const vw = window.innerWidth
  const vh = window.innerHeight
  const left = Math.min(Math.max(MARGIN, anchor.left + anchor.width / 2 - box.width / 2), vw - box.width - MARGIN)
  const below = anchor.bottom + GAP
  const top = below + box.height <= vh - MARGIN ? below : Math.max(MARGIN, anchor.top - GAP - box.height)
  popStyle.value = { left: `${Math.max(MARGIN, left)}px`, top: `${top}px` }
}

async function show() {
  clearTimeout(leaveTimer)
  if (open.value) return
  popStyle.value = { visibility: 'hidden' }
  open.value = true
  await nextTick()
  place()
  document.addEventListener('pointerdown', outside, true)
  document.addEventListener('keydown', onKey)
  window.addEventListener('scroll', close, true)
  window.addEventListener('resize', close)
}
function close() {
  clearTimeout(leaveTimer)
  open.value = false
  pinned.value = false
  document.removeEventListener('pointerdown', outside, true)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('scroll', close, true)
  window.removeEventListener('resize', close)
}
/** Hover/focus leaving: close after a short grace period, unless it was pinned by a click. */
function softClose() {
  if (pinned.value) return
  clearTimeout(leaveTimer)
  leaveTimer = setTimeout(close, 120)
}
function toggle() {
  if (pinned.value) return close()
  pinned.value = true
  void show()
}
// Safari doesn't focus a tapped button, so Escape is caught on the document, not the ⓘ.
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
function outside(e: Event) {
  const t = e.target as Node
  if (!btn.value?.contains(t) && !pop.value?.contains(t)) close()
}
onBeforeUnmount(close)
</script>

<template>
  <span class="adm-info" @mouseenter="show" @mouseleave="softClose">
    <button
      ref="btn"
      type="button"
      class="adm-info-btn"
      :aria-label="`What is ${props.term}?`"
      :aria-expanded="open"
      :aria-describedby="open ? id : undefined"
      @click.stop.prevent="toggle"
      @focus="show"
      @blur="softClose"
    >
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5" />
        <rect x="7.25" y="7" width="1.5" height="5" rx="0.75" fill="currentColor" />
        <circle cx="8" cy="4.75" r="1" fill="currentColor" />
      </svg>
    </button>
    <Teleport defer to="#adm-tooltip-layer" :disabled="!open">
      <span
        v-if="open"
        :id="id"
        ref="pop"
        role="tooltip"
        class="adm-info-pop"
        :style="popStyle"
        @mouseenter="show"
        @mouseleave="softClose"
      >
        <strong>{{ term }}</strong>
        {{ text }}
      </span>
    </Teleport>
  </span>
</template>
