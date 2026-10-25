<script setup lang="ts">
import { ref } from 'vue'
import { HelpCircle } from '@lucide/vue'

defineProps<{ text: string }>()
const open = ref(false)
</script>

<template>
  <span class="relative inline-flex items-center">
    <button
      type="button"
      aria-label="What does this page do?"
      :aria-expanded="open"
      class="adm-btn adm-btn--ghost adm-btn--sm pointer-coarse:min-w-11"
      @click="open = !open"
      @blur="open = false"
    >
      <HelpCircle aria-hidden="true" />
      <span class="hidden md:inline">About this page</span>
    </button>
    <div
      v-if="open"
      role="tooltip"
      class="absolute right-0 top-[calc(100%+8px)] z-30 w-80 rounded-lg max-sm:fixed max-sm:inset-x-4 max-sm:top-[calc(env(safe-area-inset-top)+4.25rem)] max-sm:w-auto border border-[var(--adm-border-strong)] bg-[var(--adm-surface-solid)] p-4 text-left text-[0.875rem] leading-relaxed text-[var(--adm-text)] shadow-[0_16px_40px_-12px_oklch(0_0_0/0.45)]"
    >
      {{ text }}
    </div>
  </span>
</template>
