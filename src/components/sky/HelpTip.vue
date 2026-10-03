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
      class="adm-btn adm-btn--ghost adm-btn--sm"
      @click="open = !open"
      @blur="open = false"
    >
      <HelpCircle aria-hidden="true" />
      <span class="hidden md:inline">About this page</span>
    </button>
    <div
      v-if="open"
      role="tooltip"
      class="absolute right-0 top-[calc(100%+8px)] z-30 w-80 rounded-lg border border-[var(--adm-border-strong)] bg-[oklch(0.18_0.045_290)] p-4 text-left text-[0.875rem] leading-relaxed text-[var(--adm-text-2)] shadow-[0_16px_40px_-12px_oklch(0_0_0/0.8)]"
    >
      {{ text }}
    </div>
  </span>
</template>
