<script setup lang="ts">
import { ref } from 'vue'
import { HelpCircle } from '@lucide/vue'

defineProps<{ text: string }>()
const open = ref(false)
</script>

<template>
  <span class="relative inline-block align-middle">
    <button
      type="button"
      aria-label="What does this page do?"
      class="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-violet/50 text-muted-foreground transition-colors hover:border-electric hover:text-electric"
      @click="open = !open"
      @blur="open = false"
    >
      <HelpCircle class="h-3.5 w-3.5" aria-hidden="true" />
    </button>
    <div
      v-if="open"
      class="neon-panel clip-hud absolute left-0 top-7 z-30 w-72 p-3 text-left text-xs font-sans normal-case leading-relaxed tracking-normal text-foreground sm:left-auto sm:right-0"
    >
      {{ text }}
    </div>
  </span>
</template>
