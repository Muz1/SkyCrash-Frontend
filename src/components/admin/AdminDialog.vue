<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Modal dialog in the admin console style (same frame as Adjust Balance). Escape closes it,
 * focus starts on the first field and comes back to whatever opened it.
 */
const props = withDefaults(defineProps<{ title: string; sub?: string; tone?: string; wide?: boolean }>(), {
  tone: '#ff2bd6',
  wide: false,
})
const emit = defineEmits<{ close: [] }>()

const box = ref<HTMLElement | null>(null)
const titleId = `adm-dialog-${Math.random().toString(36).slice(2, 9)}`
let opener: HTMLElement | null = null

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}

onMounted(async () => {
  opener = document.activeElement as HTMLElement | null
  document.addEventListener('keydown', onKey)
  await nextTick()
  box.value?.querySelector<HTMLElement>('select, input, textarea, button')?.focus()
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  opener?.focus?.()
})
</script>

<template>
  <div class="admin-console-modal" role="dialog" aria-modal="true" :aria-labelledby="titleId" @click.self="emit('close')">
    <div ref="box" class="adm-modal" :class="{ 'adm-modal--wide': props.wide }" :style="{ '--adm-modal-tone': props.tone }">
      <div class="adm-modal-header">
        <span v-if="$slots.icon" class="adm-modal-icon" aria-hidden="true"><slot name="icon" /></span>
        <div class="min-w-0">
          <h2 :id="titleId" class="adm-modal-title">{{ title }}</h2>
          <p v-if="sub" class="adm-modal-sub">{{ sub }}</p>
        </div>
      </div>
      <div class="adm-modal-body"><slot /></div>
      <div class="adm-modal-footer"><slot name="footer" /></div>
    </div>
  </div>
</template>
