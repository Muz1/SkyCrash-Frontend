<script setup lang="ts">
import { ChevronDown, Info } from '@lucide/vue'

/**
 * Collapsible "what does this measure?" panel under a report heading. Each entry
 * names a metric and defines exactly how it's calculated, so admins never have
 * to guess what a number means.
 */
defineProps<{
  title?: string
  items: { term: string; definition: string }[]
}>()
</script>

<template>
  <details class="adm-explain">
    <summary>
      <Info aria-hidden="true" />
      <span>{{ title ?? 'What do these numbers mean?' }}</span>
      <ChevronDown class="adm-explain-chevron" aria-hidden="true" />
    </summary>
    <dl>
      <div v-for="item in items" :key="item.term">
        <dt>{{ item.term }}</dt>
        <dd>{{ item.definition }}</dd>
      </div>
    </dl>
  </details>
</template>
