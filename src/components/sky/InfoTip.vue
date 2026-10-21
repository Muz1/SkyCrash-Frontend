<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { en } from '@/copy/en'

/**
 * The ⓘ that holds the long explanation, so the screen itself keeps one short line.
 * Tap toggles it (phones), hover/focus shows it (mouse and keyboard). On phones the bubble
 * spans the screen width so it can never poke out sideways.
 */
const props = withDefaults(defineProps<{ text: string; label?: string; align?: 'left' | 'right' }>(), {
  label: en.common.info,
  align: 'left',
})

/** Shown while a mouse hovers it, or pinned open by a tap / click / Enter. */
const hover = ref(false)
const pinned = ref(false)
const open = computed(() => hover.value || pinned.value)
const root = ref<HTMLElement | null>(null)
const bubble = ref<HTMLElement | null>(null)
/** Where the bubble sits on desktop/tablet (phones use a bottom sheet). */
const pos = ref({ top: 0, left: 0 })
function place() {
  const r = root.value?.getBoundingClientRect()
  if (!r) return
  const width = 256
  const left = props.align === 'right' ? r.right - width : r.left
  pos.value = { top: r.bottom + 6, left: Math.max(8, Math.min(left, window.innerWidth - width - 8)) }
}
const id = `tip-${Math.random().toString(36).slice(2, 9)}`

function onDocPointer(e: PointerEvent) {
  const t = e.target as Node
  if (root.value && !root.value.contains(t) && !bubble.value?.contains(t)) pinned.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') pinned.value = hover.value = false
}
function onFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (next && !root.value?.contains(next) && !bubble.value?.contains(next)) pinned.value = false
}
function onEnter(e: PointerEvent) {
  if (e.pointerType === 'mouse') {
    place()
    hover.value = true
  }
}
function toggle() {
  place()
  pinned.value = !pinned.value
}
onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointer)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <span ref="root" class="relative inline-flex align-middle" @pointerenter="onEnter" @pointerleave="hover = false" @focusout="onFocusOut">
    <button
      type="button"
      :aria-label="props.label"
      :aria-expanded="open"
      :aria-describedby="open ? id : undefined"
      class="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current text-electric transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric pointer-coarse:h-11 pointer-coarse:w-11 pointer-coarse:border-0"
      @click.stop="toggle"
    >
      <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 pointer-coarse:h-5 pointer-coarse:w-5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" class="hidden pointer-coarse:inline" />
        <rect x="11" y="10" width="2" height="7" fill="currentColor" />
        <rect x="11" y="6.5" width="2" height="2" fill="currentColor" />
      </svg>
    </button>
    <!-- Rendered at the top of the page, so a scrolling or clipped parent (the bet panel)
         can never cover the bubble or swallow taps on the links inside it. -->
    <Teleport to="body">
      <span
        v-if="open"
        :id="id"
        ref="bubble"
        role="tooltip"
        :style="{ top: `${pos.top}px`, left: `${pos.left}px` }"
        :class="[
          'neon-panel fixed z-[100] w-64 border-2 border-electric/70 bg-void p-3 text-left text-sm font-medium normal-case leading-snug tracking-normal text-foreground',
          'max-sm:!inset-x-4 max-sm:!top-auto max-sm:!left-4 max-sm:bottom-[max(1rem,env(safe-area-inset-bottom))] max-sm:w-auto',
        ]"
        @pointerenter="hover = true"
        @pointerleave="hover = false"
      >
        {{ props.text }}
        <slot />
      </span>
    </Teleport>
  </span>
</template>
