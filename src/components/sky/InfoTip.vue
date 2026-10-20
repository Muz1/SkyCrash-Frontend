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
const id = `tip-${Math.random().toString(36).slice(2, 9)}`

function onDocPointer(e: PointerEvent) {
  if (root.value && !root.value.contains(e.target as Node)) pinned.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') pinned.value = hover.value = false
}
function onFocusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null
  if (next && !root.value?.contains(next)) pinned.value = false
}
function onEnter(e: PointerEvent) {
  if (e.pointerType === 'mouse') hover.value = true
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
      @click.stop="pinned = !pinned"
    >
      <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 pointer-coarse:h-5 pointer-coarse:w-5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" class="hidden pointer-coarse:inline" />
        <rect x="11" y="10" width="2" height="7" fill="currentColor" />
        <rect x="11" y="6.5" width="2" height="2" fill="currentColor" />
      </svg>
    </button>
    <span
      v-if="open"
      :id="id"
      role="tooltip"
      :class="[
        'neon-panel absolute top-[calc(100%+6px)] z-50 w-64 border-2 border-electric/70 bg-void p-3 text-left text-sm font-medium normal-case leading-snug tracking-normal text-foreground',
        'max-sm:fixed max-sm:inset-x-4 max-sm:top-auto max-sm:bottom-[max(1rem,env(safe-area-inset-bottom))] max-sm:w-auto',
        props.align === 'right' ? 'right-0' : 'left-0',
      ]"
    >
      {{ props.text }}
      <slot />
    </span>
  </span>
</template>
