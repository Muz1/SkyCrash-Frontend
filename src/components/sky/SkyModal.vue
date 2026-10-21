<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { X } from '@lucide/vue'
import { en } from '@/copy/en'

/**
 * A retro dialog: dark panel, neon border, close button, Escape to close. Scrolls inside
 * itself on short screens so its buttons are always reachable.
 */
const props = withDefaults(
  defineProps<{
    title: string
    accent?: 'blue' | 'magenta' | 'lime' | 'ember' | 'danger'
    /** Hide the × (for steps that need an explicit answer). */
    closable?: boolean
    width?: 'sm' | 'md' | 'lg'
  }>(),
  { accent: 'blue', closable: true, width: 'md' },
)
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const titleId = `modal-${Math.random().toString(36).slice(2, 9)}`
let lastFocus: HTMLElement | null = null

const BORDER: Record<string, string> = {
  blue: 'border-electric [box-shadow:var(--glow-blue)]',
  magenta: 'border-magenta [box-shadow:var(--glow-magenta)]',
  lime: 'border-lime [box-shadow:var(--glow-lime)]',
  ember: 'border-ember [box-shadow:var(--glow-ember)]',
  danger: 'border-danger',
}
const WIDTH: Record<string, string> = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl' }

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closable) emit('close')
}
onMounted(async () => {
  lastFocus = document.activeElement as HTMLElement | null
  document.addEventListener('keydown', onKey)
  await nextTick()
  const target = panel.value?.querySelector<HTMLElement>('[data-autofocus]') ?? panel.value
  target?.focus()
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  lastFocus?.focus?.()
})
</script>

<template>
  <!-- On <body>, so it layers above the header and nav dock of whatever page opened it. -->
  <Teleport to="body">
  <div class="fixed inset-0 z-[95] flex overflow-y-auto bg-[oklch(0.08_0.04_285/0.82)] p-4 backdrop-blur-sm" @click.self="props.closable && emit('close')">
    <section
      ref="panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
      :class="['clip-hud relative m-auto w-full border-2 bg-void p-5 text-foreground focus:outline-none', BORDER[props.accent], WIDTH[props.width]]"
    >
      <div class="flex items-start gap-3">
        <h2 :id="titleId" class="min-w-0 flex-1 pt-1 font-display text-base font-black uppercase tracking-[0.14em] sm:text-lg">
          {{ props.title }}
        </h2>
        <button
          v-if="props.closable"
          type="button"
          :aria-label="en.common.close"
          class="grid h-9 w-9 shrink-0 place-items-center border-2 border-violet/60 text-foreground transition-colors hover:border-electric hover:text-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric pointer-coarse:h-11 pointer-coarse:w-11"
          @click="emit('close')"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div class="mt-3">
        <slot />
      </div>
      <div v-if="$slots.footer" class="mt-5 flex flex-wrap justify-end gap-2">
        <slot name="footer" />
      </div>
    </section>
  </div>
  </Teleport>
</template>
